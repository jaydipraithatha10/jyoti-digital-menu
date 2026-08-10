// ==========================================
// JYOTI GRUH UDHYOG
// API.JS V6
// ==========================================


// ==========================================
// CART
// ==========================================

let cart = JSON.parse(localStorage.getItem("cart")) || [];

function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
}


// ==========================================
// DATA
// ==========================================

let categoryRows = [];
let subCategoryRows = [];
let productRows = [];

let productMap = new Map();


// ==========================================
// GOOGLE SHEET
// ==========================================

const SHEET =
"2PACX-1vStfoYZJzDES0lAav3gzVi4hHMrr-g-vu6oHbAecwVN7-j5ZfyZCE4wy5qE8oaH0fSw14Y97pHMmUrU";


const categoryURL =
`https://docs.google.com/spreadsheets/d/e/${SHEET}/pub?gid=2013716827&single=true&output=csv`;

const subCategoryURL =
`https://docs.google.com/spreadsheets/d/e/${SHEET}/pub?gid=35788410&single=true&output=csv`;

const productURL =
`https://docs.google.com/spreadsheets/d/e/${SHEET}/pub?gid=0&single=true&output=csv`;


// ==========================================
// CSV PARSER
// ==========================================

function csvToArray(csv) {

    const lines = csv
        .trim()
        .split(/\r?\n/);

    return lines.map(line => {

        const result = [];
        let current = "";
        let insideQuotes = false;

        for (let i = 0; i < line.length; i++) {

            const char = line[i];

            if (char === '"') {

                if (
                    insideQuotes &&
                    line[i + 1] === '"'
                ) {

                    current += '"';
                    i++;

                } else {

                    insideQuotes =
                        !insideQuotes;

                }

            }
            else if (
                char === "," &&
                !insideQuotes
            ) {

                result.push(
                    current.trim()
                );

                current = "";

            }
            else {

                current += char;

            }

        }

        result.push(
            current.trim()
        );

        return result;

    });

}


// ==========================================
// FETCH CSV
// ==========================================

async function fetchCSV(url) {

    const response =
        await fetch(
            url + "&v=" + Date.now(),
            {
                cache: "no-store"
            }
        );

    if (!response.ok) {

        throw new Error(
            "CSV Load Failed"
        );

    }

    return await response.text();

}


// ==========================================
// BUILD PRODUCT MAP
// ==========================================

function buildProductMap() {

    productMap.clear();

    productRows
        .slice(1)
        .forEach(row => {

            if (row[0]) {

                productMap.set(
                    String(row[0]),
                    row
                );

            }

        });

}


// ==========================================
// GET PRODUCT
// ==========================================

function getProduct(id) {

    return productMap.get(
        String(id)
    );

}


// ==========================================
// URL PARAMETER
// ==========================================

function getParam(name) {

    return new URLSearchParams(
        window.location.search
    ).get(name);

}


// ==========================================
// LOAD DATA
// ==========================================

async function loadData() {

    try {

        const data =
            await Promise.all([

                fetchCSV(
                    categoryURL
                ),

                fetchCSV(
                    subCategoryURL
                ),

                fetchCSV(
                    productURL
                )

            ]);


        categoryRows =
            csvToArray(
                data[0]
            );

        subCategoryRows =
            csvToArray(
                data[1]
            );

        productRows =
            csvToArray(
                data[2]
            );


        buildProductMap();


        console.log(
            "CATEGORY:",
            categoryRows.length
        );

        console.log(
            "SUBCATEGORY:",
            subCategoryRows.length
        );

        console.log(
            "PRODUCTS:",
            productRows.length
        );


    }
    catch (error) {

        console.error(
            "DATA LOAD ERROR:",
            error
        );

    }

}


// ==========================================
// LOAD CATEGORIES
// ==========================================

function loadCategories() {

    const list =
        document.getElementById(
            "categoryList"
        );

    if (!list) return;


    let html = "";


    categoryRows
        .slice(1)
        .forEach(row => {

            const id =
                row[0];

            const name =
                row[1];

            const status =
                row[2];

            const image =
                row[3];


            if (
                String(status)
                    .trim()
                    .toLowerCase()
                !== "active"
            ) {

                return;

            }


            html += `

<div
    class="category-card"
    onclick="openCategory('${id}')"
>

<img
    src="${image || "placeholder.webp"}"
    alt="${name}"
    loading="lazy"
    onerror="this.src='placeholder.webp'"
>

<h3>
    ${name}
</h3>

</div>

`;

        });


    list.innerHTML =
        html;

}


