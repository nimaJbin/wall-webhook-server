// src/server.js
import app from "./app.js";
import { connectMongo } from "./config/mongo.js";

const PORT = process.env.WH_SERVER_PORT || 7001;

await connectMongo();

app.listen(PORT, () => {
    console.log(`🚀 Webhook Server running on port ${PORT}`);
});
