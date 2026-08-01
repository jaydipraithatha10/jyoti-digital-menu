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

onclick="openCategory('${row[0]}')"
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
     onclick="openCategory('${row[0]}')">

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
     decoding="async"
     onerror="this.src='placeholder.png'">

    <h3>${product}</h3>

    <p>${weight}</p>

    <h4>₹${price}</h4>

    <button onclick="addToCart('${id}')">

        🛒 Add To Cart

    </button>

</div>

`;

    });

}


// =========================
// Auto Load Products
// =========================

document.addEventListener("DOMContentLoaded",()=>{

    loadProducts();

});