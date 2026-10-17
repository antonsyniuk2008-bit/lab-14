// Глобальний стан магазину
let globalStoreProducts = [];
let cart = [];

// DOM Елементи сторінки
const productsGrid = document.querySelector(".products-grid"); 
const cartButton = document.querySelector(".btn-cart"); 
const cartOverlay = document.getElementById("cartOverlay");
const closeBtn = document.getElementById("closeCartBtn");
const cartItemsContainer = document.getElementById("cartItemsContainer");
const cartTotalSum = document.getElementById("cartTotalSum");
const cartCounter = document.querySelector(".cart-counter");
const favoritesZone = document.getElementById("favoritesZone");

// ==========================================
// 1. ЗАВАНТАЖЕННЯ ДАНИХ З СЕРВЕРА (ЛР №13) + ЗАХИСТ ВІД ЗБОЇВ
// ==========================================
async function fetchProducts() {
    try {
        if (productsGrid) {
            productsGrid.innerHTML = "<p class='loading-message'>Завантаження товарів з сервера...</p>";
        }
        
        // 1. Спроба надіслати мережевий GET-запит до публічного API
        const response = await fetch("https://fakestoreapi.com");
        
        // 2. Якщо статус відповіді сервера не ОК — кидаємо помилку в блок catch
        if (!response.ok) {
            throw new Error(`HTTP помилка: ${response.status}`);
        }
        
        // 3. Якщо все добре, розпаковуємо та повертаємо JSON
        return await response.json();
        
    } catch (error) {
        // Якщо інтернет-сервер впав, виконується цей резервний сценарій:
        console.warn("Зовнішній сервер API недоступний. Автоматично активовано резервну копію товарів:", error.message);
        
        // Локальний масив товарів, розширений до 9 штук для ідеальної сітки 3х3
        return [
            {
                id: 1,
                title: "Fjallraven - Foldsack No. 1 Backpack, Fits 15 Laptops",
                price: 109.95,
                image: "https://unsplash.com"
            },
            {
                id: 2,
                title: "Mens Casual Premium Slim Fit T-Shirts",
                price: 22.30,
                image: "https://unsplash.com"
            },
            {
                id: 3,
                title: "Mens Cotton Jacket - Спортивна Куртка",
                price: 55.99,
                image: "https://unsplash.com"
            },
            {
                id: 4,
                title: "Mens Casual Slim Fit - Штани повсякденні",
                price: 15.99,
                image: "https://unsplash.com"
            },
            {
                id: 5,
                title: "Ноутбук Apple MacBook Pro 16",
                price: 2499.00,
                image: "https://unsplash.com"
            },
            {
                id: 6,
                title: "Смартфон Samsung Galaxy S24 Ultra",
                price: 1199.00,
                image: "https://unsplash.com"
            },
            {
                id: 7,
                title: "Навушники Sony WH-1000XM5",
                price: 349.99,
                image: "https://unsplash.com"
            },
            {
                id: 8,
                title: "Ігровий Монітор LG UltraGear 27",
                price: 299.50,
                image: "https://unsplash.com"
            },
            {
                id: 9,
                title: "Ігрова миша Razer DeathAdder Essential",
                price: 29.99,
                image: "https://unsplash.com"
            }
        ];
    }
}

async function initShop() {
    try {
        const data = await fetchProducts();
        globalStoreProducts = data;

        if (productsGrid) {
            // Генеруємо HTML-картки товарів за допомогою тегу <article> згідно зі стилями CSS
            productsGrid.innerHTML = globalStoreProducts.map(product => `
                <article class="product-card" draggable="true" data-id="${product.id}">
                    <img src="${product.image}" alt="${product.title}" draggable="false">
                    <h3 title="${product.title}">${product.title}</h3>
                    <p class="price">$${product.price}</p>
                    <button class="btn-buy" data-id="${product.id}">Купити</button>
                </article>
            `).join("");
        }
    } catch (error) {
        console.log("Критична помилка ініціалізації магазину.");
    }
}

