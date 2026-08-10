// ======================================
// JYOTI GRUH UDHYOG
// API.JS V6
// PART 1
// CORE + CACHE + FAST FETCH
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

let productMap = new Map();

let productList = [];

let dataLoaded = false;

let cacheTime = 0;

const CACHE_DURATION = 5 * 60 * 1000;

// LOCAL STORAGE CACHE

const STORAGE_KEY = "jyoti_data_cache";

function saveCache(){

    const data = {

        categoryRows,
        subCategoryRows,
        productRows,

        time: Date.now()

    };

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(data)
    );

}

function loadCache(){

    const cache =
    localStorage.getItem(STORAGE_KEY);

    if(!cache) return false;

    const data = JSON.parse(cache);

    if(
        Date.now() - data.time >
        CACHE_DURATION
    ){
        return false;
    }

    categoryRows = data.categoryRows;
    subCategoryRows = data.subCategoryRows;
    productRows = data.productRows;

    productMap.clear();

    productRows.slice(1).forEach(row=>{

        productMap.set(row[0],row);

    });

    dataLoaded = true;

    cacheTime = data.time;

    return true;

}

// ---------- GOOGLE SHEET ----------

const SHEET =
"2PACX-1vStfoYZJzDES0lAav3gzVi4hHMrr-g-vu6oHbAecwVN7-j5ZfyZCE4wy5qE8oaH0fSw14Y97pHMmUrU";

const categoryURL =
`https://docs.google.com/spreadsheets/d/e/${SHEET}/pub?gid=2013716827&single=true&output=csv`;

const subCategoryURL =
`https://docs.google.com/spreadsheets/d/e/${SHEET}/pub?gid=35788410&single=true&output=csv`;

const productURL =
`https://docs.google.com/spreadsheets/d/e/${SHEET}/pub?gid=0&single=true&output=csv`;

// ======================================
// FAST FETCH
// ======================================

async function fetchCSV(url){

    const response = await fetch(url,{
        cache:"force-cache"
    });

    if(!response.ok){

        throw new Error("Data Load Failed");

    }

    return await response.text();

}

// ======================================
// CSV PARSER
// ======================================

function csvToArray(csv){

    return csv
        .trim()
        .split(/\r?\n/)
        .map(row=>row.split(","));

}

// ======================================
// URL PARAM
// ======================================

function getParam(name){

    return new URLSearchParams(location.search).get(name);

}

// ======================================
// FAST PRODUCT LOOKUP
// ======================================

function getProduct(id){
    return productMap.get(id);
}

// ======================================
// LOAD DATA (ONLY ONCE)
// ======================================

async function loadData(){

if(loadCache()) return;

    if(
    dataLoaded &&
    (Date.now() - cacheTime) < CACHE_DURATION
){
    return;
}

    const [catCSV,subCSV,proCSV] =
    await Promise.all([

        fetchCSV(categoryURL),
        fetchCSV(subCategoryURL),
        fetchCSV(productURL)

    ]);

    categoryRows = csvToArray(catCSV);
    subCategoryRows = csvToArray(subCSV);
    productRows = csvToArray(proCSV);

    productList = [];

    productRows.slice(1).forEach(row=>{

        productList.push({

            id: row[0],

            category: row[1],

            subCategory: row[2],

            name: row[3],

            weight: row[4],

            price: Number(row[5]),

            status: row[6],

            image: row[7]

        });

    });

    // Build Product Map

    productMap.clear();

    productRows.slice(1).forEach(row=>{

        productMap.set(row[0], row);

    });

    dataLoaded = true;

    cacheTime = Date.now();

    saveCache();

}

// ======================================
// API.JS V6
// PART 2
// CATEGORY + SUB CATEGORY + PRODUCTS
// ======================================

// ======================================
// CATEGORY
// ======================================

