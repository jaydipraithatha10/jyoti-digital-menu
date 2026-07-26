// ================= CSV LINKS =================

const CATEGORY_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vStfoYZJzDES0lAav3gzVi4hHMrr-g-vu6oHbAecwVN7-j5ZfyZCE4wy5qE8oaH0fSw14Y97pHMmUrU/pub?gid=2013716827&single=true&output=csv";

const SUBCATEGORY_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vStfoYZJzDES0lAav3gzVi4hHMrr-g-vu6oHbAecwVN7-j5ZfyZCE4wy5qE8oaH0fSw14Y97pHMmUrU/pub?gid=35788410&single=true&output=csv";

const PRODUCT_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vStfoYZJzDES0lAav3gzVi4hHMrr-g-vu6oHbAecwVN7-j5ZfyZCE4wy5qE8oaH0fSw14Y97pHMmUrU/pub?gid=0&single=true&output=csv";


// ================= START =================

document.addEventListener("DOMContentLoaded", () => {
    loadCategories();
});


// ================= LOAD CATEGORIES =================

async function loadCategories() {

    const container = document.getElementById("categories");

    container.innerHTML = "";

    const response = await fetch(CATEGORY_CSV);

    const csv = await response.text();

    const rows = csv.trim().split("\n");

    for (let i = 1; i < rows.length; i++) {

        const cols = rows[i].split(",");

        const id = cols[0].trim();

        const name = cols[1].trim();

        const status = cols[2].trim().toLowerCase();

        if (status !== "active") continue;

        const item = document.createElement("div");

        item.className = "category-item";

        item.innerHTML = `
            <div class="category-card">
                ${name}
            </div>

            <div id="sub-${id}" class="sub-list"></div>
        `;

        item.querySelector(".category-card").onclick = function () {
            toggleCategory(id, this);
        };

        container.appendChild(item);

    }

}
// ================= TOGGLE CATEGORY =================

async function toggleCategory(categoryId, card) {

    // બધા Category Active Remove
    document.querySelectorAll(".category-card").forEach(item => {
        item.classList.remove("active");
    });

    // Click થયેલ Category Active
    card.classList.add("active");

    // બીજા બધા ખુલેલા Category બંધ કરો
    document.querySelectorAll(".sub-list").forEach(list => {
        if (list.id !== "sub-" + categoryId) {
            list.innerHTML = "";
        }
    });

    const container = document.getElementById("sub-" + categoryId);

    // જો પહેલેથી ખુલેલું હોય તો બંધ કરો
    if (container.innerHTML.trim() !== "") {
        container.innerHTML = "";
        return;
    }

    const response = await fetch(SUBCATEGORY_CSV);
    const csv = await response.text();

    const rows = csv.trim().split("\n");

    let html = "";

    for (let i = 1; i < rows.length; i++) {

        const cols = rows[i].split(",");

        const subId = cols[0].trim();
        const catId = cols[1].trim();
        const subName = cols[2].trim();
        const status = cols[3].trim().toLowerCase();

        if (status !== "active") continue;
        if (String(catId) !== String(categoryId)) continue;

        html += `
            <div class="subcategory-card"
                 onclick="toggleSubCategory('${categoryId}','${subId}', this)">
                ${subName}
            </div>

            <div id="product-${subId}" class="product-list"></div>
        `;
    }

    container.innerHTML = html;

    // જો Sub Category ન હોય તો સીધા Products બતાવો
    if (html === "") {
        loadProducts(categoryId, "");
    }

}
// ================= TOGGLE SUB CATEGORY =================

function toggleSubCategory(categoryId, subCategoryId, card) {

    // બધા SubCategory Active Remove
    document.querySelectorAll(".subcategory-card").forEach(item => {
        item.classList.remove("active");
    });

    // Click થયેલી SubCategory Active
    card.classList.add("active");

    // બીજા બધા Product List બંધ કરો
    document.querySelectorAll(".product-list").forEach(list => {
        if (list.id !== "product-" + subCategoryId) {
            list.innerHTML = "";
        }
    });

    const container = document.getElementById("product-" + subCategoryId);

    // જો ખુલ્લું હોય તો બંધ કરો
    if (container.innerHTML.trim() !== "") {
        container.innerHTML = "";
        return;
    }

    // Products Load કરો
    loadProducts(categoryId, subCategoryId);

}