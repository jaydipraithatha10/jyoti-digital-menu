// ================= CONFIG =================

const productCache = {};
let cart = [];

let categories = [];
let subcategories = [];
let products = [];

const CATEGORY_CSV =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vStfoYZJzDES0lAav3gzVi4hHMrr-g-vu6oHbAecwVN7-j5ZfyZCE4wy5qE8oaH0fSw14Y97pHMmUrU/pub?gid=2013716827&single=true&output=csv";

const SUBCATEGORY_CSV =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vStfoYZJzDES0lAav3gzVi4hHMrr-g-vu6oHbAecwVN7-j5ZfyZCE4wy5qE8oaH0fSw14Y97pHMmUrU/pub?gid=35788410&single=true&output=csv";

const PRODUCT_CSV =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vStfoYZJzDES0lAav3gzVi4hHMrr-g-vu6oHbAecwVN7-j5ZfyZCE4wy5qE8oaH0fSw14Y97pHMmUrU/pub?gid=0&single=true&output=csv";

// ================= START =================

document.addEventListener("DOMContentLoaded", async () => {

    await loadData();

    renderCategories();

    const searchInput = document.getElementById("searchInput");

    let timer;

    searchInput.addEventListener("input", () => {

        clearTimeout(timer);

        timer = setTimeout(searchProducts, 250);

    });

});

// ================= CSV =================

function parseCSV(csv){

    return csv
        .trim()
        .split(/\r?\n/)
        .map(row => row.split(",").map(col => col.trim()));

}

async function loadData(){

    const [catRes, subRes, proRes] = await Promise.all([

        fetch(CATEGORY_CSV),
        fetch(SUBCATEGORY_CSV),
        fetch(PRODUCT_CSV)

    ]);

    categories = parseCSV(await catRes.text());
    subcategories = parseCSV(await subRes.text());
    products = parseCSV(await proRes.text());

    // Image preload
    products.slice(1).forEach(p => {

        if (p[7]) {

            const img = new Image();
            img.src = p[7];

        }

    });

}
// ================= RENDER CATEGORY =================

function renderCategories() {

    const container = document.getElementById("categories");
    container.innerHTML = "";

    for (let i = 1; i < categories.length; i++) {

        const id = categories[i][0];
        const name = categories[i][1];
        const status = categories[i][2].toLowerCase();
        const image = categories[i][3];

        if (status !== "active") continue;

        container.innerHTML += `
<div class="category-item">

    <div class="category-card"
         data-id="${id}"
         data-name="${name.toLowerCase()}"
         onclick="toggleCategory('${id}',this)">

        <div class="category-content">

            <img
                loading="lazy"
                decoding="async"
                class="product-image"
                src="${image}"
                alt="${name}"
                onerror="this.src='placeholder.png'">

            <div class="category-name">${name}</div>

        </div>

        <span class="category-arrow">▼</span>

    </div>

    <div id="sub-${id}" class="sub-list"></div>

</div>`;
    }
}

// ================= CATEGORY =================

function toggleCategory(categoryId, card) {

    const container = document.getElementById("sub-" + categoryId);

    if (container.innerHTML !== "") {

        container.innerHTML = "";

        card.classList.remove("active");

        card.querySelector(".category-arrow").innerHTML = "▼";

        return;
    }

    document.querySelectorAll(".category-card").forEach(c => {

        c.classList.remove("active");

        c.querySelector(".category-arrow").innerHTML = "▼";

    });

    document.querySelectorAll(".sub-list").forEach(s => {

        s.innerHTML = "";

    });

    card.classList.add("active");

    card.querySelector(".category-arrow").innerHTML = "▲";

    let html = "";

    for (let i = 1; i < subcategories.length; i++) {

        const subId = subcategories[i][0];
        const catId = subcategories[i][1];
        const subName = subcategories[i][2];
        const status = subcategories[i][3].toLowerCase();
        const image = subcategories[i][4];

        if (status !== "active") continue;
        if (catId != categoryId) continue;

        html += `
<div class="subcategory-card"
     onclick="toggleSubCategory('${categoryId}','${subId}',this)">

    <img
        loading="lazy"
        decoding="async"
        class="product-image"
        src="${image}"
        alt="${subName}"
        onerror="this.src='placeholder.png'">

    <div class="subcategory-name">${subName}</div>

    <div class="subcategory-arrow">▶</div>

</div>

<div id="product-${subId}" class="product-list"></div>`;
    }

    if (html === "") {

        loadProducts(categoryId, "");

    } else {

        container.innerHTML = html;

    }
}

// ================= SUB CATEGORY =================

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

    if (container.innerHTML !== "") {

        container.innerHTML = "";

        return;
    }

    loadProducts(categoryId, subCategoryId);

}

// ================= LOAD PRODUCTS =================

