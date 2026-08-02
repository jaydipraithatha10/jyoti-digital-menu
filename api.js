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