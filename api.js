// ==========================================
// JYOTI GRUH UDHYOG
// API.JS V9
// FINAL - ACTUAL PRODUCTS SHEET STRUCTURE
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

const CACHE_DURATION = 5 * 60 * 1000;

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
// CSV PARSER
// Proper CSV parser
// ==========================================

function csvToArray(csv){

    const rows = [];

    let row = [];
    let cell = "";
    let insideQuotes = false;

    for(let i = 0; i < csv.length; i++){

        const char = csv[i];
        const next = csv[i + 1];

        if(char === '"' && insideQuotes && next === '"'){

            cell += '"';
            i++;

        }
        else if(char === '"'){

            insideQuotes = !insideQuotes;

        }
        else if(char === "," && !insideQuotes){

            row.push(cell.trim());
            cell = "";

        }
        else if(
            (char === "\n" || char === "\r") &&
            !insideQuotes
        ){

            if(char === "\r" && next === "\n"){
                i++;
            }

            row.push(cell.trim());
            cell = "";

            if(row.some(x => x !== "")){
                rows.push(row);
            }

            row = [];

        }
        else{

            cell += char;

        }

    }

    if(cell !== "" || row.length){

        row.push(cell.trim());

        if(row.some(x => x !== "")){
            rows.push(row);
        }

    }

    return rows;

}


// ==========================================
// FETCH
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
// CACHE
// ==========================================

function saveCache(){

    try{

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({

                categoryRows,
                subCategoryRows,
                productRows,

                time:Date.now()

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
        cacheTime = data.time;

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
// URL PARAM
// ==========================================

function getParam(name){

    return new URLSearchParams(
        window.location.search
    ).get(name);

}


// ==========================================
// PRODUCT UNIQUE ID
//
// Actual products sheet does NOT have
// separate product ID.
//
// Therefore we create one safely.
//
// subCategory + product + weight
// ==========================================

function makeProductID(
    subCategory,
    product,
    weight
){

    return (

        String(subCategory)
        .trim()
        .toLowerCase()

        + "|" +

        String(product)
        .trim()
        .toLowerCase()

        + "|" +

        String(weight)
        .trim()
        .toLowerCase()

    );

}


// ==========================================
// PRODUCT MAP
// ==========================================

function buildProductMap(){

    productMap.clear();

    productRows
        .slice(1)
        .forEach(row => {

            /*
            ACTUAL PRODUCTS SHEET

            row[0] = subCategoryID
            row[1] = Product
            row[2] = Weight
            row[3] = Price
            row[4] = Status
            row[5] = Images
            */

            const subCategory =
                row[0] || "";

            const product =
                row[1] || "";

            const weight =
                row[2] || "";

            const id =
                makeProductID(
                    subCategory,
                    product,
                    weight
                );

            productMap.set(
                id,
                row
            );

        });

}


function getProduct(id){

    return productMap.get(
        String(id)
    );

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

        return true;

    }


    if(loadCache()){

        return true;

    }


    try{

        const result =
            await Promise.all([

                fetchCSV(categoryURL),

                fetchCSV(subCategoryURL),

                fetchCSV(productURL)

            ]);


        categoryRows =
            csvToArray(result[0]);

        subCategoryRows =
            csvToArray(result[1]);

        productRows =
            csvToArray(result[2]);


        buildProductMap();


        dataLoaded = true;

        cacheTime =
            Date.now();


        saveCache();


        console.log(
            "Jyoti data loaded successfully"
        );


        return true;

    }
    catch(error){

        console.error(
            "DATA LOAD ERROR:",
            error
        );

        return false;

    }

}


// ==========================================
// CATEGORY
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
                status
                    .trim()
                    .toLowerCase() !==
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

<h3>${name}</h3>

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

                    String(row[1]) ===
                    String(id)

                    &&

                    row[3] &&
                    row[3]
                        .trim()
                        .toLowerCase() ===
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
// SUB CATEGORY
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
                String(parentId) !==
                String(categoryId)
            ){

                return;

            }


            if(
                !status ||
                status
                    .trim()
                    .toLowerCase() !==
                "active"
            ){

                return;

            }


            html.push(`

<div
    class="category-card"
    onclick="
        location.href=
        'products.html?sub=${encodeURIComponent(id)}'
    "
>

<img
    src="${image || "placeholder.webp"}"
    alt="${name}"
    loading="lazy"
    decoding="async"
    onerror="this.src='placeholder.webp'"
>

<h3>${name}</h3>

</div>

`);

        });


    list.innerHTML =
        html.join("");

}


