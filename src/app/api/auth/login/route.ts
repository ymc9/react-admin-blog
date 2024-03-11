import { compare } from "bcryptjs";
import { sign } from "jsonwebtoken";
import { db } from "~/server/db";

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
export async function POST(request: Request) {
  const { email, password }: { email: string; password: string } =
    await request.json();

  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    return new Response("invalid email and password combination", {
      status: 401,
    });
  }

  if (!(await compare(password, user.password))) {
    return new Response("invalid email and password combination", {
      status: 401,
    });
  }

  return Response.json({
    id: user.id,
    email: user.email,
    token: sign(
      { sub: user.id.toString(), email: user.email, role: user.role },
      process.env.JWT_SECRET!,
    ),
  });
}
