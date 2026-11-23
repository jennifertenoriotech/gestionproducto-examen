const API_URL = "/api/productos";
const form = document.getElementById("product-form");
const rows = document.getElementById("product-rows");
const search = document.getElementById("admin-search");
const message = document.getElementById("admin-message");
const count = document.getElementById("inventory-count");
const empty = document.getElementById("inventory-empty");
const imageInput = document.getElementById("product-image");
const imagePreview = document.getElementById("image-preview");
const removeImageButton = document.getElementById("remove-image");
const cancelButton = document.getElementById("cancel-edit");
const submitButton = document.getElementById("submit-product");

let productos = [];
let editingId = null;
let imageToRemove = false;
let previewObjectUrl = null;

const dinero = (valor) => new Intl.NumberFormat("es-CO", {
  style: "currency", currency: "COP", maximumFractionDigits: 2
}).format(Number(valor) || 0);

const elemento = (tag, className, texto) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (texto !== undefined) node.textContent = texto;
  return node;
};

function avisar(texto, tipo = "success") {
  message.textContent = texto;
  message.className = `feedback ${tipo}`;
  message.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

async function pedirJSON(url, options = {}) {
  const response = await fetch(url, options);
  let result;
  try { result = await response.json(); } catch (_error) { throw new Error("La API no devolvió una respuesta válida"); }
  if (!response.ok) throw new Error(result.message || "La operación no se pudo completar");
  return result.data;
}

function campo(name) { return form.elements.namedItem(name); }

function renderizarFilas() {
  const termino = search.value.trim().toLocaleLowerCase("es");
  const visibles = productos.filter((p) =>
    `${p.nombre} ${p.categoria}`.toLocaleLowerCase("es").includes(termino)
  );
  rows.replaceChildren();
  count.textContent = `${productos.length} producto${productos.length === 1 ? "" : "s"} en el inventario`;
  empty.hidden = visibles.length > 0;

  visibles.forEach((producto) => {
    const row = elemento("tr");
    const productCell = elemento("td");
    const summary = elemento("div", "table-product");
    const thumb = elemento("div", "table-thumb");
    if (producto.imagenUrl) {
      const img = elemento("img");
      img.src = producto.imagenUrl;
      img.alt = "";
      img.addEventListener("error", () => { img.remove(); thumb.textContent = "◇"; }, { once: true });
      thumb.append(img);
    } else thumb.textContent = "◇";
    summary.append(thumb, elemento("strong", "", producto.nombre));
    productCell.append(summary);
    row.append(productCell);
    row.append(elemento("td", "price-cell", dinero(producto.precio)));
    const stockCell = elemento("td");
    stockCell.append(elemento("span", `stock-badge ${producto.stock > 0 && producto.estado === "Disponible" ? "in-stock" : "out-stock"}`, String(producto.stock)));
    row.append(stockCell);
    row.append(elemento("td", "", producto.categoria));
    const actions = elemento("td", "table-actions");
    const edit = elemento("button", "small-button edit-button", "Editar");
    edit.type = "button";
    edit.setAttribute("aria-label", `Editar ${producto.nombre}`);
    edit.addEventListener("click", () => editarProducto(producto._id));
    const remove = elemento("button", "small-button delete-button", "Eliminar");
    remove.type = "button";
    remove.setAttribute("aria-label", `Eliminar ${producto.nombre}`);
    remove.addEventListener("click", () => eliminarProducto(producto._id, producto.nombre));
    actions.append(edit, remove);
    row.append(actions);
    rows.append(row);
  });
}

async function cargarProductos() {
  try {
    productos = await pedirJSON(API_URL);
    renderizarFilas();
  } catch (error) {
    rows.replaceChildren();
    empty.hidden = false;
    count.textContent = "No se pudo cargar el inventario";
    avisar(error.message, "error");
  }
}

function mostrarImagen(url) {
  if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
  previewObjectUrl = null;
  imagePreview.replaceChildren();
  if (url) {
    const img = elemento("img");
    img.src = url;
    img.alt = "Vista previa del producto";
    imagePreview.append(img);
  } else {
    imagePreview.append(elemento("span", "upload-symbol", "↑"));
  }
}

function resetEditor() {
  editingId = null;
  imageToRemove = false;
  form.reset();
  mostrarImagen("");
  document.getElementById("form-title").textContent = "Nuevo producto";
  document.getElementById("form-subtitle").textContent = "Completa los datos para agregarlo al catálogo.";
  submitButton.textContent = "Guardar producto";
  cancelButton.hidden = true;
  removeImageButton.hidden = true;
}

async function editarProducto(id) {
  try {
    const producto = await pedirJSON(`${API_URL}/${id}`);
    editingId = producto._id;
    imageToRemove = false;
    campo("nombre").value = producto.nombre;
    campo("descripcion").value = producto.descripcion;
    campo("precio").value = producto.precio;
    campo("stock").value = producto.stock;
    campo("categoria").value = producto.categoria;
    campo("estado").value = producto.estado;
    imageInput.value = "";
    mostrarImagen(producto.imagenUrl);
    removeImageButton.hidden = !producto.imagenUrl;
    document.getElementById("form-title").textContent = "Editar producto";
    document.getElementById("form-subtitle").textContent = "Actualiza los datos y guarda los cambios.";
    submitButton.textContent = "Actualizar producto";
    cancelButton.hidden = false;
    document.getElementById("form-panel").scrollIntoView({ behavior: "smooth", block: "start" });
    campo("nombre").focus({ preventScroll: true });
  } catch (error) {
    avisar(error.message, "error");
  }
}

function obtenerDatos() {
  const datos = {
    nombre: campo("nombre").value.trim(),
    descripcion: campo("descripcion").value.trim(),
    precio: Number(campo("precio").value),
    stock: Number(campo("stock").value),
    categoria: campo("categoria").value.trim(),
    estado: campo("estado").value
  };
  if (!datos.nombre || !datos.descripcion || !datos.categoria) throw new Error("Completa todos los campos obligatorios");
  if (!Number.isFinite(datos.precio) || datos.precio < 0) throw new Error("El precio debe ser mayor o igual a cero");
  if (!Number.isInteger(datos.stock) || datos.stock < 0) throw new Error("El stock debe ser un número entero mayor o igual a cero");
  return datos;
}

async function guardarProducto(event) {
  event.preventDefault();
  if (!form.reportValidity()) return;
  try {
    const datos = obtenerDatos();
    const archivo = imageInput.files[0];
    if (archivo && (!["image/jpeg", "image/png", "image/webp"].includes(archivo.type) || archivo.size > 5 * 1024 * 1024 || !archivo.size)) {
      throw new Error("Selecciona una imagen JPG, PNG o WEBP de hasta 5 MB");
    }
    submitButton.disabled = true;
    const idAnterior = editingId;
    const producto = await pedirJSON(idAnterior ? `${API_URL}/${idAnterior}` : API_URL, {
      method: idAnterior ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos)
    });
    try {
      if (archivo) {
        await pedirJSON(`${API_URL}/${producto._id}/imagen`, {
          method: "POST", headers: { "Content-Type": archivo.type }, body: archivo
        });
      } else if (idAnterior && imageToRemove) {
        await pedirJSON(`${API_URL}/${producto._id}/imagen`, { method: "DELETE" });
      }
      avisar(idAnterior ? "Producto actualizado correctamente" : "Producto creado correctamente");
      resetEditor();
    } catch (error) {
      avisar(`El producto se guardó, pero la imagen no: ${error.message}`, "error");
    }
    await cargarProductos();
  } catch (error) {
    avisar(error.message, "error");
  } finally {
    submitButton.disabled = false;
  }
}

