/* =========================================================
   JYOTI GRUH UDHYOG
   API.JS V36
   CATEGORY → SUB CATEGORY → PRODUCTS
========================================================= */


/* =========================================================
   CART
========================================================= */

let cart =
    JSON.parse(
        localStorage.getItem("cart") || "[]"
    );


function saveCart(){

    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );

}


/* =========================================================
   GOOGLE SHEET
========================================================= */

const SHEET =
"2PACX-1vStfoYZJzDES0lAav3gzVi4hHMrr-g-vu6oHbAecwVN7-j5ZfyZCE4wy5qE8oaH0fSw14Y97pHMmUrU";


const categoryURL =
`https://docs.google.com/spreadsheets/d/e/${SHEET}/pub?gid=2013716827&single=true&output=csv`;


const subCategoryURL =
`https://docs.google.com/spreadsheets/d/e/${SHEET}/pub?gid=35788410&single=true&output=csv`;


const productURL =
`https://docs.google.com/spreadsheets/d/e/${SHEET}/pub?gid=0&single=true&output=csv`;


/* =========================================================
   DATA
========================================================= */

let categoryRows = [];

let subCategoryRows = [];

let productRows = [];

let productMap = new Map();


/* =========================================================
   HELPERS
========================================================= */

function clean(value){

    return String(value ?? "")
        .replace(/^\uFEFF/, "")
        .trim();

}


function active(value){

    return clean(value)
        .toLowerCase() === "active";

}


function param(name){

    return new URLSearchParams(
        window.location.search
    ).get(name) || "";

}


/* =========================================================
   CSV PARSER
========================================================= */

function csvToArray(csv){

    const rows = [];

    let row = [];

    let value = "";

    let insideQuote = false;


    for(
        let i = 0;
        i < csv.length;
        i++
    ){

        const char =
            csv[i];

        const next =
            csv[i + 1];


        if(
            char === '"' &&
            insideQuote &&
            next === '"'
        ){

            value += '"';

            i++;

            continue;

        }


        if(char === '"'){

            insideQuote =
                !insideQuote;

            continue;

        }


        if(
            char === "," &&
            !insideQuote
        ){

            row.push(
                value.trim()
            );

            value = "";

            continue;

        }


        if(
            (
                char === "\n" ||
                char === "\r"
            ) &&
            !insideQuote
        ){

            if(
                char === "\r" &&
                next === "\n"
            ){

                i++;

            }


            row.push(
                value.trim()
            );


            if(
                row.some(
                    x => x !== ""
                )
            ){

                rows.push(row);

            }


            row = [];

            value = "";

            continue;

        }


        value += char;

    }


    if(
        value !== "" ||
        row.length
    ){

        row.push(
            value.trim()
        );


        if(
            row.some(
                x => x !== ""
            )
        ){

            rows.push(row);

        }

    }


    return rows;

}


/* =========================================================
   FETCH
========================================================= */

async function fetchCSV(url){

    const response =
        await fetch(
            url +
            "&_=" +
            Date.now(),
            {
                cache:"no-store"
            }
        );


    if(!response.ok){

        throw new Error(
            "Google Sheet Error: " +
            response.status
        );

    }


    const text =
        await response.text();


    if(
        !text.trim()
    ){

        throw new Error(
            "Empty Google Sheet"
        );

    }


    return text;

}


/* =========================================================
   LOAD DATA
========================================================= */

async function loadData(){

    console.log(
        "Jyoti V36: Loading Google Sheets..."
    );


    const result =
        await Promise.allSettled([

            fetchCSV(categoryURL),

            fetchCSV(subCategoryURL),

            fetchCSV(productURL)

        ]);


    /* =====================================================
       CATEGORY
    ===================================================== */

    if(
        result[0].status === "fulfilled"
    ){

        categoryRows =
            csvToArray(
                result[0].value
            );


        console.log(
            "CATEGORY DATA:",
            categoryRows
        );

    }
    else{

        console.error(
            "CATEGORY ERROR:",
            result[0].reason
        );

    }


    /* =====================================================
       SUB CATEGORY
    ===================================================== */

    if(
        result[1].status === "fulfilled"
    ){

        subCategoryRows =
            csvToArray(
                result[1].value
            );


        console.log(
            "SUB CATEGORY DATA:",
            subCategoryRows
        );

    }
    else{

        console.error(
            "SUB CATEGORY ERROR:",
            result[1].reason
        );

        subCategoryRows = [];

    }


    /* =====================================================
       PRODUCTS
    ===================================================== */

    if(
        result[2].status === "fulfilled"
    ){

        productRows =
            csvToArray(
                result[2].value
            );


        productMap.clear();


        productRows
            .slice(1)
            .forEach(
                row => {

                    if(
                        row &&
                        row[0]
                    ){

                        productMap.set(
                            clean(row[0]),
                            row
                        );

                    }

                }
            );


        console.log(
            "PRODUCT DATA:",
            productRows
        );

    }
    else{

        console.error(
            "PRODUCT ERROR:",
            result[2].reason
        );

        productRows = [];

        productMap.clear();

    }


    console.log(
        "Jyoti V36: DATA READY"
    );

}


