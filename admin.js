/* ===========================================================
   ADMIN.JS - GESTIÓN DE PRODUCTOS CON ESTADO (ACT/AGO/DES)
   =========================================================== */

let products = [];
const table = document.getElementById("tableProducts");

// 1. CARGA INICIAL: Lee de la memoria local o extrae el JSON físico original
async function loadInitialData() {
    let localData = JSON.parse(localStorage.getItem("productos_tienda"));
    
    if (localData && localData.length > 0) {
        products = localData;
    } else {
        try {
            const response = await fetch("data/products.json");
            if (response.ok) {
                products = await response.json();
                localStorage.setItem("productos_tienda", JSON.stringify(products));
            }
        } catch (error) {
            console.error("Error cargando productos previos:", error);
        }
    }
    renderProducts();
}

// 2. RENDERIZAR TABLA: Muestra tus productos y sus estados con colores
function renderProducts() {
    if (!table) return;
    table.innerHTML = "";
    
    if (products.length === 0) {
        table.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px;">No hay productos en la lista.</td></tr>`;
        return;
    }

    products.forEach((product, index) => {
        // Por si un producto viejo no tiene estado, le asignamos "activado" por defecto
        const currentStatus = product.status || "activado"; 

        table.innerHTML += `
        <tr>
            <td><img src="${product.image}" style="width:65px; height:65px; object-fit:cover; border-radius:10px; border:1px solid #e9ecef;"></td>
            <td><strong>${product.name}</strong></td>
            <td>$${Number(product.price).toFixed(2)}</td>
            <td>${product.stock}</td>
            <td><span class="badge">${product.category}</span></td>
            <td><span class="status-badge status-${currentStatus}">${currentStatus}</span></td>
            <td>
                <div class="actions">
                    <button class="edit-btn" onclick="editProduct(${index})"><i class="fas fa-edit"></i> Editar</button>
                    <button class="delete-btn" onclick="deleteProduct(${index})"><i class="fas fa-trash"></i> Eliminar</button>
                </div>
            </td>
        </tr>`;
    });
}

// 3. GUARDAR CAMBIOS: Procesa el formulario incluyendo el Estado
async function saveProduct() {
    const id = document.getElementById("productId").value;
    const name = document.getElementById("name").value;
    const price = parseFloat(document.getElementById("price").value);
    const stock = parseInt(document.getElementById("stock").value);
    const category = document.getElementById("category").value;
    const status = document.getElementById("status").value; // Captura el estado
    let imageValue = document.getElementById("image").value.trim();
    const description = document.getElementById("description").value;

    if (!name || Number.isNaN(price) || !imageValue) {
        alert("Por favor rellene los campos obligatorios (Nombre, Precio e Imagen).");
        return;
    }

    if (!imageValue.startsWith("images/") && !imageValue.startsWith("http")) {
        imageValue = "images/" + imageValue;
    }

    const productData = {
        id: id ? Number(id) : Date.now(),
        name,
        price,
        stock: Number.isNaN(stock) ? 0 : stock,
        category,
        status, // Guarda "activado", "agotado" o "desactivado" en tu JSON
        image: imageValue,
        description
    };

    if (id) {
        const idx = products.findIndex(p => p.id == id);
        if (idx !== -1) products[idx] = productData;
    } else {
        products.push(productData);
    }

    localStorage.setItem("productos_tienda", JSON.stringify(products));
    renderProducts();
    clearForm();
    alert("¡Producto guardado con éxito!");
}

// 4. CARGAR EN EL FORMULARIO PARA EDITAR
function editProduct(index) {
    const p = products[index];
    if (!p) return;

    document.getElementById("productId").value = p.id;
    document.getElementById("name").value = p.name;
    document.getElementById("price").value = p.price;
    document.getElementById("stock").value = p.stock;
    document.getElementById("category").value = p.category;
    document.getElementById("status").value = p.status || "activado"; // Carga el estado al editar
    document.getElementById("image").value = p.image.replace("images/", "");
    document.getElementById("description").value = p.description || "";
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 5. ELIMINAR PRODUCTO
function deleteProduct(index) {
    if (confirm("¿Seguro que deseas eliminar este producto?")) {
        products.splice(index, 1);
        localStorage.setItem("productos_tienda", JSON.stringify(products));
        renderProducts();
    }
}

// 6. DESCARGAR NUEVO ARCHIVO JSON COMPLETO
function downloadJsonFile() {
    if (products.length === 0) {
        alert("No hay productos para exportar.");
        return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(products, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", "products.json");
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
}

// 7. LIMPIAR EL FORMULARIO
function clearForm() {
    document.getElementById("productId").value = "";
    document.getElementById("name").value = "";
    document.getElementById("price").value = "";
    document.getElementById("stock").value = "";
    document.getElementById("category").value = "";
    document.getElementById("status").value = "activado"; // Resetea a activado
    document.getElementById("image").value = "";
    document.getElementById("description").value = "";
}

loadInitialData();