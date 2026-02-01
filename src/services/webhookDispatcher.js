//src/services/webhookDispatcher.js
import axios from "axios";
import WebhookLog from "../models/WebhookLog.js";

export async function dispatchWebhook(data) {
    const {
        sessionId,
        crmDeviceId,
        eventId,
        url,
        headers,
        payload,
        filePath
    } = data;

    try {
        const res = await axios.post(url, payload, {
            headers,
            timeout: 10000
        });

        console.log(`dispatchWebhook.sessionId:  ${sessionId}`);
        console.log(`dispatchWebhook.responseCode:  ${res.status}`);

        const ok = res.status >= 200 && res.status < 300;

        await WebhookLog.create({
            crmDeviceId,
            eventId,
            targetUrl: url,
            status: ok ? "success" : "failed",
            responseCode: res.status,
            error: ok ? null : `HTTP ${res.status}`,
            payload,
            filePath,
        });

        return true;
    } catch (err) {
        await WebhookLog.create({
            crmDeviceId,
            eventId,
            targetUrl: url,
            status: "failed",
            responseCode: err.response?.status || 0,
            error: err.message,
            payload,
            filePath
        });

        return false;
    }
}