function loadProducts(categoryId, subCategoryId) {

    let container;

    if (subCategoryId === "") {

        container = document.getElementById("sub-" + categoryId);

    } else {

        container = document.getElementById("product-" + subCategoryId);

    }

    const key = categoryId + "_" + subCategoryId;

    if (productCache[key]) {

        container.innerHTML = productCache[key];

        return;

    }

    let html = "";

    for (let i = 1; i < products.length; i++) {

        const catId = products[i][1];
        const subId = products[i][2];
        const product = products[i][3];
        const weight = products[i][4];
        const price = products[i][5];
        const status = products[i][6].toLowerCase();
        const image = products[i][7];

        if (status !== "active") continue;

        if (subCategoryId === "") {

            if (catId != categoryId) continue;

        } else {

            if (subId != subCategoryId) continue;

        }

        html += `
<div class="product-card">

<img
loading="lazy"
decoding="async"
class="product-image"
src="${image}"
alt="${product}"
onerror="this.src='placeholder.png'">

<div class="product-name">${product}</div>

<div class="product-weight">${weight}</div>

<div class="product-price">₹ ${price}</div>

<div class="qty-box">

<button class="qty-btn" onclick="changeQty(this,-1)">−</button>

<span class="qty">0</span>

<button class="qty-btn" onclick="changeQty(this,1)">+</button>

</div>

<button class="add-cart-btn"
onclick="addToCart('${product}','${weight}','${price}',this)">
🛒 Add to Cart
</button>

</div>`;
    }

    if (html === "") {

        html = `<div class="no-product">No Products Found</div>`;

    }

    productCache[key] = html;

    container.innerHTML = html;

}
// ================= CHANGE QTY =================

function changeQty(btn, change) {

    const qty = btn.parentElement.querySelector(".qty");

    let value = Number(qty.textContent);

    value += change;

    if (value < 0) value = 0;

    qty.textContent = value;

}

// ================= ADD TO CART =================

function addToCart(product, weight, price, btn) {

    const qty = Number(
        btn.parentElement.querySelector(".qty").textContent
    );

    if (qty <= 0) {

        showPopup();

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
            product,
            weight,
            price: Number(price),
            qty
        });

    }

    btn.parentElement.querySelector(".qty").textContent = 0;

    updateCart();

    btn.innerHTML = "✅ Added";
    btn.style.background = "#2E7D32";
    btn.style.color = "#fff";

    setTimeout(() => {

        btn.innerHTML = "🛒 Add to Cart";
        btn.style.background = "";
        btn.style.color = "";

    }, 1200);

}

// ================= UPDATE CART =================

function updateCart() {

    let totalQty = 0;
    let totalAmount = 0;

    for (const item of cart) {

        totalQty += item.qty;
        totalAmount += item.qty * item.price;

    }

    document.getElementById("cart-count").textContent = totalQty;
    document.getElementById("cart-total").textContent = "₹ " + totalAmount;

    document.getElementById("cart-bar").style.display =
        cart.length ? "flex" : "none";

}
// ================= SMART SEARCH =================

function searchProducts() {

    const keyword = document
        .getElementById("searchInput")
        .value
        .trim()
        .toLowerCase();

    const searchResults = document.getElementById("searchResults");
    const categoriesDiv = document.getElementById("categories");
    const noProducts = document.getElementById("noProducts");

    if (keyword === "") {

        searchResults.style.display = "none";
        categoriesDiv.style.display = "flex";
        noProducts.style.display = "none";

        renderCategories();

        return;
    }

    searchResults.style.display = "grid";
    categoriesDiv.style.display = "none";

    let html = "";
    let found = false;

    for (let i = 1; i < products.length; i++) {

        const catId = products[i][1];
        const subId = products[i][2];
        const product = products[i][3];
        const weight = products[i][4];
        const price = products[i][5];
        const status = products[i][6].toLowerCase();
        const image = products[i][7];

        if (status !== "active") continue;

        const category =
            categories.find(c => c[0] == catId)?.[1] || "";

        const subcategory =
            subcategories.find(s => s[0] == subId)?.[2] || "";

        const text = (
            product + " " +
            category + " " +
            subcategory
        ).toLowerCase();

        if (!text.includes(keyword)) continue;

        found = true;

        html += `

<div class="product-card">

<img
loading="lazy"
decoding="async"
class="product-image"
src="${image}"
alt="${product}"
onerror="this.src='placeholder.png'">

<div class="product-name">${product}</div>

<div class="product-weight">${weight}</div>

<div class="product-price">₹ ${price}</div>

<div class="qty-box">

<button class="qty-btn" onclick="changeQty(this,-1)">−</button>

<span class="qty">0</span>

<button class="qty-btn" onclick="changeQty(this,1)">+</button>

</div>

<button class="add-cart-btn"
onclick="addToCart('${product}','${weight}','${price}',this)">
🛒 Add to Cart
</button>

</div>

`;
    }

    searchResults.innerHTML = html;

    noProducts.style.display = found ? "none" : "block";

}