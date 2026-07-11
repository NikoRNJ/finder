/**
 * Dulce Encanto - Alfajores Artesanales
 * Application Logic (JS Vanilla)
 */

// Default data to populate the catalog on first load
const DEFAULT_PRODUCTS = [
  {
    id: "prod-1",
    name: "Alfajor de Maicena Tradicional",
    description: "El clásico alfajor de maicena, ultra suave y delicado, relleno con abundante dulce de leche artesanal y rodado en coco rallado fino.",
    price: 1200,
    category: "tradicional",
    tags: ["Dulce de leche", "Coco", "Maicena"],
    image: "assets/alfajor_maicena.png"
  },
  {
    id: "prod-2",
    name: "Alfajor Chocolate Negro Tentación",
    description: "Alfajor de galleta artesanal de cacao, relleno con doble capa de dulce de leche premium y bañado en una crujiente cobertura de chocolate negro 60% cacao.",
    price: 1500,
    category: "especial",
    tags: ["Chocolate Negro", "Doble Dulce de Leche"],
    image: "assets/alfajor_chocolate.png"
  },
  {
    id: "prod-3",
    name: "Alfajores de Diseño Especial (Unidad)",
    description: "Alfajores decorados a mano con glasé real y diseños florales o corporativos. Ideales para matrimonios, cumpleaños, bautizos y recuerdos elegantes.",
    price: 1800,
    category: "diseno",
    tags: ["Diseño a mano", "Chocolate Blanco", "Eventos"],
    image: "assets/alfajor_decorado.png"
  },
  {
    id: "prod-4",
    name: "Pack Regalo Dulce Encanto (6 unidades)",
    description: "Hermosa caja de regalo que contiene 6 alfajores surtidos: 2 tradicionales de maicena, 2 bañados en chocolate negro y 2 en chocolate blanco con frutos secos.",
    price: 9000,
    category: "pack",
    tags: ["Surtido", "Caja Regalo", "Ideal Compartir"],
    image: "assets/hero_alfajores.png"
  }
];

// Admin Credentials
const ADMIN_PASSWORD = "admin2026";
let isAdminAuthenticated = false;

// Global State
let products = [];
let currentSelectedProduct = null;
let currentFilter = "all";
let currentSearch = "";
let uploadedImageBase64 = "";

// WhatsApp Contact Settings
const WHATSAPP_PHONE = "56912345678"; // SME phone number format: country code + number

// DOM Elements
const productGrid = document.getElementById("product-grid");
const searchInput = document.getElementById("catalog-search");
const filterButtons = document.querySelectorAll(".filter-btn");

// Modals
const modalProductDetail = document.getElementById("modal-product-detail");
const modalAdminLogin = document.getElementById("modal-admin-login");
const modalAdminPanel = document.getElementById("modal-admin-panel");

// Modal Buttons / Controls
const btnAdminLogin = document.getElementById("btn-admin-login");
const menuToggle = document.getElementById("menu-toggle");
const navMenu = document.getElementById("nav-menu");
const header = document.getElementById("header");

// Product detail modal elements
const modalProductImg = document.getElementById("modal-product-img");
const modalProductCategory = document.getElementById("modal-product-category");
const modalProductTitle = document.getElementById("modal-product-title");
const modalProductPrice = document.getElementById("modal-product-price");
const modalProductDescription = document.getElementById("modal-product-description");
const orderQtyInput = document.getElementById("order-qty");
const btnQtyMinus = document.getElementById("btn-qty-minus");
const btnQtyPlus = document.getElementById("btn-qty-plus");
const btnOrderWhatsapp = document.getElementById("btn-order-whatsapp");
const btnCloseProductModal = document.getElementById("btn-close-product-modal");

// Admin login form elements
const adminLoginForm = document.getElementById("admin-login-form");
const adminPasswordInput = document.getElementById("admin-password");
const loginErrorMsg = document.getElementById("login-error-msg");
const btnCloseLoginModal = document.getElementById("btn-close-login-modal");

