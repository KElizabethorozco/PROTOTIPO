/* ==========================================================
   ESCOBAR FASHION - SCRIPT.JS
   CARRITO + FAVORITOS + FILTROS (ACTUALIZADO SIN NODE.JS)
========================================================== */
console.log("SCRIPT CARGADO CORRECTAMENTE");

const PRODUCTS_API_URL = "/api/products";
const isLocalServer = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

const carritoBtn = document.getElementById("carritoBtn");
const favoritosBtn = document.getElementById("favoritosBtn");
const carritoPanel = document.getElementById("carritoPanel");
const favoritosPanel = document.getElementById("favoritosPanel");
const cerrarCarrito = document.getElementById("cerrarCarrito");
const listaCarrito = document.getElementById("listaCarrito");
const totalCarrito = document.getElementById("totalCarrito");
const cantidadCarrito = document.getElementById("cantidadCarrito");
const favoritosCantidad = document.getElementById("favoritosCantidad");

let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
let favoritos = JSON.parse(localStorage.getItem("favoritos")) || [];

/* ==========================================
   CARRERA DE DATOS (LOCALSTORAGE / JSON)
========================================== */
async function initializeProducts() {
    let localProducts = JSON.parse(localStorage.getItem("productos_tienda"));
    
    if (localProducts && localProducts.length > 0) {
        console.log("Cargando productos desde LocalStorage");
        return localProducts;
    } else {
        console.log("Cargando productos desde el archivo JSON de respaldo");
        try {
            const response = await fetch("data/products.json");
            if(!response.ok) throw new Error("Error al cargar JSON");
            return await response.json();
        } catch(error) {
            console.error("No se encontraron productos:", error);
            return [];
        }
    }
}

/* ==========================================
   RENDERIZADO DEL CATÁLOGO DE LA TIENDA
========================================== */
async function renderProductosAdminCatalogo() {
    const contenedor = document.getElementById("productos");
    if(!contenedor) return;

    const productos = await initializeProducts();
    contenedor.innerHTML = "";

    if(productos.length === 0) {
        contenedor.innerHTML = "<p>No hay productos disponibles en este momento.</p>";
        return;
    }

    productos.forEach(producto => {
        
        // 1. FILTRO DE SEGURIDAD RADICAL: Si está desactivado, se ignora y no se dibuja en la web
        if (producto.status === "desactivado") {
            return; // Salta al siguiente producto de inmediato
        }

        // 2. DETECTOR DE AGOTADO: Evaluamos si el estado dice "agotado" o el stock llegó a 0
        const estaAgotado = producto.status === "agotado" || Number(producto.stock) <= 0;

        // Configuración de textos y estilos de inventario
        const stockClase = estaAgotado ? "stock-agotado" : producto.stock <= 5 ? "stock-bajo" : "";
        const stockTexto = estaAgotado ? "Agotado" : `Stock: ${producto.stock}`;
        
        // Configuración de tallas por defecto si no vienen definidas
        const sizes = producto.sizes || ["S", "M", "L", "XL"];
        const sizesOptions = sizes.map(size => `<option>${size}</option>`).join("");

        // 3. DETERMINACIÓN DEL BOTÓN DE COMPRA (Bloqueado si está agotado)
        let botonHTML = "";
        if (estaAgotado) {
            botonHTML = `<button class="agregar btn-agotado" disabled style="background:#ced4da; color:#495057; cursor:not-allowed;">Agotado temporalmente</button>`;
        } else {
            botonHTML = `<button class="agregar">Agregar al carrito</button>`;
        }

        // 4. INYECCIÓN DE LA TARJETA EN LA TIENDA
        contenedor.innerHTML += `
        <div class="producto ${estaAgotado ? 'card-agotada' : ''}" data-categoria="${producto.category}">
            <div class="favorito">
                <i class="fa-regular fa-heart"></i>
            </div>
            <div class="galeria" style="position: relative;">
                <img src="${producto.image}" alt="${producto.name}">
                ${estaAgotado ? '<span style="position:absolute; top:10px; left:10px; background:#e03131; color:white; padding:4px 8px; font-size:0.75rem; font-weight:bold; border-radius:5px;">NO DISPONIBLE</span>' : ''}
            </div>
            <h3>${producto.name}</h3>
            <p class="descripcion">${producto.description || ""}</p>
            <p class="precio">$${Number(producto.price).toFixed(2)}</p>
            <p class="stock ${stockClase}">${stockTexto}</p>
            <select class="tallas" ${estaAgotado ? 'disabled' : ''}>${sizesOptions}</select>
            <input type="number" class="cantidad" value="1" min="1" ${estaAgotado ? 'disabled' : ''}>
            
            ${botonHTML}
        </div>`;
    });

    // Reactivar eventos tras dibujar los elementos en el HTML
    setupBotonesAgregar();
    setupFavoritos();
}

