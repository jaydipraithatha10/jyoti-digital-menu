// ===========================================
// JYOTI GRUH UDHYOG
// API.JS V2
// PART 1
// ===========================================

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
loading="lazy"
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

    const hasSub = rows.slice(1).some(row =>

        row[1] == categoryId &&
        row[3].trim().toLowerCase() == "active"

    );

    if(hasSub){

        location.href =
        "category.html?id=" + categoryId;

    }else{

        location.href =
        "products.html?category=" + categoryId;

    }

}

// ---------- SUB CATEGORY ----------

async function loadSubCategories(){

    const list =
    document.getElementById("subCategoryList");

    if(!list) return;

    const categoryId = getParam("id");

    const csv = await fetchCSV(subCategoryURL);

    const rows = csvToArray(csv);

    list.innerHTML = "";

    rows.slice(1).forEach(row=>{

        if(row[3].trim().toLowerCase()!="active") return;

        if(row[1]!=categoryId) return;

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