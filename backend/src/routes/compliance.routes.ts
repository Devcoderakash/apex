import { Router } from "express";
import {
  submitGrievanceHandler,
  getGrievanceStatusHandler,
  submitPrivacyRequestHandler,
  getPrivacyRequestStatusHandler,
} from "../controllers/compliance.controller.js";

export const grievanceRouter = Router();
grievanceRouter.post("/", submitGrievanceHandler);
grievanceRouter.get("/:id", getGrievanceStatusHandler);

export const privacyRouter = Router();
privacyRouter.post("/", submitPrivacyRequestHandler);
privacyRouter.get("/:id", getPrivacyRequestStatusHandler);
