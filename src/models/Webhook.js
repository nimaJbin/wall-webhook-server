import mongoose from "mongoose";

const WebhookSchema = new mongoose.Schema(
    {
        // شناسه مالک یا منبع رویداد (مثلاً device / tenant / customer)
        deviceId: {
            type: String,
            required: true,
            index: true
        },

        // رویدادی که این وبهوک به آن گوش می‌دهد
        eventId: {
            type: Number,
            required: true,
            index: true
        },

        // آدرس مقصد وبهوک
        targetUrl: {
            type: String,
            required: true
        },

        // هدرهای دلخواه برای ارسال (Authorization، Signature، ...)
        headers: {
            type: Object,
            default: {}
        },

        // فعال / غیرفعال
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active",
            index: true
        },

        // حداکثر تعداد تلاش مجدد (برای آینده)
        maxRetry: {
            type: Number,
            default: 3
        },

        // تعداد تلاش انجام‌شده
        retryCount: {
            type: Number,
            default: 0
        },

        // توضیح یا نام وبهوک (برای مدیریت)
        description: {
            type: String
        }
    },
    {
        timestamps: true
    }
);

// جلوگیری از ثبت وبهوک تکراری برای یک event روی یک device
WebhookSchema.index(
    { deviceId: 1, eventId: 1, targetUrl: 1 },
    { unique: true }
);

export default mongoose.model("Webhook", WebhookSchema);
