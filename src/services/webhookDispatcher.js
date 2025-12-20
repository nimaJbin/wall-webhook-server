import axios from "axios";
import WebhookLog from "../models/WebhookLog.js";

export async function dispatchWebhook(data) {
    const {
        deviceId,
        eventId,
        targetUrl,
        headers,
        payload,
        filePath
    } = data;

    try {
        const res = await axios.post(targetUrl, payload, {
            headers,
            timeout: 10000
        });

        await WebhookLog.create({
            deviceId,
            eventId,
            targetUrl,
            status: "success",
            responseCode: res.status,
            payload,
            filePath
        });

        return true;
    } catch (err) {
        await WebhookLog.create({
            deviceId,
            eventId,
            targetUrl,
            status: "failed",
            responseCode: err.response?.status,
            error: err.message,
            payload,
            filePath
        });

        return false;
    }
}
