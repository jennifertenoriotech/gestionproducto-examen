const express = require("express");
const {
  obtenerProductos,
  obtenerProductoPorId,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  subirImagenProducto,
  eliminarImagenProducto
} = require("../controllers/productoController");

const router = express.Router();
const leerImagen = express.raw({
  type: ["image/jpeg", "image/png", "image/webp"],
  limit: "5mb"
});

router.get("/", obtenerProductos);
router.post("/", crearProducto);
router.post("/:id/imagen", leerImagen, subirImagenProducto);
router.delete("/:id/imagen", eliminarImagenProducto);
router.get("/:id", obtenerProductoPorId);
router.put("/:id", actualizarProducto);
router.delete("/:id", eliminarProducto);

module.exports = router;
