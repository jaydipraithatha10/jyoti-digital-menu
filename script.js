// ================= CONFIG =================

const CATEGORY_CSV =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vStfoYZJzDES0lAav3gzVi4hHMrr-g-vu6oHbAecwVN7-j5ZfyZCE4wy5qE8oaH0fSw14Y97pHMmUrU/pub?gid=2013716827&single=true&output=csv";

const SUBCATEGORY_CSV =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vStfoYZJzDES0lAav3gzVi4hHMrr-g-vu6oHbAecwVN7-j5ZfyZCE4wy5qE8oaH0fSw14Y97pHMmUrU/pub?gid=35788410&single=true&output=csv";

const PRODUCT_CSV =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vStfoYZzDES0lAav3gzVi4hHMrr-g-vu6oHbAecwVN7-j5ZfyZCE4wy5qE8oaH0fSw14Y97pHMmUrU/pub?gid=0&single=true&output=csv";

let cart = [];

let categories = [];
let subcategories = [];
let products = [];

document.addEventListener("DOMContentLoaded", async () => {

    await loadData();

    renderCategories();

    document
        .getElementById("searchInput")
        .addEventListener("input", searchProducts);

});

// ================= CSV =================

function parseCSV(csv){

    return csv
        .trim()
        .split(/\r?\n/)
        .map(r => r.split(",").map(c => c.trim()));

}

async function loadData(){

    const [catRes,subRes,proRes] = await Promise.all([

        fetch(CATEGORY_CSV),
        fetch(SUBCATEGORY_CSV),
        fetch(PRODUCT_CSV)

    ]);

    categories = parseCSV(await catRes.text());

    subcategories = parseCSV(await subRes.text());

    products = parseCSV(await proRes.text());

}