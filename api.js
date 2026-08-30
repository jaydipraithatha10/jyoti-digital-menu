/* =========================================================
   JYOTI GRUH UDHYOG
   API.JS V23
   CATEGORY + SUB CATEGORY + PRODUCT + CART
========================================================= */

let cart = JSON.parse(localStorage.getItem("cart") || "[]");

function saveCart(){
    localStorage.setItem("cart", JSON.stringify(cart));
}

/* =========================================================
   DATA
========================================================= */

let categoryRows = [];
let subCategoryRows = [];
let productRows = [];
let productMap = new Map();

let dataLoaded = false;
let cacheTime = 0;

const CACHE_DURATION = 5 * 60 * 1000;
const STORAGE_KEY = "jyoti_data_cache_v24";

/* =========================================================
   GOOGLE SHEET
========================================================= */

const SHEET =
"2PACX-1vStfoYZJzDES0lAav3gzVi4hHMrr-g-vu6oHbAecwVN7-j5ZfyZCE4wy5qE8oaH0fSw14Y97pHMmUrU";

const categoryURL =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vStfoYZJzDES0lAav3gzVi4hHMrr-g-vu6oHbAecwVN7-j5ZfyZCE4wy5qE8oaH0fSw14Y97pHMmUrU/pub?gid=2013716827&single=true&output=csv";

const subCategoryURL =
`https://docs.google.com/spreadsheets/d/e/${SHEET}/pub?gid=35788410&single=true&output=csv`;

const productURL =
`https://docs.google.com/spreadsheets/d/e/${SHEET}/pub?gid=0&single=true&output=csv`;

const categoryGvizURL =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vStfoYZJzDES0lAav3gzVi4hHMrr-g-vu6oHbAecwVN7-j5ZfyZCE4wy5qE8oaH0fSw14Y97pHMmUrU/gviz/tq?tqx=out:csv&gid=2013716827";

/* =========================================================
   HELPERS
========================================================= */

function cleanValue(value){
    return String(value ?? "")
        .replace(/^\uFEFF/, "")
        .trim();
}

function isActive(value){
    const status = cleanValue(value).toLowerCase();

    if(status === "") return true;

    return [
        "active",
        "enable",
        "enabled",
        "yes",
        "true",
        "1",
        "show",
        "visible"
    ].includes(status);
}

function escapeHTML(value){
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function getParam(name){
    return new URLSearchParams(window.location.search).get(name);
}

/* =========================================================
   CSV PARSER
   Handles commas inside quoted cells
========================================================= */

function csvToArray(csv){

    const rows = [];
    let row = [];
    let cell = "";
    let quoted = false;

    for(let i = 0; i < csv.length; i++){

        const ch = csv[i];
        const next = csv[i + 1];

        if(ch === '"' && quoted && next === '"'){
            cell += '"';
            i++;
            continue;
        }

        if(ch === '"'){
            quoted = !quoted;
            continue;
        }

        if(ch === "," && !quoted){
            row.push(cell.trim());
            cell = "";
            continue;
        }

        if((ch === "\n" || ch === "\r") && !quoted){

            if(ch === "\r" && next === "\n") i++;

            row.push(cell.trim());

            if(row.some(v => v !== "")){
                rows.push(row);
            }

            row = [];
            cell = "";
            continue;
        }

        cell += ch;
    }

    if(cell !== "" || row.length){
        row.push(cell.trim());

        if(row.some(v => v !== "")){
            rows.push(row);
        }
    }

    return rows;
}

/* =========================================================
   FETCH CSV
========================================================= */

async function fetchCSV(url){

    const separator = url.includes("?") ? "&" : "?";

    const response = await fetch(
        url + separator + "_=" + Date.now(),
        {
            cache: "no-store",
            credentials: "omit"
        }
    );

    if(!response.ok){
        throw new Error(
            "CSV request failed: " +
            response.status +
            " " +
            response.statusText
        );
    }

    const text = await response.text();

    if(!text || text.trim().length < 2){
        throw new Error("CSV returned empty data");
    }

    return text;
}

/* =========================================================
   CACHE
========================================================= */

function saveCache(){

    try{
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                categoryRows,
                subCategoryRows,
                productRows,
                time: Date.now()
            })
        );
    }
    catch(error){
        console.warn("Cache save error:", error);
    }
}

