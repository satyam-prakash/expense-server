const express = require("express");
const groupController = require("../controllers/groupController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();
router.use(authMiddleware.protect);

router.post("/create", groupController.create);
router.put("/update", groupController.update);
router.patch("/members/add", groupController.addMembers);
router.patch("/members/remove", groupController.removeMembers);
router.delete("/:groupId", groupController.delete);
router.get("/my-groups", groupController.getGroupsByUser);
router.get("/status", groupController.getGroupsByPaymentStatus);
router.get("/:groupId/audit", groupController.getAudit);

module.exports = router;
