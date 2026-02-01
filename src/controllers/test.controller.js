// src/controllers/test.controller.js
// import WebhookLog from "../models/WebhookLog.js";
// import * as console from "console";
// import axios from "axios";
// import https from "https";
// import dns from "dns";
import { dispatchWebhook } from "../services/webhookDispatcher.js";
import WebhookLog from "../models/WebhookLog.js";

// const ipv4Agent = new https.Agent({
//     keepAlive: true,
//     lookup: (hostname, options, callback) => {
//         // فقط IPv4
//         dns.lookup(hostname, { family: 4 }, callback);
//     },
// });


export async function health(req, res) {
    return res.status(200).json({
        ok: true,
        service: "wall-webhook-server",
        message: "healthy",
        timestamp: Date.now(),
    });
}

function buildFakePayload() {
    const sessionId = "md_989900612862"; // فیک ولی شبیه واقعی
    return {
        event: "message_received",
        sessionId,
        from: "989121234567@s.whatsapp.net",
        timestamp: Date.now(),
        messageType: "text",
        text: "سلام 👋 این یک پیام تستی برای seed وب‌هوک است.",
    };
}



export async function seed(req, res) {
    const targetUrl =
        (typeof req.query.url === "string" && req.query.url.trim() !== "")
            ? req.query.url.trim()
            : null;

    const fakePayload = buildFakePayload();

    const envelope = {
        sessionId: fakePayload.sessionId,
        crmDeviceId: "crmDevice_test_001",
        url: targetUrl,
        eventId: 7,
        headers: {},     // اگر نیاز داشتی
        payload: fakePayload,
        filePath: null,
    };

    // اگر url نداشت، فقط ذخیره کن و برگردون
    if (!targetUrl) {
        const created = await WebhookLog.create({
            crmDeviceId: envelope.crmDeviceId,
            eventId: envelope.eventId,
            targetUrl: "N/A",
            status: "skipped",
            responseCode: null,
            error: null,
            filePath: null,
            payload: envelope,
        });

        const fromDb = await WebhookLog.findById(created._id).lean();
        return res.status(200).json({ ok: true, dispatchedTo: null, dbSaved: fromDb });
    }

    // ✅ فقط همین: صدا زدن dispatch واقعی
    const ok = await dispatchWebhook(envelope);

    // ✅ خروجی از Mongo خوانده شود
    const last = await WebhookLog.findOne({
        crmDeviceId: envelope.crmDeviceId,
        eventId: envelope.eventId,
        targetUrl: targetUrl,
    }).sort({ createdAt: -1 }).lean();

    return res.status(200).json({
        ok: true,
        dispatchedTo: targetUrl,
        dispatchOk: ok,
        dbSaved: last,
    });
}



export async function logsPage(req, res) {
    const limit = Math.min(Number(req.query.limit || 20), 100);
    const logs = await WebhookLog.find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

    const rows = logs
        .map((l) => {
            const createdAt = l.createdAt ? new Date(l.createdAt).toLocaleString() : "";
            return `
        <tr>
          <td>${l._id}</td>
          <td>${l.crmDeviceId || ""}</td>
          <td>${l.eventId ?? ""}</td>
          <td>${(l.targetUrl || "").replace(/</g, "&lt;")}</td>
          <td>${l.status || ""}</td>
          <td>${l.responseCode ?? ""}</td>
          <td>${createdAt}</td>
          <td><pre style="max-width:720px; white-space:pre-wrap;">${JSON.stringify(l.payload || {}, null, 2).replace(/</g, "&lt;")}</pre></td>
        </tr>
      `;
        })
        .join("");

    return res.status(200).send(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8"/>
        <title>Webhook Logs</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 16px; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; vertical-align: top; }
          th { background: #f5f5f5; text-align: left; }
          pre { margin: 0; }
        </style>
      </head>
      <body>
        <h2>Webhook Logs (latest ${limit})</h2>
        <p>
          Seed: <code>/test/seed?url=...</code> |
          Health: <code>/health</code>
        </p>
        <table>
          <thead>
            <tr>
              <th>_id</th>
              <th>crmDeviceId</th>
              <th>eventId</th>
              <th>targetUrl</th>
              <th>status</th>
              <th>code</th>
              <th>createdAt</th>
              <th>payload</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
    </html>
  `);
}
