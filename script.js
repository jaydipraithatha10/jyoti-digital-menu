// ================= CSV LINKS =================

const CATEGORY_CSV =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vStfoYZJzDES0lAav3gzVi4hHMrr-g-vu6oHbAecwVN7-j5ZfyZCE4wy5qE8oaH0fSw14Y97pHMmUrU/pub?gid=2013716827&single=true&output=csv";

const SUBCATEGORY_CSV =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vStfoYZJzDES0lAav3gzVi4hHMrr-g-vu6oHbAecwVN7-j5ZfyZCE4wy5qE8oaH0fSw14Y97pHMmUrU/pub?gid=35788410&single=true&output=csv";

const PRODUCT_CSV =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vStfoYZJzDES0lAav3gzVi4hHMrr-g-vu6oHbAecwVN7-j5ZfyZCE4wy5qE8oaH0fSw14Y97pHMmUrU/pub?gid=0&single=true&output=csv";

let cart = [];

document.addEventListener("DOMContentLoaded", () => {
    loadCategories();
});

// ================= CSV PARSER =================

  function parseCSV(csv) {
    return csv
        .trim()
        .split(/\r?\n/)
        .map(row => row.split(",").map(col => col.trim()));
}

// ================= LOAD CATEGORY =================

async function loadCategories() {

    const container = document.getElementById("categories");

    container.innerHTML = "";

    const response = await fetch(CATEGORY_CSV);

    const csv = await response.text();

    const rows = parseCSV(csv);

    for (let i = 1; i < rows.length; i++) {

        const id = rows[i][0];
        const name = rows[i][1];
        const status = rows[i][2].toLowerCase();

        if (status !== "active") continue;

        container.innerHTML += `
        <div class="category-item">

            <div class="category-card"
                 onclick="toggleCategory('${id}',this)">

                <span>${name}</span>

                <span>▼</span>

            </div>

            <div id="sub-${id}" class="sub-list"></div>

        </div>
        `;
    }

}
// ================= TOGGLE CATEGORY =================

async function toggleCategory(categoryId, card) {

    document.querySelectorAll(".category-card").forEach(item => {
    item.classList.remove("active");
    item.querySelector("span:last-child").innerHTML = "▼";
});

card.classList.add("active");
card.querySelector("span:last-child").innerHTML = "▲";

    card.classList.add("active");

    document.querySelectorAll(".sub-list").forEach(list => {
        if (list.id !== "sub-" + categoryId) {
            list.innerHTML = "";
        }
    });

    const container = document.getElementById("sub-" + categoryId);

    if (container.innerHTML.trim() !== "") {
    container.innerHTML = "";
    card.classList.remove("active");
    card.querySelector("span:last-child").innerHTML = "▼";
    return;
}

    const response = await fetch(SUBCATEGORY_CSV);
    const csv = await response.text();

    const rows = parseCSV(csv);

    let html = "";

    for (let i = 1; i < rows.length; i++) {

        const subId = rows[i][0];
        const catId = rows[i][1];
        const subName = rows[i][2];
        const status = rows[i][3].toLowerCase();

        if (status !== "active") continue;

        if (String(catId) !== String(categoryId)) continue;

        html += `
        <div class="subcategory-card"
             onclick="toggleSubCategory('${categoryId}','${subId}',this)">

            <span>${subName}</span>

            <span>▶</span>

        </div>

        <div id="product-${subId}" class="product-list"></div>
        `;
    }

    if (html === "") {

        loadProducts(categoryId, "");

    } else {

        container.innerHTML = html;

    }

}

// ================= TOGGLE SUB CATEGORY =================

function toggleSubCategory(categoryId, subCategoryId, card) {

    document.querySelectorAll(".subcategory-card").forEach(item => {
        item.classList.remove("active");
    });

    card.classList.add("active");

    document.querySelectorAll(".product-list").forEach(list => {

        if (list.id !== "product-" + subCategoryId) {

            list.innerHTML = "";

        }

    });

    const container = document.getElementById("product-" + subCategoryId);

    if (container.innerHTML.trim() !== "") {

        container.innerHTML = "";

        return;

    }

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

    const rows = parseCSV(csv);

    let html = "";

    for (let i = 1; i < rows.length; i++) {

        const catId = rows[i][1];
        const subId = rows[i][2];
        const product = rows[i][3];
        const weight = rows[i][4];
        const price = rows[i][5];
        const status = rows[i][6].toLowerCase();

        if (status !== "active") continue;

        if (subCategoryId === "") {

            if (String(catId) !== String(categoryId)) continue;

        } else {

            if (String(subId) !== String(subCategoryId)) continue;

        }

        html += `
        <div class="product-card">

            <div class="product-name">
                ${product}
            </div>

            <div class="product-weight">
                ${weight}
            </div>

            <div class="product-price">
                ₹ ${price}
            </div>

            <div class="qty-box">

                <button onclick="changeQty(this,-1)">−</button>

                <span class="qty">0</span>

                <button onclick="changeQty(this,1)">+</button>

            </div>

            <button class="add-cart-btn"
onclick="addToCart('${product}','${weight}','${price}',this)">
🛒 Add to Cart
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

// ================= CHANGE QUANTITY =================

function changeQty(btn, value) {

    const qty = btn.parentElement.querySelector(".qty");

    let count = parseInt(qty.innerText);

    count += value;

    if (count < 0) count = 0;

    qty.innerText = count;

}
// ================= ADD TO CART =================

function addToCart(product, weight, price, btn) {

    const qty = parseInt(
        btn.parentElement.querySelector(".qty").innerText
    );

    if (qty <= 0) {
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

    document.getElementById("cart-count").innerText = totalQty;
    document.getElementById("cart-total").innerText = "₹ " + totalAmount;

    const cartBar = document.getElementById("cart-bar");

    if (cart.length > 0) {

        cartBar.style.display = "flex";

    } else {

        cartBar.style.display = "none";

    }

}

// ================= OPEN CART =================

function openCart() {

    const popup = document.getElementById("cartPopup");
    const cartItems = document.getElementById("cartItems");
    const grandTotal = document.getElementById("grandTotal");

    popup.style.display = "flex";

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

            <h4>${index + 1}. ${item.product}</h4>

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

// ================= CLOSE CART =================

function closeCart() {

    document.getElementById("cartPopup").style.display = "none";

}
// ================= CLEAR CART =================

function clearCart() {

    if (!confirm("Clear Cart?")) return;

    cart = [];

    updateCart();

    const cartItems = document.getElementById("cartItems");
    const grandTotal = document.getElementById("grandTotal");

    if (cartItems) {
        cartItems.innerHTML = "<p>Your Cart is Empty</p>";
    }

    if (grandTotal) {
        grandTotal.innerText = "0";
    }

}

// ================= REMOVE ITEM =================

function removeItem(index) {

    cart.splice(index, 1);

    updateCart();

    openCart();

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
        "%0A--------------------%0A";

    });

    msg += "%0A*Grand Total : ₹" + total + "*";

    window.open(
        "https://wa.me/919712149344?text=" + msg,
        "_blank"
    );

}

// ================= CLOSE POPUP ON OUTSIDE CLICK =================

window.onclick = function(e) {

    const popup = document.getElementById("cartPopup");

    if (e.target === popup) {

        closeCart();

    }

};