// ==========================================
// OPEN CATEGORY
// ==========================================

function openCategory(id) {

    const hasSubCategory =
        subCategoryRows
            .slice(1)
            .some(row => {

                return (
                    String(row[1]) ===
                    String(id)
                    &&
                    String(row[3])
                        .trim()
                        .toLowerCase()
                    === "active"
                );

            });


    if (hasSubCategory) {

        window.location.href =
            "category.html?id=" +
            encodeURIComponent(id);

    }
    else {

        window.location.href =
            "products.html?category=" +
            encodeURIComponent(id);

    }

}


// ==========================================
// LOAD SUB CATEGORIES
// ==========================================

function loadSubCategories() {

    const list =
        document.getElementById(
            "subCategoryList"
        );

    if (!list) return;


    const categoryId =
        getParam("id");


    let html = "";


    subCategoryRows
        .slice(1)
        .forEach(row => {

            const id =
                row[0];

            const parentId =
                row[1];

            const name =
                row[2];

            const status =
                row[3];

            const image =
                row[4];


            if (
                String(parentId) !==
                String(categoryId)
            ) {

                return;

            }


            if (
                String(status)
                    .trim()
                    .toLowerCase()
                !== "active"
            ) {

                return;

            }


            html += `

<div
    class="category-card"
    onclick="window.location.href='products.html?sub=${encodeURIComponent(id)}'"
>

<img
    src="${image || "placeholder.webp"}"
    alt="${name}"
    loading="lazy"
    onerror="this.src='placeholder.webp'"
>

<h3>
    ${name}
</h3>

</div>

`;

        });


    list.innerHTML =
        html;

}


// ==========================================
// LOAD PRODUCTS
// ==========================================

function loadProducts(searchText = "") {

    const list =
        document.getElementById(
            "productList"
        );

    if (!list) return;


    const categoryId =
        getParam("category");

    const subId =
        getParam("sub");

    const urlSearch =
        getParam("search") || "";


    const search =
        (
            searchText ||
            urlSearch
        )
        .trim()
        .toLowerCase();


    const grouped =
        new Map();


    // ======================================
    // READ PRODUCTS
    // ======================================

    productRows
        .slice(1)
        .forEach(row => {

            /*
                A = ID
                B = CategoryID
                C = SubCategoryID
                D = Product
                E = Weight
                F = Price
                G = Status
                H = Images
            */


            const id =
                row[0];

            const category =
                row[1];

            const subCategory =
                row[2];

            const name =
                row[3];

            const weight =
                row[4];

            const price =
                Number(
                    String(row[5])
                        .replace(/[^\d.]/g, "")
                ) || 0;

            const status =
                row[6];

            const image =
                row[7];


            // ACTIVE ONLY

            if (
                String(status)
                    .trim()
                    .toLowerCase()
                !== "active"
            ) {

                return;

            }


            // CATEGORY FILTER

            if (
                categoryId &&
                !subId &&
                String(category) !==
                String(categoryId)
            ) {

                return;

            }


            // SUB CATEGORY FILTER

            if (
                subId &&
                String(subCategory) !==
                String(subId)
            ) {

                return;

            }


            // SEARCH

            if (search) {

                const text =
                    (
                        name +
                        " " +
                        weight
                    )
                    .toLowerCase();


                if (
                    !text.includes(
                        search
                    )
                ) {

                    return;

                }

            }


            // GROUP BY PRODUCT NAME

            const key =
                String(name)
                    .trim()
                    .toLowerCase();


            if (
                !grouped.has(key)
            ) {

                grouped.set(
                    key,
                    {
                        name: name,
                        image: image,
                        variants: []
                    }
                );

            }


            grouped
                .get(key)
                .variants
                .push({

                    id: id,
                    weight: weight,
                    price: price

                });

        });


    // ======================================
    // CREATE PRODUCT CARDS
    // ======================================

    let html = "";


    grouped.forEach(product => {


        let variants = "";


        product.variants
            .forEach(variant => {


                const cartItem =
                    cart.find(
                        item =>
                            String(item.id) ===
                            String(variant.id)
                    );


                const qty =
                    cartItem
                        ? cartItem.qty
                        : 0;


                let button = "";


                if (qty === 0) {

                    button = `

<button
    class="variant-add-btn"
    type="button"
    onclick="addToCart('${variant.id}')"
>
    + Add
</button>

`;

                }
                else {

                    button = `

<div class="variant-qty">

<button
    class="qty-btn"
    type="button"
    onclick="changeQty('${variant.id}',-1)"
>
    −
</button>

<span class="qty-number">
    ${qty}
</span>

<button
    class="qty-btn"
    type="button"
    onclick="changeQty('${variant.id}',1)"
>
    +
</button>

</div>

`;

                }


                variants += `

<div class="product-variant-row">

<div class="product-variant-weight">
    ${variant.weight}
</div>

<div class="product-variant-price">
    ₹${variant.price}
</div>

<div class="product-variant-action">

    ${button}

</div>

</div>

`;

            });


        html += `

<div class="product-card">

<img
    src="${product.image || "placeholder.webp"}"
    alt="${product.name}"
    loading="lazy"
    decoding="async"
    onclick="openImage('${product.image || "placeholder.webp"}')"
    onerror="this.src='placeholder.webp'"
>

<h3 class="product-name">
    ${product.name}
</h3>

<div class="product-variants">

    ${variants}

</div>

</div>

`;

    });


    list.innerHTML =
        html;


    // ======================================
    // PRODUCT COUNT
    // ======================================

    const heading =
        document.querySelector(
            ".section-title"
        );


    if (heading) {

        heading.innerHTML =
            `🛒 All Products <span style="font-size:16px;color:#888">(${grouped.size})</span>`;

    }


    console.log(
        "PRODUCT CARDS:",
        grouped.size
    );

}


