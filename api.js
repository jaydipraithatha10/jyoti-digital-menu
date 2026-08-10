// ==========================================
// JYOTI GRUH UDHYOG
// API.JS FINAL
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
    "jyoti_data_cache";


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
// CACHE
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
            "Cache save error",
            error
        );

    }

}


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
            "Cache load error",
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
            "Google Sheet data load failed"
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


    for(let i = 0; i < csv.length; i++){

        const char =
            csv[i];

        const next =
            csv[i + 1];


        if(char === '"' && insideQuotes && next === '"'){

            cell += '"';

            i++;

        }

        else if(char === '"'){

            insideQuotes =
                !insideQuotes;

        }

        else if(char === "," && !insideQuotes){

            row.push(
                cell.trim()
            );

            cell = "";

        }

        else if(
            (char === "\n" || char === "\r")
            &&
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

            cell = "";


            if(
                row.some(
                    value =>
                        value !== ""
                )
            ){

                rows.push(row);

            }


            row = [];

        }

        else{

            cell += char;

        }

    }


    if(
        cell !== "" ||
        row.length > 0
    ){

        row.push(
            cell.trim()
        );

        if(
            row.some(
                value =>
                    value !== ""
            )
        ){

            rows.push(row);

        }

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

            if(row[0]){

                productMap.set(
                    String(row[0]).trim(),
                    row
                );

            }

        });

}


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
// LOAD DATA
// ==========================================