// Inicializar el catálogo automáticamente al cargar el script
renderProductosAdminCatalogo();

/* ==========================================
   MÓDULOS DEL CARRITO Y PANELES
========================================== */
if(carritoBtn) { carritoBtn.addEventListener("click", () => carritoPanel.classList.toggle("activo")); }
if(cerrarCarrito) { cerrarCarrito.addEventListener("click", () => carritoPanel.classList.remove("activo")); }
if(favoritosBtn) { favoritosBtn.addEventListener("click", () => { favoritosPanel.classList.toggle("activo"); mostrarFavoritos(); }); }

function setupBotonesAgregar(){
    const botonesAgregar = document.querySelectorAll(".agregar:not([disabled])"); // Solo añade eventos a botones activos
    botonesAgregar.forEach((boton)=>{
        boton.addEventListener("click",()=>{
            const producto = boton.closest(".producto");
            const nombre = producto.querySelector("h3").innerText;
            const precio = parseFloat(producto.querySelector(".precio").innerText.replace("$",""));
            const imagen = producto.querySelector("img").src;
            const talla = producto.querySelector(".tallas").value;
            const cantidad = parseInt(producto.querySelector(".cantidad").value);

            const itemExistente = carrito.find(item=> item.nombre===nombre && item.talla===talla);
            if(itemExistente){
                itemExistente.cantidad += cantidad;
            }else{
                carrito.push({ nombre, precio, imagen, talla, cantidad });
            }
            guardarCarrito();
            renderCarrito();
            mostrarMensaje("Producto agregado al carrito");
        });
    });
}

function renderCarrito(){
    if(!listaCarrito) return;
    listaCarrito.innerHTML="";
    let total=0;

    carrito.forEach((item, index)=>{
        total += item.price ? (item.price * item.cantidad) : (item.precio * item.cantidad);
        listaCarrito.innerHTML +=`
        <div class="item-carrito">
            <img src="${item.imagen}">
            <div>
                <h4>${item.nombre}</h4>
                <p>Talla: ${item.talla}</p>
                <p>Cantidad: ${item.cantidad}</p>
                <p>$${((item.precio || item.price)* item.cantidad).toFixed(2)}</p>
                <button onclick="eliminarProducto(${index})">Eliminar</button>
            </div>
        </div>`;
    });
    if(totalCarrito) totalCarrito.textContent = "$" + total.toFixed(2);
    actualizarContadores();
}

function eliminarProducto(index){
    carrito.splice(index,1);
    guardarCarrito();
    renderCarrito();
}

function guardarCarrito(){ localStorage.setItem("carrito", JSON.stringify(carrito)); }

function actualizarContadores(){
    let totalItems = 0;
    carrito.forEach(item => totalItems += item.cantidad);
    if(cantidadCarrito) cantidadCarrito.textContent = totalItems;
    if(favoritosCantidad) favoritosCantidad.textContent = favoritos.length;
}

