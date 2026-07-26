// ================= CSV LINKS =================

const CATEGORY_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vStfoYZJzDES0lAav3gzVi4hHMrr-g-vu6oHbAecwVN7-j5ZfyZCE4wy5qE8oaH0fSw14Y97pHMmUrU/pub?gid=2013716827&single=true&output=csv";

const SUBCATEGORY_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vStfoYZJzDES0lAav3gzVi4hHMrr-g-vu6oHbAecwVN7-j5ZfyZCE4wy5qE8oaH0fSw14Y97pHMmUrU/pub?gid=35788410&single=true&output=csv";

const PRODUCT_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vStfoYZJzDES0lAav3gzVi4hHMrr-g-vu6oHbAecwVN7-j5ZfyZCE4wy5qE8oaH0fSw14Y97pHMmUrU/pub?gid=0&single=true&output=csv";


// ================= START =================

document.addEventListener("DOMContentLoaded", () => {
    loadCategories();
});


// ================= LOAD CATEGORIES =================

async function loadCategories() {

    const container = document.getElementById("categories");

    container.innerHTML = "";

    const response = await fetch(CATEGORY_CSV);

    const csv = await response.text();

    const rows = csv.trim().split("\n");

    for (let i = 1; i < rows.length; i++) {

        const cols = rows[i].split(",");

        const id = cols[0].trim();

        const name = cols[1].trim();

        const status = cols[2].trim().toLowerCase();

        if (status !== "active") continue;

        const item = document.createElement("div");

        item.className = "category-item";

        item.innerHTML = `
            <div class="category-card">
                ${name}
            </div>

            <div id="sub-${id}" class="sub-list"></div>
        `;

        item.querySelector(".category-card").onclick = function () {
            toggleCategory(id, this);
        };

        container.appendChild(item);

    }

}
// ================= TOGGLE CATEGORY =================

async function toggleCategory(categoryId, card) {

    // બધા Category Active Remove
    document.querySelectorAll(".category-card").forEach(item => {
        item.classList.remove("active");
    });

    // Click થયેલ Category Active
    card.classList.add("active");

    // બીજા બધા ખુલેલા Category બંધ કરો
    document.querySelectorAll(".sub-list").forEach(list => {
        if (list.id !== "sub-" + categoryId) {
            list.innerHTML = "";
        }
    });

    const container = document.getElementById("sub-" + categoryId);

    // જો પહેલેથી ખુલેલું હોય તો બંધ કરો
    if (container.innerHTML.trim() !== "") {
        container.innerHTML = "";
        return;
    }

    const response = await fetch(SUBCATEGORY_CSV);
    const csv = await response.text();

    const rows = csv.trim().split("\n");

    let html = "";

    for (let i = 1; i < rows.length; i++) {

        const cols = rows[i].split(",");

        const subId = cols[0].trim();
        const catId = cols[1].trim();
        const subName = cols[2].trim();
        const status = cols[3].trim().toLowerCase();

        if (status !== "active") continue;
        if (String(catId) !== String(categoryId)) continue;

        html += `
            <div class="subcategory-card"
                 onclick="toggleSubCategory('${categoryId}','${subId}', this)">
                ${subName}
            </div>

            <div id="product-${subId}" class="product-list"></div>
        `;
    }

    container.innerHTML = html;

    // જો Sub Category ન હોય તો સીધા Products બતાવો
    if (html === "") {
        loadProducts(categoryId, "");
    }

}
// ================= TOGGLE SUB CATEGORY =================

function toggleSubCategory(categoryId, subCategoryId, card) {

    // બધા SubCategory Active Remove
    document.querySelectorAll(".subcategory-card").forEach(item => {
        item.classList.remove("active");
    });

    // Click થયેલી SubCategory Active
    card.classList.add("active");

    // બીજા બધા Product List બંધ કરો
    document.querySelectorAll(".product-list").forEach(list => {
        if (list.id !== "product-" + subCategoryId) {
            list.innerHTML = "";
        }
    });

    const container = document.getElementById("product-" + subCategoryId);

    // જો ખુલ્લું હોય તો બંધ કરો
    if (container.innerHTML.trim() !== "") {
        container.innerHTML = "";
        return;
    }

    // Products Load કરો
    loadProducts(categoryId, subCategoryId);

}
// ================= LOAD PRODUCTS =================

