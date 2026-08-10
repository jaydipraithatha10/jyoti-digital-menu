// ======================================
// JYOTI GRUH UDHYOG
// API.JS V8 - PREMIUM PRODUCT GROUPING
// ======================================


// ======================================
// CART
// ======================================

let cart =
    JSON.parse(localStorage.getItem("cart")) || [];

function saveCart(){
    localStorage.setItem("cart", JSON.stringify(cart));
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

const CACHE_DURATION = 5 * 60 * 1000;

const STORAGE_KEY = "jyoti_data_cache_v8";


// ======================================
// CACHE
// ======================================

function saveCache(){

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
            categoryRows,
            subCategoryRows,
            productRows,
            time: Date.now()
        })
    );

}


function loadCache(){

    const cache =
        localStorage.getItem(STORAGE_KEY);

    if(!cache) return false;

    try{

        const data = JSON.parse(cache);

        if(
            !data.time ||
            Date.now() - data.time > CACHE_DURATION
        ){
            return false;
        }

        categoryRows = data.categoryRows || [];
        subCategoryRows = data.subCategoryRows || [];
        productRows = data.productRows || [];

        productMap.clear();

        productRows.slice(1).forEach(row=>{
            if(row[0]){
                productMap.set(
                    String(row[0]).trim(),
                    row
                );
            }
        });

        dataLoaded = true;
        cacheTime = data.time;

        return true;

    }catch(error){

        console.log("Cache Error:", error);

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
// FETCH
// ======================================

async function fetchCSV(url){

    const separator =
        url.includes("?") ? "&" : "?";

    const response =
        await fetch(
            url + separator + "_=" + Date.now(),
            {
                cache:"no-store"
            }
        );

    if(!response.ok){
        throw new Error("Data Load Failed");
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
        .map(row => row.split(","));

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

    return productMap.get(
        String(id).trim()
    );

}


// ======================================
// PRODUCT NAME NORMALIZER
// ======================================

function normalizeProductName(name){

    return String(name || "")
        .trim()
        .replace(/\s+/g," ")
        .toLowerCase();

}


// ======================================
// LOAD DATA
// ======================================

async function loadData(){

    if(loadCache()){
        return;
    }

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

    productList = [];

    productRows
        .slice(1)
        .forEach(row=>{

            productList.push({

                id: row[0],
                category: row[1],
                subCategory: row[2],
                name: row[3],
                weight: row[4],
                price: Number(row[5]),
                status: row[6],
                image: row[7]

            });

        });

    productMap.clear();

    productRows
        .slice(1)
        .forEach(row=>{

            if(row[0]){

                productMap.set(
                    String(row[0]).trim(),
                    row
                );

            }

        });

    dataLoaded = true;
    cacheTime = Date.now();

    saveCache();

}


// ======================================
// CATEGORIES
// ======================================

async function loadCategories(){

    const list =
        document.getElementById("categoryList");

    if(!list) return;

    const html = [];

    categoryRows
        .slice(1)
        .forEach(row=>{

            if(
                !row[2] ||
                row[2].trim().toLowerCase() !== "active"
            ){
                return;
            }

            html.push(`

<div
    class="category-card"
    onclick="openCategory('${row[0]}')"
>

    <img
        src="${row[3]}"
        loading="lazy"
        decoding="async"
        onerror="this.src='placeholder.webp'"
    >

    <h3>${row[1]}</h3>

</div>

`);

        });

    list.innerHTML = html.join("");

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
                row[3] &&
                row[3].trim().toLowerCase() === "active"

            );

    location.href =
        hasSub
        ? "category.html?id=" + encodeURIComponent(id)
        : "products.html?category=" + encodeURIComponent(id);

}


// ======================================
// SUB CATEGORIES
// ======================================

async function loadSubCategories(){

    const list =
        document.getElementById("subCategoryList");

    if(!list) return;

    const id = getParam("id");

    const html = [];

    subCategoryRows
        .slice(1)
        .forEach(row=>{

            if(
                !row[3] ||
                row[3].trim().toLowerCase() !== "active"
            ){
                return;
            }

            if(row[1] != id){
                return;
            }

            html.push(`

<div
    class="category-card"
    onclick="location.href='products.html?sub=${encodeURIComponent(row[0])}'"
>

    <img
        src="${row[4]}"
        loading="lazy"
        decoding="async"
        onerror="this.src='placeholder.webp'"
    >

    <h3>${row[2]}</h3>

</div>

`);

        });

    list.innerHTML = html.join("");

}


// ======================================
// PRODUCTS
// PREMIUM GROUPING
// ======================================

async function loadProducts(searchText=""){

    const list =
        document.getElementById("productList");

    if(!list) return;


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


    /*
    ======================================
    FIRST FILTER PRODUCTS
    ======================================
    */

    const filteredRows = [];

    productRows
        .slice(1)
        .forEach(row=>{

            const id = row[0];
            const catId = row[1];
            const subCatId = row[2];
            const product = row[3];
            const weight = row[4];
            const price = Number(row[5]);
            const status = row[6];
            const image = row[7];


            if(
                !status ||
                status.trim().toLowerCase() !== "active"
            ){
                return;
            }


            if(
                subId &&
                subCatId != subId
            ){
                return;
            }


            if(
                categoryId &&
                !subId &&
                catId != categoryId
            ){
                return;
            }


            if(search){

                const keyword =
                    (
                        product +
                        " " +
                        weight
                    )
                    .toLowerCase();

                if(!keyword.includes(search)){
                    return;
                }

            }


            filteredRows.push({
                id,
                product,
                weight,
                price,
                image
            });

        });


    /*
    ======================================
    GROUP BY PRODUCT NAME ONLY
    ======================================
    */

    const groups = new Map();


    filteredRows.forEach(item=>{

        const key =
            normalizeProductName(item.product);


        if(!key) return;


        if(!groups.has(key)){

            groups.set(
                key,
                {
                    name: item.product.trim(),
                    image: item.image,
                    variants: []
                }
            );

        }


        const group =
            groups.get(key);


        /*
        Prevent duplicate same weight
        */

        const alreadyExists =
            group.variants.some(
                variant =>
                    String(variant.weight)
                        .trim()
                        .toLowerCase()
                    ===
                    String(item.weight)
                        .trim()
                        .toLowerCase()
            );


        if(!alreadyExists){

            group.variants.push({

                id: item.id,

                weight: item.weight,

                price: item.price,

                image: item.image

            });

        }

    });


    /*
    ======================================
    SORT WEIGHTS
    ======================================
    */

    groups.forEach(group=>{

        group.variants.sort((a,b)=>{

            const aNumber =
                parseFloat(
                    String(a.weight)
                ) || 0;

            const bNumber =
                parseFloat(
                    String(b.weight)
                ) || 0;

            return aNumber - bNumber;

        });

    });


    /*
    ======================================
    BUILD PREMIUM HTML
    ======================================
    */

    const html = [];


    groups.forEach(group=>{

        html.push(`

<article class="product-card premium-product-card">

    <div class="product-image-wrap">

        <img
            class="group-product-image"
            src="${group.image}"
            loading="lazy"
            decoding="async"
            onclick="openImage('${group.image}')"
            onerror="this.src='placeholder.webp'"
        >

    </div>


    <h3 class="grouped-product-name">
        ${group.name}
    </h3>


    <div class="product-variants">

`);


        group.variants.forEach(variant=>{

            const item =
                cart.find(
                    p => p.id == variant.id
                );

            const qty =
                item ? item.qty : 0;


            html.push(`

        <div class="product-variant">

            <div class="variant-info">

                <span class="variant-weight">
                    ${variant.weight}
                </span>

                <span class="variant-dot">
                    •
                </span>

                <span class="variant-price">
                    ₹${variant.price}
                </span>

            </div>


            <div
                class="variant-cart"
                id="cart-${variant.id}"
            >

                <div class="variant-qty-control">

                    <button
                        class="variant-qty-btn"
                        onclick="changeQty('${variant.id}',-1)"
                        aria-label="Decrease quantity"
                    >
                        −
                    </button>

                    <span class="variant-qty-number">
                        ${qty}
                    </span>

                    <button
                        class="variant-qty-btn"
                        onclick="changeQty('${variant.id}',1)"
                        aria-label="Increase quantity"
                    >
                        +
                    </button>

                </div>

            </div>

        </div>

`);

        });


        html.push(`

    </div>

</article>

`);

    });


    list.innerHTML =
        html.join("");


    /*
    PRODUCT COUNT
    */

    const heading =
        document.querySelector(".section-title");

    if(heading){

        heading.innerHTML =
            `🛍️ All Products
            <span class="product-count">
                ${groups.size}
            </span>`;

    }

}


// ======================================
// SEARCH
// ======================================

function initSearch(){

    const searchBox =
        document.getElementById("searchBox");

    if(!searchBox) return;

    let timer;

    searchBox.addEventListener(
        "input",
        function(){

            const text =
                this.value.trim();

            clearTimeout(timer);

            timer =
                setTimeout(()=>{

                    if(
                        document.getElementById("productList")
                    ){

                        loadProducts(text);

                    }
                    else if(
                        document.getElementById("categoryList")
                    ){

                        if(text.length >= 2){

                            location.href =
                                "products.html?search=" +
                                encodeURIComponent(text);

                        }

                    }

                },250);

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
// CHANGE QUANTITY
// ======================================

function changeQty(id, change){

    const item =
        cart.find(
            p => p.id == id
        );


    if(!item && change > 0){

        cart.push({
            id:id,
            qty:1
        });

    }
    else if(item){

        item.qty += change;

        if(item.qty <= 0){

            cart =
                cart.filter(
                    p => p.id != id
                );

        }

    }


    saveCart();

    updateCartButton();

    loadProducts();

    loadCart();

}


// ======================================
// REMOVE
// ======================================

function removeCartItem(id){

    cart =
        cart.filter(
            item => item.id != id
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
        document.getElementById("viewCartBtn");

    const count =
        document.getElementById("cartCount");

    if(!btn || !count) return;


    const total =
        cart.reduce(
            (sum,item) =>
                sum + item.qty,
            0
        );


    if(total === 0){

        btn.style.display = "none";
        count.textContent = "0";

    }else{

        btn.style.display = "flex";
        count.textContent = total;

    }

}


// ======================================
// LOAD CART
// ======================================

async function loadCart(){

    const list =
        document.getElementById("cartList");

    if(!list) return;


    if(cart.length === 0){

        list.innerHTML = `

<div class="empty-cart">

    <h2>🛒 Your Cart is Empty</h2>

    <p>Please add products.</p>

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

        if(!row) return;


        const product = row[3];
        const weight = row[4];
        const price = Number(row[5]);
        const image = row[7];

        const total =
            price * item.qty;


        grandTotal += total;


        html.push(`

<div class="cart-item">

    <img
        src="${image}"
        loading="lazy"
        decoding="async"
        onerror="this.src='placeholder.webp'"
    >

    <div class="cart-info">

        <h3>${product}</h3>

        <p>${weight}</p>

        <div class="cart-price">
            ₹${price} × ${item.qty} = ₹${total}
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

    });


    html.push(`

<div class="cart-total">

    <h2>Grand Total</h2>

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


    let grandTotal = 0;


    let message =
`🛒 *Jyoti Gruh Udhyog*

નવો ઓર્ડર

------------------------

`;


    cart.forEach(item=>{

        const row =
            getProduct(item.id);

        if(!row) return;


        const price =
            Number(row[5]);

        const total =
            price * item.qty;


        grandTotal += total;


        message +=
`📦 ${row[3]}
⚖️ ${row[4]}

💰 ₹${price} × ${item.qty} = ₹${total}

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
    async ()=>{

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
                "Jyoti Data Load Error:",
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
    ()=>{

        cart =
            JSON.parse(
                localStorage.getItem("cart")
            ) || [];

        updateCartButton();


        if(
            document.getElementById("productList")
        ){

            loadProducts();

        }


        if(
            document.getElementById("cartList")
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
        document.getElementById("zoomImage");

    const modal =
        document.getElementById("imageModal");

    if(!image || !modal) return;

    image.src = src;

    modal.classList.add("show");

}


function closeImage(){

    const modal =
        document.getElementById("imageModal");

    if(!modal) return;

    modal.classList.remove("show");

}


document.addEventListener(
    "keydown",
    event=>{

        if(event.key === "Escape"){
            closeImage();
        }

    }
);