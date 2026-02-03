import http from "http";
import https from "https";
import { URL } from "url";

/**
 * Minimal outbound HTTP(S) client with IPv4-only connect (family: 4)
 * - No external deps
 * - Good for webhook dispatch
 */
export function httpRequest({
                                url,
                                method = "POST",
                                headers = {},
                                body = null,
                                timeoutMs = 15000,
                            }) {
    return new Promise((resolve, reject) => {
        const u = new URL(url);
        const isHttps = u.protocol === "https:";
        const lib = isHttps ? https : http;

        const agent = isHttps
            ? new https.Agent({ keepAlive: true, family: 4 })
            : new http.Agent({ keepAlive: true, family: 4 });

        const req = lib.request(
            {
                protocol: u.protocol,
                hostname: u.hostname,
                port: u.port || (isHttps ? 443 : 80),
                path: `${u.pathname}${u.search}`,
                method,
                headers,
                agent,
            },
            (res) => {
                const chunks = [];
                res.on("data", (d) => chunks.push(d));
                res.on("end", () => {
                    const buf = Buffer.concat(chunks);
                    resolve({
                        ok: res.statusCode >= 200 && res.statusCode < 300,
                        status: res.statusCode,
                        headers: res.headers,
                        body: buf.toString("utf8"),
                    });
                });
            }
        );

        req.setTimeout(timeoutMs, () => {
            req.destroy(new Error(`timeout after ${timeoutMs}ms`));
        });

        req.on("error", reject);

        if (body) req.write(body);
        req.end();
    });
}
