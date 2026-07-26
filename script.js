// ================= CSV LINKS =================

const CATEGORY_CSV =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vStfoYZJzDES0lAav3gzVi4hHMrr-g-vu6oHbAecwVN7-j5ZfyZCE4wy5qE8oaH0fSw14Y97pHMmUrU/pub?gid=2013716827&single=true&output=csv";

const SUBCATEGORY_CSV =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vStfoYZJzDES0lAav3gzVi4hHMrr-g-vu6oHbAecwVN7-j5ZfyZCE4wy5qE8oaH0fSw14Y97pHMmUrU/pub?gid=35788410&single=true&output=csv";

const PRODUCT_CSV =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vStfoYZJzDES0lAav3gzVi4hHMrr-g-vu6oHbAecwVN7-j5ZfyZCE4wy5qE8oaH0fSw14Y97pHMmUrU/pub?gid=0&single=true&output=csv";

let cart = [];

document.addEventListener("DOMContentLoaded", () => {
    loadCategories();
});

// ================= CSV PARSER =================

function parseCSV(text) {

    const rows = [];
    let row = [];
    let value = "";
    let insideQuote = false;

    for (let i = 0; i < text.length; i++) {

        const ch = text[i];

        if (ch === '"') {
            insideQuote = !insideQuote;
        }

        else if (ch === "," && !insideQuote) {
            row.push(value.trim());
            value = "";
        }

        else if ((ch === "\n" || ch === "\r") && !insideQuote) {

            if (value !== "" || row.length) {
                row.push(value.trim());
                rows.push(row);
            }

            row = [];
            value = "";
        }

        else {
            value += ch;
        }

    }

    if (value !== "" || row.length) {
        row.push(value.trim());
        rows.push(row);
    }

    return rows;

}

// ================= LOAD CATEGORY =================

async function loadCategories() {

    const container = document.getElementById("categories");

    container.innerHTML = "";

    const response = await fetch(CATEGORY_CSV);

    const csv = await response.text();

    const rows = parseCSV(csv);

    for (let i = 1; i < rows.length; i++) {

        const id = rows[i][0];
        const name = rows[i][1];
        const status = rows[i][2].toLowerCase();

        if (status !== "active") continue;

        container.innerHTML += `
        <div class="category-item">

            <div class="category-card"
                 onclick="toggleCategory('${id}',this)">

                <span>${name}</span>

                <span>▼</span>

            </div>

            <div id="sub-${id}" class="sub-list"></div>

        </div>
        `;
    }

}
// ================= TOGGLE CATEGORY =================

async function toggleCategory(categoryId, card) {

    document.querySelectorAll(".category-card").forEach(item => {
        item.classList.remove("active");
    });

    card.classList.add("active");

    document.querySelectorAll(".sub-list").forEach(list => {
        if (list.id !== "sub-" + categoryId) {
            list.innerHTML = "";
        }
    });

    const container = document.getElementById("sub-" + categoryId);

    if (container.innerHTML.trim() !== "") {
        container.innerHTML = "";
        return;
    }

    const response = await fetch(SUBCATEGORY_CSV);
    const csv = await response.text();

    const rows = parseCSV(csv);

    let html = "";

    for (let i = 1; i < rows.length; i++) {

        const subId = rows[i][0];
        const catId = rows[i][1];
        const subName = rows[i][2];
        const status = rows[i][3].toLowerCase();

        if (status !== "active") continue;

        if (String(catId) !== String(categoryId)) continue;

        html += `
        <div class="subcategory-card"
             onclick="toggleSubCategory('${categoryId}','${subId}',this)">

            <span>${subName}</span>

            <span>▶</span>

        </div>

        <div id="product-${subId}" class="product-list"></div>
        `;
    }

    if (html === "") {

        loadProducts(categoryId, "");

    } else {

        container.innerHTML = html;

    }

}

// ================= TOGGLE SUB CATEGORY =================

function toggleSubCategory(categoryId, subCategoryId, card) {

    document.querySelectorAll(".subcategory-card").forEach(item => {
        item.classList.remove("active");
    });

    card.classList.add("active");

    document.querySelectorAll(".product-list").forEach(list => {

        if (list.id !== "product-" + subCategoryId) {

            list.innerHTML = "";

        }

    });

    const container = document.getElementById("product-" + subCategoryId);

    if (container.innerHTML.trim() !== "") {

        container.innerHTML = "";

        return;

    }

    loadProducts(categoryId, subCategoryId);

}