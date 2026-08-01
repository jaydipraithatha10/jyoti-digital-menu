// ========================================
// JYOTI GRUH UDHYOG
// API.JS - PART 1
// ========================================

// ---------- CART ----------

let cart = JSON.parse(localStorage.getItem("cart")) || [];

function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
}

// ---------- GOOGLE SHEET URL ----------

const categoryURL =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vStfoYZJzDES0lAav3gzVi4hHMrr-g-vu6oHbAecwVN7-j5ZfyZCE4wy5qE8oaH0fSw14Y97pHMmUrU/pub?gid=2013716827&single=true&output=csv";

const subCategoryURL =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vStfoYZJzDES0lAav3gzVi4hHMrr-g-vu6oHbAecwVN7-j5ZfyZCE4wy5qE8oaH0fSw14Y97pHMmUrU/pub?gid=35788410&single=true&output=csv";

const productURL =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vStfoYZJzDES0lAav3gzVi4hHMrr-g-vu6oHbAecwVN7-j5ZfyZCE4wy5qE8oaH0fSw14Y97pHMmUrU/pub?gid=0&single=true&output=csv";

// ---------- COMMON ----------

async function fetchCSV(url){

    const response = await fetch(url);

    return await response.text();

}

function csvToArray(csv){

    return csv
        .trim()
        .split("\n")
        .map(row => row.split(","));

}

function getParam(name){

    return new URLSearchParams(location.search).get(name);

}

// ---------- CATEGORY ----------

async function loadCategories(){

    const list = document.getElementById("categoryList");

    if(!list) return;

    const csv = await fetchCSV(categoryURL);

    const rows = csvToArray(csv);

    list.innerHTML = "";

    rows.slice(1).forEach(row=>{

        if(row[2].trim().toLowerCase()!="active") return;

        list.innerHTML += `

<div class="category-card"
onclick="openCategory('${row[0]}')">

    <img src="${row[3]}"
         alt="${row[1]}"
         onerror="this.src='placeholder.png'">

    <h3>${row[1]}</h3>

</div>

`;

    });

}

// ---------- OPEN CATEGORY ----------

async function openCategory(categoryId){

    const csv = await fetchCSV(subCategoryURL);

    const rows = csvToArray(csv);

    const hasSub = rows.slice(1).some(row=>{

        return row[1]==categoryId &&
        row[3].trim().toLowerCase()=="active";

    });

    if(hasSub){

        location.href="category.html?id="+categoryId;

    }else{

        location.href="products.html?category="+categoryId;

    }

}

// ---------- SUB CATEGORY ----------

async function loadSubCategories(){

    const list=document.getElementById("subCategoryList");

    if(!list) return;

    const categoryId=getParam("id");

    const csv=await fetchCSV(subCategoryURL);

    const rows=csvToArray(csv);

    list.innerHTML="";

    rows.slice(1).forEach(row=>{

        if(row[3].trim().toLowerCase()!="active") return;

        if(row[1]!=categoryId) return;

        list.innerHTML+=`

<div class="category-card"
onclick="location.href='products.html?sub=${row[0]}'">

<img src="${row[4]}"
onerror="this.src='placeholder.png'">

<h3>${row[2]}</h3>

</div>

`;

    });

}

// ========================================
// PRODUCTS
// ========================================

async function loadProducts(){

    const list = document.getElementById("productList");

    if(!list) return;

    const subId = getParam("sub");
    const categoryId = getParam("category");

    const csv = await fetchCSV(productURL);
    const rows = csvToArray(csv);

    list.innerHTML = "";

    rows.slice(1).forEach(row=>{

        const id = row[0];
        const catId = row[1];
        const subCatId = row[2];
        const product = row[3];
        const weight = row[4];
        const price = row[5];
        const status = row[6];
        const image = row[7];

        if(status.trim().toLowerCase()!="active") return;

        if(subId){
            if(subCatId!=subId) return;
        }else if(categoryId){
            if(catId!=categoryId) return;
        }

        const item = cart.find(p=>p.id==id);
        const qty = item ? item.qty : 0;

        list.innerHTML += `

<div class="product-card">

<img src="${image}"
onerror="this.src='placeholder.png'">

<h3 class="product-name">${product}</h3>

<p class="product-weight">${weight}</p>

<h4 class="product-price">₹${price}</h4>

<div id="cart-${id}">

${qty==0 ?

`<button class="cart-btn"
onclick="addToCart('${id}')">
+ Add
</button>`

:

`<div class="qty-control">

<button onclick="changeQty('${id}',-1)">−</button>

<span>${qty}</span>

<button onclick="changeQty('${id}',1)">+</button>

</div>`

}

</div>

</div>

`;

    });

}