// Admin panel elements
const btnCloseAdminPanel = document.getElementById("btn-close-admin-panel");
const btnAdminLogout = document.getElementById("btn-admin-logout");
const adminProductForm = document.getElementById("admin-product-form");
const adminProductIdInput = document.getElementById("admin-product-id");
const adminProdNameInput = document.getElementById("admin-prod-name");
const adminProdPriceInput = document.getElementById("admin-prod-price");
const adminProdCategorySelect = document.getElementById("admin-prod-category");
const adminProdDescInput = document.getElementById("admin-prod-desc");
const adminProdTagsInput = document.getElementById("admin-prod-tags");
const adminProdImgUrlInput = document.getElementById("admin-prod-img-url");
const adminProdFileInput = document.getElementById("admin-prod-file");
const btnTriggerFile = document.getElementById("btn-trigger-file");
const adminProdPreview = document.getElementById("admin-prod-preview");
const adminFileNameSpan = document.getElementById("admin-file-name");
const adminProductsTableBody = document.getElementById("admin-products-table-body");
const btnResetData = document.getElementById("btn-reset-data");
const btnAdminCancel = document.getElementById("btn-admin-cancel");
const adminFormTitle = document.getElementById("admin-form-title");

// Contact Form
const contactForm = document.getElementById("contact-form");

/* ==========================================================================
   INITIALIZATION & SEEDING
   ========================================================================== */
function init() {
  // Load products from localStorage or set default
  const localProducts = localStorage.getItem("dulce_encanto_products");
  if (localProducts) {
    products = JSON.parse(localProducts);
  } else {
    products = [...DEFAULT_PRODUCTS];
    localStorage.setItem("dulce_encanto_products", JSON.stringify(products));
  }

  // Setup Event Listeners
  setupEventListeners();

  // Initial Render
  renderCatalog();
}

/* ==========================================================================
   EVENT LISTENERS
   ========================================================================== */
function setupEventListeners() {
  // Sticky Header Effect
  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  });

  // Mobile Menu Toggle
  menuToggle.addEventListener("click", () => {
    navMenu.classList.toggle("active");
    const icon = menuToggle.querySelector("i");
    if (navMenu.classList.contains("active")) {
      icon.className = "fa-solid fa-xmark";
    } else {
      icon.className = "fa-solid fa-bars";
    }
  });

  // Close mobile menu when clicking nav links
  document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", (e) => {
      // Remove active class from all links and add to clicked
      document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
      link.classList.add("active");
      
      navMenu.classList.remove("active");
      menuToggle.querySelector("i").className = "fa-solid fa-bars";
    });
  });

  // Category Filtering
  filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      filterButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.getAttribute("data-filter");
      renderCatalog();
    });
  });

  // Search Input
  searchInput.addEventListener("input", (e) => {
    currentSearch = e.target.value.toLowerCase().trim();
    renderCatalog();
  });

  // Product Quantity controls
  btnQtyMinus.addEventListener("click", () => updateQuantity(-1));
  btnQtyPlus.addEventListener("click", () => updateQuantity(1));
  orderQtyInput.addEventListener("change", () => {
    let val = parseInt(orderQtyInput.value);
    if (isNaN(val) || val < 1) orderQtyInput.value = 1;
    if (val > 100) orderQtyInput.value = 100;
  });

  // WhatsApp Order Submission
  btnOrderWhatsapp.addEventListener("click", sendOrderWhatsApp);

  // Contact Form Submission
  contactForm.addEventListener("submit", sendContactFormWhatsApp);

  // Modal Open/Close handlers
  btnAdminLogin.addEventListener("click", () => {
    if (isAdminAuthenticated) {
      openAdminPanelModal();
    } else {
      openModal(modalAdminLogin);
    }
  });

  btnCloseProductModal.addEventListener("click", () => closeModal(modalProductDetail));
  btnCloseLoginModal.addEventListener("click", () => closeModal(modalAdminLogin));
  btnCloseAdminPanel.addEventListener("click", () => closeModal(modalAdminPanel));

  // Close modals clicking outside dialog
  window.addEventListener("click", (e) => {
    if (e.target === modalProductDetail) closeModal(modalProductDetail);
    if (e.target === modalAdminLogin) closeModal(modalAdminLogin);
    if (e.target === modalAdminPanel) closeModal(modalAdminPanel);
  });

  // Admin Login Action
  adminLoginForm.addEventListener("submit", handleAdminLogin);

  // Admin Actions
  btnAdminLogout.addEventListener("click", handleAdminLogout);
  btnResetData.addEventListener("click", handleResetData);
  btnAdminCancel.addEventListener("click", resetAdminForm);

  // Image Upload inside Admin Panel
  btnTriggerFile.addEventListener("click", () => adminProdFileInput.click());
  adminProdFileInput.addEventListener("change", handleFileChange);
  
  // Image URL Input preview
  adminProdImgUrlInput.addEventListener("input", (e) => {
    const url = e.target.value.trim();
    if (url) {
      adminProdPreview.src = url;
      uploadedImageBase64 = ""; // Clear file uploaded image
      adminFileNameSpan.textContent = "URL de imagen ingresada";
    }
  });

  // Admin Save Product Form
  adminProductForm.addEventListener("submit", handleProductSave);
}