// ==========================================
// PRODUCTS
//
// ACTUAL SHEET:
//
// subCategoryID
// Product
// Weight
// Price
// Status
// Images
//
// Same product name = ONE CARD
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
    // READ PRODUCTS
    // ======================================

    productRows
        .slice(1)
        .forEach(row => {

            /*
            ACTUAL SHEET:

            row[0] = subCategoryID
            row[1] = Product
            row[2] = Weight
            row[3] = Price
            row[4] = Status
            row[5] = Images
            */


            const subCategory =
                String(row[0] || "")
                .trim();


            const name =
                String(row[1] || "")
                .trim();


            const weight =
                String(row[2] || "")
                .trim();


            const price =
                Number(
                    String(row[3] || "")
                    .replace(/[^\d.]/g,"")
                ) || 0;


            const status =
                String(row[4] || "")
                .trim();


            const image =
                String(row[5] || "")
                .trim();


            // EMPTY

            if(!name)
                return;


            // ACTIVE ONLY

            if(
                status.toLowerCase() !==
                "active"
            ){

                return;

            }


            // SUB CATEGORY

            if(
                subId &&
                subCategory !==
                String(subId)
            ){

                return;

            }


            // ==================================
            // CATEGORY
            //
            // Product sheet only contains
            // subCategoryID.
            //
            // Therefore category filtering
            // is done through subCategory sheet.
            // ==================================

            if(
                categoryId &&
                !subId
            ){

                const belongsToCategory =
                    subCategoryRows
                        .slice(1)
                        .some(subRow => {

                            return (

                                String(subRow[0]) ===
                                subCategory

                                &&

                                String(subRow[1]) ===
                                String(categoryId)

                                &&

                                String(subRow[3] || "")
                                    .trim()
                                    .toLowerCase() ===
                                "active"

                            );

                        });


                if(!belongsToCategory)
                    return;

            }


            // SEARCH

            if(search){

                const keyword =
                    (
                        name +
                        " " +
                        weight
                    )
                    .toLowerCase();


                if(
                    !keyword.includes(search)
                ){

                    return;

                }

            }


            // ==================================
            // GROUP SAME PRODUCT
            // ==================================

            const groupKey =
                name
                    .toLowerCase()
                    .trim();


            if(!grouped.has(groupKey)){

                grouped.set(
                    groupKey,
                    {

                        name:name,

                        image:
                            image,

                        subCategory:
                            subCategory,

                        variants:[]

                    }
                );

            }


            const group =
                grouped.get(groupKey);


            // Use first available image

            if(
                !group.image &&
                image
            ){

                group.image =
                    image;

            }


            // UNIQUE VARIANT ID

            const id =
                makeProductID(
                    subCategory,
                    name,
                    weight
                );


            group.variants.push({

                id:id,

                weight:weight,

                price:price

            });

        });


    // ======================================
    // CREATE HTML
    // ======================================

    const html = [];


    grouped.forEach(
        product => {


            let variantsHTML =
                "";


            product.variants
                .forEach(
                    variant => {


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


                    let actionHTML;


                    // =================================
                    // ADD
                    // =================================

                    if(qty === 0){

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
                    // QUANTITY
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

                });


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

        item.qty++;

    }
    else{

        cart.push({

            id:String(id),

            qty:1

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


    item.qty +=
        change;


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
// REMOVE CART ITEM
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
// CART
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


            /*
            row[0] = subCategoryID
            row[1] = Product
            row[2] = Weight
            row[3] = Price
            row[4] = Status
            row[5] = Image
            */


            const product =
                row[1];


            const weight =
                row[2];


            const price =
                Number(row[3]) || 0;


            const image =
                row[5];


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
                row[1];


            const weight =
                row[2];


            const price =
                Number(row[3]) || 0;


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


// ==========================================
// START
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    async function(){

        const success =
            await loadData();


        if(!success){

            console.log(
                "Unable to load Google Sheet"
            );

            return;

        }


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