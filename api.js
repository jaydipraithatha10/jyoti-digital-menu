// ==========================================
// JYOTI GRUH UDHYOG
// API.JS V9
// FINAL PRODUCT GROUPING VERSION
// ==========================================


// ==========================================
// CART
// ==========================================

let cart =
    JSON.parse(localStorage.getItem("cart")) || [];


function saveCart(){

    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );

}


// ==========================================
// DATA
// ==========================================

let categoryRows = [];
let subCategoryRows = [];
let productRows = [];

let productMap = new Map();

let dataLoaded = false;
let cacheTime = 0;

const CACHE_DURATION =
    5 * 60 * 1000;

const STORAGE_KEY =
    "jyoti_data_cache_v9";


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
// ESCAPE HTML
// ==========================================

function escapeHTML(value){

    return String(value || "")
        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;")
        .replace(/'/g,"&#039;");

}


// ==========================================
// SAFE IMAGE
// ==========================================

function safeImage(url){

    if(!url)
        return "placeholder.webp";

    return String(url).trim();

}


// ==========================================
// CACHE SAVE
// ==========================================

function saveCache(){

    try{

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({

                categoryRows:
                    categoryRows,

                subCategoryRows:
                    subCategoryRows,

                productRows:
                    productRows,

                time:
                    Date.now()

            })
        );

    }
    catch(error){

        console.log(
            "Cache save error:",
            error
        );

    }

}


// ==========================================
// CACHE LOAD
// ==========================================

function loadCache(){

    try{

        const saved =
            localStorage.getItem(
                STORAGE_KEY
            );


        if(!saved)
            return false;


        const data =
            JSON.parse(saved);


        if(
            !data.time ||
            Date.now() - data.time >
            CACHE_DURATION
        ){

            localStorage.removeItem(
                STORAGE_KEY
            );

            return false;

        }


        categoryRows =
            data.categoryRows || [];


        subCategoryRows =
            data.subCategoryRows || [];


        productRows =
            data.productRows || [];


        buildProductMap();


        dataLoaded = true;

        cacheTime =
            data.time;


        return true;

    }
    catch(error){

        console.log(
            "Cache load error:",
            error
        );

        return false;

    }

}


// ==========================================
// FETCH CSV
// ==========================================

async function fetchCSV(url){

    const response =
        await fetch(
            url,
            {
                cache:"no-store"
            }
        );


    if(!response.ok){

        throw new Error(
            "Google Sheet load failed"
        );

    }


    return await response.text();

}


// ==========================================
// CSV PARSER
// ==========================================

function csvToArray(csv){

    const rows = [];

    let row = [];

    let cell = "";

    let insideQuotes = false;


    for(
        let i = 0;
        i < csv.length;
        i++
    ){

        const char =
            csv[i];

        const next =
            csv[i + 1];


        // ------------------------------
        // QUOTE
        // ------------------------------

        if(char === '"'){

            if(
                insideQuotes &&
                next === '"'
            ){

                cell += '"';

                i++;

            }
            else{

                insideQuotes =
                    !insideQuotes;

            }

            continue;

        }


        // ------------------------------
        // COMMA
        // ------------------------------

        if(
            char === "," &&
            !insideQuotes
        ){

            row.push(
                cell.trim()
            );

            cell = "";

            continue;

        }


        // ------------------------------
        // NEW LINE
        // ------------------------------

        if(
            (char === "\n" || char === "\r") &&
            !insideQuotes
        ){

            if(
                char === "\r" &&
                next === "\n"
            ){

                i++;

            }


            row.push(
                cell.trim()
            );


            if(
                row.some(
                    value =>
                        String(value).trim() !== ""
                )
            ){

                rows.push(row);

            }


            row = [];

            cell = "";

            continue;

        }


        cell += char;

    }


    // LAST CELL

    if(cell !== "" || row.length){

        row.push(
            cell.trim()
        );

    }


    if(
        row.length &&
        row.some(
            value =>
                String(value).trim() !== ""
        )
    ){

        rows.push(row);

    }


    return rows;

}


// ==========================================
// PRODUCT MAP
// ==========================================

