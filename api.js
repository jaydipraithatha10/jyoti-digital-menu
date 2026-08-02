// ======================================
// JYOTI GRUH UDHYOG
// API.JS V4
// PART 1
// ======================================

// ---------- CART ----------

let cart = JSON.parse(localStorage.getItem("cart")) || [];

function saveCart(){
    localStorage.setItem("cart", JSON.stringify(cart));
}

// ---------- CACHE ----------

let categoryRows = [];
let subCategoryRows = [];
let productRows = [];

// ---------- GOOGLE SHEET ----------

const SHEET =
"2PACX-1vStfoYZJzDES0lAav3gzVi4hHMrr-g-vu6oHbAecwVN7-j5ZfyZCE4wy5qE8oaH0fSw14Y97pHMmUrU";

const categoryURL =
`https://docs.google.com/spreadsheets/d/e/${SHEET}/pub?gid=2013716827&single=true&output=csv`;

const subCategoryURL =
`https://docs.google.com/spreadsheets/d/e/${SHEET}/pub?gid=35788410&single=true&output=csv`;

const productURL =
`https://docs.google.com/spreadsheets/d/e/${SHEET}/pub?gid=0&single=true&output=csv`;

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

// ---------- LOAD CACHE ----------

async function loadData(){

    if(categoryRows.length === 0){

        categoryRows =
        csvToArray(await fetchCSV(categoryURL));

    }

    if(subCategoryRows.length === 0){

        subCategoryRows =
        csvToArray(await fetchCSV(subCategoryURL));

    }

    if(productRows.length === 0){

        productRows =
        csvToArray(await fetchCSV(productURL));

    }

}

// ======================================
// PART 2
// CATEGORY + SUB CATEGORY
// ======================================

async function loadCategories(){

    const list = document.getElementById("categoryList");

    if(!list) return;

    await loadData();

    list.innerHTML = "";

    categoryRows.slice(1).forEach(row=>{

        if(row[2].trim().toLowerCase()!="active")
            return;

        list.innerHTML += `

<div class="category-card"
onclick="openCategory('${row[0]}')">

    <img src="${row[3]}"
    loading="lazy"
    onerror="this.src='placeholder.png'">

    <h3>${row[1]}</h3>

</div>

`;

    });

}

// ======================================
// OPEN CATEGORY
// ======================================

async function openCategory(id){

    await loadData();

    const hasSub = subCategoryRows.slice(1).some(row=>{

        return row[1]==id &&
        row[3].trim().toLowerCase()=="active";

    });

    if(hasSub){

        location.href =
        "category.html?id="+id;

    }else{

        location.href =
        "products.html?category="+id;

    }

}

// ======================================
// SUB CATEGORY
// ======================================

async function loadSubCategories(){

    const list =
    document.getElementById("subCategoryList");

    if(!list) return;

    await loadData();

    const id = getParam("id");

    list.innerHTML = "";

    subCategoryRows.slice(1).forEach(row=>{

        if(row[3].trim().toLowerCase()!="active")
            return;

        if(row[1]!=id)
            return;

        list.innerHTML += `

<div class="category-card"
onclick="location.href='products.html?sub=${row[0]}'">

    <img src="${row[4]}"
    loading="lazy"
    onerror="this.src='placeholder.png'">

    <h3>${row[2]}</h3>

</div>

`;

    });

}

// ======================================
// PART 3
// PRODUCTS
// ======================================

