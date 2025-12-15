import express from "express";
import {
  checkAuth,
  login,
  logout,
  signup,
  logUserActivity,
  getUserActivityLogs,
  getAllUsers,
} from "../controller/auth.controller.js";

import { protectRoute } from "../lib/auth.middleware.js";
const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

router.get("/check", protectRoute, checkAuth);
router.post("/logUserActivity", protectRoute, logUserActivity);
router.get("/getUserActivityLogs", getUserActivityLogs);
router.get("/getAllUsers", getAllUsers);

export default router;