async function eliminarProducto(id, nombre) {
  if (!window.confirm(`¿Eliminar "${nombre}" del catálogo?`)) return;
  try {
    await pedirJSON(`${API_URL}/${id}`, { method: "DELETE" });
    if (editingId === id) resetEditor();
    avisar("Producto eliminado correctamente");
    await cargarProductos();
  } catch (error) {
    avisar(error.message, "error");
  }
}

imageInput.addEventListener("change", () => {
  const archivo = imageInput.files[0];
  if (!archivo) return;
  if (!["image/jpeg", "image/png", "image/webp"].includes(archivo.type) || archivo.size > 5 * 1024 * 1024 || !archivo.size) {
    imageInput.value = "";
    avisar("Selecciona una imagen JPG, PNG o WEBP de hasta 5 MB", "error");
    return;
  }
  if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
  previewObjectUrl = URL.createObjectURL(archivo);
  imagePreview.replaceChildren();
  const img = elemento("img");
  img.src = previewObjectUrl;
  img.alt = "Vista previa de la imagen seleccionada";
  imagePreview.append(img);
  removeImageButton.hidden = false;
});

removeImageButton.addEventListener("click", () => {
  imageInput.value = "";
  imageToRemove = true;
  mostrarImagen("");
  removeImageButton.hidden = true;
});

document.getElementById("new-product").addEventListener("click", () => {
  resetEditor();
  document.getElementById("form-panel").scrollIntoView({ behavior: "smooth", block: "start" });
  campo("nombre").focus({ preventScroll: true });
});
cancelButton.addEventListener("click", resetEditor);
form.addEventListener("submit", guardarProducto);
search.addEventListener("input", renderizarFilas);
resetEditor();
cargarProductos();
