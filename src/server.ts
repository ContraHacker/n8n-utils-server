import express, { type NextFunction, type Request, type Response } from "express";
import n8n_utils_router from "./routes/n8n-utils";

const app = express();

const PORT = Number(process.env.PORT) || 7875;

app.use(express.json({ limit: "10mb" }));

app.disable("x-powered-by");
app.use((req: Request, res: Response, next: NextFunction) => {

  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Credentials", "false");

  next();
});

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.use("/n8n-utils", n8n_utils_router);

app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(err);
  res.status(500).json({
    error: "internal_server_error",
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`N8N utility server running on port ${PORT}`);
});