// Стартуємо додаток
initShop();

// ==========================================
// 2. ДЕЛЕГУВАННЯ ПОДІЙ ТА DRAG-AND-DROP (ЛР №14)
// ==========================================

if (productsGrid) {
    // А. Делегування кліку на кнопку "Купити" (працює для динамічних карток)
    productsGrid.addEventListener("click", (event) => {
        if (event.target.classList.contains("btn-buy")) {
            const productId = Number(event.target.dataset.id);
            const product = globalStoreProducts.find(p => p.id === productId);
            if (product) {
                addToCart(product);
            }
        }
    });

    // Б. Початок перетягування картки мишкою (dragstart)
    productsGrid.addEventListener("dragstart", (event) => {
        const card = event.target.closest(".product-card");
        if (card) {
            event.dataTransfer.setData("text/plain", card.dataset.id);
            card.classList.add("dragging");
        }
    });

    // В. Кінець перетягування (dragend)
    productsGrid.addEventListener("dragend", (event) => {
        const card = event.target.closest(".product-card");
        if (card) {
            card.classList.remove("dragging");
        }
    });
}

// Г. Логіка обробки зони скидання в Улюблене (Dropzone)
if (favoritesZone) {
    // Скасовуємо стандартну заборону браузера на скидання (дозволяємо drop)
    favoritesZone.addEventListener("dragover", (event) => {
        event.preventDefault(); 
        favoritesZone.classList.add("drag-over");
    });

    // Коли курсор миші з товаром виходить за межі зони
    favoritesZone.addEventListener("dragleave", () => {
        favoritesZone.classList.remove("drag-over"); 
    });

    // Момент відпускання лівої кнопки миші над зоною (Drop)
    favoritesZone.addEventListener("drop", (event) => {
        event.preventDefault();
        favoritesZone.classList.remove("drag-over");

        // Витягуємо збережений ID з буфера обміну
        const productId = event.dataTransfer.getData("text/plain");
        const product = globalStoreProducts.find(p => p.id === Number(productId));

        if (product) {
            // Форматуємо назву, щоб довгий текст не розривав рамку зони
            const shortTitle = product.title.length > 20 ? product.title.slice(0, 20) + "..." : product.title;
            favoritesZone.innerHTML += `<div class="fav-item" title="${product.title}">${shortTitle}</div>`;
        }
    });
}

// ==========================================
// 3. УПРАВЛІННЯ МОДАЛЬНИМ ВІКНОМ КОШИКА (ЛР №12)
// ==========================================
function openCartModal() {
    if (cartOverlay) cartOverlay.classList.remove("hidden");
    renderCartItems(); 
}

function closeCartModal() {
    if (cartOverlay) cartOverlay.classList.add("hidden");
}

if (cartButton) cartButton.addEventListener("click", openCartModal);
if (closeBtn) closeBtn.addEventListener("click", closeCartModal);

if (cartOverlay) {
    cartOverlay.addEventListener("click", (event) => {
        if (event.target === cartOverlay) {
            closeCartModal();
        }
    });
}

// ==========================================
// 4. ФУНКЦІОНАЛ КОШИКА
// ==========================================
function addToCart(product) {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    updateUI();
}

function calculateTotal() {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return total.toFixed(2);
}

function renderCartItems() {
    if (!cartItemsContainer) return;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = "<p class='empty-message'>Кошик порожній.</p>";
        if (cartTotalSum) cartTotalSum.textContent = "0";
        return;
    }

    cartItemsContainer.innerHTML = cart.map(item => `
        <div class="cart-item">
            <span class="cart-item-title">${item.title}</span>
            <span class="cart-item-price">$${item.price} x ${item.quantity}</span>
        </div>
    `).join("");

    if (cartTotalSum) cartTotalSum.textContent = calculateTotal();
}

// Оновлення лічильника в шапці сайту
function updateUI() {
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCounter) {
        cartCounter.textContent = totalCount;
    }
}
