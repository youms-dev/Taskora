import { BrevoClient } from "@getbrevo/brevo";
import { config } from "dotenv";

config({
  path: [".env", ".env.development"],
  quiet: true,
});

export const brevo = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY,
  timeoutInSeconds: 30,
  maxRetries: 5,
});
