const API_URL = "/api/productos";
const grid = document.getElementById("catalog-grid");
const count = document.getElementById("catalog-count");
const message = document.getElementById("catalog-message");
const search = document.getElementById("catalog-search");
const filters = document.getElementById("category-filters");
const detailDialog = document.getElementById("detail-dialog");
const detailContent = document.getElementById("detail-content");

let productos = [];
let categoriaActiva = "Todos";

const dinero = (valor) => new Intl.NumberFormat("es-CO", {
  style: "currency", currency: "COP", maximumFractionDigits: 2
}).format(Number(valor) || 0);

const elemento = (tag, className, texto) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (texto !== undefined) node.textContent = texto;
  return node;
};

const disponible = (producto) => producto.estado === "Disponible" && producto.stock > 0;

async function pedirJSON(url) {
  const response = await fetch(url);
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "No se pudo cargar el catálogo");
  return result.data;
}

function imagenProducto(producto, className) {
  const wrapper = elemento("div", className);
  if (producto.imagenUrl) {
    const img = elemento("img", "product-image");
    img.src = producto.imagenUrl;
    img.alt = `Imagen de ${producto.nombre}`;
    img.loading = "lazy";
    img.addEventListener("error", () => {
      img.remove();
      wrapper.append(elemento("span", "image-fallback", "◇"));
    }, { once: true });
    wrapper.append(img);
  } else {
    wrapper.append(elemento("span", "image-fallback", "◇"));
  }
  return wrapper;
}

function renderizarFiltros() {
  filters.replaceChildren();
  const categorias = ["Todos", ...new Set(productos.map((p) => p.categoria).filter(Boolean))];
  if (!categorias.includes(categoriaActiva)) categoriaActiva = "Todos";
  categorias.forEach((categoria) => {
    const button = elemento("button", `filter-chip${categoria === categoriaActiva ? " selected" : ""}`, categoria);
    button.type = "button";
    button.setAttribute("aria-pressed", String(categoria === categoriaActiva));
    button.addEventListener("click", () => {
      categoriaActiva = categoria;
      renderizarFiltros();
      renderizarProductos();
    });
    filters.append(button);
  });
}

function renderizarProductos() {
  const termino = search.value.trim().toLocaleLowerCase("es");
  const visibles = productos.filter((p) =>
    (categoriaActiva === "Todos" || p.categoria === categoriaActiva) &&
    `${p.nombre} ${p.descripcion} ${p.categoria}`.toLocaleLowerCase("es").includes(termino)
  );
  count.textContent = `${visibles.length} producto${visibles.length === 1 ? "" : "s"} disponible${visibles.length === 1 ? "" : "s"} en esta vista`;
  grid.replaceChildren();
  if (!visibles.length) {
    const empty = elemento("div", "empty-state");
    empty.append(elemento("span", "empty-icon", "◇"));
    empty.append(elemento("h3", "", productos.length ? "No encontramos productos" : "Todavía no hay productos"));
    empty.append(elemento("p", "", productos.length ? "Prueba con otra búsqueda o categoría." : "Cuando agregues productos desde Administración, aparecerán aquí."));
    grid.append(empty);
    return;
  }

  visibles.forEach((producto) => {
    const card = elemento("article", "catalog-card");
    card.append(imagenProducto(producto, "card-image"));
    const body = elemento("div", "card-body");
    body.append(elemento("span", "card-category", producto.categoria));
    body.append(elemento("h3", "card-title", producto.nombre));
    body.append(elemento("p", "card-description", producto.descripcion));
    body.append(elemento("strong", "card-price", dinero(producto.precio)));
    const badge = elemento("span", `stock-badge ${disponible(producto) ? "in-stock" : "out-stock"}`,
      disponible(producto) ? `● Disponible · ${producto.stock} en stock` : producto.estado === "Descontinuado" ? "● Descontinuado" : "● Agotado");
    body.append(badge);
    const button = elemento("button", "button button-dark card-button", "Ver detalles →");
    button.type = "button";
    button.addEventListener("click", () => verDetalle(producto._id));
    body.append(button);
    card.append(body);
    grid.append(card);
  });
}

async function verDetalle(id) {
  try {
    const producto = await pedirJSON(`${API_URL}/${id}`);
    detailContent.replaceChildren();
    const layout = elemento("div", "detail-layout");
    layout.append(imagenProducto(producto, "detail-image"));
    const info = elemento("div", "detail-info");
    info.append(elemento("span", "eyebrow", producto.categoria));
    const title = elemento("h2", "", producto.nombre);
    title.id = "detail-title";
    info.append(title);
    info.append(elemento("strong", "detail-price", dinero(producto.precio)));
    info.append(elemento("p", "", producto.descripcion));
    info.append(elemento("span", `stock-badge ${disponible(producto) ? "in-stock" : "out-stock"}`,
      disponible(producto) ? `${producto.stock} unidades disponibles` : "No disponible"));
    layout.append(info);
    detailContent.append(layout);
    detailDialog.showModal();
  } catch (error) {
    message.textContent = error.message;
    message.classList.add("error");
  }
}

async function cargarProductos() {
  try {
    message.textContent = "";
    message.classList.remove("error");
    productos = await pedirJSON(API_URL);
    renderizarFiltros();
    renderizarProductos();
  } catch (error) {
    productos = [];
    count.textContent = "No se pudieron cargar los productos";
    grid.replaceChildren();
    message.textContent = error.message;
    message.classList.add("error");
  }
}

search.addEventListener("input", renderizarProductos);
document.getElementById("close-detail").addEventListener("click", () => detailDialog.close());
detailDialog.addEventListener("click", (event) => {
  if (event.target === detailDialog) detailDialog.close();
});
cargarProductos();
