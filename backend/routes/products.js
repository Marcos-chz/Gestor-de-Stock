const express = require("express");
const router = express.Router();
const controller = require("../controllers/productsController.js");

router.get("/", controller.getAll);
router.get("/:id", controller.getOne);
router.post("/", controller.createWithVariant);
router.put("/:id", controller.update);
router.delete("/:id", controller.delete);

module.exports = router;