function loadCache(){

    try{

        const raw = localStorage.getItem(STORAGE_KEY);

        if(!raw) return false;

        const data = JSON.parse(raw);

        if(
            !data.time ||
            Date.now() - data.time > CACHE_DURATION
        ){
            return false;
        }

        categoryRows = Array.isArray(data.categoryRows)
            ? data.categoryRows : [];

        subCategoryRows = Array.isArray(data.subCategoryRows)
            ? data.subCategoryRows : [];

        productRows = Array.isArray(data.productRows)
            ? data.productRows : [];

        buildProductMap();

        dataLoaded = true;
        cacheTime = data.time;

        return true;
    }
    catch(error){
        console.warn("Cache read error:", error);
        localStorage.removeItem(STORAGE_KEY);
        return false;
    }
}

/* =========================================================
   PRODUCT MAP
========================================================= */

function buildProductMap(){

    productMap.clear();

    productRows.slice(1).forEach(row => {

        if(row && row[0]){
            productMap.set(
                cleanValue(row[0]),
                row
            );
        }

    });
}

function getProduct(id){

    if(id === undefined || id === null) return null;

    return productMap.get(cleanValue(id)) || null;
}

/* =========================================================
   LOAD DATA
   Category is loaded independently so product/subcategory
   errors cannot hide the category list.
========================================================= */

async function loadData(){

    if(
        dataLoaded &&
        Date.now() - cacheTime < CACHE_DURATION
    ){
        return;
    }

    /* Use fresh V23 cache only if available */
    if(loadCache()){
        return;
    }

    console.log("Jyoti V23: Loading Google Sheet data...");

    /* CATEGORY - REQUIRED */
    try{

        let catCSV;

        try {
            catCSV = await fetchCSV(categoryURL);
        }
        catch(firstError) {
            console.warn(
                "Published CSV endpoint failed. Trying Google gviz fallback...",
                firstError
            );

            catCSV = await fetchCSV(categoryGvizURL);
        }

        categoryRows = csvToArray(catCSV);

        console.log(
            "Category rows loaded:",
            categoryRows.length,
            categoryRows
        );

        if(categoryRows.length < 2){
            throw new Error("Category CSV contains no category rows");
        }

    }
    catch(error){

        console.error(
            "CATEGORY SHEET ERROR:",
            error
        );

        categoryRows = [];

        throw new Error(
            "Category Sheet could not be loaded"
        );
    }

    /* SUB CATEGORY - OPTIONAL */
    try{

        const subCSV = await fetchCSV(subCategoryURL);

        subCategoryRows = csvToArray(subCSV);

        console.log(
            "Sub-category rows loaded:",
            subCategoryRows.length
        );

    }
    catch(error){

        console.warn(
            "Sub-category Sheet error:",
            error
        );

        subCategoryRows = [];
    }

    /* PRODUCT - OPTIONAL ON HOME PAGE */
    try{

        const proCSV = await fetchCSV(productURL);

        productRows = csvToArray(proCSV);

        buildProductMap();

        console.log(
            "Product rows loaded:",
            productRows.length
        );

    }
    catch(error){

        console.warn(
            "Product Sheet error:",
            error
        );

        productRows = [];
        productMap.clear();
    }

    dataLoaded = true;
    cacheTime = Date.now();

    saveCache();

    console.log("Jyoti V23: Data ready.");
}

/* =========================================================
   CATEGORY LIST
========================================================= */

