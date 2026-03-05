const express = require("express");
const router = express.Router();
const variantsController = require("../controllers/variantsController");

router.get("/", variantsController.getAll);
router.get("/:id", variantsController.getById);
router.post("/", variantsController.create);
router.put("/:id", variantsController.update);
router.delete("/:id", variantsController.delete);

module.exports = router;
