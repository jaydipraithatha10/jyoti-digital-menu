const CATEGORY_CSV =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vStfoYZJzDES0lAav3gzVi4hHMrr-g-vu6oHbAecwVN7-j5ZfyZCE4wy5qE8oaH0fSw14Y97pHMmUrU/pub?gid=2013716827&single=true&output=csv";

async function loadCategories() {

    const response = await fetch(CATEGORY_CSV);
    const csv = await response.text();

    const rows = csv.trim().split("\n");

    const container = document.getElementById("categories");
    container.innerHTML = "";

    for (let i = 1; i < rows.length; i++) {

        const cols = rows[i].split(",");

        const id = cols[0].trim();
        const name = cols[1].trim();

        const card = document.createElement("div");
        card.className = "category-card";
        card.dataset.id = id;

        card.innerHTML = `
            <div class="category-name">${name}</div>
        `;

        card.onclick = () => {
            document.querySelectorAll(".category-card").forEach(c => c.classList.remove("active"));
            card.classList.add("active");

            console.log("Selected Category:", id, name);

            // આગળ અહીં Products Load કરવાના છે
        };

        container.appendChild(card);
    }
}

document.addEventListener("DOMContentLoaded", loadCategories);