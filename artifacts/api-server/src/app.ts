import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { attachUser } from "./middlewares/requireUser";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
          userId: (req as unknown as { user?: { id: number } | null }).user?.id ?? null,
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cors({ credentials: true, origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Populate `req.user` for every request based on the `boloban_session`
// cookie.  Mounted before the router so handlers can read it.
app.use(attachUser);

app.use("/api", router);

export default app;
