// src/controllers/dispatch.controller.js
import { dispatchWebhook } from "../services/webhookDispatcher.js";

export async function dispatchEvent(req, res) {
    const {
        deviceId,
        eventId,
        targetUrl,
        headers,
        payload
    } = req.body;

    const filePath = req.file
        ? req.file.path
        : null;

    // پاسخ سریع به Server X
    res.status(202).json({
        message: "Webhook accepted"
    });

    // Dispatch async (non-blocking)
    dispatchWebhook({
        deviceId,
        eventId,
        targetUrl,
        headers,
        payload,
        filePath
    });
}
