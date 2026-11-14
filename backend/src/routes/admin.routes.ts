import { Router } from "express";
import {
  deleteTeam,
  getRegistrations,
  getSettings,
  getStats,
  getTeamPptSignedUrl,
  sendAdminTeamEmail,
  updateReviewStatus,
  updateSettings,
  updateTeam,
  updateTeamStatus,
} from "../controllers/admin.controller.js";
import { authenticateAdmin } from "../middleware/auth.middleware.js";

export const adminRouter = Router();

adminRouter.use(authenticateAdmin);

adminRouter.get("/registrations", getRegistrations);
adminRouter.get("/registrations/:id/ppt-url", getTeamPptSignedUrl);
adminRouter.patch("/registrations/:id/review", updateReviewStatus);
adminRouter.post("/registrations/:id/send-email", sendAdminTeamEmail);

adminRouter.get("/stats", getStats);
adminRouter.patch("/teams/:id/status", updateTeamStatus);
adminRouter.patch("/teams/:id/review", updateReviewStatus);
adminRouter.put("/teams/:id", updateTeam);
adminRouter.delete("/teams/:id", deleteTeam);

adminRouter.get("/settings", getSettings);
adminRouter.post("/settings", updateSettings);
