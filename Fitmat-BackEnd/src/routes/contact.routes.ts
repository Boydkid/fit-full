import { Router } from "express";
import { submitContact, listContacts } from "../controllers/contact.controller";
import { requireAdmin, attachAuthIfPresent } from "../middleware/auth";

const router = Router();
router.use(attachAuthIfPresent);

router.get("/", requireAdmin, listContacts);
router.post("/", submitContact);

export default router;
