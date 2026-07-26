const CATEGORY_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vStfoYZJzDES0lAav3gzVi4hHMrr-g-vu6oHbAecwVN7-j5ZfyZCE4wy5qE8oaH0fSw14Y97pHMmUrU/pub?gid=2013716827&single=true&output=csv";

const SUBCATEGORY_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vStfoYZJzDES0lAav3gzVi4hHMrr-g-vu6oHbAecwVN7-j5ZfyZCE4wy5qE8oaH0fSw14Y97pHMmUrU/pub?gid=35788410&single=true&output=csv";

const PRODUCT_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vStfoYZJzDES0lAav3gzVi4hHMrr-g-vu6oHbAecwVN7-j5ZfyZCE4wy5qE8oaH0fSw14Y97pHMmUrU/pub?gid=0&single=true&output=csv";

document.addEventListener("DOMContentLoaded", () => {
    loadCategories();
});

async function loadCategories() {

    const container = document.getElementById("categories");

    const response = await fetch(CATEGORY_CSV);
    const csv = await response.text();

    const rows = csv.trim().split("\n");

    container.innerHTML = "";

    for (let i = 1; i < rows.length; i++) {

        const cols = rows[i].split(",");

        const id = cols[0].trim();
        const name = cols[1].trim();
        const status = cols[2].trim().toLowerCase();

        if (status !== "active") continue;

        const item = document.createElement("div");

        item.className = "category-item";

        item.innerHTML = `
            <div class="category-card" onclick="toggleCategory('${id}', this)">
                ${name}
            </div>

            <div id="sub-${id}" class="sub-list"></div>
        `;

        container.appendChild(item);

    }

}
async function toggleCategory(categoryId, element) {

    // બીજા બધા ખુલેલા Category બંધ કરો
    document.querySelectorAll(".sub-list").forEach(div => {
        if (div.id !== "sub-" + categoryId) {
            div.innerHTML = "";
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
        if (catId !== categoryId) continue;

        html += `
            <div class="subcategory-card"
                 onclick="loadProducts('${categoryId}','${subId}', this)">
                ▶ ${subName}
            </div>

            <div id="product-${subId}" class="product-list"></div>
        `;
    }

    container.innerHTML = html;

    // જો Sub Category ન હોય તો સીધા Products બતાવો
    if (html === "") {
        loadProducts(categoryId, "", container);
    }

}