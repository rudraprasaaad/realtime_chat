import { NextRequest, NextResponse } from "next/server";
import { redis } from "./app/lib/redis";
import { nanoid } from "nanoid";

export const proxy = async (req: NextRequest) => {
  const pathname = req.nextUrl.pathname;
  const roomMatch = pathname.match(/^\/room\/([^/]+)$/);

  if (!roomMatch) return NextResponse.redirect(new URL("/", req.url));

  const roomId = roomMatch[1];
  const token = req.cookies.get("x-auth-token")?.value;

  if (token) {
    const exists = await redis.sismember(`room:${roomId}:connected`, token);
    if (exists) return NextResponse.next();
  }

  const count = await redis.scard(`room:${roomId}:connected`);

  if (count >= 2) {
    return NextResponse.redirect(new URL("/?error=room-full", req.url));
  }

  const newToken = nanoid();
  await redis.sadd(`room:${roomId}:connected`, newToken);

  const res = NextResponse.next();
  res.cookies.set("x-auth-token", newToken, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  return res;
};

export const config = {
  matcher: "/room/:path*",
};