async function loadCategories(){

    const list = document.getElementById("categoryList");

    if(!list) return;

    const html = [];

    categoryRows.slice(1).forEach(row => {

        if(!row || !row[0]) return;

        const id = cleanValue(row[0]);
        const name = cleanValue(row[1]);
        const status = cleanValue(row[2]);
        const image = cleanValue(row[3]) || "placeholder.webp";

        if(!id || !name) return;

        if(!isActive(status)) return;

        html.push(`
            <div
                class="category-card"
                onclick="openCategory('${escapeHTML(id)}')"
            >
                <img
                    src="${escapeHTML(image)}"
                    alt="${escapeHTML(name)}"
                    loading="lazy"
                    decoding="async"
                    onerror="this.src='placeholder.webp'"
                >

                <h3>${escapeHTML(name)}</h3>
            </div>
        `);
    });

    if(html.length === 0){

        list.innerHTML = `
            <div
                class="empty-search"
                style="grid-column:1/-1;text-align:center;padding:30px;"
            >
                <div class="empty-search-icon">📂</div>
                <h3>Categories Not Found</h3>
                <p>Please check your Google Sheet category data.</p>
            </div>
        `;

        return;
    }

    list.innerHTML = html.join("");

    console.log(
        "Active categories displayed:",
        html.length
    );
}

/* =========================================================
   OPEN CATEGORY
========================================================= */

function openCategory(id){

    const categoryId = cleanValue(id);

    if(!categoryId) return;

    const hasSubCategory =
        subCategoryRows.slice(1).some(row => {

            if(!row || !row[0]) return false;

            const subId = cleanValue(row[0]);
            const parentId = cleanValue(row[1]);
            const status = cleanValue(row[3]);

            return (
                subId &&
                parentId === categoryId &&
                isActive(status)
            );
        });

    if(hasSubCategory){

        location.href =
            "category.html?id=" +
            encodeURIComponent(categoryId);

    }
    else{

        location.href =
            "products.html?category=" +
            encodeURIComponent(categoryId);
    }
}

/* =========================================================
   SUB CATEGORY LIST
========================================================= */

async function loadSubCategories(){

    const list =
        document.getElementById("subCategoryList");

    if(!list) return;

    const categoryId =
        cleanValue(getParam("id"));

    const html = [];

    subCategoryRows.slice(1).forEach(row => {

        if(!row || !row[0]) return;

        const id = cleanValue(row[0]);
        const parentId = cleanValue(row[1]);
        const name = cleanValue(row[2]);
        const status = cleanValue(row[3]);
        const image = cleanValue(row[4]) || "placeholder.webp";

        if(!id || !name) return;

        if(parentId !== categoryId) return;

        if(!isActive(status)) return;

        html.push(`
            <div
                class="category-card"
                onclick="location.href='products.html?sub=${encodeURIComponent(id)}'"
            >
                <img
                    src="${escapeHTML(image)}"
                    alt="${escapeHTML(name)}"
                    loading="lazy"
                    decoding="async"
                    onerror="this.src='placeholder.webp'"
                >

                <h3>${escapeHTML(name)}</h3>
            </div>
        `);
    });

    if(html.length === 0){

        list.innerHTML = `
            <div
                class="empty-search"
                style="grid-column:1/-1;text-align:center;padding:30px;"
            >
                <div class="empty-search-icon">📂</div>
                <h3>No Sub Categories Found</h3>
            </div>
        `;

        return;
    }

    list.innerHTML = html.join("");
}

/* =========================================================
   PRODUCT CARD
========================================================= */

function createProductCard(row){

    const id = cleanValue(row[0]);
    const product = cleanValue(row[3]);
    const weight = cleanValue(row[4]);
    const price = Number(cleanValue(row[5])) || 0;
    const image = cleanValue(row[7]) || "placeholder.webp";

    const cartItem =
        cart.find(item => cleanValue(item.id) === id);

    const qty =
        cartItem ? Number(cartItem.qty) : 0;

    const actionHTML =
        qty <= 0
        ? `
            <button
                class="premium-add-btn"
                onclick="addToCart('${escapeHTML(id)}')"
            >
                <span class="add-symbol">+</span>
                Add
            </button>
        `
        : `
            <div class="premium-quantity">

                <button
                    class="premium-qty-btn"
                    onclick="changeQty('${escapeHTML(id)}',-1)"
                >
                    −
                </button>

                <span class="premium-qty-number">
                    ${qty}
                </span>

                <button
                    class="premium-qty-btn"
                    onclick="changeQty('${escapeHTML(id)}',1)"
                >
                    +
                </button>

            </div>
        `;

    return `
        <article class="product-card premium-product-card">

            <div class="product-image-wrap">

                <img
                    class="group-product-image"
                    src="${escapeHTML(image)}"
                    alt="${escapeHTML(product)}"
                    loading="lazy"
                    decoding="async"
                    onclick="openImage('${escapeHTML(image)}')"
                    onerror="this.src='placeholder.webp'"
                >

            </div>

            <div class="product-info">

                <div class="product-category-label">
                    JYOTI GRUH UDHYOG
                </div>

                <h3 class="grouped-product-name">
                    ${escapeHTML(product)}
                </h3>

                <div class="product-meta">

                    <span class="product-weight">
                        ${escapeHTML(weight)}
                    </span>

                    <span class="product-dot">•</span>

                    <span class="product-price">
                        ₹${price}
                    </span>

                </div>

                <div
                    class="product-action"
                    id="cart-${escapeHTML(id)}"
                >
                    ${actionHTML}
                </div>

            </div>

        </article>
    `;
}

