const express = require("express");
const rbacController = require("../controllers/rbacController");
const authMiddleware = require("../middleware/authMiddleware");
const authorizeMiddleware = require("../middleware/authorizeMiddleware");

const router = express.Router();
router.use(authMiddleware.protect);

router.post("/", authorizeMiddleware("user:create"), rbacController.create);
router.put("/", authorizeMiddleware("user:update"), rbacController.update);
router.delete("/", authorizeMiddleware("user:delete"), rbacController.delete);
router.get("/", authorizeMiddleware("user:view"), rbacController.getAllUsers);

module.exports = router;
