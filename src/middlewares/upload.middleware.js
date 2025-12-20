// src/middlewares/upload.middleware.js

import multer from "multer";
import fs from "fs";
import path from "path";
import { v4 as uuid } from "uuid";

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const id = uuid();
        req.uploadId = id;

        const dir = path.join(process.env.UPLOAD_DIR, id);
        fs.mkdirSync(dir, { recursive: true });

        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

export const upload = multer({
    storage,
    limits: { fileSize: 64 * 1024 * 1024 } // 64MB
});