async function loadCategories(){

    const list =
    document.getElementById("categoryList");

    if(!list) return;

    const html = [];

    categoryRows.slice(1).forEach(row=>{

        if(row[2].trim().toLowerCase()!="active")
            return;

        html.push(`

<div class="category-card"
onclick="openCategory('${row[0]}')">

<img
src="${row[3]}"
loading="lazy"
decoding="async"
fetchpriority="low"
onerror="this.src='placeholder.webp'">

<h3>${row[1]}</h3>

</div>

`);

    });

    list.innerHTML = html.join("");

}

// ======================================
// OPEN CATEGORY
// ======================================

function openCategory(id){

    const hasSub =
    subCategoryRows.slice(1).some(row=>

        row[1]==id &&
        row[3].trim().toLowerCase()=="active"

    );

    location.href = hasSub
        ? "category.html?id="+id
        : "products.html?category="+id;

}

// ======================================
// SUB CATEGORY
// ======================================

async function loadSubCategories(){

    const list =
    document.getElementById("subCategoryList");

    if(!list) return;

    const id = getParam("id");

    const html = [];

    subCategoryRows.slice(1).forEach(row=>{

        if(row[3].trim().toLowerCase()!="active")
            return;

        if(row[1]!=id)
            return;

        html.push(`

<div class="category-card"
onclick="location.href='products.html?sub=${row[0]}'">

<img
src="${row[4]}"
loading="lazy"
decoding="async"
fetchpriority="low"
onerror="this.src='placeholder.webp'">

<h3>${row[2]}</h3>

</div>

`);

    });

    list.innerHTML = html.join("");

}

// ======================================
// PRODUCTS
// ======================================

// ==========================================
// PRODUCTS
// SAME PRODUCT NAME = ONE CARD
// 250 gm + 500 gm = SAME CARD
// ==========================================