/* =========================================================
   PRODUCTS
========================================================= */

async function loadProducts(searchText = ""){

    const list =
        document.getElementById("productList");

    if(!list) return;

    const subId = getParam("sub");
    const categoryId = getParam("category");
    const urlSearch = getParam("search");

    const search =
        String(
            searchText || urlSearch || ""
        ).trim().toLowerCase();

    const html = [];
    let totalProducts = 0;

    productRows.slice(1).forEach(row => {

        if(!row || !row[0]) return;

        const id = cleanValue(row[0]);
        const categoryIdRow = cleanValue(row[1]);
        const subCategoryIdRow = cleanValue(row[2]);
        const product = cleanValue(row[3]);
        const weight = cleanValue(row[4]);
        const status = cleanValue(row[6]);

        if(!isActive(status)) return;

        if(
            subId &&
            subCategoryIdRow !== cleanValue(subId)
        ){
            return;
        }

        if(
            categoryId &&
            !subId &&
            categoryIdRow !== cleanValue(categoryId)
        ){
            return;
        }

        if(search){

            const searchable =
                (product + " " + weight)
                .toLowerCase();

            if(!searchable.includes(search)){
                return;
            }
        }

        totalProducts++;

        html.push(
            createProductCard(row)
        );
    });

    list.innerHTML =
        html.length
        ? html.join("")
        : `
            <div class="empty-search">
                <div class="empty-search-icon">🔍</div>
                <h3>No Products Found</h3>
                <p>Try another product name.</p>
            </div>
        `;

    const heading =
        document.querySelector(".section-title");

    if(heading){

        heading.innerHTML = `
            🛍️ All Products
            <span class="product-count">
                ${totalProducts}
            </span>
        `;
    }
}

/* =========================================================
   SEARCH
========================================================= */

function initSearch(){

    const searchBox =
        document.getElementById("searchBox");

    if(!searchBox) return;

    let timer;

    searchBox.addEventListener(
        "input",
        function(){

            const text =
                this.value.trim();

            clearTimeout(timer);

            timer = setTimeout(() => {

                const productList =
                    document.getElementById("productList");

                const categoryList =
                    document.getElementById("categoryList");

                if(productList){

                    loadProducts(text);

                }
                else if(
                    categoryList &&
                    text.length >= 2
                ){

                    location.href =
                        "products.html?search=" +
                        encodeURIComponent(text);
                }

            }, 200);
        }
    );
}

/* =========================================================
   CART
========================================================= */

function addToCart(id){

    const cleanId = cleanValue(id);

    const item =
        cart.find(
            p => cleanValue(p.id) === cleanId
        );

    if(item){
        item.qty = Number(item.qty || 0) + 1;
    }
    else{
        cart.push({
            id: cleanId,
            qty: 1
        });
    }

    saveCart();
    updateCartButton();
    updateProductAction(cleanId);
}

