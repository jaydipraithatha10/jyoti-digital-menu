// ================= CSV LINKS =================

const CATEGORY_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vStfoYZJzDES0lAav3gzVi4hHMrr-g-vu6oHbAecwVN7-j5ZfyZCE4wy5qE8oaH0fSw14Y97pHMmUrU/pub?gid=2013716827&single=true&output=csv";

const SUBCATEGORY_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vStfoYZJzDES0lAav3gzVi4hHMrr-g-vu6oHbAecwVN7-j5ZfyZCE4wy5qE8oaH0fSw14Y97pHMmUrU/pub?gid=35788410&single=true&output=csv";

const PRODUCT_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vStfoYZjDES0lAav3gzVi4hHMrr-g-vu6oHbAecwVN7-j5ZfyZCE4wy5qE8oaH0fSw14Y97pHMmUrU/pub?gid=0&single=true&output=csv";


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

        if (status != "active") continue;

        const div = document.createElement("div");

        div.className = "category-item";

        div.innerHTML = `

            <div class="category-card">

                ${name}

            </div>

            <div id="sub-${id}" class="sub-list"></div>

        `;

        div.querySelector(".category-card").onclick = function(){

            toggleCategory(id,this);

        };

        container.appendChild(div);

    }

}

// ================= TOGGLE CATEGORY =================

async function toggleCategory(categoryId, card){

    // બધા Category Active Remove
    document.querySelectorAll(".category-card").forEach(item=>{
        item.classList.remove("active");
    });

    // Click થયેલ Category Active
    card.classList.add("active");

    // બીજા બધા બંધ
    document.querySelectorAll(".sub-list").forEach(list=>{
        if(list.id!="sub-"+categoryId){
            list.innerHTML="";
        }
    });

    const container=document.getElementById("sub-"+categoryId);

    // પહેલેથી ખુલ્લું હોય તો બંધ કરો
    if(container.innerHTML!=""){
        container.innerHTML="";
        return;
    }

    const response=await fetch(SUBCATEGORY_CSV);

    const csv=await response.text();

    const rows=csv.trim().split("\n");

    let html="";

    for(let i=1;i<rows.length;i++){

        const cols=rows[i].split(",");

        const subId=cols[0].trim();

        const catId=cols[1].trim();

        const subName=cols[2].trim();

        const status=cols[3].trim().toLowerCase();

        if(status!="active") continue;

        if(catId!=categoryId) continue;

        html+=`

        <div class="subcategory-card"
             onclick="toggleSubCategory('${categoryId}','${subId}',this)">

            ${subName}

        </div>

        <div id="product-${subId}" class="product-list"></div>

        `;

    }

    container.innerHTML=html;

    // જો SubCategory ન હોય
    if(html==""){

        loadProducts(categoryId,"",container);

    }

}
// ================= SUB CATEGORY =================

function toggleSubCategory(categoryId, subCategoryId, card) {

    // બધા SubCategory Active Remove
    document.querySelectorAll(".subcategory-card").forEach(item => {
        item.classList.remove("active");
    });

    // Click થયેલી SubCategory Active
    card.classList.add("active");

    // બીજા બધા Product List બંધ
    document.querySelectorAll(".product-list").forEach(list => {
        if (list.id != "product-" + subCategoryId) {
            list.innerHTML = "";
        }
    });

    loadProducts(categoryId, subCategoryId);

}


// ================= LOAD PRODUCTS =================

async function loadProducts(categoryId, subCategoryId) {

    let container;

    if (subCategoryId == "") {

        container = document.getElementById("sub-" + categoryId);

    } else {

        container = document.getElementById("product-" + subCategoryId);

    }

    // જો ખુલ્લું હોય તો બંધ કરો
    if (container.innerHTML.trim() != "" && subCategoryId == "") {
        return;
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

        if (status != "active") continue;

        if (subCategoryId != "") {

            if (subId != subCategoryId) continue;

        } else {

            if (catId != categoryId) continue;

        }

        html += `
        <div class="product-card">

            <div class="product-name">${product}</div>

            <div class="product-weight">${weight}</div>

            <div class="product-price">₹ ${price}</div>

            <div class="qty-box">

                <button onclick="changeQty(this,-1)">-</button>

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

    if (html == "") {

        html = "<p>No Products Found</p>";

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
            product,
            weight,
            price: Number(price),
            qty
        });

    }

    // Quantity Reset
    btn.parentElement.querySelector(".qty").innerText = "0";

    updateCart();

}


// ================= UPDATE CART =================

function updateCart() {

    let totalQty = 0;

    let totalAmount = 0;

    cart.forEach(item => {

        totalQty += item.qty;

        totalAmount += item.qty * item.price;

    });

    const count = document.getElementById("cart-count");
    const total = document.getElementById("cart-total");

    if (count) count.innerText = totalQty;

    if (total) total.innerText = totalAmount;

}