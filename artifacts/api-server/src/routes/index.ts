import { Router, type IRouter } from "express";
import authRouter from "./auth";
import devRouter from "./dev";
import healthRouter from "./health";
import marketplaceRouter from "./marketplace";
import { ensureAuthTables } from "../lib/ensureAuthTables";

const router: IRouter = Router();

router.use(async (_req, _res, next) => {
  try {
    await ensureAuthTables();
    next();
  } catch (err) {
    next(err);
  }
});

router.use("/auth", authRouter);
router.use("/dev", devRouter);
router.use(healthRouter);
router.use(marketplaceRouter);

export default router;
