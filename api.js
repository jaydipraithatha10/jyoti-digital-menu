/* =========================================================
   JYOTI GRUH UDHYOG
   API.JS V35
   CATEGORY → SUB CATEGORY → PRODUCTS
========================================================= */

let cart = JSON.parse(localStorage.getItem("cart") || "[]");

let categoryRows = [];
let subCategoryRows = [];
let productRows = [];

let productMap = new Map();


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
   HELPERS
========================================================= */

function clean(value){

    return String(value ?? "")
        .replace(/^\uFEFF/, "")
        .trim();

}


function isActive(value){

    const status =
        clean(value).toLowerCase();

    if(status === "")
        return true;

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

    return clean(value)
        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;")
        .replace(/'/g,"&#039;");

}


function getParam(name){

    return new URLSearchParams(
        window.location.search
    ).get(name) || "";

}


/* =========================================================
   CSV PARSER
========================================================= */

function csvToArray(csv){

    const result = [];

    let row = [];
    let cell = "";
    let quoted = false;


    for(let i = 0; i < csv.length; i++){

        const char = csv[i];
        const next = csv[i + 1];


        if(
            char === '"' &&
            quoted &&
            next === '"'
        ){

            cell += '"';
            i++;
            continue;

        }


        if(char === '"'){

            quoted = !quoted;
            continue;

        }


        if(
            char === "," &&
            !quoted
        ){

            row.push(cell.trim());
            cell = "";
            continue;

        }


        if(
            (
                char === "\n" ||
                char === "\r"
            ) &&
            !quoted
        ){

            if(
                char === "\r" &&
                next === "\n"
            ){

                i++;

            }


            row.push(cell.trim());


            if(
                row.some(
                    value => value !== ""
                )
            ){

                result.push(row);

            }


            row = [];
            cell = "";

            continue;

        }


        cell += char;

    }


    if(
        cell !== "" ||
        row.length
    ){

        row.push(cell.trim());


        if(
            row.some(
                value => value !== ""
            )
        ){

            result.push(row);

        }

    }


    return result;

}


/* =========================================================
   FETCH CSV
========================================================= */

async function fetchCSV(url){

    const separator =
        url.includes("?")
        ? "&"
        : "?";


    const response =
        await fetch(
            url +
            separator +
            "_=" +
            Date.now(),
            {
                cache:"no-store"
            }
        );


    if(!response.ok){

        throw new Error(
            "CSV Error " +
            response.status
        );

    }


    const text =
        await response.text();


    if(!text.trim()){

        throw new Error(
            "CSV is empty"
        );

    }


    return text;

}


/* =========================================================
   LOAD ALL DATA
========================================================= */

async function loadData(){

    console.log(
        "Jyoti V35: Loading Google Sheet..."
    );


    const results =
        await Promise.allSettled([

            fetchCSV(categoryURL),

            fetchCSV(subCategoryURL),

            fetchCSV(productURL)

        ]);


    /* =====================================================
       CATEGORY
    ===================================================== */

    if(
        results[0].status === "fulfilled"
    ){

        categoryRows =
            csvToArray(
                results[0].value
            );


        console.log(
            "Categories:",
            categoryRows
        );

    }
    else{

        console.error(
            "CATEGORY ERROR:",
            results[0].reason
        );


        throw new Error(
            "Category Sheet could not be loaded"
        );

    }


    /* =====================================================
       SUB CATEGORY
    ===================================================== */

    if(
        results[1].status === "fulfilled"
    ){

        subCategoryRows =
            csvToArray(
                results[1].value
            );


        console.log(
            "Sub Categories:",
            subCategoryRows
        );

    }
    else{

        console.warn(
            "SUB CATEGORY ERROR:",
            results[1].reason
        );


        subCategoryRows = [];

    }


    /* =====================================================
       PRODUCTS
    ===================================================== */

    if(
        results[2].status === "fulfilled"
    ){

        productRows =
            csvToArray(
                results[2].value
            );


        productMap.clear();


        productRows
            .slice(1)
            .forEach(row => {

                if(row && row[0]){

                    productMap.set(
                        clean(row[0]),
                        row
                    );

                }

            });


        console.log(
            "Products:",
            productRows.length
        );

    }
    else{

        console.warn(
            "PRODUCT ERROR:",
            results[2].reason
        );


        productRows = [];

        productMap.clear();

    }


    console.log(
        "Jyoti V35: Data Loaded Successfully"
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
        .forEach(row => {

            const id =
                clean(row[0]);

            const name =
                clean(row[1]);

            const status =
                clean(row[2]);

            const image =
                clean(row[3]) ||
                "placeholder.webp";


            if(!id || !name)
                return;


            if(!isActive(status))
                return;


            html.push(`

                <div
                    class="category-card"
                    onclick="
                        openCategory('${escapeHTML(id)}')
                    "
                >

                    <img
                        src="${escapeHTML(image)}"
                        alt="${escapeHTML(name)}"
                        loading="lazy"
                        decoding="async"
                        onerror="
                            this.src='placeholder.webp'
                        "
                    >

                    <h3>
                        ${escapeHTML(name)}
                    </h3>

                </div>

            `);

        });


    if(html.length === 0){

        list.innerHTML = `

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

        return;

    }


    list.innerHTML =
        html.join("");

}


/* =========================================================
   CHECK ACTIVE SUB CATEGORY
========================================================= */

function hasActiveSub(categoryId){

    return subCategoryRows
        .slice(1)
        .some(row => {

            const parentId =
                clean(row[1]);

            const status =
                clean(row[3]);


            return (
                parentId ===
                clean(categoryId)
                &&
                isActive(status)
            );

        });

}


/* =========================================================
   CATEGORY CLICK
========================================================= */

function openCategory(id){

    id =
        clean(id);


    console.log(
        "Category clicked:",
        id
    );


    if(
        hasActiveSub(id)
    ){

        /*
           Sub Category exists
        */

        window.location.href =
            "category.html?id=" +
            encodeURIComponent(id);

    }
    else{

        /*
           No Sub Category
           Direct Products
        */

        window.location.href =
            "products.html?category=" +
            encodeURIComponent(id);

    }

}


/* =========================================================
   SUB CATEGORY LIST
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
            getParam("id")
        );


    const html = [];


    console.log(
        "Loading Sub Categories for:",
        categoryId
    );


    /*
       SUB CATEGORY SHEET

       A = ID
       B = Category ID
       C = Sub Category
       D = Status
       E = Images
    */


    subCategoryRows
        .slice(1)
        .forEach(row => {

            const id =
                clean(row[0]);

            const parentId =
                clean(row[1]);

            const name =
                clean(row[2]);

            const status =
                clean(row[3]);

            const image =
                clean(row[4]) ||
                "placeholder.webp";


            if(!id || !name)
                return;


            if(
                parentId !==
                categoryId
            )
                return;


            if(
                !isActive(status)
            )
                return;


            html.push(`

                <div
                    class="category-card"
                    onclick="
                        window.location.href=
                        'products.html?sub=${encodeURIComponent(id)}'
                    "
                >

                    <img
                        src="${escapeHTML(image)}"
                        alt="${escapeHTML(name)}"
                        loading="lazy"
                        decoding="async"
                        onerror="
                            this.src='placeholder.webp'
                        "
                    >

                    <h3>
                        ${escapeHTML(name)}
                    </h3>

                </div>

            `);

        });


    /*
       Safety:
       If no active sub category,
       direct products.
    */

    if(html.length === 0){

        window.location.replace(
            "products.html?category=" +
            encodeURIComponent(categoryId)
        );

        return;

    }


    list.innerHTML =
        html.join("");

}


/* =========================================================
   GET PRODUCT
========================================================= */

function getProduct(id){

    return (
        productMap.get(
            clean(id)
        ) || null
    );

}


/* =========================================================
   PRODUCT CARD
========================================================= */

function createProductCard(row){

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


    let action;


    if(qty > 0){

        action = `

            <div
                class="premium-quantity"
            >

                <button
                    class="premium-qty-btn"
                    onclick="
                        changeQty('${escapeHTML(id)}',-1)
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
                        changeQty('${escapeHTML(id)}',1)
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
                    addToCart('${escapeHTML(id)}')
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
                    src="${escapeHTML(image)}"
                    alt="${escapeHTML(product)}"
                    loading="lazy"
                    decoding="async"
                    onclick="
                        openImage('${escapeHTML(image)}')
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
                    ${escapeHTML(product)}
                </h3>


                <div
                    class="product-meta"
                >

                    <span
                        class="product-weight"
                    >
                        ${escapeHTML(weight)}
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
                    id="cart-${escapeHTML(id)}"
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


    const subId =
        clean(
            getParam("sub")
        );


    const categoryId =
        clean(
            getParam("category")
        );


    const search =
        clean(
            searchText ||
            getParam("search")
        )
        .toLowerCase();


    const html = [];


    /*
       PRODUCTS SHEET

       B = Category ID
       C = Sub Category ID
       G = Status
    */


    productRows
        .slice(1)
        .forEach(row => {

            if(
                !row ||
                !row[0]
            )
                return;


            const rowCategory =
                clean(row[1]);


            const rowSubCategory =
                clean(row[2]);


            const product =
                clean(row[3]);


            const weight =
                clean(row[4]);


            const status =
                clean(row[6]);


            if(
                !isActive(status)
            )
                return;


            /*
               Sub Category filter
            */

            if(subId){

                if(
                    rowSubCategory !==
                    subId
                ){

                    return;

                }

            }


            /*
               Direct Category filter
            */

            else if(categoryId){

                if(
                    rowCategory !==
                    categoryId
                ){

                    return;

                }

            }


            /*
               Search filter
            */

            if(search){

                const text =
                    (
                        product +
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


            html.push(
                createProductCard(row)
            );

        });


    if(html.length){

        list.innerHTML =
            html.join("");

    }
    else{

        list.innerHTML = `

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

    }


    const heading =
        document.querySelector(
            ".section-title"
        );


    if(heading){

        heading.innerHTML = `

            🛍️ All Products

            <span
                class="product-count"
            >
                ${html.length}
            </span>

        `;

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
   CART BUTTON
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


    if(!button || !count)
        return;


    const total =
        cart.reduce(
            (sum,item) =>
                sum +
                Number(item.qty || 0),
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
   ADD CART
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
   UPDATE PRODUCT BUTTON
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
                    addToCart('${escapeHTML(id)}')
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
                    changeQty('${escapeHTML(id)}',-1)
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
                    changeQty('${escapeHTML(id)}',1)
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
            Number(item.qty || 0) +
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
   REMOVE CART
========================================================= */

function removeCartItem(id){

    id =
        clean(id);


    cart =
        cart.filter(
            p =>
            clean(p.id) !== id
        );


    saveCart();

    updateCartButton();

    loadProducts();

    loadCart();

}


/* =========================================================
   CART PAGE
========================================================= */

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

                <p>
                    Add your favourite products to continue.
                </p>

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
                getProduct(item.id);


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


            total +=
                itemTotal;


            html.push(`

                <div
                    class="cart-item"
                >

                    <img
                        src="${escapeHTML(image)}"
                        alt="${escapeHTML(product)}"
                        onerror="
                            this.src='placeholder.webp'
                        "
                    >


                    <div
                        class="cart-info"
                    >

                        <h3>
                            ${escapeHTML(product)}
                        </h3>

                        <p>
                            ${escapeHTML(weight)}
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
                                        '${escapeHTML(item.id)}',
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
                                        '${escapeHTML(item.id)}',
                                        1
                                    )
                                "
                            >
                                +
                            </button>

                        </div>


                        <button
                            class="remove-btn"
                            onclick="
                                removeCartItem(
                                    '${escapeHTML(item.id)}'
                                )
                            "
                        >
                            🗑 Remove
                        </button>

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

    await loadData();


    if(!cart.length)
        return;


    let total = 0;


    let message =
`🛒 *Jyoti Gruh Udhyog*

નવો ઓર્ડર

`;


    cart.forEach(
        item => {

            const row =
                getProduct(item.id);


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


            total +=
                itemTotal;


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


    const url =
        "https://wa.me/919712149344?text=" +
        encodeURIComponent(
            message
        );


    window.open(
        url,
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
        document.getElementById(
            "imageModal"
        );


    const image =
        document.getElementById(
            "zoomImage"
        );


    if(!modal || !image)
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


document.addEventListener(
    "keydown",
    function(event){

        if(
            event.key === "Escape"
        ){

            closeImage();

        }

    }
);


/* =========================================================
   INITIALIZE
========================================================= */

async function initializePage(){

    console.log(
        "Jyoti Gruh Udhyog V35 starting..."
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
            "Jyoti V35 READY"
        );

    }
    catch(error){

        console.error(
            "Jyoti V35 ERROR:",
            error
        );


        const categoryList =
            document.getElementById(
                "categoryList"
            );


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
            document.getElementById(
                "productList"
            );


        if(productList){

            productList.innerHTML = `

                <div
                    class="empty-search"
                >

                    <h3>
                        Products Could Not Be Loaded
                    </h3>

                </div>

            `;

        }

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


/* =========================================================
   PAGE SHOW
========================================================= */

window.addEventListener(
    "pageshow",
    function(){

        cart =
            JSON.parse(
                localStorage.getItem(
                    "cart"
                ) || "[]"
            );


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