function loadProducts(searchText = "") {

    const list = document.getElementById("productList");

    if (!list) return;

    const subId = getParam("sub");
    const categoryId = getParam("category");
    const urlSearch = getParam("search") || "";

    const search = (
        searchText || urlSearch
    ).trim().toLowerCase();


    // ======================================
    // GROUP PRODUCTS
    // ======================================

    const grouped = new Map();


    productRows.slice(1).forEach(row => {

        /*
        SHEET COLUMNS

        A = ID
        B = categoryID
        C = SubCategoryID
        D = Product
        E = Weight
        F = Price
        G = Status
        H = Images
        */


        const id = row[0];

        const category = row[1];

        const subCategory = row[2];

        const name = (row[3] || "").trim();

        const weight = (row[4] || "").trim();

        const price = Number(
            String(row[5] || "")
                .replace(/[₹,\s]/g, "")
        ) || 0;

        const status = (row[6] || "")
            .trim()
            .toLowerCase();

        const image = (row[7] || "").trim();


        // ==================================
        // ACTIVE ONLY
        // ==================================

        if (status !== "active") {
            return;
        }


        // ==================================
        // SUB CATEGORY FILTER
        // ==================================

        if (
            subId &&
            String(subCategory).trim() !==
            String(subId).trim()
        ) {
            return;
        }


        // ==================================
        // CATEGORY FILTER
        // ==================================

        if (
            categoryId &&
            !subId &&
            String(category).trim() !==
            String(categoryId).trim()
        ) {
            return;
        }


        // ==================================
        // SEARCH
        // ==================================

        if (search) {

            const searchValue = (
                name + " " + weight
            ).toLowerCase();

            if (!searchValue.includes(search)) {
                return;
            }
        }


        // ==================================
        // IMPORTANT
        // SAME NAME = SAME CARD
        // ==================================

        const groupKey = name
            .toLowerCase()
            .replace(/\s+/g, " ")
            .trim();


        if (!groupKey) {
            return;
        }


        // ==================================
        // CREATE GROUP
        // ==================================

        if (!grouped.has(groupKey)) {

            grouped.set(groupKey, {

                name: name,

                image: image,

                variants: []

            });

        }


        // ==================================
        // ADD VARIANT
        // ==================================

        grouped.get(groupKey).variants.push({

            id: id,

            weight: weight,

            price: price,

            image: image

        });

    });


    // ======================================
    // CREATE HTML
    // ======================================

    const html = [];


    grouped.forEach(product => {

        let variantsHTML = "";


        // ----------------------------------
        // SORT WEIGHT
        // ----------------------------------

        product.variants.sort((a, b) => {

            const aw =
                parseFloat(a.weight) || 0;

            const bw =
                parseFloat(b.weight) || 0;

            return aw - bw;

        });


        // ----------------------------------
        // VARIANTS
        // ----------------------------------

        product.variants.forEach(variant => {


            const cartItem = cart.find(item =>
                String(item.id) ===
                String(variant.id)
            );


            const qty =
                cartItem ? cartItem.qty : 0;


            let action = "";


            // =================================
            // ADD BUTTON
            // =================================

            if (qty === 0) {

                action = `

<button
    type="button"
    class="variant-add-btn"
    onclick="addToCart('${variant.id}')"
>
    + Add
</button>

`;

            }

            // =================================
            // QUANTITY
            // =================================

            else {

                action = `

<div class="variant-qty">

<button
    type="button"
    class="qty-btn"
    onclick="changeQty('${variant.id}',-1)"
>
    −
</button>

<span class="qty-number">
    ${qty}
</span>

<button
    type="button"
    class="qty-btn"
    onclick="changeQty('${variant.id}',1)"
>
    +
</button>

</div>

`;

            }


            // =================================
            // VARIANT ROW
            // =================================

            variantsHTML += `

<div class="product-variant-row">

    <div class="product-variant-weight">
        ${variant.weight}
    </div>

    <div class="product-variant-price">
        ₹${variant.price}
    </div>

    <div class="product-variant-action">
        ${action}
    </div>

</div>

`;

        });


        // ==================================
        // PRODUCT CARD
        // ==================================

        html.push(`

<div class="product-card">

    <img
        src="${product.image || "placeholder.webp"}"
        alt="${product.name}"
        loading="lazy"
        decoding="async"
        onclick="openImage('${product.image || "placeholder.webp"}')"
        onerror="this.src='placeholder.webp'"
    >

    <h3 class="product-name">
        ${product.name}
    </h3>

    <div class="product-variants">
        ${variantsHTML}
    </div>

</div>

`);

    });


    // ======================================
    // DISPLAY
    // ======================================

    list.innerHTML = html.join("");


    // ======================================
    // PRODUCT COUNT
    // ======================================

    const heading =
        document.querySelector(".section-title");


    if (heading) {

        heading.innerHTML = `

🛒 All Products

<span
    style="
        font-size:16px;
        color:#888;
    "
>
    (${grouped.size})
</span>

`;

    }

}
// ======================================
// API.JS V6
// PART 3
// FAST SEARCH + CART
// ======================================

// ---------- SEARCH ----------

function initSearch(){

    const searchBox =
    document.getElementById("searchBox");

    if(!searchBox) return;

    let timer;

    searchBox.addEventListener("input",function(){

        const text = this.value.trim();

        clearTimeout(timer);

        timer = setTimeout(()=>{

            if(document.getElementById("productList")){

                loadProducts(text);

            }

            else if(document.getElementById("categoryList")){

                if(text.length>=2){

                    location.href=
                    "products.html?search="+
                    encodeURIComponent(text);

                }

            }

        },250);

    });

}

// ======================================
// ADD TO CART
// ======================================

function addToCart(id){

    const item =
    cart.find(p=>p.id==id);

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

    loadProducts();

}

// ======================================
// CHANGE QTY
// ======================================

function changeQty(id,change){

    const item =
    cart.find(p=>p.id==id);

    if(!item) return;

    item.qty += change;

    if(item.qty<=0){

        cart =
        cart.filter(p=>p.id!=id);

    }

    saveCart();

    updateCartButton();

    loadProducts();

    loadCart();

}

// ======================================
// REMOVE ITEM
// ======================================

function removeCartItem(id){

    cart =
    cart.filter(item=>item.id!=id);

    saveCart();

    updateCartButton();

    loadProducts();

    loadCart();

}

