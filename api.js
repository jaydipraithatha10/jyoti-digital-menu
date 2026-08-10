// ======================================
// JYOTI GRUH UDHYOG
// API.JS V8
// COMPLETE VERSION
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


// IMPORTANT:
// New cache key so old V6/V7 data
// does not break the new version.

const STORAGE_KEY =
"jyoti_data_cache_v8";


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
// CACHE
// ======================================

function saveCache(){

    const data = {

        categoryRows,
        subCategoryRows,
        productRows,

        time:Date.now()

    };

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(data)
    );

}


function loadCache(){

    const cache =
    localStorage.getItem(STORAGE_KEY);

    if(!cache)
        return false;

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


        buildProductMap();


        dataLoaded = true;

        cacheTime =
        data.time;

        return true;

    }catch(error){

        console.log(
            "Cache Error",
            error
        );

        return false;

    }

}


// ======================================
// CSV FETCH
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

    const rows = [];

    let row = [];

    let value = "";

    let insideQuotes = false;


    for(
        let i=0;
        i<csv.length;
        i++
    ){

        const char =
        csv[i];

        const next =
        csv[i+1];


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
                    cell =>
                    cell !== ""
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


    if(value !== "" || row.length){

        row.push(
            value.trim()
        );

        if(
            row.some(
                cell =>
                cell !== ""
            )
        ){

            rows.push(row);

        }

    }


    return rows;

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
    .forEach(row=>{

        if(row[0]){

            productMap.set(
                row[0],
                row
            );

        }

    });

}


function getProduct(id){

    return productMap.get(id);

}


// ======================================
// LOAD DATA
// ======================================