// ========================================
// ADD TO CART
// ========================================

function addToCart(id){

    const item = cart.find(p=>p.id==id);

    if(item){

        item.qty++;

    }else{

        cart.push({
            id:id,
            qty:1
        });

    }

    saveCart();

    loadProducts();

    updateCartButton();

}

// ========================================
// CHANGE QTY
// ========================================

function changeQty(id,change){

    const item = cart.find(p=>p.id==id);

    if(!item) return;

    item.qty += change;

    if(item.qty<=0){

        cart = cart.filter(p=>p.id!=id);

    }

    saveCart();

    loadProducts();

    updateCartButton();

}

// ========================================
// FLOATING CART
// ========================================

function updateCartButton(){

    const btn=document.getElementById("viewCartBtn");
    const count=document.getElementById("cartCount");

    if(!btn || !count) return;

    const total = cart.reduce((sum,item)=>sum+item.qty,0);

    if(total==0){

        btn.style.display="none";

    }else{

        btn.style.display="flex";
        count.innerText=total;

    }

}

// ========================================
// CART PAGE
// ========================================

async function loadCart(){

    const list = document.getElementById("cartList");

    if(!list) return;

    const csv = await fetchCSV(productURL);
    const rows = csvToArray(csv);

    let total = 0;

    list.innerHTML = "";

    if(cart.length==0){

        list.innerHTML=`
        <div class="empty-cart">
            <h2>🛒 Cart is Empty</h2>
            <p>Please add products.</p>
        </div>
        `;
        return;
    }

    cart.forEach(item=>{

        const row = rows.find(r=>r[0]==item.id);

        if(!row) return;

        const product = row[3];
        const weight = row[4];
        const price = Number(row[5]);
        const image = row[7];

        total += price * item.qty;

        list.innerHTML += `

<div class="cart-item">

<img src="${image}">

<div class="cart-info">

<h3>${product}</h3>

<p>${weight}</p>

<div class="cart-price">
₹${price}
</div>

<div class="qty-box">

<button class="qty-btn"
onclick="changeQty('${item.id}',-1);loadCart();">
−
</button>

<span class="qty-number">
${item.qty}
</span>

<button class="qty-btn"
onclick="changeQty('${item.id}',1);loadCart();">
+
</button>

</div>

<button class="remove-btn"
onclick="removeCartItem('${item.id}')">
🗑 Remove
</button>

</div>

</div>

`;

    });

    list.innerHTML += `

<div class="cart-total">

<h2>Total</h2>

<div class="total-price">
₹${total}
</div>

<button class="whatsapp-btn"
onclick="orderWhatsApp()">

📲 Order on WhatsApp

</button>

</div>

`;

}

// ========================================
// REMOVE ITEM
// ========================================

function removeCartItem(id){

    cart = cart.filter(item=>item.id!=id);

    saveCart();

    updateCartButton();

    loadCart();

}

// ========================================
// WHATSAPP ORDER
// ========================================

async function orderWhatsApp(){

    const csv = await fetchCSV(productURL);
    const rows = csvToArray(csv);

    let message = "🛒 *Jyoti Gruh Udhyog Order*%0A%0A";

    cart.forEach(item=>{

        const row = rows.find(r=>r[0]==item.id);

        if(!row) return;

        message += `• ${row[3]} (${row[4]}) x ${item.qty}%0A`;

    });

    const mobile = "91XXXXXXXXXX"; // અહીં તમારો WhatsApp નંબર

    window.open(
        `https://wa.me/${mobile}?text=${message}`,
        "_blank"
    );

    // Order પછી Cart Empty

    cart = [];

    saveCart();

}

// ========================================
// AUTO LOAD
// ========================================

document.addEventListener("DOMContentLoaded",()=>{

    loadCategories();

    loadSubCategories();

    loadProducts();

    loadCart();

    updateCartButton();

});