/* ==========================================================================
   CATALOG RENDER LOGIC
   ========================================================================== */
function renderCatalog() {
  productGrid.innerHTML = "";

  // Filter products
  const filteredProducts = products.filter(prod => {
    const matchesFilter = currentFilter === "all" || prod.category === currentFilter;
    const matchesSearch = prod.name.toLowerCase().includes(currentSearch) || 
                          prod.description.toLowerCase().includes(currentSearch) ||
                          prod.tags.some(tag => tag.toLowerCase().includes(currentSearch));
    return matchesFilter && matchesSearch;
  });

  if (filteredProducts.length === 0) {
    productGrid.innerHTML = `
      <div class="no-products text-center" style="grid-column: 1/-1; padding: 40px;">
        <i class="fa-solid fa-cookie-bite" style="font-size: 3.5rem; color: var(--color-pink-rose); margin-bottom: 16px; display:block;"></i>
        <h3>No encontramos ese alfajor</h3>
        <p>Prueba buscando con otros términos o seleccionando otra categoría.</p>
      </div>
    `;
    return;
  }

  filteredProducts.forEach(prod => {
    const card = document.createElement("div");
    card.className = "product-card";
    
    // Create tag elements HTML
    const tagsHTML = prod.tags && prod.tags.length > 0 
      ? prod.tags.map(tag => `<span class="product-tag">${tag}</span>`).join("")
      : "";

    // Clean price formatting
    const formattedPrice = formatCLPPrice(prod.price);
    
    // Category readable label
    const categoryLabels = {
      tradicional: "Tradicional",
      especial: "Especial",
      diseno: "Diseño & Evento",
      pack: "Pack Regalo"
    };
    const categoryLabel = categoryLabels[prod.category] || "Delicia";

    card.innerHTML = `
      <div class="product-image-wrapper">
        <img src="${prod.image}" alt="${prod.name}" class="product-card-img" onerror="this.src='assets/alfajor_maicena.png'">
        <span class="product-badge">${categoryLabel}</span>
      </div>
      <div class="product-card-body">
        <h3 class="product-card-title">${prod.name}</h3>
        <p class="product-card-desc">${prod.description}</p>
        <div class="product-card-tags">
          ${tagsHTML}
        </div>
        <div class="product-card-footer">
          <span class="product-card-price">${formattedPrice}</span>
          <button class="btn btn-card-order" data-id="${prod.id}">Ver Detalles</button>
        </div>
      </div>
    `;
    
    // Click event for showing product details modal
    card.querySelector(".btn-card-order").addEventListener("click", () => {
      openProductDetailModal(prod.id);
    });

    productGrid.appendChild(card);
  });
}

/* ==========================================================================
   PRODUCT DETAIL MODAL & ORDER LOGIC
   ========================================================================== */
