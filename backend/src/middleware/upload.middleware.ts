import multer from "multer";

export const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
}).fields([
  { name: "presentation", maxCount: 1 },
  { name: "ppt", maxCount: 1 },
  { name: "file", maxCount: 1 },
]);
