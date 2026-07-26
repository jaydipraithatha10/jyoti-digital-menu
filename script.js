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
            <div class="category-card"
onclick="loadProducts('${categoryId}','${subId}', this)"
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
                ${subName}
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
document.querySelectorAll(".subcategory-card").forEach(card => {
    card.classList.remove("active");
});

target.classList.add("active");
async function loadProducts(categoryId, subCategoryId, target) {

    let container;

    if (subCategoryId === "") {
        container = target;
    } else {
        container = document.getElementById("product-" + subCategoryId);
    }

    // જો ખુલ્લું હોય તો બંધ કરો
    if (container.innerHTML.trim() !== "") {
        container.innerHTML = "";
        return;
    }

    const response = await fetch(PRODUCT_CSV);
    const csv = await response.text();

    const rows = csv.trim().split("\n");

    let html = "";

    for (let i = 1; i < rows.length; i++) {

        const cols = rows[i].split(",");

        const catId = cols[1].trim();
        const subId = cols[2].trim();
        const product = cols[3].trim();
        const weight = cols[4].trim();
        const price = cols[5].trim();
        const status = cols[6].trim().toLowerCase();

        if (status !== "active") continue;

        // Sub Category હોય તો
        if (subCategoryId !== "") {

            if (subId !== subCategoryId) continue;

        } else {

            // સીધા Category Products
            if (catId !== categoryId) continue;

        }

        html += `
            <div class="product-card">
                <div class="product-name">${product}</div>
                <div class="product-weight">${weight}</div>
                <div class="product-price">₹ ${price}</div>
            </div>
        `;

    }

    if (html === "") {
        html = "<p>No Products Found</p>";
    }

    container.innerHTML = html;

}
html += `
<div class="product-card">

    <div class="product-name">${product}</div>

    <div class="product-weight">${weight}</div>

    <div class="product-price">₹ ${price}</div>

    <div class="qty-box">

        <button onclick="changeQty(this,-1)">-</button>

        <span class="qty">0</span>

        <button onclick="changeQty(this,1)">+</button>

    </div>

    <button class="add-cart-btn"
        onclick="addToCart('${product}','${weight}','${price}',this)">
        Add to Cart
    </button>

</div>
`;
function changeQty(btn,value){

    const qtySpan=btn.parentElement.querySelector(".qty");

    let qty=parseInt(qtySpan.innerText);

    qty+=value;

    if(qty<0) qty=0;

    qtySpan.innerText=qty;

}

function addToCart(product,weight,price,btn){

    const qty=parseInt(
        btn.parentElement.querySelector(".qty").innerText
    );

    if(qty===0){

        alert("Please select quantity");

        return;

    }

    alert(
        qty+" x "+product+
        "\nWeight : "+weight+
        "\nPrice : ₹"+price
    );

    // આગળના સ્ટેપમાં અહીં Cart માં Save કરીશું

}