async function loadProducts(categoryId, subCategoryId) {

    let container;

    if (subCategoryId === "") {
        container = document.getElementById("sub-" + categoryId);
    } else {
        container = document.getElementById("product-" + subCategoryId);
    }

    const response = await fetch(PRODUCT_CSV);
    const csv = await response.text();

    const rows = csv.trim().split("\n");

    let html = "";

    for (let i = 1; i < rows.length; i++) {

        const cols = rows[i].split(",");

        const catId = cols[1].trim();
        const subId = cols[2].trim();
        const product = cols[3].trim();
        const weight = cols[4].trim();
        const price = cols[5].trim();
        const status = cols[6].trim().toLowerCase();

        if (status !== "active") continue;

        if (subCategoryId !== "") {

            if (String(subId) !== String(subCategoryId)) continue;

        } else {

            if (String(catId) !== String(categoryId)) continue;

        }

        html += `
            <div class="product-card">

                <div class="product-name">${product}</div>

                <div class="product-weight">${weight}</div>

                <div class="product-price">₹ ${price}</div>

                <div class="qty-box">

                    <button onclick="changeQty(this,-1)">−</button>

                    <span class="qty">0</span>

                    <button onclick="changeQty(this,1)">+</button>

                </div>

                <button class="add-cart-btn"
                    onclick="addToCart('${product}','${weight}','${price}',this)">
                    Add to Cart
                </button>

            </div>
        `;

    }

    if (html === "") {

        html = `
            <div class="no-product">
                No Products Found
            </div>
        `;

    }

    container.innerHTML = html;

}
// ================= QUANTITY =================

function changeQty(btn, value) {

    const qtySpan = btn.parentElement.querySelector(".qty");

    let qty = parseInt(qtySpan.innerText);

    qty += value;

    if (qty < 0) qty = 0;

    qtySpan.innerText = qty;

}


// ================= CART =================

let cart = [];

function addToCart(product, weight, price, btn) {

    const qty = parseInt(
        btn.parentElement.querySelector(".qty").innerText
    );

    if (qty === 0) {
        alert("Please select quantity");
        return;
    }

    const existing = cart.find(item =>
        item.product === product &&
        item.weight === weight
    );

    if (existing) {

        existing.qty += qty;

    } else {

        cart.push({
            product: product,
            weight: weight,
            price: Number(price),
            qty: qty
        });

    }

    // Quantity Reset
    btn.parentElement.querySelector(".qty").innerText = "0";

    updateCart();

    alert(product + " added to cart");

}
// ================= UPDATE CART =================

function updateCart() {

    let totalQty = 0;
    let totalAmount = 0;

    cart.forEach(item => {

        totalQty += item.qty;
        totalAmount += item.qty * item.price;

    });

    const cartCount = document.getElementById("cart-count");
    const cartTotal = document.getElementById("cart-total");

    if (cartCount) {
        cartCount.innerText = totalQty;
    }

    if (cartTotal) {
        cartTotal.innerText = "₹ " + totalAmount;
    }

    // Cart Bar Show / Hide
    const cartBar = document.getElementById("cart-bar");

    if (cartBar) {

        if (cart.length > 0) {
            cartBar.style.display = "flex";
        } else {
            cartBar.style.display = "none";
        }

    }

}
// ================= VIEW CART =================