function buildProductMap(){

    productMap.clear();


    productRows
        .slice(1)
        .forEach(row => {

            const id =
                String(row[0] || "").trim();


            if(id){

                productMap.set(
                    id,
                    row
                );

            }

        });

}


// ==========================================
// GET PRODUCT
// ==========================================

function getProduct(id){

    return productMap.get(
        String(id).trim()
    );

}


// ==========================================
// URL PARAMETER
// ==========================================

function getParam(name){

    return new URLSearchParams(
        window.location.search
    ).get(name);

}


// ==========================================
// LOAD ALL DATA
// ==========================================

async function loadData(){

    // MEMORY

    if(
        dataLoaded &&
        Date.now() - cacheTime <
        CACHE_DURATION
    ){

        return;

    }


    // CACHE

    if(loadCache()){

        return;

    }


    try{

        const result =
            await Promise.all([

                fetchCSV(categoryURL),

                fetchCSV(subCategoryURL),

                fetchCSV(productURL)

            ]);


        categoryRows =
            csvToArray(
                result[0]
            );


        subCategoryRows =
            csvToArray(
                result[1]
            );


        productRows =
            csvToArray(
                result[2]
            );


        buildProductMap();


        dataLoaded = true;

        cacheTime =
            Date.now();


        saveCache();


        console.log(
            "Jyoti data loaded:",
            productRows.length - 1,
            "products"
        );

    }
    catch(error){

        console.error(
            "LOAD DATA ERROR:",
            error
        );

    }

}


// ==========================================
// LOAD CATEGORIES
// ==========================================

function loadCategories(){

    const list =
        document.getElementById(
            "categoryList"
        );


    if(!list)
        return;


    const html = [];


    categoryRows
        .slice(1)
        .forEach(row => {

            const id =
                String(
                    row[0] || ""
                ).trim();


            const name =
                String(
                    row[1] || ""
                ).trim();


            const status =
                String(
                    row[2] || ""
                ).trim()
                .toLowerCase();


            const image =
                safeImage(
                    row[3]
                );


            if(
                !id ||
                !name
            ){

                return;

            }


            if(
                status !== "active"
            ){

                return;

            }


            html.push(`

<div
    class="category-card"
    onclick="openCategory('${encodeURIComponent(id)}')"
>

<img
    src="${escapeHTML(image)}"
    alt="${escapeHTML(name)}"
    loading="lazy"
    decoding="async"
    onerror="this.src='placeholder.webp'"
>

<h3>
    ${escapeHTML(name)}
</h3>

</div>

`);

        });


    list.innerHTML =
        html.join("");

}


// ==========================================
// OPEN CATEGORY
// ==========================================

function openCategory(id){

    id =
        decodeURIComponent(id);


    const hasSub =
        subCategoryRows
            .slice(1)
            .some(row => {

                const parentId =
                    String(
                        row[1] || ""
                    ).trim();


                const status =
                    String(
                        row[3] || ""
                    ).trim()
                    .toLowerCase();


                return (

                    parentId ===
                    String(id).trim()

                    &&

                    status ===
                    "active"

                );

            });


    if(hasSub){

        location.href =
            "category.html?id=" +
            encodeURIComponent(id);

    }
    else{

        location.href =
            "products.html?category=" +
            encodeURIComponent(id);

    }

}


// ==========================================
// LOAD SUB CATEGORIES
// ==========================================