async function loadData(){

    if(loadCache()){

        return;

    }


    if(
        dataLoaded &&
        Date.now() - cacheTime <
        CACHE_DURATION
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

            id:row[0],

            category:row[1],

            name:row[2],

            weight:row[3],

            price:Number(row[4]),

            status:row[5],

            image:row[6]

        });

    });


    buildProductMap();


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
            !row[2] ||
            row[2]
            .trim()
            .toLowerCase()
            !== "active"
        ){

            return;

        }


        html.push(`

<div
class="category-card"
onclick="openCategory('${row[0]}')">

<img
src="${row[3]}"
loading="lazy"
decoding="async"
fetchpriority="low"
onerror="this.src='placeholder.webp'">

<h3>
${row[1]}
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
    .some(row=>{

        return (
            row[1] == id &&
            row[3] &&
            row[3]
            .trim()
            .toLowerCase()
            === "active"
        );

    });


    location.href =
    hasSub

    ? "category.html?id=" + id

    : "products.html?category=" + id;

}


// ======================================
// GET CATEGORY NAME
// ======================================

function getCategoryName(id){

    const row =
    categoryRows
    .slice(1)
    .find(
        row =>
        String(row[0]).trim()
        ===
        String(id).trim()
    );


    if(!row)
        return "";


    return String(
        row[1] || ""
    )
    .trim()
    .toLowerCase();

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
            !row[3] ||
            row[3]
            .trim()
            .toLowerCase()
            !== "active"
        ){

            return;

        }


        if(row[1] != id)
            return;


        html.push(`

<div
class="category-card"
onclick="
location.href='products.html?sub=${row[0]}'
">

<img
src="${row[4]}"
loading="lazy"
decoding="async"
fetchpriority="low"
onerror="this.src='placeholder.webp'">

<h3>
${row[2]}
</h3>

</div>

`);

    });


    list.innerHTML =
    html.join("");

}


// ======================================
// PRODUCTS
// ======================================
// SAME PRODUCT = ONE CARD
// MULTIPLE WEIGHTS = SAME CARD
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


    const categoryId =
    getParam("category");


    const subId =
    getParam("sub");


    const search =
    (
        searchText ||
        getParam("search") ||
        ""
    )
    .toLowerCase()
    .trim();


    // ==================================
    // CATEGORY NAME
    // ==================================

    const selectedCategory =
    getCategoryName(
        categoryId
    );


    // ==================================
    // GROUP
    // ==================================

    const grouped =
    new Map();


    productRows
    .slice(1)
    .forEach(row=>{

        // ==================================
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


        const id =
        String(
            row[0] || ""
        ).trim();


        const rowCategory =
        String(
            row[1] || ""
        ).trim();


        const product =
        String(
            row[2] || ""
        ).trim();


        const weight =
        String(
            row[3] || ""
        ).trim();


        const price =
        Number(
            row[4]
        );


        const status =
        String(
            row[5] || ""
        )
        .trim()
        .toLowerCase();


        const image =
        String(
            row[6] || ""
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

        if(categoryId){

            const categoryMatch =
            rowCategory
            .toLowerCase()
            ===
            selectedCategory;


            const idMatch =
            rowCategory
            ===
            String(
                categoryId
            ).trim();


            if(
                !categoryMatch &&
                !idMatch
            ){

                return;

            }

        }


        // ==================================
        // SUB CATEGORY
        // ==================================
        //
        // Product sheetમાં SubCategory
        // column નથી.
        //
        // એટલે category productsમાં
        // અહીં filtering નહીં કરીએ.
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
                !keyword.includes(
                    search
                )
            ){

                return;

            }

        }


        // ==================================
        // GROUP BY PRODUCT NAME
        // ==================================

        const key =
        product
        .toLowerCase()
        .replace(
            /\s+/g,
            " "
        )
        .trim();


        if(
            !grouped.has(key)
        ){

            grouped.set(
                key,
                {

                    name:product,

                    image:image,

                    variants:[]

                }
            );

        }


        grouped
        .get(key)
        .variants
        .push({

            id:id,

            weight:weight,

            price:price,

            image:image

        });

    });


    // ==================================
    // CREATE HTML
    // ==================================

    const html = [];


    grouped
    .forEach(item=>{

        // ==================================
        // SORT WEIGHTS
        // ==================================

        item.variants.sort(
            (a,b)=>{

                const aw =
                parseFloat(
                    a.weight
                ) || 0;

                const bw =
                parseFloat(
                    b.weight
                ) || 0;

                return aw - bw;

            }
        );


        // ==================================
        // IMAGE
        // ==================================

        const mainImage =
        item.image ||
        (
            item.variants[0]
            ?
            item.variants[0].image
            :
            ""
        );


        // ==================================
        // ONE VARIANT
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
        // MULTIPLE VARIANTS
        // ==================================

        let variantsHTML =
        "";


        item.variants
        .forEach(v=>{

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

<div
style="
display:flex;
align-items:center;
justify-content:space-between;
gap:5px;
margin:0 auto 6px;
width:100%;
">

<div
style="
display:flex;
align-items:center;
gap:7px;
flex:1;
min-width:0;
">

<span
style="
font-size:15px;
color:#777;
white-space:nowrap;
">

${v.weight}

</span>

<span
style="
font-size:19px;
font-weight:700;
color:#111;
white-space:nowrap;
">

₹${v.price}

</span>

</div>


<div
id="cart-${v.id}"
style="
width:72px;
min-width:72px;
">

${
qty === 0

?

`<button
class="cart-btn"
style="
width:72px;
height:38px;
margin:0;
padding:0;
font-size:13px;
border-radius:12px;
"
onclick="addToCart('${v.id}')">

+ Add

</button>`

:

`<div
class="qty-control"
style="
width:72px;
height:38px;
margin:0;
padding:0;
display:flex;
align-items:center;
justify-content:space-around;
border-radius:12px;
">

<button
class="qty-btn"
style="
width:22px;
height:36px;
padding:0;
font-size:19px;
"
onclick="changeQty('${v.id}',-1)">

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
height:36px;
padding:0;
font-size:19px;
"
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
style="
width:90%;
margin:4px auto 12px;
">

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
    // HEADING
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

(${grouped.size})

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

    }else{

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


    if(!btn || !count)
        return;


    const total =
    cart.reduce(
        (
            sum,
            item
        ) =>
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


    cart.forEach(item=>{

        const row =
        getProduct(
            item.id
        );


        if(!row)
            return;


        // Actual columns

        const product =
        row[2];

        const weight =
        row[3];

        const price =
        Number(row[4]);

        const image =
        row[6];


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
×
${item.qty}
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
        getProduct(
            item.id
        );


        if(!row)
            return;


        const total =
        Number(row[4]) *
        item.qty;


        grandTotal +=
        total;


        message +=
`📦 ${row[2]}
⚖️ ${row[3]}

💰 ₹${row[4]} × ${item.qty} = ₹${total}

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


        }catch(error){

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