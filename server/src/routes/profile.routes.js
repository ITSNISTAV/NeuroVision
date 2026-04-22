const express = require("express");
const router = express.Router();
const controller = require("../controllers/profile.controller");

router.get("/:id", controller.getProfile);
router.post("/:id", controller.saveProfile);
router.put("/:id/:role", controller.updateRole);
router.delete("/:id/:role", controller.deleteRole);

module.exports = router;