function loadSubCategories(){

    const list =
        document.getElementById(
            "subCategoryList"
        );


    if(!list)
        return;


    const categoryId =
        getParam("id");


    if(!categoryId)
        return;


    const html = [];


    subCategoryRows
        .slice(1)
        .forEach(row => {

            const id =
                String(
                    row[0] || ""
                ).trim();


            const parentId =
                String(
                    row[1] || ""
                ).trim();


            const name =
                String(
                    row[2] || ""
                ).trim();


            const status =
                String(
                    row[3] || ""
                ).trim()
                .toLowerCase();


            const image =
                safeImage(
                    row[4]
                );


            if(
                parentId !==
                String(categoryId).trim()
            ){

                return;

            }


            if(
                status !== "active"
            ){

                return;

            }


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

<h3>
    ${escapeHTML(name)}
</h3>

</div>

`);

        });


    list.innerHTML =
        html.join("");

}


// ==========================================
// PRODUCT GROUP KEY
// ==========================================
// IMPORTANT:
//
// Golkeri
// GOLKERI
// Golkeri
// Golkeri
//
// badha SAME card.
//
// 250 gm + 500 gm
// SAME product card.
// ==========================================

function productGroupKey(name){

    return String(name || "")
        .toLowerCase()
        .replace(/\s+/g," ")
        .trim();

}


// ==========================================
// LOAD PRODUCTS
// ==========================================

function loadProducts(searchText = ""){

    const list =
        document.getElementById(
            "productList"
        );


    if(!list)
        return;


    const subId =
        getParam("sub");


    const categoryId =
        getParam("category");


    const urlSearch =
        getParam("search") || "";


    const search =
        String(
            searchText || urlSearch
        )
        .trim()
        .toLowerCase();


    // ======================================
    // GROUP
    // ======================================

    const grouped =
        new Map();


    productRows
        .slice(1)
        .forEach(row => {


            /*
            PRODUCT SHEET

            A = ID
            B = categoryID
            C = SubCategoryID
            D = Product
            E = Weight
            F = Price
            G = Status
            H = Images
            */


            const id =
                String(
                    row[0] || ""
                ).trim();


            const category =
                String(
                    row[1] || ""
                ).trim();


            const subCategory =
                String(
                    row[2] || ""
                ).trim();


            const name =
                String(
                    row[3] || ""
                ).trim();


            const weight =
                String(
                    row[4] || ""
                ).trim();


            const price =
                Number(
                    String(
                        row[5] || ""
                    )
                    .replace(
                        /[₹,\s]/g,
                        ""
                    )
                ) || 0;


            const status =
                String(
                    row[6] || ""
                ).trim()
                .toLowerCase();


            const image =
                safeImage(
                    row[7]
                );


            // =================================
            // BASIC CHECK
            // =================================

            if(
                !id ||
                !name
            ){

                return;

            }


            // =================================
            // ACTIVE
            // =================================

            if(
                status !== "active"
            ){

                return;

            }


            // =================================
            // SUB CATEGORY
            // =================================

            if(
                subId &&
                subCategory !==
                String(subId).trim()
            ){

                return;

            }


            // =================================
            // CATEGORY
            // =================================

            if(
                categoryId &&
                !subId &&
                category !==
                String(categoryId).trim()
            ){

                return;

            }


            // =================================
            // SEARCH
            // =================================

            if(search){

                const searchValue =
                    (
                        name +
                        " " +
                        weight
                    )
                    .toLowerCase();


                if(
                    !searchValue.includes(
                        search
                    )
                ){

                    return;

                }

            }


            // =================================
            // GROUP KEY
            // =================================

            const groupKey =
                productGroupKey(
                    name
                );


            // =================================
            // CREATE GROUP
            // =================================

            if(
                !grouped.has(
                    groupKey
                )
            ){

                grouped.set(
                    groupKey,
                    {

                        name:
                            name,

                        image:
                            image,

                        variants:[]

                    }
                );

            }


            // =================================
            // ADD VARIANT
            // =================================

            grouped
                .get(groupKey)
                .variants
                .push({

                    id:
                        id,

                    weight:
                        weight,

                    price:
                        price,

                    image:
                        image

                });

        });


    // ======================================
    // HTML
    // ======================================

    const html = [];


    grouped.forEach(
        product => {


            // =================================
            // SORT WEIGHT
            // =================================

            product.variants.sort(
                (a,b) => {

                    const aWeight =
                        parseFloat(
                            a.weight
                        ) || 0;


                    const bWeight =
                        parseFloat(
                            b.weight
                        ) || 0;


                    return (
                        aWeight -
                        bWeight
                    );

                }
            );


            let variantsHTML =
                "";


            // =================================
            // VARIANTS
            // =================================

            product.variants
                .forEach(
                    variant => {


                    const cartItem =
                        cart.find(
                            item =>
                                String(
                                    item.id
                                ) ===
                                String(
                                    variant.id
                                )
                        );


                    const qty =
                        cartItem
                            ? Number(
                                cartItem.qty
                            )
                            : 0;


                    let action =
                        "";


                    // ==========================
                    // ADD
                    // ==========================

                    if(qty <= 0){

                        action = `

<button
    type="button"
    class="variant-add-btn"
    onclick="addToCart('${escapeHTML(variant.id)}')"
>
    + Add
</button>

`;

                    }


                    // ==========================
                    // QUANTITY
                    // ==========================

                    else{

                        action = `

<div class="variant-qty">

<button
    type="button"
    class="qty-btn"
    onclick="changeQty('${escapeHTML(variant.id)}',-1)"
>
    −
</button>

<span class="qty-number">
    ${qty}
</span>

<button
    type="button"
    class="qty-btn"
    onclick="changeQty('${escapeHTML(variant.id)}',1)"
>
    +
</button>

</div>

`;

                    }


                    // ==========================
                    // VARIANT ROW
                    // ==========================

                    variantsHTML += `

<div class="product-variant-row">

    <div class="product-variant-weight">
        ${escapeHTML(variant.weight)}
    </div>

    <div class="product-variant-price">
        ₹${variant.price}
    </div>

    <div class="product-variant-action">
        ${action}
    </div>

</div>

`;

                });


            // =================================
            // PRODUCT CARD
            // =================================

            const image =
                product.image ||
                (
                    product.variants[0]
                        ? product.variants[0].image
                        : "placeholder.webp"
                );


            html.push(`

<div class="product-card">

<img
    src="${escapeHTML(image)}"
    alt="${escapeHTML(product.name)}"
    loading="lazy"
    decoding="async"
    onclick="openImage('${escapeHTML(image)}')"
    onerror="this.src='placeholder.webp'"
>

<h3 class="product-name">
    ${escapeHTML(product.name)}
</h3>

<div class="product-variants">

    ${variantsHTML}

</div>

</div>

`);

        }
    );


    // ======================================
    // SHOW PRODUCTS
    // ======================================

    list.innerHTML =
        html.join("");


    // ======================================
    // COUNT
    // ======================================

    const heading =
        document.querySelector(
            ".section-title"
        );


    if(heading){

        heading.innerHTML = `

🛒 All Products

<span
    style="
        font-size:16px;
        color:#888;
    "
>
    (${grouped.size})
</span>

`;

    }

}


// ==========================================
// SEARCH
// ==========================================

function initSearch(){

    const searchBox =
        document.getElementById(
            "searchBox"
        );


    if(!searchBox)
        return;


    let timer;


    searchBox.addEventListener(
        "input",
        function(){

            const text =
                this.value.trim();


            clearTimeout(
                timer
            );


            timer =
                setTimeout(
                    function(){

                        if(
                            document.getElementById(
                                "productList"
                            )
                        ){

                            loadProducts(
                                text
                            );

                        }

                        else if(
                            document.getElementById(
                                "categoryList"
                            )
                        ){

                            if(
                                text.length >= 2
                            ){

                                location.href =
                                    "products.html?search=" +
                                    encodeURIComponent(
                                        text
                                    );

                            }

                        }

                    },
                    250
                );

        }
    );

}


// ==========================================
// ADD TO CART
// ==========================================

function addToCart(id){

    id =
        String(id);


    const item =
        cart.find(
            p =>
                String(p.id) ===
                id
        );


    if(item){

        item.qty =
            Number(item.qty) + 1;

    }
    else{

        cart.push({

            id:
                id,

            qty:
                1

        });

    }


    saveCart();

    updateCartButton();

    loadProducts();

}


// ==========================================
// CHANGE QUANTITY
// ==========================================

function changeQty(
    id,
    change
){

    id =
        String(id);


    const item =
        cart.find(
            p =>
                String(p.id) ===
                id
        );


    if(!item)
        return;


    item.qty =
        Number(item.qty) +
        Number(change);


    if(item.qty <= 0){

        cart =
            cart.filter(
                p =>
                    String(p.id) !==
                    id
            );

    }


    saveCart();

    updateCartButton();

    loadProducts();

    loadCart();

}


// ==========================================
// REMOVE CART ITEM
// ==========================================

function removeCartItem(id){

    id =
        String(id);


    cart =
        cart.filter(
            item =>
                String(item.id) !==
                id
        );


    saveCart();

    updateCartButton();

    loadProducts();

    loadCart();

}


// ==========================================
// CART BUTTON
// ==========================================

function updateCartButton(){

    const button =
        document.getElementById(
            "viewCartBtn"
        );


    const count =
        document.getElementById(
            "cartCount"
        );


    if(
        !button ||
        !count
    ){

        return;

    }


    const total =
        cart.reduce(
            (
                sum,
                item
            ) =>
                sum +
                Number(item.qty || 0),
            0
        );


    if(total <= 0){

        button.style.display =
            "none";

        count.textContent =
            "0";

    }
    else{

        button.style.display =
            "flex";

        count.textContent =
            total;

    }

}


// ==========================================
// LOAD CART
// ==========================================

function loadCart(){

    const list =
        document.getElementById(
            "cartList"
        );


    if(!list)
        return;


    if(cart.length === 0){

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


    const html = [];

    let grandTotal = 0;


    cart.forEach(
        item => {


            const row =
                getProduct(
                    item.id
                );


            if(!row)
                return;


            const product =
                String(
                    row[3] || ""
                ).trim();


            const weight =
                String(
                    row[4] || ""
                ).trim();


            const price =
                Number(
                    String(
                        row[5] || ""
                    )
                    .replace(
                        /[₹,\s]/g,
                        ""
                    )
                ) || 0;


            const image =
                safeImage(
                    row[7]
                );


            const qty =
                Number(
                    item.qty || 0
                );


            const total =
                price * qty;


            grandTotal +=
                total;


            html.push(`

<div class="cart-item">

<img
    src="${escapeHTML(image)}"
    alt="${escapeHTML(product)}"
    loading="lazy"
    decoding="async"
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

₹${price} × ${qty}
=
₹${total}

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

        }
    );


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


    list.innerHTML =
        html.join("");


    updateCartButton();

}


