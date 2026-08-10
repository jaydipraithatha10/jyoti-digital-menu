// ==========================================
// JYOTI GRUH UDHYOG
// API.JS V11
// PRODUCTS SHEET EXACT COLUMN VERSION
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


// New cache key
const STORAGE_KEY =
    "jyoti_data_cache_v11";


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


        // Double quote inside quoted cell
        if(
            char === '"' &&
            insideQuotes &&
            next === '"'
        ){

            cell += '"';

            i++;

        }


        // Start / end quote
        else if(
            char === '"'
        ){

            insideQuotes =
                !insideQuotes;

        }


        // Comma
        else if(
            char === "," &&
            !insideQuotes
        ){

            row.push(
                cell.trim()
            );

            cell = "";

        }


        // New line
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

            cell = "";


            if(
                row.some(
                    x => x !== ""
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


    // Last row

    if(
        cell !== "" ||
        row.length > 0
    ){

        row.push(
            cell.trim()
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
            "Google Sheet load failed: " +
            response.status
        );

    }


    return await response.text();

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
            Date.now() -
            data.time >
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
// URL PARAM
// ==========================================

function getParam(name){

    return new URLSearchParams(
        window.location.search
    ).get(name);

}


// ==========================================
// PRODUCT UNIQUE ID
// ==========================================

function makeProductID(
    originalID
){

    return String(
        originalID
    ).trim();

}


// ==========================================
// PRODUCT MAP
//
// PRODUCTS SHEET:
//
// A = ID
// B = CategoryID
// C = SubCategoryID
// D = Product
// E = Weight
// F = Price
// G = Status
// H = Images
// ==========================================

function buildProductMap(){

    productMap.clear();


    productRows
        .slice(1)
        .forEach(row => {

            const id =
                String(
                    row[0] || ""
                ).trim();


            if(!id)
                return;


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
        Date.now() -
        cacheTime <
        CACHE_DURATION
    ){

        return true;

    }


    if(
        loadCache()
    ){

        return true;

    }


    try{

        const result =
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
            "Jyoti V11 data loaded"
        );


        console.log(
            "Products:",
            productRows.length - 1
        );


        return true;

    }
    catch(error){

        console.error(
            "LOAD DATA ERROR:",
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
                )
                .trim()
                .toLowerCase();


            const image =
                String(
                    row[3] || ""
                ).trim();


            if(
                !id ||
                !name ||
                status !==
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

                const parentID =
                    String(
                        row[1] || ""
                    ).trim();


                const status =
                    String(
                        row[3] || ""
                    )
                    .trim()
                    .toLowerCase();


                return (

                    parentID ===
                    String(id)

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
// SUB CATEGORY
// ==========================================

function loadSubCategories(){

    const list =
        document.getElementById(
            "subCategoryList"
        );


    if(!list)
        return;


    const categoryID =
        String(
            getParam("id") || ""
        ).trim();


    const html = [];


    subCategoryRows
        .slice(1)
        .forEach(row => {

            const id =
                String(
                    row[0] || ""
                ).trim();


            const parentID =
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
                )
                .trim()
                .toLowerCase();


            const image =
                String(
                    row[4] || ""
                ).trim();


            if(
                parentID !==
                categoryID
            ){

                return;

            }


            if(
                status !==
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
// ==========================================
//
// EXACT PRODUCTS SHEET:
//
// A ID
// B CategoryID
// C SubCategoryID
// D Product
// E Weight
// F Price
// G Status
// H Images
//
// SAME PRODUCT NAME = ONE CARD
// ==========================================

function loadProducts(
    searchText = ""
){

    const list =
        document.getElementById(
            "productList"
        );


    if(!list)
        return;


    const categoryID =
        String(
            getParam("category") || ""
        ).trim();


    const subCategoryID =
        String(
            getParam("sub") || ""
        ).trim();


    const urlSearch =
        getParam("search") || "";


    const search =
        String(
            searchText ||
            urlSearch
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

            // EXACT COLUMN MAPPING

            const id =
                String(
                    row[0] || ""
                ).trim();


            const rowCategoryID =
                String(
                    row[1] || ""
                ).trim();


            const rowSubCategoryID =
                String(
                    row[2] || ""
                ).trim();


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
                        /[^\d.]/g,
                        ""
                    )
                ) || 0;


            const status =
                String(
                    row[6] || ""
                )
                .trim()
                .toLowerCase();


            const image =
                String(
                    row[7] || ""
                ).trim();


            // =================================
            // BASIC VALIDATION
            // =================================

            if(
                !id ||
                !product
            ){

                return;

            }


            // =================================
            // ACTIVE
            // =================================

            if(
                status !==
                "active"
            ){

                return;

            }


            // =================================
            // SUB CATEGORY FILTER
            // =================================

            if(
                subCategoryID
            ){

                if(
                    rowSubCategoryID !==
                    subCategoryID
                ){

                    return;

                }

            }


            // =================================
            // CATEGORY FILTER
            // =================================

            else if(
                categoryID
            ){

                if(
                    rowCategoryID !==
                    categoryID
                ){

                    return;

                }

            }


            // =================================
            // SEARCH
            // =================================

            if(search){

                const text =
                    (
                        product +
                        " " +
                        weight
                    )
                    .toLowerCase();


                if(
                    !text.includes(
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
                (
                    rowCategoryID +
                    "|" +
                    rowSubCategoryID +
                    "|" +
                    product
                        .toLowerCase()
                        .trim()
                );


            if(
                !grouped.has(
                    groupKey
                )
            ){

                grouped.set(
                    groupKey,
                    {

                        name:
                            product,

                        image:
                            image,

                        variants:[]

                    }
                );

            }


            const group =
                grouped.get(
                    groupKey
                );


            // If first row has no image,
            // use next available image.

            if(
                !group.image &&
                image
            ){

                group.image =
                    image;

            }


            // =================================
            // VARIANT
            // =================================

            group.variants.push({

                id:id,

                weight:weight,

                price:price

            });

        });


    // ======================================
    // SORT VARIANTS
    // ======================================

    grouped.forEach(
        product => {

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

        }
    );


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


                    // =================================
                    // BUTTON
                    // =================================

                    let actionHTML;


                    if(
                        qty <= 0
                    ){

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


                    // =================================
                    // ROW
                    // =================================

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


            // =================================
            // CARD
            // =================================

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
    // PRODUCT COUNT
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


    console.log(
        "Products displayed:",
        grouped.size
    );

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

        item.qty =
            Number(item.qty || 0) +
            1;

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


    item.qty =
        Number(item.qty || 0) +
        Number(change);


    if(
        item.qty <= 0
    ){

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
                Number(
                    item.qty || 0
                ),
            0
        );


    if(
        total <= 0
    ){

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


    if(
        cart.length === 0
    ){

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


            // EXACT COLUMNS

            const product =
                row[3];


            const weight =
                row[4];


            const price =
                Number(
                    String(
                        row[5] || ""
                    )
                    .replace(
                        /[^\d.]/g,
                        ""
                    )
                ) || 0;


            const image =
                row[7];


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

₹${price} × ${qty}
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
    ${qty}
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
                row[3];


            const weight =
                row[4];


            const price =
                Number(
                    String(
                        row[5] || ""
                    )
                    .replace(
                        /[^\d.]/g,
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
// IMAGE MODAL
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