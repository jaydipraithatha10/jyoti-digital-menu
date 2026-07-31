// =========================
// Google Sheet URL
// =========================

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

<div class="category-card"
onclick="location.href='category.html?id=${row[0]}'">

    <img src="${row[3]}" alt="${row[1]}">

    <h3>${row[1]}</h3>

</div>

`;

    });

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

<img src="${row[4]}"
loading="lazy"
decoding="async">

<h3>${row[2]}</h3>

</div>

`;

    });

}

document.addEventListener("DOMContentLoaded",()=>{

    loadSubCategories();

});