// ==========================================
// WHATSAPP ORDER
// ==========================================

async function orderWhatsApp(){

    await loadData();


    if(
        cart.length === 0
    ){

        return;

    }


    let grandTotal = 0;


    let message =
`🛒 *Jyoti Gruh Udhyog*

નવો ઓર્ડર

------------------------

`;


    cart.forEach(
        item => {


            const row =
                getProduct(
                    item.id
                );


            if(!row)
                return;


            const product =
                String(
                    row[3] || ""
                ).trim();


            const weight =
                String(
                    row[4] || ""
                ).trim();


            const price =
                Number(
                    String(
                        row[5] || ""
                    )
                    .replace(
                        /[₹,\s]/g,
                        ""
                    )
                ) || 0;


            const qty =
                Number(
                    item.qty || 0
                );


            const total =
                price * qty;


            grandTotal +=
                total;


            message +=
`📦 ${product}
⚖️ ${weight}

💰 ₹${price} × ${qty} = ₹${total}

------------------------

`;

        }
    );


    message +=
`💵 Grand Total : ₹${grandTotal}

🙏 આભાર`;


    window.open(

        `https://wa.me/919712149344?text=${encodeURIComponent(message)}`,

        "_blank"

    );


    cart = [];

    saveCart();

    updateCartButton();

    loadCart();

    loadProducts();

}


// ==========================================
// IMAGE ZOOM
// ==========================================

function openImage(src){

    const image =
        document.getElementById(
            "zoomImage"
        );


    const modal =
        document.getElementById(
            "imageModal"
        );


    if(
        !image ||
        !modal
    ){

        return;

    }


    image.src =
        src;


    modal.classList.add(
        "show"
    );

}


// ==========================================
// CLOSE IMAGE
// ==========================================

function closeImage(){

    const modal =
        document.getElementById(
            "imageModal"
        );


    if(modal){

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
    async function(){

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
    function(){

        cart =
            JSON.parse(
                localStorage.getItem(
                    "cart"
                )
            ) || [];


        updateCartButton();


        if(
            document.getElementById(
                "productList"
            )
        ){

            loadProducts();

        }


        if(
            document.getElementById(
                "cartList"
            )
        ){

            loadCart();

        }

    }
);