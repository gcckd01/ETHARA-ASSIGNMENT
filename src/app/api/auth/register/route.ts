import { prisma } from "@/lib/prisma";
import { signToken, apiError, apiSuccess } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password) {
      return apiError("Name, email, and password are required");
    }

    if (password.length < 6) {
      return apiError("Password must be at least 6 characters");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return apiError("Invalid email format");
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return apiError("Email already in use", 409);
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const userRole = role === "ADMIN" ? "ADMIN" : "MEMBER";

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role: userRole },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const response = apiSuccess({ user, message: "Account created successfully" }, 201);
    const headers = new Headers(response.headers);
    headers.set(
      "Set-Cookie",
      `auth-token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`
    );
    return new Response(response.body, { status: 201, headers });
  } catch (err) {
    console.error("Register error:", err);
    return apiError("Internal server error", 500);
  }
}