async function loadProducts(){

    const list =
    document.getElementById("productList");

    if(!list) return;

    await loadData();

    const subId = getParam("sub");
    const categoryId = getParam("category");
    const search =
    (getParam("search") || "").toLowerCase();

    list.innerHTML = "";

    productRows.slice(1).forEach(row=>{

        const id = row[0];
        const catId = row[1];
        const subCatId = row[2];
        const product = row[3];
        const weight = row[4];
        const price = Number(row[5]);
        const status = row[6];
        const image = row[7];

        if(status.trim().toLowerCase()!="active")
            return;

        if(subId && subCatId!=subId)
            return;

        if(categoryId && !subId && catId!=categoryId)
            return;

        if(search){

            const keyword =
            (product + " " + weight)
            .toLowerCase();

            if(!keyword.includes(search))
                return;

        }

        const item =
        cart.find(p=>p.id==id);

        const qty =
        item ? item.qty : 0;

        list.innerHTML += `

<div class="product-card">

<img src="${image}"
loading="lazy"
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

<button class="qty-btn"
onclick="changeQty('${id}',-1)">

−

</button>

<span class="qty-number">

${qty}

</span>

<button class="qty-btn"
onclick="changeQty('${id}',1)">

+

</button>

</div>`

}

</div>

</div>

`;

    });

}

// ======================================
// PART 4
// CART + WHATSAPP + AUTO LOAD
// ======================================

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

function changeQty(id,change){

    const item = cart.find(p=>p.id==id);

    if(!item) return;

    item.qty += change;

    if(item.qty<=0){

        cart = cart.filter(p=>p.id!=id);

    }

    saveCart();

    loadProducts();

    loadCart();

    updateCartButton();

}

function updateCartButton(){

    const btn=document.getElementById("viewCartBtn");
    const count=document.getElementById("cartCount");

    if(!btn || !count) return;

    const total=cart.reduce((sum,item)=>sum+item.qty,0);

    if(total==0){

        btn.style.display="none";

    }else{

        btn.style.display="flex";

        count.innerText=total;

    }

}

async function loadCart(){

    const list=document.getElementById("cartList");

    if(!list) return;

    await loadData();

    list.innerHTML="";

    let grandTotal=0;

    if(cart.length===0){

        list.innerHTML=`
<div class="empty-cart">
<h2>🛒 Your Cart is Empty</h2>
</div>
`;
        return;
    }

    cart.forEach(item=>{

        const row=productRows.find(r=>r[0]==item.id);

        if(!row) return;

        const total=Number(row[5])*item.qty;

        grandTotal+=total;

        list.innerHTML+=`

<div class="cart-item">

<img src="${row[7]}" onerror="this.src='placeholder.png'">

<div class="cart-info">

<h3>${row[3]}</h3>

<p>${row[4]}</p>

<div class="cart-price">

₹${row[5]} × ${item.qty} = ₹${total}

</div>

<div class="qty-box">

<button class="qty-btn"
onclick="changeQty('${item.id}',-1)">−</button>

<span class="qty-number">${item.qty}</span>

<button class="qty-btn"
onclick="changeQty('${item.id}',1)">+</button>

</div>

<button class="remove-btn"
onclick="removeCartItem('${item.id}')">

🗑 Remove

</button>

</div>

</div>

`;

    });

    list.innerHTML+=`

<div class="cart-total">

<h2>Grand Total</h2>

<div class="total-price">

₹${grandTotal}

</div>

<button class="whatsapp-btn"
onclick="orderWhatsApp()">

📲 Order on WhatsApp

</button>

</div>

`;

}

function removeCartItem(id){

    cart=cart.filter(item=>item.id!=id);

    saveCart();

    loadCart();

    updateCartButton();

}


async function orderWhatsApp(){

    await loadData();

    let grandTotal = 0;

    let message = "🛒 *Jyoti Gruh Udhyog Order*\n\n";

    cart.forEach(item=>{

        const row = productRows.find(r=>r[0]==item.id);

        if(!row) return;

        const total = Number(row[5]) * item.qty;

        grandTotal += total;

        message +=
`📦 ${row[3]} (${row[4]})
Qty : ${item.qty}
Price : ₹${row[5]}
Total : ₹${total}

`;

    });

    message += `💰 Grand Total : ₹${grandTotal}`;

    window.open(
        `https://wa.me/919712149344?text=${encodeURIComponent(message)}`,
        "_blank"
    );

    setTimeout(()=>{

        const popup = document.getElementById("orderPopup");

        if(popup){

            popup.style.display="block";

        }

    },1000);

}
    

document.addEventListener("DOMContentLoaded",async()=>{

    await loadData();

    loadCategories();

    loadSubCategories();

    loadProducts();

    loadCart();

    updateCartButton();

});



function closePopup(){

    document.getElementById("orderPopup").style.display="none";

}

function completeOrder(){

    cart = [];

    saveCart();

    updateCartButton();

    document.getElementById("orderPopup").style.display = "none";

    window.location.href = "index.html";

}