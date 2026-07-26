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