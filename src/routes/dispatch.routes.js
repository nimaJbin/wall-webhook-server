// src/routes/dispatch.routes.js
import express from "express";
import { dispatchEvent } from "../controllers/dispatch.controller.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = express.Router();

router.post(
    "/dispatch",
    upload.single("file"),
    dispatchEvent
);

export default router;
