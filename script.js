const CATEGORY_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vStfoYZJzDES0lAav3gzVi4hHMrr-g-vu6oHbAecwVN7-j5ZfyZCE4wy5qE8oaH0fSw14Y97pHMmUrU/pub?gid=2013716827&single=true&output=csv";

const SUBCATEGORY_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vStfoYZJzDES0lAav3gzVi4hHMrr-g-vu6oHbAecwVN7-j5ZfyZCE4wy5qE8oaH0fSw14Y97pHMmUrU/pub?gid=35788410&single=true&output=csv";

document.addEventListener("DOMContentLoaded", () => {
    loadCategories();
});

async function loadCategories() {

    const container = document.getElementById("categories");

    container.innerHTML = "<p>Loading...</p>";

    try {

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

            const card = document.createElement("div");
            card.className = "category-card";
            card.innerHTML = `<div class="category-name">${name}</div>`;

            card.onclick = function () {

                document.querySelectorAll("#categories .category-card").forEach(c => {
                    c.classList.remove("active");
                });

                card.classList.add("active");

                loadSubCategories(id);

            };

            container.appendChild(card);

        }

    } catch (e) {

        console.log(e);
        container.innerHTML = "<p>Unable to load categories.</p>";

    }

}

async function loadSubCategories(categoryId) {

    const container = document.getElementById("subcategories");

    container.innerHTML = "<p>Loading...</p>";

    try {

        const response = await fetch(SUBCATEGORY_CSV);
        const csv = await response.text();

        const rows = csv.trim().split("\n");

        container.innerHTML = "";

        for (let i = 1; i < rows.length; i++) {

            const cols = rows[i].split(",");

            const id = cols[0].trim();
            const catId = cols[1].trim();
            const name = cols[2].trim();
            const status = cols[3].trim().toLowerCase();

            if (status !== "active") continue;
            if (catId !== categoryId) continue;

            const card = document.createElement("div");
            card.className = "category-card";
            card.innerHTML = `<div class="category-name">${name}</div>`;

            container.appendChild(card);

        }

    } catch (e) {

        console.log(e);
        container.innerHTML = "<p>Unable to load sub categories.</p>";

    }

}