import type { Request, Response, NextFunction } from "express";
import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

/**
 * Non-blocking memoryUpload middleware:
 * Transparently supports JSON payloads as well as legacy multipart forms.
 */
export const memoryUpload = (req: Request, res: Response, next: NextFunction) => {
  const contentType = req.headers["content-type"] || "";
  if (contentType.includes("multipart/form-data")) {
    return upload.any()(req, res, (err) => {
      if (err) return next(err);
      next();
    });
  }
  next();
};
