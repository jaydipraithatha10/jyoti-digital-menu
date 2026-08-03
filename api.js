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