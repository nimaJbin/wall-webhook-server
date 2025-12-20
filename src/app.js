import express from "express";
import dispatchRoutes from "./routes/dispatch.routes.js";

const app = express();

app.use(express.json({ limit: "70mb" }));
app.use(express.urlencoded({ extended: true, limit: "70mb" }));

app.use("/api/events", dispatchRoutes);

export default app;
