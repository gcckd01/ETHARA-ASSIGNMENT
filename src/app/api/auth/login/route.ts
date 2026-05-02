import { prisma } from "@/lib/prisma";
import { signToken, apiError, apiSuccess } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return apiError("Email and password are required");
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return apiError("Invalid email or password", 401);
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return apiError("Invalid email or password", 401);
    }

    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const data = { id: user.id, name: user.name, email: user.email, role: user.role };
    const response = apiSuccess({ user: data, message: "Login successful" });
    const headers = new Headers(response.headers);
    headers.set(
      "Set-Cookie",
      `auth-token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`
    );
    return new Response(response.body, { status: 200, headers });
  } catch (err) {
    console.error("Login error:", err);
    return apiError("Internal server error", 500);
  }
}
