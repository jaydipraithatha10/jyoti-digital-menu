// ================= CONFIG =================

const CATEGORY_CSV =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vStfoYZJzDES0lAav3gzVi4hHMrr-g-vu6oHbAecwVN7-j5ZfyZCE4wy5qE8oaH0fSw14Y97pHMmUrU/pub?gid=2013716827&single=true&output=csv";

const SUBCATEGORY_CSV =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vStfoYZJzDES0lAav3gzVi4hHMrr-g-vu6oHbAecwVN7-j5ZfyZCE4wy5qE8oaH0fSw14Y97pHMmUrU/pub?gid=35788410&single=true&output=csv";

const PRODUCT_CSV =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vStfoYZzDES0lAav3gzVi4hHMrr-g-vu6oHbAecwVN7-j5ZfyZCE4wy5qE8oaH0fSw14Y97pHMmUrU/pub?gid=0&single=true&output=csv";

let cart = [];

let categories = [];
let subcategories = [];
let products = [];

document.addEventListener("DOMContentLoaded", async () => {

    await loadData();

    renderCategories();

    document
        .getElementById("searchInput")
        .addEventListener("input", searchProducts);

});

// ================= CSV =================

function parseCSV(csv){

    return csv
        .trim()
        .split(/\r?\n/)
        .map(r => r.split(",").map(c => c.trim()));

}

async function loadData(){

    const [catRes,subRes,proRes] = await Promise.all([

        fetch(CATEGORY_CSV),
        fetch(SUBCATEGORY_CSV),
        fetch(PRODUCT_CSV)

    ]);

    categories = parseCSV(await catRes.text());

    subcategories = parseCSV(await subRes.text());

    products = parseCSV(await proRes.text());

}
// ================= RENDER CATEGORY =================

function renderCategories(){

    const container = document.getElementById("categories");

    container.innerHTML = "";

    for(let i=1;i<categories.length;i++){

        const id = categories[i][0];
        const name = categories[i][1];
        const status = categories[i][2].toLowerCase();

        if(status !== "active") continue;

        container.innerHTML += `

<div class="category-item">

    <div class="category-card"
         data-id="${id}"
         data-name="${name.toLowerCase()}"
         onclick="toggleCategory('${id}',this)">

        <span>${name}</span>

        <span>▼</span>

    </div>

    <div id="sub-${id}" class="sub-list"></div>

</div>

`;

    }

}

// ================= CATEGORY =================

function toggleCategory(categoryId,card){

    const container = document.getElementById("sub-"+categoryId);

    if(container.innerHTML !== ""){

        container.innerHTML="";

        card.classList.remove("active");

        card.querySelector("span:last-child").innerHTML="▼";

        return;

    }

    document.querySelectorAll(".category-card").forEach(c=>{

        c.classList.remove("active");

        c.querySelector("span:last-child").innerHTML="▼";

    });

    document.querySelectorAll(".sub-list").forEach(s=>{

        s.innerHTML="";

    });

    card.classList.add("active");

    card.querySelector("span:last-child").innerHTML="▲";

    let html="";

    for(let i=1;i<subcategories.length;i++){

        const subId=subcategories[i][0];
        const catId=subcategories[i][1];
        const subName=subcategories[i][2];
        const status=subcategories[i][3].toLowerCase();

        if(status!=="active") continue;

        if(catId!=categoryId) continue;

        html += `

<div class="subcategory-card"
     data-id="${subId}"
     data-name="${subName.toLowerCase()}"
     onclick="toggleSubCategory('${categoryId}','${subId}',this)">

<span>${subName}</span>

<span>▶</span>

</div>

<div id="product-${subId}" class="product-list"></div>

`;

    }

    if(html===""){

        loadProducts(categoryId,"");

    }else{

        container.innerHTML=html;

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

    let html = "";

    for (let i = 1; i < products.length; i++) {

        const catId = products[i][1];
        const subId = products[i][2];
        const product = products[i][3];
        const weight = products[i][4];
        const price = products[i][5];
        const status = products[i][6].toLowerCase();

        if (status !== "active") continue;

        if (subCategoryId === "") {
            if (catId != categoryId) continue;
        } else {
            if (subId != subCategoryId) continue;
        }

        html += `

<div class="product-card">

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

    if (html === "") {
        html = `<div class="no-product">No Products Found</div>`;
    }

    container.innerHTML = html;

}
// ================= CHANGE QTY =================

function changeQty(btn, change){

    const qty = btn.parentElement.querySelector(".qty");

    let value = parseInt(qty.innerText);

    value += change;

    if(value < 0) value = 0;

    qty.innerText = value;

}

// ================= ADD TO CART =================

function addToCart(product, weight, price, btn){

    const qty = parseInt(
        btn.parentElement.querySelector(".qty").innerText
    );

    if(qty <= 0){

        alert("Please select quantity");

        return;

    }

    const existing = cart.find(item =>
        item.product === product &&
        item.weight === weight
    );

    if(existing){

        existing.qty += qty;

    }else{

        cart.push({

            product,

            weight,

            price:Number(price),

            qty

        });

    }

    btn.parentElement.querySelector(".qty").innerText = "0";

    updateCart();

    btn.innerHTML = "✅ Added";

    btn.style.background = "#2E7D32";

    btn.style.color = "#fff";

    setTimeout(()=>{

        btn.innerHTML = "🛒 Add to Cart";

        btn.style.background = "";

        btn.style.color = "";

    },1500);

}

// ================= UPDATE CART =================

function updateCart(){

    let totalQty = 0;

    let totalAmount = 0;

    cart.forEach(item=>{

        totalQty += item.qty;

        totalAmount += item.qty * item.price;

    });

    document.getElementById("cart-count").innerText = totalQty;

    document.getElementById("cart-total").innerText = "₹ " + totalAmount;

    const cartBar = document.getElementById("cart-bar");

    cartBar.style.display = cart.length ? "flex" : "none";

}