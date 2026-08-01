// ===========================================
// JYOTI GRUH UDHYOG
// API.JS V3
// PART 1
// ===========================================

// ---------- CART ----------

let cart = JSON.parse(localStorage.getItem("cart")) || [];

function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
}

// ---------- GOOGLE SHEET ----------

const SHEET_ID = "2PACX-1vStfoYZJzDES0lAav3gzVi4hHMrr-g-vu6oHbAecwVN7-j5ZfyZCE4wy5qE8oaH0fSw14Y97pHMmUrU";

const categoryURL =
`https://docs.google.com/spreadsheets/d/e/${SHEET_ID}/pub?gid=2013716827&single=true&output=csv`;

const subCategoryURL =
`https://docs.google.com/spreadsheets/d/e/${SHEET_ID}/pub?gid=35788410&single=true&output=csv`;

const productURL =
`https://docs.google.com/spreadsheets/d/e/${SHEET_ID}/pub?gid=0&single=true&output=csv`;

// ---------- COMMON ----------

async function fetchCSV(url){

    const response = await fetch(url);

    if(!response.ok){
        throw new Error("CSV Load Failed");
    }

    return await response.text();

}

function csvToArray(csv){

    return csv
        .trim()
        .split("\n")
        .map(r => r.split(","));

}

function getParam(name){

    return new URLSearchParams(location.search).get(name);

}

// ---------- CATEGORY ----------

async function loadCategories(){

    const list =
    document.getElementById("categoryList");

    if(!list) return;

    try{

        const csv = await fetchCSV(categoryURL);

        const rows = csvToArray(csv);

        list.innerHTML="";

        rows.slice(1).forEach(row=>{

            if(row[2].trim().toLowerCase()!="active")
                return;

            list.innerHTML += `
<div class="category-card"
onclick="openCategory('${row[0]}')">

<img src="${row[3]}"
alt="${row[1]}"
loading="lazy"
onerror="this.src='placeholder.png'">

<h3>${row[1]}</h3>

</div>
`;

        });

    }catch(e){

        console.error(e);

    }

}

// ---------- OPEN CATEGORY ----------

async function openCategory(id){

    const csv = await fetchCSV(subCategoryURL);

    const rows = csvToArray(csv);

    const hasSub = rows
    .slice(1)
    .some(r =>

        r[1]==id &&
        r[3].trim().toLowerCase()=="active"

    );

    if(hasSub){

        location.href =
        "category.html?id="+id;

    }else{

        location.href =
        "products.html?category="+id;

    }

}

// ---------- SUB CATEGORY ----------

async function loadSubCategories(){

    const list =
    document.getElementById("subCategoryList");

    if(!list) return;

    const id = getParam("id");

    try{

        const csv = await fetchCSV(subCategoryURL);

        const rows = csvToArray(csv);

        list.innerHTML="";

        rows.slice(1).forEach(row=>{

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

    }catch(e){

        console.error(e);

    }

}
// ===========================================
// PART 2A
// LOAD PRODUCTS + SEARCH
// ===========================================

async function loadProducts(){

    const list = document.getElementById("productList");

    if(!list) return;

    const subId = getParam("sub");
    const categoryId = getParam("category");

    const search =
    (getParam("search") || "").toLowerCase();

    const csv = await fetchCSV(productURL);

    const rows = csvToArray(csv);

    list.innerHTML = "";

    rows.slice(1).forEach(row=>{

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

        // Category Filter

        if(subId){

            if(subCatId!=subId)
                return;

        }else if(categoryId){

            if(catId!=categoryId)
                return;

        }

        // Home Search

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

<!-- Quantity Button Here -->

</div>

</div>

`;

    });

}