// ======================================
// FLOATING CART
// ======================================

function updateCartButton(){

    const btn =
    document.getElementById("viewCartBtn");

    const count =
    document.getElementById("cartCount");

    if(!btn || !count) return;

    const total =
    cart.reduce(
        (sum,item)=>sum+item.qty,
        0
    );

    if(total===0){

        btn.style.display="none";
        count.textContent="0";

    }else{

        btn.style.display="flex";
        count.textContent=total;

    }

}

// ======================================
// API.JS V6
// PART 4
// CART + WHATSAPP + AUTO LOAD
// ======================================

// ======================================
// LOAD CART
// ======================================

async function loadCart(){

    const list =
    document.getElementById("cartList");

    if(!list) return;

    if(cart.length===0){

        list.innerHTML=`

<div class="empty-cart">

<h2>🛒 Your Cart is Empty</h2>

<p>Please add products.</p>

</div>

`;

        updateCartButton();

        return;

    }

    let html = [];
    let grandTotal = 0;

    cart.forEach(item=>{

        const row = getProduct(item.id);

        if(!row) return;

        const product = row[3];
        const weight = row[4];
        const price = Number(row[5]);
        const image = row[7];

        const total = price * item.qty;

        grandTotal += total;

        html.push(`

<div class="cart-item">

<img
src="${image}"
loading="lazy"
decoding="async"
fetchpriority="low"
onerror="this.src='placeholder.webp'">

<div class="cart-info">

<h3>${product}</h3>

<p>${weight}</p>

<div class="cart-price">

₹${price} × ${item.qty} = ₹${total}

</div>

<div class="qty-box">

<button class="qty-btn"
onclick="changeQty('${item.id}',-1)">−</button>

<span class="qty-number">
${item.qty}
</span>

<button class="qty-btn"
onclick="changeQty('${item.id}',1)">+</button>

</div>

<button class="remove-btn"
onclick="removeCartItem('${item.id}')">

🗑 Remove

</button>

</div>

</div>

`);

    });

    html.push(`

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

`);

    list.innerHTML = html.join("");

    updateCartButton();

}

// ======================================
// WHATSAPP
// ======================================

async function orderWhatsApp(){

    await loadData();

    let grandTotal = 0;

    let message =
`🛒 *Jyoti Gruh Udhyog*

નવો ઓર્ડર

------------------------

`;

    cart.forEach(item=>{

        const row = getProduct(item.id);

        if(!row) return;

        const total =
        Number(row[5]) * item.qty;

        grandTotal += total;

        message +=
`📦 ${row[3]}
⚖️ ${row[4]}

💰 ₹${row[5]} × ${item.qty} = ₹${total}

------------------------

`;

    });

    message +=
`💵 Grand Total : ₹${grandTotal}

🙏 આભાર`;

    window.open(

`https://wa.me/919712149344?text=${encodeURIComponent(message)}`,

"_blank"

);

    cart = [];

    saveCart();

    updateCartButton();

    loadCart();

    loadProducts();

}

// ======================================
// AUTO LOAD
// ======================================

document.addEventListener("DOMContentLoaded", async () => {

    await loadData();

    Promise.all([
        loadCategories(),
        loadSubCategories(),
        loadProducts(),
        loadCart()
    ]);

    updateCartButton();

    initSearch();

});

// ======================================
// PAGE REFRESH
// ======================================

window.addEventListener("pageshow",()=>{

    cart =
    JSON.parse(localStorage.getItem("cart")) || [];

    updateCartButton();

    if(document.getElementById("productList")){

        loadProducts();

    }

    if(document.getElementById("cartList")){

        loadCart();

    }

});

// ======================================
// IMAGE ZOOM
// ======================================

function openImage(src){

    document.getElementById("zoomImage").src = src;

    document
    .getElementById("imageModal")
    .classList.add("show");

}

function closeImage(){

    document
    .getElementById("imageModal")
    .classList.remove("show");

}