function openProductDetailModal(productId) {
  const prod = products.find(p => p.id === productId);
  if (!prod) return;

  currentSelectedProduct = prod;
  
  modalProductImg.src = prod.image;
  modalProductImg.onerror = function() { this.src = 'assets/alfajor_maicena.png'; };
  
  // Category Label
  const categoryLabels = {
    tradicional: "Tradicional de la casa",
    especial: "Receta Especial",
    diseno: "Diseño & Eventos",
    pack: "Packs y Cajas de Regalo"
  };
  modalProductCategory.textContent = categoryLabels[prod.category] || "Premium";
  
  modalProductTitle.textContent = prod.name;
  modalProductPrice.textContent = formatCLPPrice(prod.price);
  modalProductDescription.textContent = prod.description;
  
  // Reset quantity input to minimum boxes (usually packs of 6 is default for orders)
  orderQtyInput.value = prod.category === "pack" ? 1 : 6; 

  // Hide design option checkbox if it's not event/design catalog
  const designCheckbox = document.querySelector('input[value="Diseño Personalizado (Icing)"]');
  if (prod.category !== "diseno") {
    designCheckbox.checked = false;
  } else {
    designCheckbox.checked = true;
  }

  openModal(modalProductDetail);
}

function updateQuantity(change) {
  let val = parseInt(orderQtyInput.value) + change;
  if (val < 1) val = 1;
  if (val > 100) val = 100;
  orderQtyInput.value = val;
}

function sendOrderWhatsApp() {
  if (!currentSelectedProduct) return;

  const qty = orderQtyInput.value;
  
  // Retrieve selected options from modal
  const selectedRelleno = document.querySelector('input[name="relleno"]:checked').value;
  const selectedCobertura = document.querySelector('input[name="cobertura"]:checked').value;
  
  const checkedExtras = [];
  document.querySelectorAll('input[name="agregados"]:checked').forEach(chk => {
    checkedExtras.push(chk.value);
  });
  
  const extrasText = checkedExtras.length > 0 ? checkedExtras.join(", ") : "Ninguno";
  const totalPrice = formatCLPPrice(currentSelectedProduct.price * qty);

  // Appending custom detail text
  const message = `¡Hola! Me gustaría cotizar/comprar los siguientes alfajores:

*Producto:* ${currentSelectedProduct.name}
*Cantidad:* ${qty} unidades
*Relleno:* ${selectedRelleno}
*Cobertura/Decoración:* ${selectedCobertura}
*Agregados extras:* ${extrasText}
*Total estimado:* ${totalPrice}

Por favor, confírmame disponibilidad y datos de pago. ¡Gracias!`;

  // WhatsApp Link Formatting
  const encodedText = encodeURIComponent(message);
  const waUrl = `https://api.whatsapp.com/send?phone=${WHATSAPP_PHONE}&text=${encodedText}`;
  
  window.open(waUrl, "_blank");
  closeModal(modalProductDetail);
  showToast("Redirigiendo a WhatsApp...", "success");
}

function sendContactFormWhatsApp(e) {
  e.preventDefault();
  
  const name = document.getElementById("contact-name").value.trim();
  const phone = document.getElementById("contact-phone").value.trim();
  const message = document.getElementById("contact-message").value.trim();

  const waMessage = `¡Hola! He enviado una consulta desde la web de Dulce Encanto:

*Nombre:* ${name}
*Teléfono:* ${phone}
*Consulta:* ${message}`;

  const encodedText = encodeURIComponent(waMessage);
  const waUrl = `https://api.whatsapp.com/send?phone=${WHATSAPP_PHONE}&text=${encodedText}`;
  
  window.open(waUrl, "_blank");
  contactForm.reset();
  showToast("Enviando mensaje por WhatsApp...", "success");
}

/* ==========================================================================
   ADMIN LOGIN & PANEL MANAGEMENT
   ========================================================================== */
