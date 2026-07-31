// ================= CONFIG =================

const productCache = {};
let cart = [];

let categories = [];
let subcategories = [];
let products = [];

const CATEGORY_CSV =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vStfoYZJzDES0lAav3gzVi4hHMrr-g-vu6oHbAecwVN7-j5ZfyZCE4wy5qE8oaH0fSw14Y97pHMmUrU/pub?gid=2013716827&single=true&output=csv";

const SUBCATEGORY_CSV =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vStfoYZJzDES0lAav3gzVi4hHMrr-g-vu6oHbAecwVN7-j5ZfyZCE4wy5qE8oaH0fSw14Y97pHMmUrU/pub?gid=35788410&single=true&output=csv";

const PRODUCT_CSV =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vStfoYZJzDES0lAav3gzVi4hHMrr-g-vu6oHbAecwVN7-j5ZfyZCE4wy5qE8oaH0fSw14Y97pHMmUrU/pub?gid=0&single=true&output=csv";

// ================= START =================

document.addEventListener("DOMContentLoaded", async () => {

    await loadData();

    renderCategories();

    const searchInput = document.getElementById("searchInput");

    let timer;

    searchInput.addEventListener("input", () => {

        clearTimeout(timer);

        timer = setTimeout(searchProducts, 250);

    });

});

// ================= CSV =================

function parseCSV(csv){

    return csv
        .trim()
        .split(/\r?\n/)
        .map(row => row.split(",").map(col => col.trim()));

}

async function loadData(){

    const [catRes, subRes, proRes] = await Promise.all([

        fetch(CATEGORY_CSV),
        fetch(SUBCATEGORY_CSV),
        fetch(PRODUCT_CSV)

    ]);

    categories = parseCSV(await catRes.text());
    subcategories = parseCSV(await subRes.text());
    products = parseCSV(await proRes.text());

    // Image preload
    products.slice(1).forEach(p => {

        if (p[7]) {

            const img = new Image();
            img.src = p[7];

        }

    });

}