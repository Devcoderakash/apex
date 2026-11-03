import type { Request, Response, NextFunction } from "express";
import crypto from "node:crypto";
import { config } from "../config/env.js";
import { supabase } from "../services/supabase.service.js";
import { errorResponse } from "../utils/response.js";

export async function authenticateAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization || (req.headers["x-admin-key"] as string);

  if (!authHeader) {
    return errorResponse(res, "Unauthorized: Administrative access requires authentication", 401);
  }

  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return errorResponse(res, "Unauthorized: Missing administrative credentials", 401);
  }

  // 1. Verify against configured ADMIN_API_KEY using timing-safe comparison
  const adminKey = config.adminApiKey || config.cronSecret;
  if (adminKey && adminKey.length > 0) {
    const hash = (val: string) => crypto.createHash("sha256").update(val, "utf8").digest();
    const tokenHash = hash(token);
    const keyHash = hash(adminKey);

    if (crypto.timingSafeEqual(tokenHash, keyHash)) {
      return next();
    }
  }

  // 2. Verify as Supabase Auth JWT
  try {
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (!authErr && user) {
      // Check if user has admin role in public.user_roles
      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (roleRow) {
        (req as any).user = user;
        return next();
      }
    }
  } catch {}

  return errorResponse(res, "Forbidden: Invalid administrative credentials or insufficient role", 403);
}

export function authenticateCron(req: Request, res: Response, next: NextFunction) {
  if (!config.cronSecret) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return errorResponse(res, "Unauthorized", 401);
  }

  const match = /^Bearer ([^\s,]+)$/.exec(authHeader);
  const token = match?.[1];

  if (!token) {
    return errorResponse(res, "Unauthorized", 401);
  }

  const digest = (value: string) =>
    crypto.createHash("sha256").update(value, "utf8").digest();

  const tokenDigest = digest(token);
  const secretDigest = digest(config.cronSecret);

  if (!crypto.timingSafeEqual(tokenDigest, secretDigest)) {
    return errorResponse(res, "Unauthorized", 401);
  }

  next();
}
