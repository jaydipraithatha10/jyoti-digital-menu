/* =========================================================
   JYOTI GRUH UDHYOG
   API.JS V22
   PREMIUM DIGITAL MENU
========================================================= */


/* =========================================================
   CART
========================================================= */

let cart =
    JSON.parse(localStorage.getItem("cart")) || [];


function saveCart(){

    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );

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

const CACHE_DURATION =
    5 * 60 * 1000;


/* IMPORTANT:
   V22 automatically bypasses old V21 cache
*/

const STORAGE_KEY =
    "jyoti_data_cache_v22";


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
   CACHE
========================================================= */

function saveCache(){

    const data = {

        categoryRows,
        subCategoryRows,
        productRows,

        time: Date.now()

    };


    try{

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(data)
        );

    }
    catch(error){

        console.warn(
            "Cache save failed:",
            error
        );

    }

}


function loadCache(){

    const cache =
        localStorage.getItem(
            STORAGE_KEY
        );


    if(!cache)
        return false;


    try{

        const data =
            JSON.parse(cache);


        if(
            !data.time ||
            Date.now() - data.time >
            CACHE_DURATION
        ){

            return false;

        }


        categoryRows =
            Array.isArray(data.categoryRows)
            ? data.categoryRows
            : [];


        subCategoryRows =
            Array.isArray(data.subCategoryRows)
            ? data.subCategoryRows
            : [];


        productRows =
            Array.isArray(data.productRows)
            ? data.productRows
            : [];


        buildProductMap();


        dataLoaded = true;

        cacheTime =
            data.time;


        console.log(
            "Jyoti data loaded from V22 cache"
        );


        return true;

    }
    catch(error){

        console.warn(
            "Cache error:",
            error
        );


        localStorage.removeItem(
            STORAGE_KEY
        );


        return false;

    }

}


/* =========================================================
   PRODUCT MAP
========================================================= */

function buildProductMap(){

    productMap.clear();


    productRows
        .slice(1)
        .forEach(row=>{

            if(
                row &&
                row[0]
            ){

                productMap.set(
                    String(row[0]).trim(),
                    row
                );

            }

        });


    console.log(
        "Products mapped:",
        productMap.size
    );

}


/* =========================================================
   CSV FETCH
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
                cache: "no-store"
            }
        );


    if(!response.ok){

        throw new Error(
            "CSV data load failed: " +
            response.status
        );

    }


    return await response.text();

}


/* =========================================================
   IMPROVED CSV PARSER
   Supports commas inside quoted cells
========================================================= */

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


        /* Double quote inside quoted cell */

        if(
            char === '"' &&
            insideQuotes &&
            next === '"'
        ){

            cell += '"';

            i++;

        }


        /* Start / end quoted cell */

        else if(
            char === '"'
        ){

            insideQuotes =
                !insideQuotes;

        }


        /* Column separator */

        else if(
            char === "," &&
            !insideQuotes
        ){

            row.push(
                cell.trim()
            );

            cell = "";

        }


        /* New row */

        else if(
            (char === "\n" ||
             char === "\r") &&
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
                    value !== ""
                )
            ){

                rows.push(row);

            }


            row = [];

            cell = "";

        }


        else{

            cell += char;

        }

    }


    /* Last row */

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


/* =========================================================
   CLEAN VALUE
========================================================= */

function cleanValue(value){

    return String(
        value ?? ""
    )
    .replace(/^\uFEFF/, "")
    .trim();

}


/* =========================================================
   ACTIVE CHECK
========================================================= */

function isActive(value){

    const status =
        cleanValue(value)
        .toLowerCase();


    const activeValues = [

        "active",
        "enable",
        "enabled",
        "yes",
        "true",
        "1",
        "show",
        "visible"

    ];


    /* Empty status is also allowed.
       This prevents all categories disappearing
       if status column is not being used.
    */

    if(status === "")
        return true;


    return activeValues.includes(
        status
    );

}


/* =========================================================
   URL PARAMETER
========================================================= */

function getParam(name){

    return new URLSearchParams(
        window.location.search
    ).get(name);

}


/* =========================================================
   PRODUCT LOOKUP
========================================================= */

function getProduct(id){

    if(
        id === undefined ||
        id === null
    ){

        return null;

    }


    return productMap.get(
        cleanValue(id)
    ) || null;

}


/* =========================================================
   LOAD ALL DATA
========================================================= */

