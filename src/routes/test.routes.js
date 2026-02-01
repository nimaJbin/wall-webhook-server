// src/routes/test.routes.js

import express from "express";
import { health, seed, logsPage } from "../controllers/test.controller.js";

const router = express.Router();

router.get("/health", health);
router.get("/test/seed", seed);
router.get("/test/logs", logsPage);

export default router;