/* =========================================================
   CATEGORY LIST
========================================================= */

function loadCategories(){

    const list =
        document.getElementById(
            "categoryList"
        );


    if(!list)
        return;


    const html = [];


    /*
       CATEGORY SHEET

       A = ID
       B = Category
       C = Status
       D = Images
    */


    categoryRows
        .slice(1)
        .forEach(
            row => {

                const id =
                    clean(row[0]);

                const name =
                    clean(row[1]);

                const status =
                    clean(row[2]);

                const image =
                    clean(row[3]) ||
                    "placeholder.webp";


                if(!id)
                    return;


                if(!name)
                    return;


                if(
                    !active(status)
                )
                    return;


                html.push(`

                    <div
                        class="category-card"
                        onclick="
                            openCategory('${id}')
                        "
                    >

                        <img
                            src="${image}"
                            alt="${name}"
                            loading="lazy"
                            decoding="async"
                            onerror="
                                this.src='placeholder.webp'
                            "
                        >

                        <h3>
                            ${name}
                        </h3>

                    </div>

                `);

            }
        );


    list.innerHTML =
        html.length
        ? html.join("")
        : `
            <div
                style="
                    grid-column:1/-1;
                    text-align:center;
                    padding:30px;
                "
            >
                <h3>
                    No Categories Found
                </h3>
            </div>
        `;

}


/* =========================================================
   FIND SUB CATEGORIES
========================================================= */

function getSubCategories(
    categoryId
){

    categoryId =
        clean(categoryId);


    return subCategoryRows
        .slice(1)
        .filter(
            row => {

                if(!row)
                    return false;


                /*
                   SUB CATEGORY SHEET

                   A = ID
                   B = Category ID
                   C = Sub Category
                   D = Status
                   E = Images
                */


                const parentId =
                    clean(row[1]);

                const status =
                    clean(row[3]);


                return (
                    parentId === categoryId &&
                    active(status)
                );

            }
        );

}


/* =========================================================
   CATEGORY CLICK
========================================================= */

function openCategory(
    categoryId
){

    categoryId =
        clean(categoryId);


    const subs =
        getSubCategories(
            categoryId
        );


    console.log(
        "CATEGORY CLICK:",
        categoryId
    );


    console.log(
        "ACTIVE SUB CATEGORIES:",
        subs
    );


    if(
        subs.length > 0
    ){

        /*
           Sub Category exists
        */

        window.location.href =
            "category.html?id=" +
            encodeURIComponent(
                categoryId
            );

    }
    else{

        /*
           No Sub Category

           Direct Products
        */

        window.location.href =
            "products.html?category=" +
            encodeURIComponent(
                categoryId
            );

    }

}


/* =========================================================
   SUB CATEGORY PAGE
========================================================= */

function loadSubCategories(){

    const list =
        document.getElementById(
            "subCategoryList"
        );


    if(!list)
        return;


    const categoryId =
        clean(
            param("id")
        );


    const subs =
        getSubCategories(
            categoryId
        );


    console.log(
        "SUB CATEGORY PAGE:",
        categoryId
    );


    console.log(
        "SUB CATEGORIES FOUND:",
        subs.length
    );


    /*
       Safety:
       If no active sub-category,
       direct products.
    */

    if(
        subs.length === 0
    ){

        window.location.replace(
            "products.html?category=" +
            encodeURIComponent(
                categoryId
            )
        );

        return;

    }


    const html = [];


    subs.forEach(
        row => {

            const id =
                clean(row[0]);

            const name =
                clean(row[2]);

            const image =
                clean(row[4]) ||
                "placeholder.webp";


            html.push(`

                <div
                    class="category-card"
                    onclick="
                        openSubCategory('${id}')
                    "
                >

                    <img
                        src="${image}"
                        alt="${name}"
                        loading="lazy"
                        decoding="async"
                        onerror="
                            this.src='placeholder.webp'
                        "
                    >

                    <h3>
                        ${name}
                    </h3>

                </div>

            `);

        }
    );


    list.innerHTML =
        html.join("");

}