function updateProductAction(id){

    const cleanId = cleanValue(id);

    const container =
        document.getElementById(
            `cart-${cleanId}`
        );

    if(!container) return;

    const item =
        cart.find(
            p => cleanValue(p.id) === cleanId
        );

    const qty =
        item ? Number(item.qty) : 0;

    if(qty <= 0){

        container.innerHTML = `
            <button
                class="premium-add-btn"
                onclick="addToCart('${escapeHTML(cleanId)}')"
            >
                <span class="add-symbol">+</span>
                Add
            </button>
        `;

        return;
    }

    container.innerHTML = `
        <div class="premium-quantity">

            <button
                class="premium-qty-btn"
                onclick="changeQty('${escapeHTML(cleanId)}',-1)"
            >
                −
            </button>

            <span class="premium-qty-number">
                ${qty}
            </span>

            <button
                class="premium-qty-btn"
                onclick="changeQty('${escapeHTML(cleanId)}',1)"
            >
                +
            </button>

        </div>
    `;
}

function changeQty(id, change){

    const cleanId = cleanValue(id);

    const item =
        cart.find(
            p => cleanValue(p.id) === cleanId
        );

    if(!item){

        if(Number(change) > 0){

            cart.push({
                id: cleanId,
                qty: 1
            });
        }

    }
    else{

        item.qty =
            Number(item.qty || 0) +
            Number(change);

        if(item.qty <= 0){

            cart =
                cart.filter(
                    p =>
                    cleanValue(p.id) !== cleanId
                );
        }
    }

    saveCart();
    updateCartButton();
    updateProductAction(cleanId);
    loadCart();
}

function removeCartItem(id){

    const cleanId = cleanValue(id);

    cart =
        cart.filter(
            item =>
            cleanValue(item.id) !== cleanId
        );

    saveCart();
    updateCartButton();

    loadProducts();
    loadCart();
}

/* =========================================================
   FLOATING CART
========================================================= */

function updateCartButton(){

    const button =
        document.getElementById("viewCartBtn");

    const count =
        document.getElementById("cartCount");

    if(!button || !count) return;

    const total =
        cart.reduce(
            (sum, item) =>
                sum + Number(item.qty || 0),
            0
        );

    if(total <= 0){

        button.style.display = "none";
        count.textContent = "0";

    }
    else{

        button.style.display = "flex";
        count.textContent = total;

    }
}

/* =========================================================
   CART PAGE
========================================================= */

async function loadCart(){

    const list =
        document.getElementById("cartList");

    if(!list) return;

    if(cart.length === 0){

        list.innerHTML = `
            <div class="empty-cart">

                <div class="empty-cart-icon">
                    🛒
                </div>

                <h2>
                    Your Cart is Empty
                </h2>

                <p>
                    Add your favourite products to continue.
                </p>

            </div>
        `;

        updateCartButton();
        return;
    }

    let html = [];
    let grandTotal = 0;

    cart.forEach(item => {

        const row =
            getProduct(item.id);

        if(!row) return;

        const product = cleanValue(row[3]);
        const weight = cleanValue(row[4]);
        const price = Number(cleanValue(row[5])) || 0;
        const image = cleanValue(row[7]) || "placeholder.webp";
        const qty = Number(item.qty) || 0;

        const total = price * qty;

        grandTotal += total;

        html.push(`
            <div class="cart-item">

                <img
                    src="${escapeHTML(image)}"
                    alt="${escapeHTML(product)}"
                    loading="lazy"
                    onerror="this.src='placeholder.webp'"
                >

                <div class="cart-info">

                    <h3>
                        ${escapeHTML(product)}
                    </h3>

                    <p>
                        ${escapeHTML(weight)}
                    </p>

                    <div class="cart-price">
                        ₹${price} × ${qty} = ₹${total}
                    </div>

                    <div class="qty-box">

                        <button
                            class="qty-btn"
                            onclick="changeQty('${escapeHTML(item.id)}',-1)"
                        >
                            −
                        </button>

                        <span class="qty-number">
                            ${qty}
                        </span>

                        <button
                            class="qty-btn"
                            onclick="changeQty('${escapeHTML(item.id)}',1)"
                        >
                            +
                        </button>

                    </div>

                    <button
                        class="remove-btn"
                        onclick="removeCartItem('${escapeHTML(item.id)}')"
                    >
                        🗑 Remove
                    </button>

                </div>
            </div>
        `);
    });

    html.push(`
        <div class="cart-total">

            <h2>
                Grand Total
            </h2>

            <div class="total-price">
                ₹${grandTotal}
            </div>

            <button
                class="whatsapp-btn"
                onclick="orderWhatsApp()"
            >
                📲 Order on WhatsApp
            </button>

        </div>
    `);

    list.innerHTML = html.join("");

    updateCartButton();
}

