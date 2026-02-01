# سرور وب‌هوک (Webhook Server)

## 1. معرفی

سرور وب‌هوک سرویسی اجرایی برای دریافت، ذخیره و ارسال رویدادها بین سرویس‌ها (مانند **New Bailey**) است. این مستند صرفاً **Operational** بوده و وارد جزئیات پیاده‌سازی کد نمی‌شود.

**وظایف اصلی:**

* دریافت رویدادهای وب‌هوک
* ذخیره رویدادها و لاگ‌ها در MongoDB
* ارسال رویداد به URL مقصد
* ارائه Endpointهای تست و بررسی لاگ

---

## 2. محیط اجرا

| مورد       | مقدار                   |
| ---------- | ----------------------- |
| نام سرور   | WebHook                 |
| IP داخلی   | `192.168.104.50`        |
| سیستم‌عامل | Ubuntu 24.04 LTS        |
| بستر اجرا  | Docker / Docker Compose |

---

## 3. مسیر نصب پروژه

```
/opt/wall/wall-webhook-server
```

> این مسیر ثابت بوده و برای Production در نظر گرفته شده است.

---

## 4. سرویس‌های Docker

**فایل اجرا:**

```
/opt/wall/wall-webhook-server/docker-compose.yml
```

| سرویس         | نام کانتینر    | توضیح             |
| ------------- | -------------- | ----------------- |
| webhookserver | webhook-server | سرویس اصلی وب‌هوک |
| mongo         | webhook-mongo  | دیتابیس MongoDB   |

---

## 5. پورت‌ها

| سرویس          | پورت  | توضیح                    |
| -------------- | ----- | ------------------------ |
| Webhook Server | 7001  | فعال و قابل دسترسی       |
| MongoDB        | 27017 | فقط داخلی (Publish نشده) |

---

## 6. تنظیمات محیطی

**مسیر فایل:**

```
/opt/wall/wall-webhook-server/.env
```

> تغییر پورت یا تنظیمات فقط از طریق این فایل انجام شود.

---

## 7. Endpointها

### بررسی سلامت سرویس

```
GET /health
```

نمونه خروجی:

```json
{
  "ok": true,
  "service": "wall-webhook-server",
  "message": "healthy",
  "timestamp": 1738420000000
}
```

---

### تست ارسال وب‌هوک

```
GET /test/seed?url=https://www.time.ir
```

---

### مشاهده لاگ‌ها

```
GET /test/logs
```

---

## 8. دیتابیس

* نوع: MongoDB 6 (داخل Docker)
* نام دیتابیس: `webhookdb`

| Collection  | کاربرد             |
| ----------- | ------------------ |
| webhooks    | تعریف وب‌هوک‌ها    |
| webhooklogs | لاگ ارسال و دریافت |

---

## 9. ساختار داده وب‌هوک

```json
{
  "sessionId": "md_989900612862",
  "crmDeviceId": "crmDevice_test_001",
  "url": "https://target.url",
  "eventId": 7,
  "payload": {
    "event": "message_received",
    "from": "98912xxxx@s.whatsapp.net",
    "timestamp": 1738420000000,
    "messageType": "text",
    "text": "پیام تستی"
  }
}
```

---

## 10. دستورات اجرایی مهم

```bash
cd /opt/wall/wall-webhook-server

docker compose up -d --build
```

بررسی وضعیت:

```bash
docker compose ps
```

مشاهده لاگ:

```bash
docker compose logs -f webhookserver
```

ری‌استارت کامل:

```bash
docker compose down
docker compose up -d --build
```

---

## 11. نکات اجرایی مهم

* مسیر پروژه نباید تغییر کند
* MongoDB نباید Public شود
* تغییر پورت فقط از طریق `.env`
* برای استفاده Public حتماً Reverse Proxy + SSL در نظر گرفته شود

---

## 12. راهنمای تحویل به توسعه‌دهنده جدید

اطلاعات ضروری برای ادامه کار:

* مسیر پروژه: `/opt/wall/wall-webhook-server`
* اجرای سرویس: `docker compose up -d`
* بررسی سلامت: `/health`
* تست کامل: `/test/seed`
* مشاهده لاگ‌ها: `/test/logs`
* دیتابیس فقط داخلی است
