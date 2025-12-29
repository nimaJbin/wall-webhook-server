import mongoose from "mongoose";

const WebhookLogSchema = new mongoose.Schema(
    {
        crmDeviceId: String,
        eventId: Number,
        targetUrl: String,
        status: {
            type: String,
            enum: ["success", "failed"],
            default: "failed"
        },
        responseCode: Number,
        error: String,
        filePath: String,
        payload: Object
    },
    { timestamps: true }
);

export default mongoose.model("WebhookLog", WebhookLogSchema);
