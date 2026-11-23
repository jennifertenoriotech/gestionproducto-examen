const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs/promises");
const { randomUUID } = require("crypto");
const Producto = require("../models/Producto");

const camposEditables = ["nombre", "descripcion", "precio", "categoria", "stock", "estado"];
const directorioImagenes = path.join(__dirname, "..", "public", "uploads");
const tiposImagen = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
};

const datosProducto = (body) => {
  const datos = {};
  for (const campo of camposEditables) {
    if (Object.prototype.hasOwnProperty.call(body || {}, campo)) datos[campo] = body[campo];
  }
  return datos;
};

const mensajeValidacion = (error) =>
  Object.values(error.errors || {}).map((item) => item.message).join(" | ") || "Datos inválidos";

const idValido = (id) => mongoose.Types.ObjectId.isValid(id);
const errorServidor = (res) => res.status(500).json({ success: false, message: "Error interno del servidor" });
const errorId = (res) => res.status(400).json({ success: false, message: "ID de producto inválido" });
const noEncontrado = (res) => res.status(404).json({ success: false, message: "Producto no encontrado" });

const rutaImagenLocal = (imagenUrl) => {
  const nombre = imagenUrl?.startsWith("/uploads/") ? imagenUrl.slice(9) : "";
  return /^[a-f0-9-]{36}\.(jpg|png|webp)$/.test(nombre)
    ? path.join(directorioImagenes, nombre)
    : null;
};

const borrarImagenLocal = async (imagenUrl) => {
  const ruta = rutaImagenLocal(imagenUrl);
  if (!ruta) return;
  try {
    await fs.unlink(ruta);
  } catch (error) {
    if (error.code !== "ENOENT") console.error("No se pudo borrar una imagen:", error);
  }
};

const imagenValida = (buffer, tipo) => {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0 || buffer.length > 5 * 1024 * 1024) return false;
  if (tipo === "image/png") return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (tipo === "image/jpeg") return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (tipo === "image/webp") return buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";
  return false;
};

const obtenerProductos = async (_req, res) => {
  try {
    const productos = await Producto.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, message: "Productos obtenidos correctamente", data: productos });
  } catch (_error) {
    return errorServidor(res);
  }
};

const obtenerProductoPorId = async (req, res) => {
  if (!idValido(req.params.id)) return errorId(res);
  try {
    const producto = await Producto.findById(req.params.id);
    if (!producto) return noEncontrado(res);
    return res.status(200).json({ success: true, message: "Producto obtenido correctamente", data: producto });
  } catch (_error) {
    return errorServidor(res);
  }
};

const crearProducto = async (req, res) => {
  try {
    const producto = await Producto.create(datosProducto(req.body));
    return res.status(201).json({ success: true, message: "Producto creado correctamente", data: producto });
  } catch (error) {
    if (error.name === "ValidationError") return res.status(400).json({ success: false, message: mensajeValidacion(error) });
    return errorServidor(res);
  }
};

const actualizarProducto = async (req, res) => {
  if (!idValido(req.params.id)) return errorId(res);
  try {
    const producto = await Producto.findByIdAndUpdate(req.params.id, datosProducto(req.body), {
      returnDocument: "after",
      runValidators: true
    });
    if (!producto) return noEncontrado(res);
    return res.status(200).json({ success: true, message: "Producto actualizado correctamente", data: producto });
  } catch (error) {
    if (error.name === "ValidationError") return res.status(400).json({ success: false, message: mensajeValidacion(error) });
    return errorServidor(res);
  }
};

const eliminarProducto = async (req, res) => {
  if (!idValido(req.params.id)) return errorId(res);
  try {
    const producto = await Producto.findByIdAndDelete(req.params.id);
    if (!producto) return noEncontrado(res);
    await borrarImagenLocal(producto.imagenUrl);
    return res.status(200).json({ success: true, message: "Producto eliminado correctamente", data: producto });
  } catch (_error) {
    return errorServidor(res);
  }
};

const subirImagenProducto = async (req, res) => {
  if (!idValido(req.params.id)) return errorId(res);
  const tipo = req.headers["content-type"]?.split(";")[0].trim().toLowerCase();
  if (!tiposImagen[tipo]) return res.status(415).json({ success: false, message: "Usa una imagen JPG, PNG o WEBP" });
  if (!imagenValida(req.body, tipo)) return res.status(400).json({ success: false, message: "La imagen no es válida o supera 5 MB" });

  let rutaNueva;
  try {
    const producto = await Producto.findById(req.params.id);
    if (!producto) return noEncontrado(res);

    await fs.mkdir(directorioImagenes, { recursive: true });
    const nombre = `${randomUUID()}.${tiposImagen[tipo]}`;
    rutaNueva = path.join(directorioImagenes, nombre);
    await fs.writeFile(rutaNueva, req.body, { flag: "wx" });
    const imagenAnterior = producto.imagenUrl;
    producto.imagenUrl = `/uploads/${nombre}`;
    await producto.save();
    await borrarImagenLocal(imagenAnterior);
    return res.status(200).json({ success: true, message: "Imagen subida correctamente", data: producto });
  } catch (_error) {
    if (rutaNueva) await fs.unlink(rutaNueva).catch(() => {});
    return errorServidor(res);
  }
};

const eliminarImagenProducto = async (req, res) => {
  if (!idValido(req.params.id)) return errorId(res);
  try {
    const producto = await Producto.findById(req.params.id);
    if (!producto) return noEncontrado(res);
    const imagenAnterior = producto.imagenUrl;
    producto.imagenUrl = "";
    await producto.save();
    await borrarImagenLocal(imagenAnterior);
    return res.status(200).json({ success: true, message: "Imagen eliminada correctamente", data: producto });
  } catch (_error) {
    return errorServidor(res);
  }
};

module.exports = {
  obtenerProductos,
  obtenerProductoPorId,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  subirImagenProducto,
  eliminarImagenProducto
};
