import { apiSuccess } from "@/lib/auth";

export async function POST() {
  const response = apiSuccess({ message: "Logged out successfully" });
  const headers = new Headers(response.headers);
  headers.set("Set-Cookie", "auth-token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");
  return new Response(response.body, { status: 200, headers });
}