/* =========================================================
   WHATSAPP ORDER
========================================================= */

async function orderWhatsApp(){

    await loadData();

    if(cart.length === 0) return;

    let grandTotal = 0;

    let message =
`🛒 *Jyoti Gruh Udhyog*

નવો ઓર્ડર

`;

    cart.forEach(item => {

        const row =
            getProduct(item.id);

        if(!row) return;

        const product = cleanValue(row[3]);
        const weight = cleanValue(row[4]);
        const price = Number(cleanValue(row[5])) || 0;
        const qty = Number(item.qty) || 0;
        const total = price * qty;

        grandTotal += total;

        message +=
`📦 ${product}
⚖️ ${weight}
💰 ₹${price} × ${qty} = ₹${total}

`;
    });

    message +=
`💵 *Total: ₹${grandTotal}*

🙏 આભાર`;

    const whatsappURL =
        `https://wa.me/919712149344?text=` +
        encodeURIComponent(message);

    window.open(
        whatsappURL,
        "_blank"
    );

    cart = [];

    saveCart();
    updateCartButton();
    loadCart();
    loadProducts();
}

/* =========================================================
   IMAGE ZOOM
========================================================= */

function openImage(src){

    const modal =
        document.getElementById("imageModal");

    const image =
        document.getElementById("zoomImage");

    if(!modal || !image) return;

    image.src = src;

    modal.classList.add("show");
}

function closeImage(){

    const modal =
        document.getElementById("imageModal");

    if(!modal) return;

    modal.classList.remove("show");
}

document.addEventListener(
    "keydown",
    event => {

        if(event.key === "Escape"){
            closeImage();
        }

    }
);

/* =========================================================
   V24 CACHE RESET
========================================================= */

try {
    localStorage.removeItem("jyoti_data_cache_v23");
    localStorage.removeItem("jyoti_data_cache_v22");
} catch(error) {
    console.warn("Old cache cleanup failed:", error);
}

/* =========================================================
   INITIALIZE
========================================================= */

async function initializePage(){

    console.log(
        "Jyoti Gruh Udhyog API V24 starting..."
    );

    try{

        await loadData();

        /* Category is always rendered if categoryList exists */
        await loadCategories();

        /* These functions safely do nothing on pages
           where their containers do not exist */
        await loadSubCategories();
        await loadProducts();
        await loadCart();

        updateCartButton();
        initSearch();

        console.log(
            "Jyoti Gruh Udhyog API V24 READY"
        );

    }
    catch(error){

        console.error(
            "Jyoti Gruh Udhyog V24 ERROR:",
            error
        );

        const categoryList =
            document.getElementById("categoryList");

        if(categoryList){

            categoryList.innerHTML = `
                <div
                    style="
                        grid-column:1/-1;
                        text-align:center;
                        padding:30px;
                    "
                >

                    <div
                        style="font-size:45px;"
                    >
                        ⚠️
                    </div>

                    <h3>
                        Categories Could Not Be Loaded
                    </h3>

                    <p>
                        Google Sheet connection failed.
                    </p>

                </div>
            `;
        }

        const productList =
            document.getElementById("productList");

        if(productList){

            productList.innerHTML = `
                <div class="empty-search">

                    <div class="empty-search-icon">
                        ⚠️
                    </div>

                    <h3>
                        Products Could Not Be Loaded
                    </h3>

                    <p>
                        Please refresh the page.
                    </p>

                </div>
            `;
        }
    }
}

/* =========================================================
   DOM READY
========================================================= */

if(document.readyState === "loading"){

    document.addEventListener(
        "DOMContentLoaded",
        initializePage
    );

}
else{

    initializePage();

}

/* =========================================================
   PAGE SHOW
========================================================= */

window.addEventListener(
    "pageshow",
    () => {

        cart =
            JSON.parse(
                localStorage.getItem("cart") || "[]"
            );

        updateCartButton();

        if(
            document.getElementById("productList")
        ){
            loadProducts();
        }

        if(
            document.getElementById("cartList")
        ){
            loadCart();
        }

    }
);
