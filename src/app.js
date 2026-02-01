// src/app.js
import express from "express";
import dispatchRoutes from "./routes/dispatch.routes.js";
import testRoutes from "./routes/test.routes.js";   // ✅ اضافه

const app = express();

app.use(express.json({ limit: "70mb" }));
app.use(express.urlencoded({ extended: true, limit: "70mb" }));

app.use("/api/events", dispatchRoutes);
app.use("/", testRoutes); // ✅ اضافه

export default app;
