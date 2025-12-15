import express from "express";
import {
countProductsByCategory
} from "../controller/calculation.js";

import { protectRoute } from "../lib/auth.middleware.js";
const router = express.Router();

router.get('/countProductsByCategory', countProductsByCategory);

export default router;