// ==========================================
// SEARCH
// ==========================================

function initSearch() {

    const input =
        document.getElementById(
            "searchBox"
        );

    if (!input) return;


    let timer;


    input.addEventListener(
        "input",
        function () {

            clearTimeout(
                timer
            );


            timer =
                setTimeout(() => {

                    const text =
                        this.value.trim();


                    if (
                        document.getElementById(
                            "productList"
                        )
                    ) {

                        loadProducts(
                            text
                        );

                    }
                    else if (
                        text.length >= 2
                    ) {

                        window.location.href =
                            "products.html?search=" +
                            encodeURIComponent(
                                text
                            );

                    }

                }, 200);

        }
    );

}


// ==========================================
// ADD CART
// ==========================================

function addToCart(id) {

    const item =
        cart.find(
            p =>
                String(p.id) ===
                String(id)
        );


    if (item) {

        item.qty++;

    }
    else {

        cart.push({
            id: String(id),
            qty: 1
        });

    }


    saveCart();

    updateCartButton();

    loadProducts();

}


// ==========================================
// CHANGE QTY
// ==========================================

function changeQty(
    id,
    change
) {

    const item =
        cart.find(
            p =>
                String(p.id) ===
                String(id)
        );


    if (!item) return;


    item.qty += change;


    if (item.qty <= 0) {

        cart =
            cart.filter(
                p =>
                    String(p.id) !==
                    String(id)
            );

    }


    saveCart();

    updateCartButton();

    loadProducts();

    loadCart();

}


// ==========================================
// REMOVE CART
// ==========================================

function removeCartItem(id) {

    cart =
        cart.filter(
            item =>
                String(item.id) !==
                String(id)
        );


    saveCart();

    updateCartButton();

    loadCart();

    loadProducts();

}


// ==========================================
// CART BUTTON
// ==========================================

function updateCartButton() {

    const button =
        document.getElementById(
            "viewCartBtn"
        );

    const count =
        document.getElementById(
            "cartCount"
        );


    if (!button || !count)
        return;


    const total =
        cart.reduce(
            (sum, item) =>
                sum + Number(item.qty || 0),
            0
        );


    if (total <= 0) {

        button.style.display =
            "none";

        count.textContent =
            "0";

    }
    else {

        button.style.display =
            "flex";

        count.textContent =
            total;

    }

}


