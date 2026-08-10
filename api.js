// ======================================
// JYOTI GRUH UDHYOG
// API.JS V11
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

let productList = [];

let dataLoaded = false;

let cacheTime = 0;

const CACHE_DURATION =
    5 * 60 * 1000;


// New cache key
// જેથી જૂનો wrong cache load ન થાય
const STORAGE_KEY =
    "jyoti_data_cache_v11";


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
// CSV PARSER
// ======================================

function csvToArray(csv){

    const rows = [];

    let row = [];
    let value = "";
    let insideQuotes = false;


    for(
        let i = 0;
        i < csv.length;
        i++
    ){

        const char = csv[i];
        const next = csv[i + 1];


        if(
            char === '"' &&
            next === '"'
        ){

            value += '"';

            i++;

        }


        else if(
            char === '"'
        ){

            insideQuotes =
                !insideQuotes;

        }


        else if(
            char === ',' &&
            !insideQuotes
        ){

            row.push(
                value.trim()
            );

            value = "";

        }


        else if(
            (
                char === '\n' ||
                char === '\r'
            ) &&
            !insideQuotes
        ){

            if(
                char === '\r' &&
                next === '\n'
            ){

                i++;

            }


            row.push(
                value.trim()
            );

            value = "";


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

            value += char;

        }

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


// ======================================
// FETCH CSV
// ======================================

async function fetchCSV(url){

    const response =
        await fetch(
            url,
            {
                cache: "no-store"
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
// CACHE
// ======================================

function saveCache(){

    const data = {

        categoryRows:
            categoryRows,

        subCategoryRows:
            subCategoryRows,

        productRows:
            productRows,

        time:
            Date.now()

    };


    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(data)
    );

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
            "Cache Error:",
            error
        );


        return false;

    }

}


// ======================================
// URL PARAM
// ======================================

function getParam(name){

    return new URLSearchParams(
        location.search
    ).get(name);

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


// ======================================
// LOAD DATA
// ======================================

async function loadData(){

    // First try fresh V11 cache
    if(loadCache()){

        return;

    }


    const [
        categoryCSV,
        subCategoryCSV,
        productCSV
    ] = await Promise.all([

        fetchCSV(categoryURL),

        fetchCSV(subCategoryURL),

        fetchCSV(productURL)

    ]);


    categoryRows =
        csvToArray(categoryCSV);


    subCategoryRows =
        csvToArray(subCategoryCSV);


    productRows =
        csvToArray(productCSV);


    // ==================================
    // PRODUCT SHEET
    //
    // A = Product ID
    // B = Category ID
    // C = subCategory ID
    // D = Product
    // E = Weight
    // F = Price
    // G = Status
    // H = Images
    // ==================================

    productList = [];


    productRows
        .slice(1)
        .forEach(row => {

            productList.push({

                id:
                    row[0],

                categoryId:
                    row[1],

                subCategoryId:
                    row[2],

                name:
                    row[3],

                weight:
                    row[4],

                price:
                    Number(row[5]),

                status:
                    row[6],

                image:
                    row[7]

            });

        });


    buildProductMap();


    dataLoaded = true;

    cacheTime =
        Date.now();


    saveCache();

}


// ======================================
// CATEGORY
// ======================================

async function loadCategories(){

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

            // CATEGORY SHEET
            //
            // A = ID
            // B = Name
            // C = Status
            // D = Image


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
                status !== "active"
            ){

                return;

            }


            html.push(`

<div
class="category-card"
onclick="openCategory('${id}')">

<img
src="${image}"
loading="lazy"
decoding="async"
fetchpriority="low"
onerror="this.src='placeholder.webp'">

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

    const categoryId =
        String(id).trim();


    const hasSubCategory =
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
                    )
                    .trim()
                    .toLowerCase();


                return (
                    parentId === categoryId &&
                    status === "active"
                );

            });


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


// ======================================
// SUB CATEGORY
// ======================================

async function loadSubCategories(){

    const list =
        document.getElementById(
            "subCategoryList"
        );


    if(!list)
        return;


    const categoryId =
        String(
            getParam("id") || ""
        ).trim();


    const html = [];


    subCategoryRows
        .slice(1)
        .forEach(row => {

            // SUB CATEGORY SHEET
            //
            // A = ID
            // B = Category ID
            // C = Name
            // D = Status
            // E = Image


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
                )
                .trim()
                .toLowerCase();


            const image =
                String(
                    row[4] || ""
                ).trim();


            if(
                status !== "active"
            ){

                return;

            }


            if(
                parentId !== categoryId
            ){

                return;

            }


            html.push(`

<div
class="category-card"
onclick="
location.href='products.html?sub=${encodeURIComponent(id)}'
">

<img
src="${image}"
loading="lazy"
decoding="async"
fetchpriority="low"
onerror="this.src='placeholder.webp'">

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
//
// IMPORTANT:
//
// SAME PRODUCT NAME
// = ONE CARD
//
// Example:
//
// Golkeri
//
// 250 gm  ₹100  + Add
// 500 gm  ₹190  + Add
//
// ======================================

async function loadProducts(
    searchText = ""
){

    const list =
        document.getElementById(
            "productList"
        );


    if(!list)
        return;


    const categoryId =
        String(
            getParam("category") || ""
        ).trim();


    const subCategoryId =
        String(
            getParam("sub") || ""
        ).trim();


    const search =
        (
            searchText ||
            getParam("search") ||
            ""
        )
        .toLowerCase()
        .trim();


    // ==================================
    // GROUP PRODUCTS
    // ==================================

    const groupedProducts =
        new Map();


    productRows
        .slice(1)
        .forEach(row => {

            // ==================================
            // EXACT COLUMNS
            // ==================================

            const id =
                String(
                    row[0] || ""
                ).trim();


            const rowCategoryId =
                String(
                    row[1] || ""
                ).trim();


            const rowSubCategoryId =
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
                    row[5]
                );


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


            // ==================================
            // ACTIVE
            // ==================================

            if(
                status !== "active"
            ){

                return;

            }


            // ==================================
            // CATEGORY FILTER
            // ==================================

            if(
                categoryId &&
                rowCategoryId !==
                categoryId
            ){

                return;

            }


            // ==================================
            // SUB CATEGORY FILTER
            // ==================================

            if(
                subCategoryId &&
                rowSubCategoryId !==
                subCategoryId
            ){

                return;

            }


            // ==================================
            // SEARCH
            // ==================================

            if(search){

                const keyword =
                    (
                        product +
                        " " +
                        weight
                    )
                    .toLowerCase();


                if(
                    !keyword.includes(
                        search
                    )
                ){

                    return;

                }

            }


            // ==================================
            // SAME NAME = SAME CARD
            // ==================================

            const groupKey =
                product
                    .toLowerCase()
                    .replace(
                        /\s+/g,
                        " "
                    )
                    .trim();


            if(
                !groupedProducts.has(
                    groupKey
                )
            ){

                groupedProducts.set(
                    groupKey,
                    {

                        name:
                            product,

                        image:
                            image,

                        variants:
                            []

                    }
                );

            }


            const group =
                groupedProducts.get(
                    groupKey
                );


            // ==================================
            // ADD WEIGHT VARIANT
            // ==================================

            group.variants.push({

                id:
                    id,

                weight:
                    weight,

                price:
                    price,

                image:
                    image

            });


            // If first image is empty,
            // use next available image

            if(
                !group.image &&
                image
            ){

                group.image =
                    image;

            }

        });


    // ==================================
    // HTML
    // ==================================

    const html = [];


    groupedProducts
        .forEach(item => {

            // ==================================
            // SORT BY WEIGHT
            // ==================================

            item.variants.sort(
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


            const mainImage =
                item.image ||
                (
                    item.variants[0]
                    ?
                    item.variants[0].image
                    :
                    "placeholder.webp"
                );


            // ==================================
            // SINGLE VARIANT
            // ==================================

            if(
                item.variants.length === 1
            ){

                const v =
                    item.variants[0];


                const cartItem =
                    cart.find(
                        p =>
                        p.id == v.id
                    );


                const qty =
                    cartItem
                    ? cartItem.qty
                    : 0;


                html.push(`

<div
class="product-card">

<img
src="${mainImage}"
loading="lazy"
decoding="async"
fetchpriority="low"
onclick="openImage('${mainImage}')"
onerror="this.src='placeholder.webp'">

<h3
class="product-name">

${item.name}

</h3>

<p
class="product-weight">

${v.weight}

</p>

<h4
class="product-price">

₹${v.price}

</h4>

<div
id="cart-${v.id}">

${
qty === 0

?

`<button
class="cart-btn"
onclick="addToCart('${v.id}')">

+ Add

</button>`

:

`<div
class="qty-control">

<button
class="qty-btn"
onclick="changeQty('${v.id}',-1)">

−

</button>

<span
class="qty-number">

${qty}

</span>

<button
class="qty-btn"
onclick="changeQty('${v.id}',1)">

+

</button>

</div>`

}

</div>

</div>

`);

                return;

            }


            // ==================================
            // MULTIPLE WEIGHTS
            // ==================================

            let variantsHTML = "";


            item.variants
                .forEach(v => {

                    const cartItem =
                        cart.find(
                            p =>
                            p.id == v.id
                        );


                    const qty =
                        cartItem
                        ? cartItem.qty
                        : 0;


                    variantsHTML += `

<div class="product-variant-row">

    <div class="product-variant-info">

        <span class="product-variant-weight">
            ${v.weight}
        </span>

        <span class="product-variant-price">
            ₹${v.price}
        </span>

    </div>


    <div
        id="cart-${v.id}"
        class="product-variant-action">

        ${
        qty === 0

        ?

        `<button
            class="cart-btn"
            onclick="addToCart('${v.id}')">

            + Add

        </button>`

        :

        `<div class="qty-control">

            <button
                class="qty-btn"
                onclick="changeQty('${v.id}',-1)">

                −

            </button>

            <span class="qty-number">

                ${qty}

            </span>

            <button
                class="qty-btn"
                onclick="changeQty('${v.id}',1)">

                +

            </button>

        </div>`

        }

    </div>

</div>

`;

                });


            // ==================================
            // PRODUCT CARD
            // ==================================

            html.push(`

<div
class="product-card">

<img
src="${mainImage}"
loading="lazy"
decoding="async"
fetchpriority="low"
onclick="openImage('${mainImage}')"
onerror="this.src='placeholder.webp'">

<h3
class="product-name">

${item.name}

</h3>


<div
class="product-variants">

${variantsHTML}

</div>


</div>

`);

        });


    // ==================================
    // DISPLAY
    // ==================================

    list.innerHTML =
        html.join("");


    // ==================================
    // COUNT
    // ==================================

    const heading =
        document.querySelector(
            ".section-title"
        );


    if(heading){

        heading.innerHTML =
`🛒 All Products
<span
style="
font-size:16px;
color:#888;
">

(${groupedProducts.size})

</span>`;

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
            p =>
            p.id == id
        );


    if(item){

        item.qty++;

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


// ======================================
// CHANGE QTY
// ======================================

function changeQty(
    id,
    change
){

    const item =
        cart.find(
            p =>
            p.id == id
        );


    if(!item)
        return;


    item.qty +=
        change;


    if(
        item.qty <= 0
    ){

        cart =
            cart.filter(
                p =>
                p.id != id
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
            sum + item.qty,
            0
        );


    if(
        total === 0
    ){

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
class="empty-cart">

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


    cart.forEach(item => {

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
                row[5]
            );


        const image =
            row[7];


        const total =
            price *
            item.qty;


        grandTotal +=
            total;


        html.push(`

<div
class="cart-item">

<img
src="${image}"
loading="lazy"
decoding="async"
fetchpriority="low"
onerror="this.src='placeholder.webp'">

<div
class="cart-info">

<h3>
${product}
</h3>

<p>
${weight}
</p>

<div
class="cart-price">

₹${price}
× ${item.qty}
=
₹${total}

</div>

<div
class="qty-box">

<button
class="qty-btn"
onclick="changeQty('${item.id}',-1)">

−

</button>

<span
class="qty-number">

${item.qty}

</span>

<button
class="qty-btn"
onclick="changeQty('${item.id}',1)">

+

</button>

</div>

<button
class="remove-btn"
onclick="removeCartItem('${item.id}')">

🗑 Remove

</button>

</div>

</div>

`);

    });


    html.push(`

<div
class="cart-total">

<h2>
Grand Total
</h2>

<div
class="total-price">

₹${grandTotal}

</div>

<button
class="whatsapp-btn"
onclick="orderWhatsApp()">

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


    let grandTotal = 0;


    let message =
`🛒 *Jyoti Gruh Udhyog*

નવો ઓર્ડર

------------------------

`;


    cart.forEach(item => {

        const row =
            getProduct(
                item.id
            );


        if(!row)
            return;


        const total =
            Number(
                row[5]
            ) *
            item.qty;


        grandTotal +=
            total;


        message +=
`📦 ${row[3]}
⚖️ ${row[4]}

💰 ₹${row[5]} × ${item.qty} = ₹${total}

------------------------

`;

    });


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
// AUTO LOAD
// ======================================

document.addEventListener(
    "DOMContentLoaded",
    async function(){

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

        }


        catch(error){

            console.error(
                "Jyoti Menu Error:",
                error
            );

        }

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


    if(!modal)
        return;


    modal.classList.remove(
        "show"
    );

}