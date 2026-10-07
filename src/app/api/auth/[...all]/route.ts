import { toNextJsHandler } from "better-auth/next-js";
import { auth, authConfigured } from "@/lib/auth";

const off = () => new Response("Sign-in is not configured", { status: 503 });

export async function GET(req: Request) {
  return authConfigured() ? toNextJsHandler(auth()).GET(req) : off();
}
export async function POST(req: Request) {
  return authConfigured() ? toNextJsHandler(auth()).POST(req) : off();
}
