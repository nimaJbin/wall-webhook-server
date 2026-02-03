// src/services/webhookDispatcher.js

import WebhookLog from "../models/WebhookLog.js";
import { httpRequest } from "../utils/httpClient.js"; // CHANGED: use internal IPv4-only http client

// CHANGED: small helper to prevent huge DB rows/log spam
function safeStringify(value, maxLen = 1000) { // CHANGED
    try {
        const s = typeof value === "string" ? value : JSON.stringify(value);
        if (!s) return "";
        return s.length > maxLen ? s.slice(0, maxLen) : s;
    } catch {
        return "";
    }
}

// CHANGED: normalize headers to a plain object
function normalizeHeaders(headers) { // CHANGED
    if (!headers || typeof headers !== "object") return {};
    return headers;
}

/**
 * data shape (expected):
 * {
 *   sessionId,
 *   crmDeviceId,
 *   eventId,
 *   url,            // target webhook URL
 *   headers,        // optional headers
 *   payload,        // json payload
 *   filePath        // optional
 * }
 */
export async function dispatchWebhook(data) {
    const {
        sessionId,
        crmDeviceId,
        eventId,
        url,
        headers,
        payload,
        filePath = null,
    } = data || {};

    // CHANGED: guardrails + log to DB when url is missing
    if (!url || typeof url !== "string") {
        await WebhookLog.create({
            crmDeviceId: crmDeviceId || null,
            eventId: eventId || null,
            targetUrl: url || "",
            status: "failed",
            responseCode: 0,
            error: "Missing or invalid target url", // CHANGED
            filePath,
            payload,
        });
        return false; // CHANGED
    }

    const reqHeaders = normalizeHeaders(headers); // CHANGED

    // CHANGED: ensure json headers (but do NOT override user-provided content-type if set)
    const bodyJson = JSON.stringify(payload ?? {}); // CHANGED
    const finalHeaders = {
        ...(Object.keys(reqHeaders).length ? reqHeaders : {}),
        ...(reqHeaders?.["content-type"] || reqHeaders?.["Content-Type"]
            ? {}
            : { "content-type": "application/json" }), // CHANGED
        "content-length": Buffer.byteLength(bodyJson), // CHANGED
    };

    try {
        // CHANGED: use internal client (IPv4-only) instead of axios/fetch
        const res = await httpRequest({
            url,
            method: "POST",
            headers: finalHeaders,
            body: bodyJson,
            timeoutMs: 15000, // CHANGED: consistent timeout
        });

        console.log('************ Version httpRequest 1.1 ************')

        const ok = !!res?.ok; // CHANGED
        const status = Number(res?.status || 0); // CHANGED
        const responseText = safeStringify(res?.body, 1200); // CHANGED

        console.log('res => ', {res})


        // keep logs similar to before (if you had them)
        console.log(`dispatchWebhook.sessionId: ${sessionId}`); // CHANGED
        console.log(`dispatchWebhook.responseCode: ${status}`); // CHANGED
        console.log(`dispatchWebhook.ok: ${ok}`); // CHANGED

        await WebhookLog.create({
            crmDeviceId,
            eventId,
            targetUrl: url,
            status: ok ? "success" : "failed",
            responseCode: status,
            // CHANGED: store a useful error message when non-2xx
            error: ok ? null : `HTTP ${status}${responseText ? ` | ${responseText}` : ""}`, // CHANGED
            filePath,
            payload,
        });

        return ok; // CHANGED
    } catch (err) {

        console.log('error => ', {err})

        // CHANGED: better error diagnostics
        const msgParts = [
            err?.message,
            err?.code ? `code=${err.code}` : null,
            err?.cause?.code ? `cause=${err.cause.code}` : null,
        ].filter(Boolean);

        await WebhookLog.create({
            crmDeviceId,
            eventId,
            targetUrl: url,
            status: "failed",
            responseCode: 0, // CHANGED
            error: msgParts.join(" | ") || "Unknown error", // CHANGED
            filePath,
            payload,
        });

        return false;
    }
}
