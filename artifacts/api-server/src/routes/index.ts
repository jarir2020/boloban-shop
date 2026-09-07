import { Router, type IRouter } from "express";
import authRouter from "./auth";
import devRouter from "./dev";
import healthRouter from "./health";
import marketplaceRouter from "./marketplace";

const router: IRouter = Router();

router.use("/auth", authRouter);
router.use("/dev", devRouter);
router.use(healthRouter);
router.use(marketplaceRouter);

export default router;
