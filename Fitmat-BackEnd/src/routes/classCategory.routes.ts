import { Router } from "express";
import { requireAdmin, attachAuthIfPresent } from "../middleware/auth";
import {
  createCategory,
  listCategories,
  updateCategory,
  deleteCategory,
} from "../controllers/classCategory.controller";

const router = Router();
router.use(attachAuthIfPresent);

router.get("/", listCategories);
router.post("/", requireAdmin, createCategory);
router.put("/:id", requireAdmin, updateCategory);
router.delete("/:id", requireAdmin, deleteCategory);

export default router;
