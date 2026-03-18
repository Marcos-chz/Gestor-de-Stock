const express = require("express");
const router = express.Router();
const controller = require("../controllers/categoriesController");

// Rutas existentes (modificadas)
router.post("/", controller.create);
router.get("/", controller.getAll);
router.get("/:id", controller.getOne);
router.put("/:id", controller.update);

// NUEVAS rutas para soft delete y reactivar
router.patch("/:id/deactivate", controller.softDelete);  // Soft delete
router.patch("/:id/reactivate", controller.reactivate);   // Reactivar


module.exports = router;