/* =========================================================
   SUB CATEGORY CLICK
========================================================= */

function openSubCategory(
    subCategoryId
){

    subCategoryId =
        clean(
            subCategoryId
        );


    console.log(
        "SUB CATEGORY CLICK:",
        subCategoryId
    );


    window.location.href =
        "products.html?sub=" +
        encodeURIComponent(
            subCategoryId
        );

}


/* =========================================================
   PRODUCT FILTER
========================================================= */

function getFilteredProducts(){

    const subId =
        clean(
            param("sub")
        );


    const categoryId =
        clean(
            param("category")
        );


    console.log(
        "PRODUCT FILTER:",
        {
            categoryId,
            subId
        }
    );


    const products = [];


    /*
       PRODUCTS SHEET

       A = ID
       B = CategoryID
       C = SubCategoryID
       D = Product
       E = Weight
       F = Price
       G = Status
       H = Images
    */


    productRows
        .slice(1)
        .forEach(
            row => {

                if(
                    !row ||
                    !row[0]
                )
                    return;


                const id =
                    clean(row[0]);

                const rowCategory =
                    clean(row[1]);

                const rowSub =
                    clean(row[2]);

                const status =
                    clean(row[6]);


                if(
                    !active(status)
                )
                    return;


                /*
                   IMPORTANT

                   If Sub Category selected,
                   ONLY SubCategoryID is matched.
                */

                if(subId){

                    if(
                        rowSub !== subId
                    ){

                        return;

                    }

                }


                /*
                   Direct Category

                   Used only when there
                   is no sub parameter.
                */

                else if(categoryId){

                    if(
                        rowCategory !==
                        categoryId
                    ){

                        return;

                    }

                }


                products.push(row);

            }
        );


    console.log(
        "MATCHING PRODUCTS:",
        products.length
    );


    return products;

}


/* =========================================================
   PRODUCT CARD
========================================================= */

function createProductCard(
    row
){

    const id =
        clean(row[0]);

    const product =
        clean(row[3]);

    const weight =
        clean(row[4]);

    const price =
        Number(row[5]) || 0;

    const image =
        clean(row[7]) ||
        "placeholder.webp";


    const item =
        cart.find(
            x =>
            clean(x.id) === id
        );


    const qty =
        item
        ? Number(item.qty)
        : 0;


    let action = "";


    if(qty > 0){

        action = `

            <div
                class="premium-quantity"
            >

                <button
                    class="premium-qty-btn"
                    onclick="
                        changeQty('${id}',-1)
                    "
                >
                    −
                </button>

                <span
                    class="premium-qty-number"
                >
                    ${qty}
                </span>

                <button
                    class="premium-qty-btn"
                    onclick="
                        changeQty('${id}',1)
                    "
                >
                    +
                </button>

            </div>

        `;

    }
    else{

        action = `

            <button
                class="premium-add-btn"
                onclick="
                    addToCart('${id}')
                "
            >

                <span
                    class="add-symbol"
                >
                    +
                </span>

                Add

            </button>

        `;

    }


    return `

        <article
            class="product-card premium-product-card"
        >

            <div
                class="product-image-wrap"
            >

                <img
                    class="group-product-image"
                    src="${image}"
                    alt="${product}"
                    loading="lazy"
                    decoding="async"
                    onclick="
                        openImage('${image}')
                    "
                    onerror="
                        this.src='placeholder.webp'
                    "
                >

            </div>


            <div
                class="product-info"
            >

                <div
                    class="product-category-label"
                >
                    JYOTI GRUH UDHYOG
                </div>


                <h3
                    class="grouped-product-name"
                >
                    ${product}
                </h3>


                <div
                    class="product-meta"
                >

                    <span
                        class="product-weight"
                    >
                        ${weight}
                    </span>


                    <span
                        class="product-dot"
                    >
                        •
                    </span>


                    <span
                        class="product-price"
                    >
                        ₹${price}
                    </span>

                </div>


                <div
                    class="product-action"
                    id="cart-${id}"
                >

                    ${action}

                </div>

            </div>

        </article>

    `;

}


