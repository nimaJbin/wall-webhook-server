// src/services/webhookDispatcher.js

import axios from "axios";
import http from "http"; // CHANGED: force IPv4 via agents
import https from "https"; // CHANGED: force IPv4 via agents
import dns from "dns"; // CHANGED: prefer ipv4 in DNS ordering
import WebhookLog from "../models/WebhookLog.js";

// CHANGED: make Node resolve IPv4 first (helps in dual-stack environments)
dns.setDefaultResultOrder("ipv4first"); // CHANGED

// CHANGED: force outbound connections to use IPv4 only (family: 4)
const httpAgent = new http.Agent({ keepAlive: true, family: 4 }); // CHANGED
const httpsAgent = new https.Agent({ keepAlive: true, family: 4 }); // CHANGED

export async function dispatchWebhook(data) {
    const {
        sessionId,
        crmDeviceId,
        eventId,
        url,
        headers = {}, // CHANGED: safe default
        payload,
        filePath,
    } = data;

    // CHANGED: basic guard to avoid throwing cryptic errors
    if (!url) {
        await WebhookLog.create({
            crmDeviceId,
            eventId,
            targetUrl: url || "",
            status: "failed",
            responseCode: 0,
            error: "Missing target url", // CHANGED
            payload,
            filePath,
        });
        return false; // CHANGED
    }

    try {
        const res = await axios.post(url, payload, {
            headers,
            timeout: 15000, // CHANGED: a bit more tolerant than 10s for external webhooks
            httpAgent, // CHANGED: IPv4 only
            httpsAgent, // CHANGED: IPv4 only
            // CHANGED: avoid axios throwing for non-2xx so we can log status cleanly
            validateStatus: () => true, // CHANGED
        });

        const ok = res.status >= 200 && res.status < 300;

        console.log(`dispatchWebhook.sessionId: ${sessionId}`);
        console.log(`dispatchWebhook.responseCode: ${res.status}`);
        console.log(`dispatchWebhook.ok: ${ok}`); // CHANGED

        await WebhookLog.create({
            crmDeviceId,
            eventId,
            targetUrl: url,
            status: ok ? "success" : "failed",
            responseCode: res.status,
            // CHANGED: store a useful error when non-2xx (truncate to avoid huge db rows)
            error: ok
                ? null
                : `HTTP ${res.status}${res.data ? ` | ${String(res.data).slice(0, 500)}` : ""}`, // CHANGED
            payload,
            filePath,
        });

        return ok; // CHANGED: return true only if 2xx
    } catch (err) {
        // CHANGED: produce a more informative error message
        const responseCode = err?.response?.status || 0; // CHANGED
        const errMsgParts = [
            err?.message,
            err?.code ? `code=${err.code}` : null,
            err?.cause?.code ? `cause=${err.cause.code}` : null,
        ].filter(Boolean);

        await WebhookLog.create({
            crmDeviceId,
            eventId,
            targetUrl: url,
            status: "failed",
            responseCode,
            error: errMsgParts.join(" | ") || "Unknown error", // CHANGED
            payload,
            filePath,
        });

        return false;
    }
}
