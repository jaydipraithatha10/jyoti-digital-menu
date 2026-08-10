// ======================================
// JYOTI GRUH UDHYOG
// API.JS V7 FINAL
// ======================================


// ======================================
// CART
// ======================================

let cart =
    JSON.parse(localStorage.getItem("cart")) || [];


function saveCart(){

    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );

}


// ======================================
// DATA
// ======================================

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


// ======================================
// GOOGLE SHEET
// ======================================

const SHEET =
"2PACX-1vStfoYZJzDES0lAav3gzVi4hHMrr-g-vu6oHbAecwVN7-j5ZfyZCE4wy5qE8oaH0fSw14Y97pHMmUrU";


const categoryURL =
`https://docs.google.com/spreadsheets/d/e/${SHEET}/pub?gid=2013716827&single=true&output=csv`;


const subCategoryURL =
`https://docs.google.com/spreadsheets/d/e/${SHEET}/pub?gid=35788410&single=true&output=csv`;


const productURL =
`https://docs.google.com/spreadsheets/d/e/${SHEET}/pub?gid=0&single=true&output=csv`;


// ======================================
// CACHE SAVE
// ======================================

function saveCache(){

    const data = {

        categoryRows,
        subCategoryRows,
        productRows,

        time: Date.now()

    };

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(data)
    );

}


// ======================================
// CACHE LOAD
// ======================================

function loadCache(){

    try{

        const cache =
            localStorage.getItem(
                STORAGE_KEY
            );

        if(!cache)
            return false;


        const data =
            JSON.parse(cache);


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

        cacheTime = data.time;

        return true;

    }

    catch(error){

        console.log(
            "Cache Error:",
            error
        );

        return false;

    }

}


// ======================================
// FETCH CSV
// ======================================

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
            "Data Load Failed"
        );

    }


    return await response.text();

}


// ======================================
// CSV PARSER
// ======================================

function csvToArray(csv){

    return csv
        .trim()
        .split(/\r?\n/)
        .map(row => {

            return row
                .split(",")
                .map(cell =>
                    cell
                        .replace(/^"|"$/g,"")
                        .trim()
                );

        });

}


// ======================================
// PRODUCT MAP
// ======================================

function buildProductMap(){

    productMap.clear();


    productRows
        .slice(1)
        .forEach(row => {

            if(row[0]){

                productMap.set(
                    row[0],
                    row
                );

            }

        });

}


// ======================================
// URL PARAMETER
// ======================================

function getParam(name){

    return new URLSearchParams(
        location.search
    ).get(name);

}


// ======================================
// GET PRODUCT
// ======================================

function getProduct(id){

    return productMap.get(
        id
    );

}


// ======================================
// LOAD DATA
// ======================================

async function loadData(){

    if(dataLoaded){

        if(
            Date.now() - cacheTime <
            CACHE_DURATION
        ){

            return;

        }

    }


    if(loadCache()){

        return;

    }


    try{

        const [
            catCSV,
            subCSV,
            proCSV
        ] = await Promise.all([

            fetchCSV(categoryURL),

            fetchCSV(subCategoryURL),

            fetchCSV(productURL)

        ]);


        categoryRows =
            csvToArray(catCSV);


        subCategoryRows =
            csvToArray(subCSV);


        productRows =
            csvToArray(proCSV);


        buildProductMap();


        dataLoaded = true;

        cacheTime =
            Date.now();


        saveCache();


        console.log(
            "Jyoti Data Loaded"
        );

    }

    catch(error){

        console.error(
            "Data Load Error:",
            error
        );

    }

}


// ======================================
// CATEGORY
// ======================================

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
                status
                    .trim()
                    .toLowerCase()
                    !== "active"
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


// ======================================
// OPEN CATEGORY
// ======================================

