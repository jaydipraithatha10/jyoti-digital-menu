// ======================================
// JYOTI GRUH UDHYOG
// API.JS V7
// ORIGINAL WORKING + PICKLE MULTI WEIGHT
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
// CACHE
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

const STORAGE_KEY =
"jyoti_data_cache";


// ======================================
// SAVE CACHE
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
// LOAD CACHE
// ======================================

function loadCache(){

    const cache =
    localStorage.getItem(STORAGE_KEY);

    if(!cache) return false;

    try{

        const data =
        JSON.parse(cache);

        if(
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


        productMap.clear();


        productRows
        .slice(1)
        .forEach(row=>{

            productMap.set(
                row[0],
                row
            );

        });


        dataLoaded = true;

        cacheTime = data.time;

        return true;


    }catch(error){

        console.log(
            "Cache Error:",
            error
        );

        return false;

    }

}


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
// FAST FETCH
// ======================================

async function fetchCSV(url){

    const response =
    await fetch(
        url,
        {
            cache:"force-cache"
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
        .map(row=>row.split(","));

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
// PRODUCT LOOKUP
// ======================================

function getProduct(id){

    return productMap.get(id);

}


// ======================================
// LOAD DATA
// ======================================

async function loadData(){

    if(loadCache())
        return;


    if(
        dataLoaded &&
        (Date.now() - cacheTime)
        < CACHE_DURATION
    ){

        return;

    }


    const [
        catCSV,
        subCSV,
        proCSV
    ] =
    await Promise.all([

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


    // ==================================
    // PRODUCT LIST
    // ACTUAL SHEET COLUMNS
    //
    // A = Display Order
    // B = Category
    // C = Product
    // D = Weight
    // E = Price
    // F = Status
    // G = Image
    // ==================================

    productList = [];


    productRows
    .slice(1)
    .forEach(row=>{

        productList.push({

            displayOrder:
            row[0],

            category:
            row[1],

            name:
            row[2],

            weight:
            row[3],

            price:
            Number(row[4]),

            status:
            row[5],

            image:
            row[6]

        });

    });


    // ==================================
    // PRODUCT MAP
    // ==================================

    productMap.clear();


    productRows
    .slice(1)
    .forEach(row=>{

        productMap.set(
            row[0],
            row
        );

    });


    dataLoaded = true;

    cacheTime = Date.now();

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
    .forEach(row=>{

        if(
            row[2]
            .trim()
            .toLowerCase()
            != "active"
        ){

            return;

        }


        html.push(`

<div class="category-card"
onclick="openCategory('${row[0]}')">

<img
src="${row[3]}"
loading="lazy"
decoding="async"
fetchpriority="low"
onerror="this.src='placeholder.webp'">

<h3>${row[1]}</h3>

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
    .some(row=>

        row[1] == id &&

        row[3]
        .trim()
        .toLowerCase()
        == "active"

    );


    location.href =
    hasSub

    ? "category.html?id=" + id

    : "products.html?category=" + id;

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


    const id =
    getParam("id");


    const html = [];


    subCategoryRows
    .slice(1)
    .forEach(row=>{

        if(
            row[3]
            .trim()
            .toLowerCase()
            != "active"
        ){

            return;

        }


        if(row[1] != id)
            return;


        html.push(`

<div class="category-card"
onclick="location.href='products.html?sub=${row[0]}'">

<img
src="${row[4]}"
loading="lazy"
decoding="async"
fetchpriority="low"
onerror="this.src='placeholder.webp'">

<h3>${row[2]}</h3>

</div>

`);

    });


    list.innerHTML =
    html.join("");

}


// ======================================
// PRODUCTS
// SAME PRODUCT = ONE CARD
// MULTIPLE WEIGHT = MULTIPLE ROWS
// ======================================

async function loadProducts(
    searchText=""
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


    const search =
    (
        searchText ||
        getParam("search") ||
        ""
    )
    .toLowerCase()
    .trim();


    const html = [];


    let totalProducts = 0;


    // ==================================
    // GROUP PRODUCTS
    // ==================================

    const groupedProducts =
    new Map();


    productRows
    .slice(1)
    .forEach(row=>{

        // ACTUAL PRODUCT SHEET

        const id =
        row[0];

        const catId =
        row[1];

        const product =
        (row[2] || "").trim();

        const weight =
        (row[3] || "").trim();

        const price =
        Number(row[4]);

        const status =
        row[5];

        const image =
        row[6];


        // ==================================
        // ACTIVE
        // ==================================

        if(
            !status ||
            status
            .trim()
            .toLowerCase()
            != "active"
        ){

            return;

        }


        // ==================================
        // CATEGORY
        // ==================================

        if(
            categoryId &&
            catId != categoryId
        ){

            return;

        }


        // ==================================
        // SUB CATEGORY
        // ==================================
        // Product sheetમાં subcategory column
        // નથી, એટલે sub filtering માત્ર
        // જ્યાં applicable હોય ત્યાં નહીં કરીએ.
        //
        // Existing category navigation
        // માટે category filter પૂરતો છે.
        // ==================================


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
                !keyword.includes(search)
            ){

                return;

            }

        }


        // ==================================
        // SAME PRODUCT NAME
        // ONE CARD
        // ==================================

        const groupKey =
        product
        .toLowerCase()
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


        groupedProducts
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
    // CREATE CARDS
    // ==================================

    groupedProducts
    .forEach(item=>{

        totalProducts++;


        // ==================================
        // ONE WEIGHT
        // ORIGINAL DESIGN
        // ==================================

        if(
            item.variants.length === 1
        ){

            const variant =
            item.variants[0];


            const cartItem =
            cart.find(
                p =>
                p.id == variant.id
            );


            const qty =
            cartItem
            ? cartItem.qty
            : 0;


            html.push(`

<div class="product-card">

<img
src="${variant.image}"
loading="lazy"
decoding="async"
fetchpriority="low"
onclick="openImage('${variant.image}')"
onerror="this.src='placeholder.webp'">

<h3 class="product-name">
${item.name}
</h3>

<p class="product-weight">
${variant.weight}
</p>

<h4 class="product-price">
₹${variant.price}
</h4>

<div id="cart-${variant.id}">

${
qty == 0

?

`<button
class="cart-btn"
onclick="addToCart('${variant.id}')">

+ Add

</button>`

:

`<div class="qty-control">

<button
class="qty-btn"
onclick="changeQty('${variant.id}',-1)">

−

</button>

<span class="qty-number">

${qty}

</span>

<button
class="qty-btn"
onclick="changeQty('${variant.id}',1)">

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

        let variantHTML =
        "";


        item.variants
        .forEach(
        variant=>{

            const cartItem =
            cart.find(
                p =>
                p.id == variant.id
            );


            const qty =
            cartItem
            ? cartItem.qty
            : 0;


            variantHTML += `

<div style="
display:flex;
align-items:center;
justify-content:space-between;
width:100%;
height:40px;
margin-bottom:5px;
gap:4px;
">

<div style="
display:flex;
align-items:center;
gap:5px;
flex:1;
min-width:0;
">

<span style="
font-size:14px;
color:#777;
white-space:nowrap;
">

${variant.weight}

</span>


<span style="
font-size:18px;
font-weight:700;
color:#111;
white-space:nowrap;
">

₹${variant.price}

</span>

</div>


<div
id="cart-${variant.id}"
style="
width:70px;
min-width:70px;
flex-shrink:0;
">

${
qty == 0

?

`<button
class="cart-btn"
style="
width:70px;
height:36px;
margin:0;
padding:0;
font-size:13px;
border-radius:11px;
"
onclick="addToCart('${variant.id}')">

+ Add

</button>`

:

`<div
class="qty-control"
style="
width:70px;
height:36px;
margin:0;
padding:0;
display:flex;
align-items:center;
justify-content:space-around;
border-radius:11px;
">

<button
class="qty-btn"
style="
width:22px;
height:34px;
padding:0;
font-size:19px;
"
onclick="changeQty('${variant.id}',-1)">

−

</button>

<span
class="qty-number"
style="
font-size:15px;
min-width:14px;
">

${qty}

</span>

<button
class="qty-btn"
style="
width:22px;
height:34px;
padding:0;
font-size:19px;
"
onclick="changeQty('${variant.id}',1)">

+

</button>

</div>`

}

</div>

</div>

`;

        });


        // ==================================
        // ONE PRODUCT CARD
        // ==================================

        html.push(`

<div class="product-card">

<img
src="${item.image}"
loading="lazy"
decoding="async"
fetchpriority="low"
onclick="openImage('${item.image}')"
onerror="this.src='placeholder.webp'">

<h3 class="product-name">
${item.name}
</h3>

<div style="
width:90%;
margin:2px auto 10px;
">

${variantHTML}

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
    // PRODUCT COUNT
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

(${totalProducts})

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
            ()=>{

                // PRODUCTS PAGE

                if(
                    document.getElementById(
                        "productList"
                    )
                ){

                    loadProducts(text);

                }


                // HOME PAGE

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
                        encodeURIComponent(text);

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

    }else{

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


    item.qty += change;


    if(item.qty <= 0){

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
// REMOVE ITEM
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


    if(!btn || !count)
        return;


    const total =
    cart.reduce(
        (sum,item)=>
        sum + item.qty,
        0
    );


    if(total === 0){

        btn.style.display =
        "none";

        count.textContent =
        "0";

    }else{

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


    cart.forEach(item=>{

        const row =
        getProduct(item.id);


        if(!row)
            return;


        // ACTUAL PRODUCT SHEET

        const product =
        row[2];

        const weight =
        row[3];

        const price =
        Number(row[4]);

        const image =
        row[6];


        const total =
        price * item.qty;


        grandTotal += total;


        html.push(`

<div class="cart-item">

<img
src="${image}"
loading="lazy"
decoding="async"
fetchpriority="low"
onerror="this.src='placeholder.webp'">

<div class="cart-info">

<h3>
${product}
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
onclick="changeQty(
'${item.id}',
-1
)">

−

</button>

<span
class="qty-number">

${item.qty}

</span>

<button
class="qty-btn"
onclick="changeQty(
'${item.id}',
1
)">

+

</button>

</div>

<button
class="remove-btn"
onclick="removeCartItem(
'${item.id}'
)">

🗑 Remove

</button>

</div>

</div>

`);

    });


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
// WHATSAPP
// ======================================

async function orderWhatsApp(){

    await loadData();


    let grandTotal = 0;


    let message =
`🛒 *Jyoti Gruh Udhyog*

નવો ઓર્ડર

------------------------

`;


    cart.forEach(item=>{

        const row =
        getProduct(item.id);


        if(!row)
            return;


        const total =
        Number(row[4]) *
        item.qty;


        grandTotal += total;


        message +=
`📦 ${row[2]}
⚖️ ${row[3]}

💰 ₹${row[4]} × ${item.qty}
= ₹${total}

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
    async () => {

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

        }catch(error){

            console.error(
                "Jyoti Menu Error:",
                error
            );

        }

    }
);


// ======================================
// PAGE REFRESH
// ======================================

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


    image.src = src;

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