async function loadData(){

    if(
        dataLoaded &&
        Date.now() - cacheTime <
        CACHE_DURATION
    ){

        return;

    }


    /* Try V22 cache first */

    if(loadCache()){

        return;

    }


    console.log(
        "Loading Jyoti data from Google Sheet..."
    );


    try{

        const [
            catCSV,
            subCSV,
            proCSV
        ] =
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
            csvToArray(catCSV);


        subCategoryRows =
            csvToArray(subCSV);


        productRows =
            csvToArray(proCSV);


        console.log(
            "Category rows:",
            categoryRows.length
        );


        console.log(
            "Sub-category rows:",
            subCategoryRows.length
        );


        console.log(
            "Product rows:",
            productRows.length
        );


        buildProductMap();


        dataLoaded = true;

        cacheTime =
            Date.now();


        saveCache();

    }
    catch(error){

        console.error(
            "Google Sheet Error:",
            error
        );


        throw error;

    }

}


/* =========================================================
   CATEGORY LIST
========================================================= */

async function loadCategories(){

    const list =
        document.getElementById(
            "categoryList"
        );


    if(!list)
        return;


    const html = [];


    console.log(
        "Rendering categories..."
    );


    categoryRows
        .slice(1)
        .forEach(row=>{

            if(
                !row ||
                !row[0]
            ){

                return;

            }


            const id =
                cleanValue(
                    row[0]
                );


            const name =
                cleanValue(
                    row[1]
                );


            const status =
                cleanValue(
                    row[2]
                );


            const image =
                cleanValue(
                    row[3]
                ) ||
                "placeholder.webp";


            if(!id)
                return;


            if(!name)
                return;


            if(
                !isActive(status)
            ){

                console.log(
                    "Category hidden:",
                    name,
                    status
                );

                return;

            }


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

                    <h3>
                        ${escapeHTML(name)}
                    </h3>

                </div>

            `);

        });


    if(
        html.length === 0
    ){

        list.innerHTML = `

            <div
                class="empty-search"
                style="
                    grid-column:1/-1;
                    text-align:center;
                    padding:30px;
                "
            >

                <div
                    class="empty-search-icon"
                >
                    📂
                </div>

                <h3>
                    Categories Not Found
                </h3>

                <p>
                    Please check your Google Sheet category data.
                </p>

            </div>

        `;


        console.warn(
            "No categories available."
        );


        return;

    }


    list.innerHTML =
        html.join("");


    console.log(
        "Categories displayed:",
        html.length
    );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value){

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================================
   OPEN CATEGORY
========================================================= */

function openCategory(id){

    const categoryId =
        cleanValue(id);


    if(!categoryId)
        return;


    const hasSubCategory =
        subCategoryRows
            .slice(1)
            .some(row=>{

                if(
                    !row ||
                    !row[1]
                ){

                    return false;

                }


                const parentId =
                    cleanValue(
                        row[1]
                    );


                const status =
                    cleanValue(
                        row[3]
                    );


                return (

                    parentId ===
                    categoryId &&

                    isActive(status)

                );

            });


    console.log(
        "Opening category:",
        categoryId,
        "Has sub-category:",
        hasSubCategory
    );


    if(hasSubCategory){

        location.href =
            "category.html?id=" +
            encodeURIComponent(
                categoryId
            );

    }
    else{

        location.href =
            "products.html?category=" +
            encodeURIComponent(
                categoryId
            );

    }

}


/* =========================================================
   SUB CATEGORY
========================================================= */

async function loadSubCategories(){

    const list =
        document.getElementById(
            "subCategoryList"
        );


    if(!list)
        return;


    const categoryId =
        cleanValue(
            getParam("id")
        );


    const html = [];


    subCategoryRows
        .slice(1)
        .forEach(row=>{

            if(
                !row ||
                !row[0]
            ){

                return;

            }


            const id =
                cleanValue(
                    row[0]
                );


            const parentId =
                cleanValue(
                    row[1]
                );


            const name =
                cleanValue(
                    row[2]
                );


            const status =
                cleanValue(
                    row[3]
                );


            const image =
                cleanValue(
                    row[4]
                ) ||
                "placeholder.webp";


            if(!id || !name)
                return;


            if(
                !isActive(status)
            ){

                return;

            }


            if(
                parentId !==
                categoryId
            ){

                return;

            }


            html.push(`

                <div
                    class="category-card"
                    onclick="
                        location.href='products.html?sub=${encodeURIComponent(id)}'
                    "
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


    if(
        html.length === 0
    ){

        list.innerHTML = `

            <div
                class="empty-search"
                style="grid-column:1/-1;"
            >

                <div>
                    📂
                </div>

                <h3>
                    No Sub Categories Found
                </h3>

            </div>

        `;

        return;

    }


    list.innerHTML =
        html.join("");

}


/* =========================================================
   PREMIUM PRODUCT CARD
========================================================= */

function createProductCard(row){

    const id =
        cleanValue(
            row[0]
        );


    const product =
        cleanValue(
            row[3]
        );


    const weight =
        cleanValue(
            row[4]
        );


    const price =
        Number(
            cleanValue(row[5])
        ) || 0;


    const image =
        cleanValue(
            row[7]
        ) ||
        "placeholder.webp";


    const cartItem =
        cart.find(
            item =>
            String(item.id) ===
            String(id)
        );


    const qty =
        cartItem
        ? Number(cartItem.qty)
        : 0;


    let actionHTML;


    if(qty === 0){

        actionHTML = `

            <button
                class="premium-add-btn"
                onclick="addToCart('${escapeHTML(id)}')"
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
    else{

        actionHTML = `

            <div
                class="premium-quantity"
            >

                <button
                    class="premium-qty-btn"
                    onclick="changeQty('${escapeHTML(id)}',-1)"
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
                    onclick="changeQty('${escapeHTML(id)}',1)"
                >
                    +
                </button>

            </div>

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
                    onclick="openImage('${escapeHTML(image)}')"
                    onerror="this.src='placeholder.webp'"
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

                    ${actionHTML}

                </div>

            </div>

        </article>

    `;

}


/* =========================================================
   LOAD PRODUCTS
========================================================= */

async function loadProducts(
    searchText = ""
){

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
        getParam("search");


    const search =
        String(
            searchText ||
            urlSearch ||
            ""
        )
        .trim()
        .toLowerCase();


    const html = [];

    let totalProducts = 0;


    productRows
        .slice(1)
        .forEach(row=>{

            if(
                !row ||
                !row[0]
            ){

                return;

            }


            const categoryIdRow =
                cleanValue(
                    row[1]
                );


            const subCategoryIdRow =
                cleanValue(
                    row[2]
                );


            const product =
                cleanValue(
                    row[3]
                );


            const weight =
                cleanValue(
                    row[4]
                );


            const status =
                cleanValue(
                    row[6]
                );


            if(
                !isActive(status)
            ){

                return;

            }


            if(
                subId &&
                subCategoryIdRow !==
                cleanValue(subId)
            ){

                return;

            }


            if(
                categoryId &&
                !subId &&
                categoryIdRow !==
                cleanValue(categoryId)
            ){

                return;

            }


            if(search){

                const searchableText =
                    (
                        product +
                        " " +
                        weight
                    )
                    .toLowerCase();


                if(
                    !searchableText.includes(
                        search
                    )
                ){

                    return;

                }

            }


            totalProducts++;


            html.push(
                createProductCard(row)
            );

        });


    if(
        html.length === 0
    ){

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
                    Try another product name.
                </p>

            </div>

        `;

    }
    else{

        list.innerHTML =
            html.join("");

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
                    ()=>{

                        const productList =
                            document.getElementById(
                                "productList"
                            );


                        const categoryList =
                            document.getElementById(
                                "categoryList"
                            );


                        if(productList){

                            loadProducts(
                                text
                            );

                        }
                        else if(
                            categoryList
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
                    200
                );

        }
    );

}


/* =========================================================
   ADD TO CART
========================================================= */

function addToCart(id){

    const cleanId =
        cleanValue(id);


    const item =
        cart.find(
            p =>
            cleanValue(p.id) ===
            cleanId
        );


    if(item){

        item.qty =
            Number(item.qty || 0) +
            1;

    }
    else{

        cart.push({

            id: cleanId,

            qty: 1

        });

    }


    saveCart();

    updateCartButton();

    updateProductAction(
        cleanId
    );

}


/* =========================================================
   UPDATE PRODUCT ACTION
========================================================= */

function updateProductAction(id){

    const cleanId =
        cleanValue(id);


    const container =
        document.getElementById(
            `cart-${cleanId}`
        );


    if(!container)
        return;


    const item =
        cart.find(
            p =>
            cleanValue(p.id) ===
            cleanId
        );


    const qty =
        item
        ? Number(item.qty)
        : 0;


    if(qty <= 0){

        container.innerHTML = `

            <button
                class="premium-add-btn"
                onclick="addToCart('${escapeHTML(cleanId)}')"
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


    container.innerHTML = `

        <div
            class="premium-quantity"
        >

            <button
                class="premium-qty-btn"
                onclick="changeQty('${escapeHTML(cleanId)}',-1)"
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
                onclick="changeQty('${escapeHTML(cleanId)}',1)"
            >
                +
            </button>

        </div>

    `;

}


/* =========================================================
   CHANGE QUANTITY
========================================================= */

function changeQty(
    id,
    change
){

    const cleanId =
        cleanValue(id);


    const item =
        cart.find(
            p =>
            cleanValue(p.id) ===
            cleanId
        );


    if(!item){

        if(change > 0){

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


        if(
            item.qty <= 0
        ){

            cart =
                cart.filter(
                    p =>
                    cleanValue(p.id) !==
                    cleanId
                );

        }

    }


    saveCart();

    updateCartButton();

    updateProductAction(
        cleanId
    );


    loadCart();

}


/* =========================================================
   REMOVE CART ITEM
========================================================= */

function removeCartItem(id){

    const cleanId =
        cleanValue(id);


    cart =
        cart.filter(
            item =>
            cleanValue(item.id) !==
            cleanId
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
            (sum,item)=>
                sum +
                Number(
                    item.qty || 0
                ),
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


/* =========================================================
   CART PAGE
========================================================= */

async function loadCart(){

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


    let html = [];

    let grandTotal = 0;


    cart.forEach(item=>{

        const row =
            getProduct(
                item.id
            );


        if(!row)
            return;


        const product =
            cleanValue(
                row[3]
            );


        const weight =
            cleanValue(
                row[4]
            );


        const price =
            Number(
                cleanValue(row[5])
            ) || 0;


        const image =
            cleanValue(
                row[7]
            ) ||
            "placeholder.webp";


        const qty =
            Number(
                item.qty
            ) || 0;


        const total =
            price * qty;


        grandTotal +=
            total;


        html.push(`

            <div
                class="cart-item"
            >

                <img
                    src="${escapeHTML(image)}"
                    alt="${escapeHTML(product)}"
                    loading="lazy"
                    onerror="this.src='placeholder.webp'"
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
                        ₹${price} × ${qty}
                        = ₹${total}
                    </div>


                    <div
                        class="qty-box"
                    >

                        <button
                            class="qty-btn"
                            onclick="changeQty('${escapeHTML(item.id)}',-1)"
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

        <div
            class="cart-total"
        >

            <h2>
                Grand Total
            </h2>


            <div
                class="total-price"
            >
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


/* =========================================================
   WHATSAPP ORDER
========================================================= */

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

`;


    cart.forEach(item=>{

        const row =
            getProduct(
                item.id
            );


        if(!row)
            return;


        const product =
            cleanValue(
                row[3]
            );


        const weight =
            cleanValue(
                row[4]
            );


        const price =
            Number(
                cleanValue(row[5])
            ) || 0;


        const qty =
            Number(
                item.qty
            ) || 0;


        const total =
            price * qty;


        grandTotal +=
            total;


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
        encodeURIComponent(
            message
        );


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
    ){

        return;

    }


    image.src =
        src;


    modal.classList.add(
        "show"
    );

}


/* =========================================================
   CLOSE IMAGE
========================================================= */

function closeImage(){

    const modal =
        document.getElementById(
            "imageModal"
        );


    if(!modal)
        return;


    modal.classList.remove(
        "show"
    );

}


/* =========================================================
   ESC KEY
========================================================= */

document.addEventListener(
    "keydown",
    event=>{

        if(
            event.key ===
            "Escape"
        ){

            closeImage();

        }

    }
);


/* =========================================================
   INITIALIZE PAGE
========================================================= */

async function initializePage(){

    console.log(
        "Jyoti Gruh Udhyog V22 starting..."
    );


    try{

        await loadData();


        await Promise.all([

            loadCategories(),

            loadSubCategories(),

            loadProducts(),

            loadCart()

        ]);


        updateCartButton();

        initSearch();


        console.log(
            "Jyoti Gruh Udhyog V22 ready."
        );

    }
    catch(error){

        console.error(
            "Jyoti Gruh Udhyog initialization error:",
            error
        );


        const categoryList =
            document.getElementById(
                "categoryList"
            );


        if(categoryList){

            categoryList.innerHTML = `

                <div
                    class="empty-search"
                    style="
                        grid-column:1/-1;
                        text-align:center;
                        padding:30px;
                    "
                >

                    <div
                        class="empty-search-icon"
                    >
                        ⚠️
                    </div>

                    <h3>
                        Categories could not be loaded
                    </h3>

                    <p>
                        Please refresh the page.
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

                    <div
                        class="empty-search-icon"
                    >
                        ⚠️
                    </div>

                    <h3>
                        Products could not be loaded
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
    ()=>{

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