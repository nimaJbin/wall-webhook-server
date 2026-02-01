// src/controllers/test.controller.js
import WebhookLog from "../models/WebhookLog.js";
import * as console from "console";
import axios from "axios";
import https from "https";
import dns from "dns";

const ipv4Agent = new https.Agent({
    keepAlive: true,
    lookup: (hostname, options, callback) => {
        // فقط IPv4
        dns.lookup(hostname, { family: 4 }, callback);
    },
});


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
    try {
        const targetUrl =
            (typeof req.query.url === "string" && req.query.url.trim() !== "")
                ? req.query.url.trim()
                : null;

        const fakePayload = buildFakePayload();

        // چیزی که می‌خوای مثل dispatchEvent باشد
        const dispatchEnvelope = {
            sessionId: fakePayload.sessionId,
            crmDeviceId: "crmDevice_test_001",
            url: targetUrl,
            eventId: 7,
            payload: fakePayload,
        };

        // 1) اول لاگ اولیه را ذخیره کن (pending)
        const created = await WebhookLog.create({
            crmDeviceId: dispatchEnvelope.crmDeviceId,
            eventId: dispatchEnvelope.eventId,
            targetUrl: targetUrl || "N/A",
            status: targetUrl ? "success" : "failed",
            responseCode: null,
            error: null,
            filePath: null,
            payload: dispatchEnvelope, // ✅ دقیقاً همون آبجکتی که گفتی می‌خوای ذخیره شه
        });

        let sendResult = null;

        // 2) اگر url داده شده، ارسال واقعی انجام بده
        if (targetUrl) {
            try {
                // const resp2 = await fetch(targetUrl, {
                //     method: "POST",
                //     headers: {
                //         "Content-Type": "application/json",
                //     },
                //     body: JSON.stringify(dispatchEnvelope),
                // });

                const resp = await axios.post(targetUrl, JSON.stringify(dispatchEnvelope), {
                    headers: {
                        "Content-Type": "application/json",
                    },
                    timeout: 10000
                });


                const text = await resp.text(); // ممکنه json نباشه
                sendResult = {
                    ok: resp.ok,
                    status: resp.status,
                    statusText: resp.statusText,
                    body: text?.slice(0, 2000), // لاگ رو خیلی بزرگ نکنیم
                };

                console.log('seed.sendResult : ', sendResult)

                // 3) آپدیت لاگ با نتیجه ارسال
                await WebhookLog.updateOne(
                    { _id: created._id },
                    {
                        $set: {
                            status: resp.ok ? "success" : "failed",
                            responseCode: resp.status,
                            error: resp.ok ? null : `HTTP ${resp.status} ${resp.statusText}`,
                        },
                    }
                );
            } catch (e) {
                const cause = e?.cause
                    ? (typeof e.cause === "object" ? {
                        name: e.cause.name,
                        code: e.cause.code,
                        message: e.cause.message,
                    } : e.cause)
                    : null;

                sendResult = {
                    ok: false,
                    error: e?.message || String(e),
                    cause,
                };

                await WebhookLog.updateOne(
                    { _id: created._id },
                    {
                        $set: {
                            status: "failed",
                            responseCode: 0,
                            error: JSON.stringify(sendResult),
                        },
                    }
                );
            }
        }

        // 4) حتماً از DB بخون و خروجی بده
        const fromDb = await WebhookLog.findById(created._id).lean();

        return res.status(200).json({
            ok: true,
            dispatchedTo: targetUrl || null,
            sendResult,     // نتیجه ارسال واقعی
            dbSaved: fromDb // چیزی که واقعاً در Mongo ذخیره شده (بعد از update)
        });
    } catch (err) {
        return res.status(500).json({
            ok: false,
            error: err?.message || String(err),
        });
    }
}


export async function seed1(req, res) {
    try {
        const targetUrl =
            (typeof req.query.url === "string" && req.query.url.trim() !== "")
                ? req.query.url.trim()
                : null;

        const fakePayload = buildFakePayload();

        // چیزی که می‌خوای مثل dispatchEvent باشد
        const dispatchEnvelope = {
            sessionId: fakePayload.sessionId,
            crmDeviceId: "crmDevice_test_001",
            url: targetUrl,
            eventId: 7,
            payload: fakePayload,
        };

        // 1) اول لاگ اولیه را ذخیره کن (pending)
        const created = await WebhookLog.create({
            crmDeviceId: dispatchEnvelope.crmDeviceId,
            eventId: dispatchEnvelope.eventId,
            targetUrl: targetUrl || "N/A",
            status: targetUrl ? "success" : "failed",
            responseCode: null,
            error: null,
            filePath: null,
            payload: dispatchEnvelope, // ✅ دقیقاً همون آبجکتی که گفتی می‌خوای ذخیره شه
        });

        let sendResult = null;

        // 2) اگر url داده شده، ارسال واقعی انجام بده
        if (targetUrl) {
            try {
                const resp = await fetch(targetUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(dispatchEnvelope),
                });

                const text = await resp.text(); // ممکنه json نباشه
                sendResult = {
                    ok: resp.ok,
                    status: resp.status,
                    statusText: resp.statusText,
                    body: text?.slice(0, 2000), // لاگ رو خیلی بزرگ نکنیم
                };

                console.log('seed.sendResult : ', sendResult)

                // 3) آپدیت لاگ با نتیجه ارسال
                await WebhookLog.updateOne(
                    { _id: created._id },
                    {
                        $set: {
                            status: resp.ok ? "success" : "failed",
                            responseCode: resp.status,
                            error: resp.ok ? null : `HTTP ${resp.status} ${resp.statusText}`,
                        },
                    }
                );
            } catch (e) {

                sendResult = {
                    ok: false,
                    error: e?.message || String(e),
                };

                await WebhookLog.updateOne(
                    { _id: created._id },
                    {
                        $set: {
                            status: "failed",
                            responseCode: 0,
                            error: sendResult.error,
                        },
                    }
                );
            }
        }

        // 4) حتماً از DB بخون و خروجی بده
        const fromDb = await WebhookLog.findById(created._id).lean();

        return res.status(200).json({
            ok: true,
            dispatchedTo: targetUrl || null,
            sendResult,     // نتیجه ارسال واقعی
            dbSaved: fromDb // چیزی که واقعاً در Mongo ذخیره شده (بعد از update)
        });
    } catch (err) {
        return res.status(500).json({
            ok: false,
            error: err?.message || String(err),
        });
    }
}


export async function seed2(req, res) {
    try {
        const targetUrl =
            (typeof req.query.url === "string" && req.query.url.trim() !== "")
                ? req.query.url.trim()
                : "https://example.com/webhook-test";

        // داده‌های فیک مطابق ساختار کلی شما
        const fake = {
            crmDeviceId: "crmDevice_test_001",
            eventId: 7, // مثلا message_received
            targetUrl,
            status: "success",
            responseCode: 200,
            error: null,
            filePath: null,
            payload: buildFakePayload(),
        };

        // 1) درج مستقیم
        const created = await WebhookLog.create(fake);

        // 2) حتما از DB بخونیم و برگردونیم (طبق شرط شما)
        const fromDb = await WebhookLog.findById(created._id).lean();

        return res.status(200).json({
            ok: true,
            inputInserted: fake,        // چیزی که مستقیم قصد داشتیم ذخیره کنیم
            dbSaved: fromDb,            // چیزی که واقعاً از Mongo خوانده شد
        });
    } catch (err) {
        return res.status(500).json({
            ok: false,
            error: err?.message || String(err),
        });
    }
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