/* =========================================================
   LOAD PRODUCTS
========================================================= */

function loadProducts(
    searchText = ""
){

    const list =
        document.getElementById(
            "productList"
        );


    if(!list)
        return;


    const search =
        clean(
            searchText ||
            param("search")
        )
        .toLowerCase();


    let products =
        getFilteredProducts();


    /*
       SEARCH
    */

    if(search){

        products =
            products.filter(
                row => {

                    const name =
                        clean(row[3])
                        .toLowerCase();

                    const weight =
                        clean(row[4])
                        .toLowerCase();


                    return (
                        name.includes(search) ||
                        weight.includes(search)
                    );

                }
            );

    }


    const html =
        products.map(
            createProductCard
        );


    list.innerHTML =
        html.length
        ? html.join("")
        : `

            <div
                class="empty-search"
            >

                <div
                    class="empty-search-icon"
                >
                    🔍
                </div>

                <h3>
                    No Products Found
                </h3>

                <p>
                    No products available.
                </p>

            </div>

        `;


    const heading =
        document.querySelector(
            ".section-title"
        );


    if(heading){

        heading.innerHTML =
            `🛍️ All Products
             <span
                class="product-count"
             >
                ${products.length}
             </span>`;

    }

}


/* =========================================================
   SEARCH
========================================================= */

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
                                searchBox.value
                            );

                        }
                        else if(
                            searchBox.value
                                .trim()
                                .length >= 2
                        ){

                            window.location.href =
                                "products.html?search=" +
                                encodeURIComponent(
                                    searchBox.value.trim()
                                );

                        }

                    },
                    200
                );

        }
    );

}


/* =========================================================
   CART
========================================================= */

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
    )
        return;


    const total =
        cart.reduce(
            (
                sum,
                item
            ) =>
                sum +
                Number(
                    item.qty || 0
                ),
            0
        );


    button.style.display =
        total > 0
        ? "flex"
        : "none";


    count.textContent =
        total;

}


/* =========================================================
   ADD TO CART
========================================================= */

function addToCart(id){

    id =
        clean(id);


    const item =
        cart.find(
            p =>
            clean(p.id) === id
        );


    if(item){

        item.qty =
            Number(item.qty || 0) + 1;

    }
    else{

        cart.push({

            id:id,

            qty:1

        });

    }


    saveCart();

    updateCartButton();

    updateProductAction(id);

}


/* =========================================================
   UPDATE PRODUCT ACTION
========================================================= */

function updateProductAction(id){

    id =
        clean(id);


    const box =
        document.getElementById(
            "cart-" + id
        );


    if(!box)
        return;


    const item =
        cart.find(
            p =>
            clean(p.id) === id
        );


    const qty =
        item
        ? Number(item.qty)
        : 0;


    if(qty <= 0){

        box.innerHTML = `

            <button
                class="premium-add-btn"
                onclick="
                    addToCart('${id}')
                "
            >
                <span
                    class="add-symbol"
                >
                    +
                </span>
                Add
            </button>

        `;

        return;

    }


    box.innerHTML = `

        <div
            class="premium-quantity"
        >

            <button
                class="premium-qty-btn"
                onclick="
                    changeQty('${id}',-1)
                "
            >
                −
            </button>

            <span
                class="premium-qty-number"
            >
                ${qty}
            </span>

            <button
                class="premium-qty-btn"
                onclick="
                    changeQty('${id}',1)
                "
            >
                +
            </button>

        </div>

    `;

}


/* =========================================================
   CHANGE QTY
========================================================= */

function changeQty(
    id,
    change
){

    id =
        clean(id);


    const item =
        cart.find(
            p =>
            clean(p.id) === id
        );


    if(!item){

        if(
            Number(change) > 0
        ){

            cart.push({

                id:id,

                qty:1

            });

        }

    }
    else{

        item.qty =
            Number(item.qty) +
            Number(change);


        if(
            item.qty <= 0
        ){

            cart =
                cart.filter(
                    p =>
                    clean(p.id) !== id
                );

        }

    }


    saveCart();

    updateCartButton();

    updateProductAction(id);

    loadCart();

}


/* =========================================================
   CART PAGE
========================================================= */

