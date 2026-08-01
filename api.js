// =========================
// Google Sheet URL
// =========================
// =========================
// CART
// =========================

let cart = JSON.parse(localStorage.getItem("cart")) || [];

function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
}
const categoryURL =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vStfoYZJzDES0lAav3gzVi4hHMrr-g-vu6oHbAecwVN7-j5ZfyZCE4wy5qE8oaH0fSw14Y97pHMmUrU/pub?gid=2013716827&single=true&output=csv";


// =========================
// Fetch CSV
// =========================

async function fetchCSV(url){

    const response = await fetch(url);

    return await response.text();

}


// =========================
// CSV to Array
// =========================

function csvToArray(csv){

    return csv
        .trim()
        .split("\n")
        .map(row => row.split(","));

}


// =========================
// Load Categories
// =========================

async function loadCategories(){

    const list = document.getElementById("categoryList");

    if(!list) return;

    const csv = await fetchCSV(categoryURL);

    const rows = csvToArray(csv);

    list.innerHTML = "";

    rows.slice(1).forEach(row=>{

        if(row[2].trim().toLowerCase() !== "active")
            return;

        list.innerHTML += `
<div class="category-card" onclick="openCategory('${row[0]}')">

    <img src="${row[3]}"
         alt="${row[1]}"
         loading="lazy"
         decoding="async"
         onerror="this.src='placeholder.png'">

    <h3>${row[1]}</h3>

</div>
`;

    });

}


        async function openCategory(categoryId){

    const csv = await fetchCSV(subCategoryURL);
    const rows = csvToArray(csv);

    const hasSubCategory = rows.slice(1).some(row => {
        return row[1] == categoryId &&
               row[3].trim().toLowerCase() == "active";
    });

    if(hasSubCategory){
        location.href = "category.html?id=" + categoryId;
    }else{
        location.href = "products.html?category=" + categoryId;
    }

}



// =========================
// Auto Load
// =========================

document.addEventListener("DOMContentLoaded",()=>{

    loadCategories();

});

// =========================
// URL Parameter
// =========================

function getParam(name){

    return new URLSearchParams(location.search).get(name);

}


// =========================
// Sub Category URL
// =========================

const subCategoryURL =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vStfoYZJzDES0lAav3gzVi4hHMrr-g-vu6oHbAecwVN7-j5ZfyZCE4wy5qE8oaH0fSw14Y97pHMmUrU/pub?gid=35788410&single=true&output=csv";


// =========================
// Load Sub Categories
// =========================

async function loadSubCategories(){

    const categoryId = getParam("id");

    const list = document.getElementById("subCategoryList");

    if(!list) return;

    const csv = await fetchCSV(subCategoryURL);

    const rows = csvToArray(csv);

    list.innerHTML = "";

    rows.slice(1).forEach(row=>{

        if(row[3].trim().toLowerCase()!="active")
            return;

        if(row[1]!=categoryId)
            return;

        list.innerHTML += `

<div class="category-card"
onclick="location.href='products.html?sub=${row[0]}'">

<img src="${row[4].trim()}"
     alt="${row[2]}"
     loading="lazy"
     decoding="async"
     onerror="this.src='placeholder.png'">

<h3>${row[2]}</h3>

</div>

`;

    });

}

document.addEventListener("DOMContentLoaded",()=>{

    loadSubCategories();

});

// =========================
// Products URL
// =========================

const productURL =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vStfoYZJzDES0lAav3gzVi4hHMrr-g-vu6oHbAecwVN7-j5ZfyZCE4wy5qE8oaH0fSw14Y97pHMmUrU/pub?gid=0&single=true&output=csv";


// =========================
// Load Products
// =========================

async function loadProducts(){

    const subId = getParam("sub");

    const categoryId = getParam("category");

    const list = document.getElementById("productList");

    if(!list) return;

    const csv = await fetchCSV(productURL);

    const rows = csvToArray(csv);

    list.innerHTML = "";

    rows.slice(1).forEach(row=>{

        const id = row[0];
        const catId = row[1];
        const subCategoryId = row[2];
        const product = row[3];
        const weight = row[4];
        const price = row[5];
        const status = row[6];
        const image = row[7];

        if(status.trim().toLowerCase()!="active")
            return;

        if(subId){

            if(subCategoryId!=subId)
                return;

        }else if(categoryId){

            if(catId!=categoryId)
                return;

        }

        list.innerHTML += `
<div class="product-card">

    <img src="${image}"
         alt="${product}"
         loading="lazy"
         onerror="this.src='placeholder.png'">

    <h3 class="product-name">${product}</h3>

    <p class="product-weight">${weight}</p>

    <h4 class="product-price">₹${price}</h4>

    
<div class="cart-action" id="cart-${id}">

    <button class="cart-btn" onclick="addToCart('${id}')">
        + Add
    </button>

</div>
</div>
`;

    });

    updateCartButton();

}

function addToCart(id){

    const item = cart.find(p => p.id == id);

    if(item){
        item.qty++;
    }else{
        cart.push({
            id:id,
            qty:1
        });
    }

    saveCart();
    updateCartButton();

    updateProductButton(id);

}

function updateProductButton(id){

    const box = document.getElementById("cart-" + id);

    if(!box) return;

    const item = cart.find(p => p.id == id);

    if(!item){

        box.innerHTML = `
        <button class="cart-btn" onclick="addToCart('${id}')">
            + Add
        </button>
        `;

        return;
    }

    box.innerHTML = `
    <div class="qty-control">

        <button onclick="changeQty('${id}',-1)">−</button>

        <span>${item.qty}</span>

        <button onclick="changeQty('${id}',1)">+</button>

    </div>
    `;
}

function changeQty(id, change){

    const item = cart.find(p => p.id == id);

    if(!item) return;

    item.qty += change;

    if(item.qty <= 0){
        cart = cart.filter(p => p.id != id);
    }

    saveCart();

    updateCartButton();

    updateProductButton(id);

}
// =========================
// Auto Load Products
// =========================

document.addEventListener("DOMContentLoaded", () => {
    loadProducts();
    updateCartButton();
});

function updateCartButton(){

    const btn = document.getElementById("viewCartBtn");
    const count = document.getElementById("cartCount");

    if(!btn || !count) return;

    const total = cart.reduce((sum, item) => sum + item.qty, 0);

    if(total === 0){
        btn.style.display = "none";
    }else{
        btn.style.display = "flex";
        count.innerText = total;
    }
}