// ==========================================
// LOAD CART
// ==========================================

function loadCart() {

    const list =
        document.getElementById(
            "cartList"
        );

    if (!list) return;


    if (cart.length === 0) {

        list.innerHTML = `

<div class="empty-cart">

<h2>
    🛒 Your Cart is Empty
</h2>

<p>
    Please add products.
</p>

</div>

`;

        updateCartButton();

        return;

    }


    let html = "";

    let grandTotal = 0;


    cart.forEach(item => {

        const row =
            getProduct(
                item.id
            );


        if (!row) return;


        const name =
            row[3];

        const weight =
            row[4];

        const price =
            Number(
                String(row[5])
                    .replace(/[^\d.]/g, "")
            ) || 0;

        const image =
            row[7];


        const total =
            price *
            item.qty;


        grandTotal +=
            total;


        html += `

<div class="cart-item">

<img
    src="${image || "placeholder.webp"}"
    alt="${name}"
    onerror="this.src='placeholder.webp'"
>

<div class="cart-info">

<h3>
    ${name}
</h3>

<p>
    ${weight}
</p>

<div class="cart-price">
    ₹${price} × ${item.qty}
    = ₹${total}
</div>

<div class="qty-box">

<button
    class="qty-btn"
    onclick="changeQty('${item.id}',-1)"
>
    −
</button>

<span class="qty-number">
    ${item.qty}
</span>

<button
    class="qty-btn"
    onclick="changeQty('${item.id}',1)"
>
    +
</button>

</div>

<button
    class="remove-btn"
    onclick="removeCartItem('${item.id}')"
>
    🗑 Remove
</button>

</div>

</div>

`;

    });


    html += `

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

`;


    list.innerHTML =
        html;


    updateCartButton();

}


// ==========================================
// WHATSAPP
// ==========================================

async function orderWhatsApp() {

    await loadData();


    if (cart.length === 0)
        return;


    let message =
`🛒 *Jyoti Gruh Udhyog*

નવો ઓર્ડર

------------------------

`;


    let grandTotal = 0;


    cart.forEach(item => {

        const row =
            getProduct(
                item.id
            );


        if (!row) return;


        const name =
            row[3];

        const weight =
            row[4];

        const price =
            Number(
                String(row[5])
                    .replace(/[^\d.]/g, "")
            ) || 0;


        const total =
            price *
            item.qty;


        grandTotal +=
            total;


        message +=
`📦 ${name}
⚖️ ${weight}
💰 ₹${price} × ${item.qty} = ₹${total}

------------------------

`;

    });


    message +=
`💵 Grand Total : ₹${grandTotal}

🙏 આભાર`;


    window.open(
        "https://wa.me/919712149344?text=" +
        encodeURIComponent(message),
        "_blank"
    );


    cart = [];

    saveCart();

    updateCartButton();

    loadCart();

    loadProducts();

}


// ==========================================
// IMAGE MODAL
// ==========================================

function openImage(src) {

    const image =
        document.getElementById(
            "zoomImage"
        );

    const modal =
        document.getElementById(
            "imageModal"
        );


    if (!image || !modal)
        return;


    image.src =
        src;

    modal.classList.add(
        "show"
    );

}


function closeImage() {

    const modal =
        document.getElementById(
            "imageModal"
        );


    if (modal) {

        modal.classList.remove(
            "show"
        );

    }

}


// ==========================================
// START
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        await loadData();

        loadCategories();

        loadSubCategories();

        loadProducts();

        loadCart();

        updateCartButton();

        initSearch();

    }
);


// ==========================================
// PAGE SHOW
// ==========================================

window.addEventListener(
    "pageshow",
    function () {

        cart =
            JSON.parse(
                localStorage.getItem(
                    "cart"
                )
            ) || [];


        updateCartButton();


        if (
            document.getElementById(
                "productList"
            )
        ) {

            loadProducts();

        }


        if (
            document.getElementById(
                "cartList"
            )
        ) {

            loadCart();

        }

    }
);