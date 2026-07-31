
// ======================================
// Jyoti Gruh Udhyog API
// Version 1.0
// ======================================


// ==============================
// Google Sheet CSV URLs
// ==============================

const categoryURL =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vStfoYZJzDES0lAav3gzVi4hHMrr-g-vu6oHbAecwVN7-j5ZfyZCE4wy5qE8oaH0fSw14Y97pHMmUrU/pub?gid=2013716827&single=true&output=csv";

const subCategoryURL =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vStfoYZJzDES0lAav3gzVi4hHMrr-g-vu6oHbAecwVN7-j5ZfyZCE4wy5qE8oaH0fSw14Y97pHMmUrU/pub?gid=35788410&single=true&output=csv";

const productURL =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vStfoYZJzDES0lAav3gzVi4hHMrr-g-vu6oHbAecwVN7-j5ZfyZCE4wy5qE8oaH0fSw14Y97pHMmUrU/pub?gid=0&single=true&output=csv";


// ==============================
// Fetch CSV
// ==============================

async function fetchCSV(url){

    const response = await fetch(url);

    return await response.text();

}


// ==============================
// CSV To Array
// ==============================

function csvToArray(csv){

    return csv
        .trim()
        .split("\n")
        .map(row => row.split(","));

}


// ==============================
// URL Parameter
// ==============================

function getParam(name){

    return new URLSearchParams(location.search).get(name);

}


// ==============================
// Cart Storage
// ==============================

function getCart(){

    return JSON.parse(localStorage.getItem("cart")) || [];

}

function saveCart(cart){

    localStorage.setItem("cart", JSON.stringify(cart));

}


// ==============================
// Update Cart Count
// ==============================

function updateCartCount(){

    const cart = getCart();

    let total = 0;

    cart.forEach(item => {

        total += item.qty;

    });

    const headerCount = document.getElementById("cartCount");

    if(headerCount){

        headerCount.innerHTML = total;

    }

    const footerCount = document.getElementById("orderCount");

    if(footerCount){

        footerCount.innerHTML = total;

    }

}
// ==============================
// Load Categories
// ==============================

async function loadCategories(){

    const list = document.getElementById("categoryList");

    if(!list) return;

    const csv = await fetchCSV(categoryURL);

    const rows = csvToArray(csv);

    list.innerHTML = "";

    rows.slice(1).forEach(row=>{

        const id = row[0];
        const name = row[1];
        const image = row[2];
        const status = row[3];

        if(status.toLowerCase()!="active")
            return;

        list.innerHTML += `

<div class="category-card"
onclick="location.href='category.html?id=${id}'">

    <img src="${image}" alt="${name}" loading="lazy">

    <h3>${name}</h3>

</div>

`;

    });

}


// ==============================
// Load Sub Categories
// ==============================

async function loadSubCategories(){

    const categoryId = getParam("id");

    const list = document.getElementById("subCategoryList");

    if(!list) return;

    const csv = await fetchCSV(subCategoryURL);

    const rows = csvToArray(csv);

    list.innerHTML = "";

    rows.slice(1).forEach(row=>{

        const id = row[0];
        const catId = row[1];
        const name = row[2];
        const image = row[3];
        const status = row[4];

        if(status.toLowerCase()!="active")
            return;

        if(catId!=categoryId)
            return;

        list.innerHTML += `

<div class="category-card"
onclick="location.href='subcategory.html?id=${id}'">

    <img src="${image}" alt="${name}" loading="lazy">

    <h3>${name}</h3>

</div>

`;

    });

}


// ==============================
// Load Products
// ==============================

async function loadProducts(){

    const subCategoryId = getParam("id");

    const list = document.getElementById("productList");

    if(!list) return;

    const csv = await fetchCSV(productURL);

    const rows = csvToArray(csv);

    list.innerHTML = "";

    rows.slice(1).forEach(row=>{

        const id = row[0];
        const subId = row[1];
        const product = row[2];
        const weight = row[3];
        const price = row[4];
        const status = row[5];

        if(status.toLowerCase()!="active")
            return;

        if(subId!=subCategoryId)
            return;

        list.innerHTML += `

<div class="product-card">

    <img src="product.png"
         alt="${product}"
         loading="lazy">

    <h3>${product}</h3>

    <p>${weight}</p>

    <h4>₹${price}</h4>

    <button
        onclick="addToCart(
        '${id}',
        '${product}',
        '${weight}',
        ${price}
        )">

        🛒 Add To Cart

    </button>

</div>

`;

    });

}
// ==============================
// Add To Cart
// ==============================

function addToCart(id,name,weight,price){

    let cart = getCart();

    const item = cart.find(p => p.id == id);

    if(item){

        item.qty++;

    }else{

        cart.push({

            id:id,
            name:name,
            weight:weight,
            price:price,
            qty:1

        });

    }

    saveCart(cart);

    updateCartCount();

    alert("Product Added Successfully");

}


// ==============================
// Remove From Cart
// ==============================

function removeFromCart(id){

    let cart = getCart();

    cart = cart.filter(item => item.id != id);

    saveCart(cart);

    updateCartCount();

    loadCart();

}


// ==============================
// Change Quantity
// ==============================

function changeQty(id,type){

    let cart = getCart();

    const item = cart.find(x=>x.id==id);

    if(!item) return;

    if(type=="plus"){

        item.qty++;

    }else{

        item.qty--;

    }

    if(item.qty<=0){

        cart = cart.filter(x=>x.id!=id);

    }

    saveCart(cart);

    updateCartCount();

    loadCart();

}


// ==============================
// Load Cart
// ==============================

function loadCart(){

    const list = document.getElementById("cartList");

    const totalBox = document.getElementById("grandTotal");

    if(!list) return;

    const cart = getCart();

    list.innerHTML = "";

    let grandTotal = 0;

    cart.forEach(item=>{

        const total = item.price * item.qty;

        grandTotal += total;

        list.innerHTML += `

<div class="cart-item">

<h3>${item.name}</h3>

<p>${item.weight}</p>

<p>₹${item.price} × ${item.qty} = ₹${total}</p>

<div>

<button onclick="changeQty('${item.id}','minus')">-</button>

<button>${item.qty}</button>

<button onclick="changeQty('${item.id}','plus')">+</button>

<button onclick="removeFromCart('${item.id}')">

🗑️

</button>

</div>

</div>

`;

    });

    if(totalBox){

        totalBox.innerHTML = "₹"+grandTotal;

    }

}