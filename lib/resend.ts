import "server-only";
import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

// يبقى null لحد ما يتم ضبط RESEND_API_KEY (شوف .env.local.example)
export const resend = apiKey ? new Resend(apiKey) : null;