function viewCart() {

    if (cart.length === 0) {
        alert("Cart is Empty");
        return;
    }

    let text = "🛒 Jyoti Gruh Udhyog Order\n\n";
    let total = 0;

    cart.forEach((item, index) => {

        const amount = item.qty * item.price;
        total += amount;

        text +=
            (index + 1) + ". " + item.product +
            "\nWeight : " + item.weight +
            "\nQty : " + item.qty +
            "\nPrice : ₹" + item.price +
            "\nAmount : ₹" + amount +
            "\n\n";

    });

    text += "------------------------\n";
    text += "Total : ₹" + total;

    alert(text);

}


// ================= CLEAR CART =================

function clearCart() {

    if (!confirm("Clear Cart?")) return;

    cart = [];

    updateCart();

}


// ================= WHATSAPP ORDER =================

function sendWhatsAppOrder() {

    if (cart.length === 0) {

        alert("Cart is Empty");

        return;

    }

    let msg = "🛒 *Jyoti Gruh Udhyog Order*%0A%0A";

    let total = 0;

    cart.forEach((item, index) => {

        const amount = item.qty * item.price;

        total += amount;

        msg +=
            "*" + (index + 1) + ".* " + item.product +
            "%0AWeight : " + item.weight +
            "%0AQty : " + item.qty +
            "%0APrice : ₹" + item.price +
            "%0AAmount : ₹" + amount +
            "%0A%0A";

    });

    msg += "*Total Amount : ₹" + total + "*";

    window.open(
        "https://wa.me/919712149344?text=" + msg,
        "_blank"
    );

}
// ================= VIEW CART =================

function viewCart() {

    if (cart.length === 0) {
        alert("Cart is Empty");
        return;
    }

    let text = "🛒 Jyoti Gruh Udhyog Order\n\n";
    let total = 0;

    cart.forEach((item, index) => {

        const amount = item.qty * item.price;
        total += amount;

        text +=
            (index + 1) + ". " + item.product +
            "\nWeight : " + item.weight +
            "\nQty : " + item.qty +
            "\nPrice : ₹" + item.price +
            "\nAmount : ₹" + amount +
            "\n\n";

    });

    text += "------------------------\n";
    text += "Total : ₹" + total;

    alert(text);

}


// ================= CLEAR CART =================

function clearCart() {

    if (!confirm("Clear Cart?")) return;

    cart = [];

    updateCart();

}


// ================= WHATSAPP ORDER =================

function sendWhatsAppOrder() {

    if (cart.length === 0) {

        alert("Cart is Empty");

        return;

    }

    let msg = "🛒 *Jyoti Gruh Udhyog Order*%0A%0A";

    let total = 0;

    cart.forEach((item, index) => {

        const amount = item.qty * item.price;

        total += amount;

        msg +=
            "*" + (index + 1) + ".* " + item.product +
            "%0AWeight : " + item.weight +
            "%0AQty : " + item.qty +
            "%0APrice : ₹" + item.price +
            "%0AAmount : ₹" + amount +
            "%0A%0A";

    });

    msg += "*Total Amount : ₹" + total + "*";

    window.open(
        "https://wa.me/919712149344?text=" + msg,
        "_blank"
    );

}
function openCart() {

    const popup = document.getElementById("cartPopup");
    const cartItems = document.getElementById("cartItems");
    const grandTotal = document.getElementById("grandTotal");

    popup.style.display = "block";

    if (cart.length === 0) {

        cartItems.innerHTML = "<p>Your Cart is Empty</p>";
        grandTotal.innerText = "0";
        return;

    }

    let html = "";
    let total = 0;

    cart.forEach((item, index) => {

        const amount = item.qty * item.price;
        total += amount;

        html += `
            <div class="cart-item">

                <h4>${item.product}</h4>

                <p>${item.weight}</p>

                <p>
                    Qty : ${item.qty}
                    × ₹${item.price}
                    = ₹${amount}
                </p>

            </div>
        `;

    });

    cartItems.innerHTML = html;
    grandTotal.innerText = total;

}

function closeCart() {

    document.getElementById("cartPopup").style.display = "none";

}