function setupFavoritos(){
    const corazones = document.querySelectorAll(".favorito");
    corazones.forEach((corazon)=>{
        corazon.addEventListener("click",()=>{
            const producto = corazon.closest(".producto");
            const nombre = producto.querySelector("h3").innerText;
            const imagen = producto.querySelector("img").src;
            const existe = favoritos.find(item=> item.nombre===nombre);

            if(existe){
                favoritos = favoritos.filter(item=> item.nombre!==nombre);
                corazon.innerHTML = '<i class="fa-regular fa-heart"></i>';
            }else{
                favoritos.push({ nombre, imagen });
                corazon.innerHTML = '<i class="fa-solid fa-heart"></i>';
            }
            localStorage.setItem("favoritos", JSON.stringify(favoritos));
            actualizarContadores();
            mostrarFavoritos();
        });
    });
}

function mostrarFavoritos(){
    const lista = document.getElementById("listaFavoritos");
    if(!lista) return;
    lista.innerHTML="";
    favoritos.forEach(item=>{
        lista.innerHTML +=`
        <div style="margin-bottom:20px; text-align:center;">
            <img src="${item.imagen}" style="width:100%; border-radius:10px;">
            <p>${item.nombre}</p>
        </div>`;
    });
}

function mostrarMensaje(texto){
    const mensaje = document.createElement("div");
    mensaje.className = "mensaje-toast";
    mensaje.innerText = texto;
    document.body.appendChild(mensaje);
    setTimeout(()=> mensaje.classList.add("mostrar"), 100);
    setTimeout(()=> mensaje.remove(), 2500);
}

/* ==========================================
   BUSCADOR, FILTROS Y WHATSAPP
========================================== */
const buscador = document.getElementById("buscador");
if(buscador){
    buscador.addEventListener("keyup", ()=>{
        const texto = buscador.value.toLowerCase();
        const productos = document.querySelectorAll(".producto");
        productos.forEach(producto=>{
            const nombre = producto.querySelector("h3").textContent.toLowerCase();
            const desc = producto.querySelector(".descripcion").textContent.toLowerCase();
            producto.style.display = (nombre.includes(texto) || desc.includes(texto)) ? "block" : "none";
        });
    });
}

const categoria = document.getElementById("categoria");
if(categoria){
    categoria.addEventListener("change", ()=>{
        const valor = categoria.value;
        const productos = document.querySelectorAll(".producto");
        productos.forEach(producto=>{
            producto.style.display = (valor==="todos" || producto.dataset.categoria===valor) ? "block" : "none";
        });
    });
}

const telefonoTienda = "593985551198";
const comprarWhatsapp = document.getElementById("comprarWhatsapp");
if(comprarWhatsapp){
    comprarWhatsapp.addEventListener("click",()=>{
        if(carrito.length === 0){ alert("Tu carrito está vacío."); return; }
        const metodoSeleccionado = document.getElementById("metodoPago").value;
        if(metodoSeleccionado === ""){ alert("Por favor seleccione un método de pago."); return; }

        let mensaje = " *NUEVO PEDIDO ESCOBAR FASHION*%0A%0A";
        let total = 0;
        carrito.forEach(item=>{
            const subtotal = (item.precio || item.price) * item.cantidad;
            total += subtotal;
            mensaje += ` Producto: ${item.nombre}%0A Talla: ${item.talla}%0A Cantidad: ${item.cantidad}%0A Subtotal: $${subtotal.toFixed(2)}%0A----%0A`;
        });
        mensaje += `%0A Método de Pago: ${metodoSeleccionado}%0A TOTAL: $${total.toFixed(2)}`;
        window.open(`https://wa.me/${telefonoTienda}?text=${mensaje}`, "_blank");
        
        setTimeout(()=>{
            carrito = [];
            guardarCarrito();
            renderCarrito();
        }, 1000);
    });
}

// Inicialización de vistas por defecto al cargar la página
renderCarrito();
mostrarFavoritos();
actualizarContadores();