function openCategory(id){

    const hasSub =
        subCategoryRows
            .slice(1)
            .some(row => {

                return (

                    row[1] == id &&

                    row[3] &&
                    row[3]
                        .trim()
                        .toLowerCase()
                        === "active"

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


// ======================================
// SUB CATEGORIES
// ======================================

function loadSubCategories(){

    const list =
        document.getElementById(
            "subCategoryList"
        );


    if(!list)
        return;


    const id =
        getParam("id");


    const html = [];


    subCategoryRows
        .slice(1)
        .forEach(row => {

            const subId =
                row[0];

            const categoryId =
                row[1];

            const name =
                row[2];

            const status =
                row[3];

            const image =
                row[4];


            if(categoryId != id)
                return;


            if(
                !status ||
                status
                    .trim()
                    .toLowerCase()
                    !== "active"
            ){

                return;

            }


            html.push(`

<div
    class="category-card"
    onclick="location.href='products.html?sub=${encodeURIComponent(subId)}'"
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


// ======================================
// PRODUCTS
// SAME PRODUCT = ONE CARD
// ======================================

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


    // ==================================
    // GROUP PRODUCTS
    // ==================================

    const grouped =
        new Map();


    productRows
        .slice(1)
        .forEach(row => {

            /*
                GOOGLE SHEET:

                A = Display Order
                B = Category ID
                C = SubCategory ID
                D = Product
                E = Weight
                F = Price
                G = Status
                H = Image
            */


            const id =
                row[0];


            const category =
                row[1];


            const subCategory =
                row[2];


            const productName =
                row[3];


            const weight =
                row[4];


            const price =
                Number(row[5]) || 0;


            const status =
                row[6];


            const image =
                row[7];


            // --------------------------
            // ACTIVE
            // --------------------------

            if(
                !status ||
                status
                    .trim()
                    .toLowerCase()
                    !== "active"
            ){

                return;

            }


            // --------------------------
            // SUB CATEGORY FILTER
            // --------------------------

            if(
                subId &&
                subCategory != subId
            ){

                return;

            }


            // --------------------------
            // CATEGORY FILTER
            // --------------------------

            if(
                categoryId &&
                !subId &&
                category != categoryId
            ){

                return;

            }


            // --------------------------
            // SEARCH
            // --------------------------

            if(search){

                const text =
                    (
                        productName +
                        " " +
                        weight
                    )
                    .toLowerCase();


                if(
                    !text.includes(search)
                ){

                    return;

                }

            }


            // --------------------------
            // SAME PRODUCT
            // --------------------------

            const groupKey =
                productName
                    .trim()
                    .toLowerCase();


            if(
                !grouped.has(
                    groupKey
                )
            ){

                grouped.set(
                    groupKey,
                    {

                        name:
                            productName,

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
                        id,

                    weight:
                        weight,

                    price:
                        price,

                    image:
                        image

                });

        });


    // ==================================
    // CREATE HTML
    // ==================================

    const html = [];


    grouped.forEach(
        product => {


            // --------------------------
            // VARIANT HTML
            // --------------------------

            let variantsHTML = "";


            product.variants
                .forEach(
                    variant => {


                    const cartItem =
                        cart.find(
                            item =>
                                item.id ==
                                variant.id
                        );


                    const qty =
                        cartItem
                            ? cartItem.qty
                            : 0;


                    // ------------------
                    // BUTTON
                    // ------------------

                    let actionHTML;


                    if(qty === 0){

                        actionHTML = `

<button
    class="variant-add-btn"
    onclick="addToCart('${variant.id}')"
>
    + Add
</button>

`;

                    }
                    else{

                        actionHTML = `

<div class="variant-qty">

    <button
        class="qty-btn"
        onclick="changeQty('${variant.id}',-1)"
    >
        −
    </button>

    <span class="qty-number">
        ${qty}
    </span>

    <button
        class="qty-btn"
        onclick="changeQty('${variant.id}',1)"
    >
        +
    </button>

</div>

`;

                    }


                    // ------------------
                    // ROW
                    // ------------------

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

                });


            // --------------------------
            // CARD
            // --------------------------

            html.push(`

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

        ${variantsHTML}

    </div>

</div>

`);

        }
    );


    // ==================================
    // SHOW PRODUCTS
    // ==================================

    list.innerHTML =
        html.join("");


    // ==================================
    // PRODUCT COUNT
    // ==================================

    const heading =
        document.querySelector(
            ".section-title"
        );


    if(heading){

        heading.innerHTML =
`
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


// ======================================
// SEARCH
// ======================================

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
                    () => {


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


// ======================================
// ADD TO CART
// ======================================

function addToCart(id){

    const item =
        cart.find(
            p => p.id == id
        );


    if(item){

        item.qty++;

    }
    else{

        cart.push({

            id:id,

            qty:1

        });

    }


    saveCart();

    updateCartButton();

    loadProducts();

}


// ======================================
// CHANGE QTY
// ======================================

function changeQty(
    id,
    change
){

    const item =
        cart.find(
            p => p.id == id
        );


    if(!item)
        return;


    item.qty += change;


    if(item.qty <= 0){

        cart =
            cart.filter(
                p => p.id != id
            );

    }


    saveCart();

    updateCartButton();

    loadProducts();

    loadCart();

}


// ======================================
// REMOVE CART ITEM
// ======================================

function removeCartItem(id){

    cart =
        cart.filter(
            item =>
                item.id != id
        );


    saveCart();

    updateCartButton();

    loadProducts();

    loadCart();

}


// ======================================
// FLOATING CART
// ======================================

function updateCartButton(){

    const btn =
        document.getElementById(
            "viewCartBtn"
        );


    const count =
        document.getElementById(
            "cartCount"
        );


    if(
        !btn ||
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
                item.qty,
            0
        );


    if(total === 0){

        btn.style.display =
            "none";

        count.textContent =
            "0";

    }
    else{

        btn.style.display =
            "flex";

        count.textContent =
            total;

    }

}


// ======================================
// LOAD CART
// ======================================

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
                item.qty;


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

            ₹${price}
            ×
            ${item.qty}
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


// ======================================
// WHATSAPP ORDER
// ======================================

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
                item.qty;


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


// ======================================
// IMAGE ZOOM
// ======================================

function openImage(src){

    const image =
        document.getElementById(
            "zoomImage"
        );


    const modal =
        document.getElementById(
            "imageModal"
        );


    if(!image || !modal)
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


// ======================================
// AUTO LOAD
// ======================================

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


// ======================================
// PAGE SHOW
// ======================================

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