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

let dataLoaded = false;

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
// LOAD DATA (ONLY ONCE)
// ======================================

async function loadData(){

    if(dataLoaded) return;

    const [catCSV,subCSV,proCSV] =
    await Promise.all([

        fetchCSV(categoryURL),
        fetchCSV(subCategoryURL),
        fetchCSV(productURL)

    ]);

    categoryRows = csvToArray(catCSV);
    subCategoryRows = csvToArray(subCSV);
    productRows = csvToArray(proCSV);

    dataLoaded = true;

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

    const list = document.getElementById("categoryList");

    if(!list) return;

    await loadData();

    const html = [];

    categoryRows.slice(1).forEach(row=>{

        if(row[2].trim().toLowerCase()!="active") return;

        html.push(`

<div class="category-card"
onclick="openCategory('${row[0]}')">

<img src="${row[3]}"
loading="lazy"
onerror="this.src='placeholder.png'">

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

    const hasSub = subCategoryRows.slice(1).some(row=>

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

    await loadData();

    const id = getParam("id");

    const html = [];

    subCategoryRows.slice(1).forEach(row=>{

        if(row[3].trim().toLowerCase()!="active") return;

        if(row[1]!=id) return;

        html.push(`

<div class="category-card"
onclick="location.href='products.html?sub=${row[0]}'">

<img src="${row[4]}"
loading="lazy"
onerror="this.src='placeholder.png'">

<h3>${row[2]}</h3>

</div>

`);

    });

    list.innerHTML = html.join("");

}

// ======================================
// PRODUCTS
// ======================================

async function loadProducts(searchText=""){

    const list =
    document.getElementById("productList");

    if(!list) return;

    await loadData();

    const subId = getParam("sub");
    const categoryId = getParam("category");

    const search =
    (searchText || getParam("search") || "")
    .toLowerCase();

    const html = [];

    let totalProducts = 0;

    productRows.slice(1).forEach(row=>{

        const id = row[0];
        const catId = row[1];
        const subCatId = row[2];
        const product = row[3];
        const weight = row[4];
        const price = Number(row[5]);
        const status = row[6];
        const image = row[7];

        if(status.trim().toLowerCase()!="active") return;

        if(subId && subCatId!=subId) return;

        if(categoryId && !subId && catId!=categoryId) return;

        if(search){

            const keyword =
            (product+" "+weight).toLowerCase();

            if(!keyword.includes(search))
                return;

        }

        totalProducts++;

        const item =
        cart.find(p=>p.id==id);

        const qty =
        item ? item.qty : 0;

        html.push(`

<div class="product-card">

<img src="${image}"
loading="lazy"
onerror="this.src='placeholder.png'">

<h3 class="product-name">
${product}
</h3>

<p class="product-weight">
${weight}
</p>

<h4 class="product-price">
₹${price}
</h4>

<div id="cart-${id}">

${
qty==0 ?

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

`);

    });

    list.innerHTML = html.join("");

    const heading =
    document.querySelector(".section-title");

    if(heading){

        heading.innerHTML =
`🛒 All Products <span style="font-size:16px;color:#888;">(${totalProducts})</span>`;

    }

}