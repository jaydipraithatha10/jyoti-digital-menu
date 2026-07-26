
const CATEGORY_API = "YOUR_CATEGORY_JSON_URL";
const PRODUCT_API = "YOUR_PRODUCT_JSON_URL";

const categoryContainer = document.getElementById("categories");
const productContainer = document.getElementById("products");

let categories = [];
let products = [];

async function loadCategories() {

    const response = await fetch(CATEGORY_API);

    categories = await response.json();

    categoryContainer.innerHTML = "";

    categories.forEach(category=>{

        categoryContainer.innerHTML += `
            <div class="category-card"
                 onclick="loadProducts(${category.id})">

                ${category.name}

            </div>
        `;

    });

}

async function loadProducts(categoryId){

    const response = await fetch(PRODUCT_API);

    products = await response.json();

    const filter = products.filter(p=>p.category_id==categoryId);

    productContainer.innerHTML="";

    filter.forEach(product=>{

        productContainer.innerHTML+=`

        <div class="product-card">

            <div class="product-name">
                ${product.name}
            </div>

            <div class="product-weight">
                ${product.weight}
            </div>

            <div class="product-price">
                ₹${product.price}
            </div>

        </div>

        `;

    });

}

loadCategories();