function handleAdminLogin(e) {
  e.preventDefault();
  const enteredPass = adminPasswordInput.value;

  if (enteredPass === ADMIN_PASSWORD) {
    isAdminAuthenticated = true;
    loginErrorMsg.textContent = "";
    adminPasswordInput.value = "";
    
    // Change lock icon to open lock in navbar
    btnAdminLogin.querySelector("i").className = "fa-solid fa-lock-open";
    btnAdminLogin.classList.add("admin-active");
    btnAdminLogin.title = "Panel Administrativo Activo";

    closeModal(modalAdminLogin);
    openAdminPanelModal();
    showToast("Sesión iniciada con éxito", "success");
  } else {
    loginErrorMsg.textContent = "Contraseña incorrecta. Inténtalo de nuevo.";
    adminPasswordInput.focus();
  }
}

function handleAdminLogout() {
  isAdminAuthenticated = false;
  btnAdminLogin.querySelector("i").className = "fa-solid fa-lock";
  btnAdminLogin.classList.remove("admin-active");
  btnAdminLogin.title = "Panel de Administración";
  
  closeModal(modalAdminPanel);
  showToast("Sesión cerrada", "success");
}

function openAdminPanelModal() {
  renderAdminTable();
  resetAdminForm();
  openModal(modalAdminPanel);
}

function renderAdminTable() {
  adminProductsTableBody.innerHTML = "";
  
  products.forEach(prod => {
    const tr = document.createElement("tr");
    
    const formattedPrice = formatCLPPrice(prod.price);
    
    const categoryLabels = {
      tradicional: "Tradicional",
      especial: "Especial",
      diseno: "Diseño & Evento",
      pack: "Pack Regalo"
    };
    
    tr.innerHTML = `
      <td><img src="${prod.image}" alt="" class="admin-table-img" onerror="this.src='assets/alfajor_maicena.png'"></td>
      <td style="font-weight: 600;">${prod.name}</td>
      <td>${categoryLabels[prod.category] || prod.category}</td>
      <td style="font-weight: 700; color: var(--color-terracotta);">${formattedPrice}</td>
      <td>
        <button class="admin-btn-edit" data-id="${prod.id}" title="Editar alfajor">
          <i class="fa-solid fa-pen-to-square"></i>
        </button>
        <button class="admin-btn-delete" data-id="${prod.id}" title="Eliminar alfajor">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </td>
    `;
    
    // Bind Edit Action
    tr.querySelector(".admin-btn-edit").addEventListener("click", () => loadProductToForm(prod.id));
    
    // Bind Delete Action
    tr.querySelector(".admin-btn-delete").addEventListener("click", () => handleDeleteProduct(prod.id));

    adminProductsTableBody.appendChild(tr);
  });
}

/* ==========================================================================
   ADMIN CRUD OPERATIONS
   ========================================================================== */
function loadProductToForm(productId) {
  const prod = products.find(p => p.id === productId);
  if (!prod) return;
  
  adminFormTitle.textContent = "Editar Alfajor";
  adminProductIdInput.value = prod.id;
  adminProdNameInput.value = prod.name;
  adminProdPriceInput.value = prod.price;
  adminProdCategorySelect.value = prod.category;
  adminProdDescInput.value = prod.description;
  adminProdTagsInput.value = prod.tags.join(", ");
  
  // Set preview image
  adminProdPreview.src = prod.image;
  adminProdPreview.onerror = function() { this.src = 'assets/alfajor_maicena.png'; };
  
  if (prod.image.startsWith("data:image")) {
    adminProdImgUrlInput.value = "";
    adminFileNameSpan.textContent = "Imagen subida (Base64)";
    uploadedImageBase64 = prod.image;
  } else {
    adminProdImgUrlInput.value = prod.image;
    adminFileNameSpan.textContent = "URL de imagen vinculada";
    uploadedImageBase64 = "";
  }
  
  btnAdminCancel.style.display = "inline-block";
  adminProdNameInput.focus();
}

function handleDeleteProduct(productId) {
  const prod = products.find(p => p.id === productId);
  if (!prod) return;

  if (confirm(`¿Estás seguro de que deseas quitar "${prod.name}" del catálogo?`)) {
    products = products.filter(p => p.id !== productId);
    saveProductsToStorage();
    renderAdminTable();
    renderCatalog();
    showToast(`"${prod.name}" eliminado del catálogo.`, "success");
    
    // If the currently edited product was deleted, reset form
    if (adminProductIdInput.value === productId) {
      resetAdminForm();
    }
  }
}

