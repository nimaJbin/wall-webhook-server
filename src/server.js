// src/server.js
import app from "./app.js";
import { connectMongo } from "./config/mongo.js";

const PORT = process.env.PORT || 7008;

await connectMongo();

app.listen(PORT, () => {
    console.log(`🚀 Webhook Server running on port ${PORT}`);
});