async function loadData(){

    if(
        dataLoaded &&
        Date.now() - cacheTime <
        CACHE_DURATION
    ){

        return;

    }


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
            "Jyoti Gruh Udhyog data loaded"
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
                row[0];

            const name =
                row[1];

            const status =
                row[2];

            const image =
                row[3];


            if(
                !status ||
                status.toLowerCase().trim() !==
                "active"
            ){

                return;

            }


            html.push(`

<div
    class="category-card"
    onclick="openCategory('${id}')"
>

<img
    src="${image || "placeholder.webp"}"
    alt="${name}"
    loading="lazy"
    decoding="async"
    onerror="this.src='placeholder.webp'"
>

<h3>
    ${name}
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

    const hasSub =
        subCategoryRows
            .slice(1)
            .some(row => {

                return (

                    String(row[1]).trim() ===
                    String(id).trim()

                    &&

                    row[3] &&
                    row[3].toLowerCase().trim() ===
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


    const html = [];


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


            if(
                String(parentId).trim() !==
                String(categoryId).trim()
            ){

                return;

            }


            if(
                !status ||
                status.toLowerCase().trim() !==
                "active"
            ){

                return;

            }


            html.push(`

<div
    class="category-card"
    onclick="location.href='products.html?sub=${encodeURIComponent(id)}'"
>

<img
    src="${image || "placeholder.webp"}"
    alt="${name}"
    loading="lazy"
    decoding="async"
    onerror="this.src='placeholder.webp'"
>

<h3>
    ${name}
</h3>

</div>

`);

        });


    list.innerHTML =
        html.join("");

}


// ==========================================
// LOAD PRODUCTS
//
// SAME PRODUCT NAME = ONE CARD
//
// SINGLE:
// Plain
// 500 gm   ₹160   + Add
//
// MULTI:
// Golkeri
// 250 gm   ₹100   + Add
// 500 gm   ₹190   + Add
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
        (
            searchText ||
            urlSearch
        )
        .trim()
        .toLowerCase();


    const grouped =
        new Map();


    // ======================================
    // GROUP PRODUCTS
    // ======================================

    productRows
        .slice(1)
        .forEach(row => {

            /*
            PRODUCT SHEET

            0 = ID
            1 = Category ID
            2 = Sub Category ID
            3 = Product
            4 = Weight
            5 = Price
            6 = Status
            7 = Image
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
                    String(row[5]).replace(
                        /[^0-9.]/g,
                        ""
                    )
                ) || 0;

            const status =
                row[6];

            const image =
                row[7];


            // ACTIVE

            if(
                !status ||
                status.toLowerCase().trim() !==
                "active"
            ){

                return;

            }


            // SUB CATEGORY

            if(
                subId &&
                String(subCategory).trim() !==
                String(subId).trim()
            ){

                return;

            }


            // CATEGORY

            if(
                categoryId &&
                !subId &&
                String(category).trim() !==
                String(categoryId).trim()
            ){

                return;

            }


            // SEARCH

            if(search){

                const searchValue =
                    (
                        String(name) +
                        " " +
                        String(weight)
                    )
                    .toLowerCase();


                if(
                    !searchValue.includes(search)
                ){

                    return;

                }

            }


            // ==================================
            // IMPORTANT:
            // SAME NAME = SAME CARD
            // ==================================

            const groupKey =
                String(name)
                    .trim()
                    .replace(/\s+/g, " ")
                    .toLowerCase();


            if(
                !grouped.has(groupKey)
            ){

                grouped.set(
                    groupKey,
                    {

                        name:
                            String(name).trim(),

                        image:
                            image,

                        variants:[]

                    }
                );

            }


            grouped
                .get(groupKey)
                .variants
                .push({

                    id:
                        String(id).trim(),

                    weight:
                        String(weight).trim(),

                    price:
                        price

                });

        });


    // ======================================
    // CREATE CARDS
    // ======================================

    const html = [];


    grouped.forEach(
        product => {


            // SORT BY WEIGHT NUMBER

            product.variants.sort(
                (a,b) => {

                    const aNum =
                        parseFloat(
                            a.weight
                        ) || 0;

                    const bNum =
                        parseFloat(
                            b.weight
                        ) || 0;

                    return aNum - bNum;

                }
            );


            // ==================================
            // SINGLE / MULTI CLASS
            // ==================================

            const cardType =
                product.variants.length === 1
                ? "single-weight"
                : "multi-weight";


            let variantsHTML =
                "";


            // ==================================
            // VARIANTS
            // ==================================

            product.variants.forEach(
                variant => {


                    const cartItem =
                        cart.find(
                            item =>
                                String(item.id) ===
                                String(variant.id)
                        );


                    const qty =
                        cartItem
                        ? Number(cartItem.qty)
                        : 0;


                    let actionHTML;


                    // =================================
                    // ADD BUTTON
                    // =================================

                    if(qty <= 0){

                        actionHTML = `

<button
    type="button"
    class="variant-add-btn"
    onclick="addToCart('${variant.id}')"
>
    + Add
</button>

`;

                    }

                    // =================================
                    // QTY
                    // =================================

                    else{

                        actionHTML = `

<div class="variant-qty">

<button
    type="button"
    class="qty-btn"
    onclick="changeQty('${variant.id}',-1)"
>
    −
</button>

<span class="qty-number">
    ${qty}
</span>

<button
    type="button"
    class="qty-btn"
    onclick="changeQty('${variant.id}',1)"
>
    +
</button>

</div>

`;

                    }


                    variantsHTML += `

<div class="product-variant-row">

<div class="product-variant-weight">
    ${variant.weight}
</div>

<div class="product-variant-price">
    ₹${variant.price}
</div>

<div class="product-variant-action">
    ${actionHTML}
</div>

</div>

`;

                }
            );


            // ==================================
            // PRODUCT CARD
            // ==================================

            html.push(`

<div class="product-card ${cardType}">

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

    ${variantsHTML}

</div>

</div>

`);

        }
    );


    list.innerHTML =
        html.join("");


    // ======================================
    // PRODUCT COUNT
    // ======================================

    const heading =
        document.querySelector(
            ".section-title"
        );


    if(heading){

        heading.innerHTML = `

🛒 All Products

<span>
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


            clearTimeout(timer);


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

    const item =
        cart.find(
            p =>
                String(p.id) ===
                String(id)
        );


    if(item){

        item.qty =
            Number(item.qty) + 1;

    }

    else{

        cart.push({

            id:
                String(id),

            qty:
                1

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
){

    const item =
        cart.find(
            p =>
                String(p.id) ===
                String(id)
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
                    String(id)
            );

    }


    saveCart();

    updateCartButton();

    loadProducts();

    loadCart();

}


// ==========================================
// REMOVE
// ==========================================

function removeCartItem(id){

    cart =
        cart.filter(
            item =>
                String(item.id) !==
                String(id)
        );


    saveCart();

    updateCartButton();

    loadProducts();

    loadCart();

}


// ==========================================
// FLOATING CART
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
                Number(item.qty),
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
// CART PAGE
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


    let html = [];

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
                row[3];

            const weight =
                row[4];

            const price =
                Number(row[5]) || 0;

            const image =
                row[7];

            const total =
                price *
                Number(item.qty);


            grandTotal +=
                total;


            html.push(`

<div class="cart-item">

<img
    src="${image || "placeholder.webp"}"
    alt="${product}"
    loading="lazy"
    decoding="async"
    onerror="this.src='placeholder.webp'"
>

<div class="cart-info">

<h3>
    ${product}
</h3>

<p>
    ${weight}
</p>

<div class="cart-price">
    ₹${price} × ${item.qty}
    =
    ₹${total}
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
// WHATSAPP
// ==========================================

async function orderWhatsApp(){

    await loadData();


    if(cart.length === 0)
        return;


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
                row[3];

            const weight =
                row[4];

            const price =
                Number(row[5]) || 0;

            const total =
                price *
                Number(item.qty);


            grandTotal +=
                total;


            message +=
`📦 ${product}
⚖️ ${weight}

💰 ₹${price} × ${item.qty} = ₹${total}

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
    )
        return;


    image.src =
        src;


    modal.classList.add(
        "show"
    );

}


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