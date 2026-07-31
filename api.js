
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