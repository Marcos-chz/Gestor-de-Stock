const express = require("express");
const router = express.Router();
const controller = require("../controllers/sizesController");

// Rutas existentes
router.post("/", controller.create);
router.get("/", controller.getAll);
router.get("/:id", controller.getOne);
router.put("/:id", controller.update);

// NUEVAS rutas (reemplazan a DELETE)
router.patch("/:id/deactivate", controller.softDelete); 
router.patch("/:id/reactivate", controller.reactivate);  



module.exports = router;