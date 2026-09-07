/**
 * Password hashing using Node's built-in `crypto.scrypt`.
 *
 * Why scrypt over bcrypt?
 *   - No native binding (the api-server's esbuild bundle is fully
 *     self-contained, and shipping bcrypt would need a node_modules
 *     tree on the server).
 *   - scrypt is memory-hard, so it's resistant to GPU brute-force.
 *   - It's part of Node's standard library — zero new dependencies.
 *
 * The on-disk format is:
 *
 *   scrypt$N$r$p$<saltHex>$<hashHex>
 *
 * where N is the cost (16384), r and p are scrypt block parameters, and
 * the salt and hash are hex-encoded.  Future versions can change N/r/p
 * and still verify older hashes by parsing the prefix.
 */

import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem?: number },
) => Promise<Buffer>;

const N = 16384; // CPU/memory cost
const r = 8;     // block size
const p = 1;     // parallelization
const KEYLEN = 64;
const SALT_BYTES = 16;
// maxmem must be > 128 * N * r * p per Node docs; 64 MiB is plenty.
const MAXMEM = 64 * 1024 * 1024;

export async function hashPassword(password: string): Promise<string> {
  if (typeof password !== "string" || password.length === 0) {
    throw new Error("Password must be a non-empty string");
  }
  const salt = randomBytes(SALT_BYTES);
  const hash = await scryptAsync(password, salt, KEYLEN, { N, r, p, maxmem: MAXMEM });
  return `scrypt$${N}$${r}$${p}$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  if (typeof password !== "string" || typeof stored !== "string") return false;
  const parts = stored.split("$");
  // ["scrypt", N, r, p, saltHex, hashHex]
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const Ns = Number(parts[1]);
  const rs = Number(parts[2]);
  const ps = Number(parts[3]);
  if (!Number.isFinite(Ns) || !Number.isFinite(rs) || !Number.isFinite(ps)) {
    return false;
  }
  const salt = Buffer.from(parts[4] ?? "", "hex");
  const expected = Buffer.from(parts[5] ?? "", "hex");
  if (salt.length === 0 || expected.length === 0) return false;
  const actual = await scryptAsync(password, salt, expected.length, {
    N: Ns,
    r: rs,
    p: ps,
    maxmem: MAXMEM,
  });
  if (actual.length !== expected.length) return false;
  // Constant-time compare; timingSafeEqual throws on length mismatch but
  // we've already guarded that above.
  return timingSafeEqual(actual, expected);
}
