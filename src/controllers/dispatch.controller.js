// src/controllers/dispatch.controller.js
import { dispatchWebhook } from "../services/webhookDispatcher.js";

export async function dispatchEvent(req, res) {
    const {
        sessionId,
        crmDeviceId,
        url,
        eventId,
        headers,
        payload
    } = req.body;

    const filePath = req.file
        ? req.file.path
        : null;

    console.log(`dispatchEvent.Webhook accepted url:  ${url}`);

    // پاسخ سریع به Server X
    res.status(202).json({ message: "Webhook accepted" });

    // Dispatch async (non-blocking)
    await dispatchWebhook({
        sessionId,
        crmDeviceId,
        eventId,
        headers,
        url,
        payload,
        filePath
    });
}