function getProduct(id){

    return productMap.get(
        clean(id)
    ) || null;

}


function loadCart(){

    const list =
        document.getElementById(
            "cartList"
        );


    if(!list)
        return;


    if(
        cart.length === 0
    ){

        list.innerHTML = `

            <div
                class="empty-cart"
            >

                <div
                    class="empty-cart-icon"
                >
                    🛒
                </div>

                <h2>
                    Your Cart is Empty
                </h2>

            </div>

        `;

        updateCartButton();

        return;

    }


    let total = 0;

    const html = [];


    cart.forEach(
        item => {

            const row =
                getProduct(
                    item.id
                );


            if(!row)
                return;


            const product =
                clean(row[3]);

            const weight =
                clean(row[4]);

            const price =
                Number(row[5]) || 0;

            const image =
                clean(row[7]) ||
                "placeholder.webp";

            const qty =
                Number(item.qty) || 0;

            const itemTotal =
                price * qty;


            total += itemTotal;


            html.push(`

                <div
                    class="cart-item"
                >

                    <img
                        src="${image}"
                        alt="${product}"
                        onerror="
                            this.src='placeholder.webp'
                        "
                    >


                    <div
                        class="cart-info"
                    >

                        <h3>
                            ${product}
                        </h3>

                        <p>
                            ${weight}
                        </p>

                        <div
                            class="cart-price"
                        >
                            ₹${price}
                            ×
                            ${qty}
                            =
                            ₹${itemTotal}
                        </div>


                        <div
                            class="qty-box"
                        >

                            <button
                                class="qty-btn"
                                onclick="
                                    changeQty(
                                        '${item.id}',
                                        -1
                                    )
                                "
                            >
                                −
                            </button>


                            <span
                                class="qty-number"
                            >
                                ${qty}
                            </span>


                            <button
                                class="qty-btn"
                                onclick="
                                    changeQty(
                                        '${item.id}',
                                        1
                                    )
                                "
                            >
                                +
                            </button>

                        </div>

                    </div>

                </div>

            `);

        }
    );


    html.push(`

        <div
            class="cart-total"
        >

            <h2>
                Grand Total
            </h2>

            <div
                class="total-price"
            >
                ₹${total}
            </div>

            <button
                class="whatsapp-btn"
                onclick="
                    orderWhatsApp()
                "
            >
                📲 Order on WhatsApp
            </button>

        </div>

    `);


    list.innerHTML =
        html.join("");


    updateCartButton();

}


/* =========================================================
   WHATSAPP
========================================================= */

async function orderWhatsApp(){

    if(
        cart.length === 0
    )
        return;


    let total = 0;


    let message =
`🛒 *Jyoti Gruh Udhyog*

નવો ઓર્ડર

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
                clean(row[3]);

            const weight =
                clean(row[4]);

            const price =
                Number(row[5]) || 0;

            const qty =
                Number(item.qty) || 0;


            const itemTotal =
                price * qty;


            total += itemTotal;


            message +=
`📦 ${product}
⚖️ ${weight}
💰 ₹${price} × ${qty} = ₹${itemTotal}

`;

        }
    );


    message +=
`💵 *Total: ₹${total}*

🙏 આભાર`;


    window.open(
        "https://wa.me/919712149344?text=" +
        encodeURIComponent(
            message
        ),
        "_blank"
    );


    cart = [];

    saveCart();

    updateCartButton();

    loadCart();

    loadProducts();

}


/* =========================================================
   IMAGE
========================================================= */

function openImage(src){

    const modal =
        document.getElementById(
            "imageModal"
        );

    const image =
        document.getElementById(
            "zoomImage"
        );


    if(
        !modal ||
        !image
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


/* =========================================================
   INITIALIZE
========================================================= */

async function initializePage(){

    console.log(
        "Jyoti Gruh Udhyog V36 START"
    );


    try{

        await loadData();


        loadCategories();

        loadSubCategories();

        loadProducts();

        loadCart();

        updateCartButton();

        initSearch();


        console.log(
            "Jyoti V36 READY"
        );

    }
    catch(error){

        console.error(
            "Jyoti V36 ERROR:",
            error
        );

    }

}


/* =========================================================
   DOM READY
========================================================= */

if(
    document.readyState ===
    "loading"
){

    document.addEventListener(
        "DOMContentLoaded",
        initializePage
    );

}
else{

    initializePage();

}