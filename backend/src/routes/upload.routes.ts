import { Router, Request, Response } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { supabase } from "../services/supabase.service.js";
import { authenticateAdmin } from "../middleware/auth.middleware.js";

export const uploadRouter = Router();

const BUCKET = "apex-presentations";
const MAX_FILE_SIZE_MB = 20;
const ALLOWED_MIMES = [
  "application/pdf",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];
const ALLOWED_EXTS = [".pdf", ".ppt", ".pptx"];

// Ensure local storage directory exists for offline / resilient file persistence
const LOCAL_STORAGE_DIR = path.resolve(process.cwd(), "uploads", "submissions");
if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
  fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
}

// Store file in memory — streamed to Supabase or persisted locally
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_MIMES.includes(file.mimetype) || ALLOWED_EXTS.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, PPT, and PPTX files are allowed."));
    }
  },
});

/**
 * Check if the Supabase bucket is operational without throwing.
 */
async function ensureBucket(): Promise<boolean> {
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) {
      console.warn("[Upload] Supabase listBuckets notice:", error.message);
      return false;
    }
    const exists = buckets?.some((b) => b.name === BUCKET);
    if (!exists) {
      const { error: createErr } = await supabase.storage.createBucket(BUCKET, {
        public: true,
        fileSizeLimit: MAX_FILE_SIZE_MB * 1024 * 1024,
        allowedMimeTypes: ALLOWED_MIMES,
      });
      if (createErr) {
        console.warn("[Upload] Supabase createBucket notice:", createErr.message);
        return false;
      }
    }
    return true;
  } catch (err: any) {
    console.warn("[Upload] Supabase storage not reachable, using local storage:", err.message);
    return false;
  }
}

/**
 * Resolves a preview / download URL for a file in either Supabase or local storage.
 */
async function getFileUrl(req: Request, storagePath: string): Promise<string> {
  const fileName = path.basename(storagePath);
  const localFilePath = path.join(LOCAL_STORAGE_DIR, fileName);

  // If stored on local disk, serve via backend file endpoint
  if (fs.existsSync(localFilePath)) {
    const protocol = req.protocol;
    const host = req.get("host") || "localhost:5002";
    return `${protocol}://${host}/api/upload/file/${encodeURIComponent(fileName)}`;
  }

  // Otherwise try Supabase signed / public URL
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, 3600);
    if (!error && data?.signedUrl) return data.signedUrl;

    const { data: pubData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(storagePath);
    if (pubData?.publicUrl) return pubData.publicUrl;
  } catch {}

  const protocol = req.protocol;
  const host = req.get("host") || "localhost:5002";
  return `${protocol}://${host}/api/upload/file/${encodeURIComponent(fileName)}`;
}

/**
 * POST /api/upload/ppt
 * Uploads presentation file with dual-tier storage:
 * 1. Attempts Supabase storage if available
 * 2. Seamlessly falls back to local persistent storage if Supabase is offline/paused
 */
uploadRouter.post(
  "/ppt",
  (req, res, next) => {
    upload.single("ppt")(req, res, (err: any) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(413).json({
            error: `File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`,
          });
        }
        return res.status(400).json({
          error: err.message || "Invalid file.",
        });
      }
      next();
    });
  },
  async (req: Request, res: Response) => {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({ error: "No file uploaded." });
        return;
      }

      // Validate MIME / extension
      const ext = path.extname(file.originalname).toLowerCase();
      if (!ALLOWED_MIMES.includes(file.mimetype) && !ALLOWED_EXTS.includes(ext)) {
        res.status(400).json({ error: "Only PDF, PPT, and PPTX files are allowed." });
        return;
      }

      const timestamp = Date.now();
      const safeName = file.originalname
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .replace(/_{2,}/g, "_");
      const storagePath = `submissions/${timestamp}_${safeName}`;
      const localFileName = `${timestamp}_${safeName}`;
      const localFilePath = path.join(LOCAL_STORAGE_DIR, localFileName);

      let uploadedToSupabase = false;

      // 1. Try Supabase Storage if bucket is reachable
      const isSupabaseReady = await ensureBucket();
      if (isSupabaseReady) {
        try {
          const { error: uploadError } = await supabase.storage
            .from(BUCKET)
            .upload(storagePath, file.buffer, {
              contentType: file.mimetype,
              upsert: false,
            });

          if (!uploadError) {
            uploadedToSupabase = true;
            console.log(`[Upload] File saved to Supabase Storage: ${storagePath}`);
          } else {
            console.warn("[Upload] Supabase upload error, using local fallback:", uploadError.message);
          }
        } catch (supErr: any) {
          console.warn("[Upload] Supabase storage exception, using local fallback:", supErr.message);
        }
      }

      // 2. Always persist to local disk if Supabase is unavailable or failed
      if (!uploadedToSupabase) {
        fs.writeFileSync(localFilePath, file.buffer);
        console.log(`[Upload] File saved to persistent local storage: ${localFilePath}`);
      }

      // Generate preview/download URL
      const fileUrl = await getFileUrl(req, storagePath);

      return res.status(200).json({
        success: true,
        storagePath,
        fileName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        url: fileUrl,
      });
    } catch (err: any) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
          error: `File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`,
        });
      }
      console.error("[Upload] Unexpected error:", err);
      return res.status(500).json({ error: err.message || "Upload failed." });
    }
  },
);

/**
 * GET /api/upload/file/:fileName
 * Serves presentation files from local storage securely
 */
uploadRouter.get("/file/:fileName", (req: Request, res: Response) => {
  const fileName = path.basename(req.params.fileName);
  const filePath = path.join(LOCAL_STORAGE_DIR, fileName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }

  const ext = path.extname(fileName).toLowerCase();
  let contentType = "application/octet-stream";
  if (ext === ".pdf") contentType = "application/pdf";
  else if (ext === ".ppt") contentType = "application/vnd.ms-powerpoint";
  else if (ext === ".pptx") {
    contentType =
      "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  }

  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
  return res.sendFile(filePath);
});

/**
 * GET /api/upload/signed-url?path=submissions/...
 * Returns a download / preview URL for a private file
 */
uploadRouter.get("/signed-url", async (req: Request, res: Response) => {
  const storagePath = req.query.path as string;
  if (!storagePath || typeof storagePath !== "string") {
    res.status(400).json({ error: "path query parameter is required" });
    return;
  }

  try {
    const url = await getFileUrl(req, storagePath);
    res.json({ url });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/upload/ppt  (admin only)
 * Removes an orphaned file from storage.
 */
uploadRouter.delete(
  "/ppt",
  authenticateAdmin,
  async (req: Request, res: Response) => {
    const { storagePath } = req.body as { storagePath?: string };
    if (!storagePath || !storagePath.startsWith("submissions/")) {
      res.status(400).json({ error: "Invalid or missing storagePath" });
      return;
    }

    // Try deleting from Supabase
    try {
      await supabase.storage.from(BUCKET).remove([storagePath]);
    } catch {}

    // Also delete from local disk if present
    const fileName = path.basename(storagePath);
    const localFilePath = path.join(LOCAL_STORAGE_DIR, fileName);
    if (fs.existsSync(localFilePath)) {
      try {
        fs.unlinkSync(localFilePath);
      } catch {}
    }

    res.json({ success: true });
  },
);