function handleProductSave(e) {
  e.preventDefault();
  
  const id = adminProductIdInput.value;
  const name = adminProdNameInput.value.trim();
  const price = parseInt(adminProdPriceInput.value);
  const category = adminProdCategorySelect.value;
  const description = adminProdDescInput.value.trim();
  const rawTags = adminProdTagsInput.value;
  const urlImage = adminProdImgUrlInput.value.trim();
  
  // Split tags by commas and trim whitespaces
  const tags = rawTags.split(",")
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0);

  // Set the image. File upload (Base64) has priority over raw URL
  let finalImage = "assets/alfajor_maicena.png";
  if (uploadedImageBase64) {
    finalImage = uploadedImageBase64;
  } else if (urlImage) {
    finalImage = urlImage;
  }

  if (id) {
    // Edit existing product
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      products[index] = {
        ...products[index],
        name,
        price,
        category,
        description,
        tags,
        image: finalImage
      };
      showToast("Producto actualizado correctamente.", "success");
    }
  } else {
    // Create new product
    const newId = "prod-" + Date.now();
    const newProduct = {
      id: newId,
      name,
      price,
      category,
      description,
      tags,
      image: finalImage
    };
    products.push(newProduct);
    showToast("Nuevo alfajor agregado al catálogo.", "success");
  }

  saveProductsToStorage();
  renderCatalog();
  renderAdminTable();
  resetAdminForm();
}

function handleFileChange(e) {
  const file = e.target.files[0];
  if (!file) return;

  adminFileNameSpan.textContent = file.name;
  
  const reader = new FileReader();
  reader.onload = function(evt) {
    uploadedImageBase64 = evt.target.result;
    adminProdPreview.src = uploadedImageBase64;
    adminProdImgUrlInput.value = ""; // Clear url input since we uploaded a file
  };
  reader.readAsDataURL(file);
}

function resetAdminForm() {
  adminFormTitle.textContent = "Agregar Nuevo Alfajor";
  adminProductIdInput.value = "";
  adminProductForm.reset();
  
  // Reset preview and file uploads
  adminProdPreview.src = "assets/alfajor_maicena.png";
  adminFileNameSpan.textContent = "Ninguna imagen seleccionada";
  uploadedImageBase64 = "";
  adminProdFileInput.value = "";
  
  btnAdminCancel.style.display = "none";
}

function handleResetData() {
  if (confirm("¿Estás seguro de que quieres restablecer el catálogo predeterminado de fábrica? Todos tus cambios manuales se perderán.")) {
    products = [...DEFAULT_PRODUCTS];
    saveProductsToStorage();
    renderAdminTable();
    renderCatalog();
    resetAdminForm();
    showToast("Catálogo restablecido con éxito", "success");
  }
}

function saveProductsToStorage() {
  localStorage.setItem("dulce_encanto_products", JSON.stringify(products));
}

/* ==========================================================================
   UI UTILITIES (Modal handlers, price formatter, alerts)
   ========================================================================== */
function openModal(modalEl) {
  modalEl.classList.add("active");
  modalEl.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden"; // Block page scrolling behind modal
}

function closeModal(modalEl) {
  modalEl.classList.remove("active");
  modalEl.setAttribute("aria-hidden", "true");
  
  // Restore scroll only if no other modal is active
  if (!document.querySelector(".modal.active")) {
    document.body.style.overflow = "";
  }
}

function formatCLPPrice(value) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0
  }).format(value);
}

function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  
  const icon = type === "success" 
    ? '<i class="fa-solid fa-circle-check"></i>' 
    : '<i class="fa-solid fa-circle-exclamation"></i>';

  toast.innerHTML = `${icon} <span>${message}</span>`;
  container.appendChild(toast);

  // Automatically remove toast after 3 seconds
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Start application
document.addEventListener("DOMContentLoaded", init);
