// ================= CONFIG =================

const CATEGORY_CSV =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vStfoYZJzDES0lAav3gzVi4hHMrr-g-vu6oHbAecwVN7-j5ZfyZCE4wy5qE8oaH0fSw14Y97pHMmUrU/pub?gid=2013716827&single=true&output=csv";

const SUBCATEGORY_CSV =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vStfoYZJzDES0lAav3gzVi4hHMrr-g-vu6oHbAecwVN7-j5ZfyZCE4wy5qE8oaH0fSw14Y97pHMmUrU/pub?gid=35788410&single=true&output=csv";

const PRODUCT_CSV =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vStfoYZzDES0lAav3gzVi4hHMrr-g-vu6oHbAecwVN7-j5ZfyZCE4wy5qE8oaH0fSw14Y97pHMmUrU/pub?gid=0&single=true&output=csv";

let cart = [];

let categories = [];
let subcategories = [];
let products = [];

document.addEventListener("DOMContentLoaded", async () => {

    await loadData();

    renderCategories();

    document
        .getElementById("searchInput")
        .addEventListener("input", searchProducts);

});

// ================= CSV =================

function parseCSV(csv){

    return csv
        .trim()
        .split(/\r?\n/)
        .map(r => r.split(",").map(c => c.trim()));

}

async function loadData(){

    const [catRes,subRes,proRes] = await Promise.all([

        fetch(CATEGORY_CSV),
        fetch(SUBCATEGORY_CSV),
        fetch(PRODUCT_CSV)

    ]);

    categories = parseCSV(await catRes.text());

    subcategories = parseCSV(await subRes.text());

    products = parseCSV(await proRes.text());

}
// ================= RENDER CATEGORY =================

function renderCategories(){

    const container = document.getElementById("categories");

    container.innerHTML = "";

    for(let i=1;i<categories.length;i++){

        const id = categories[i][0];
        const name = categories[i][1];
        const status = categories[i][2].toLowerCase();

        if(status !== "active") continue;

        container.innerHTML += `

<div class="category-item">

    <div class="category-card"
         data-id="${id}"
         data-name="${name.toLowerCase()}"
         onclick="toggleCategory('${id}',this)">

        <span>${name}</span>

        <span>▼</span>

    </div>

    <div id="sub-${id}" class="sub-list"></div>

</div>

`;

    }

}

// ================= CATEGORY =================

function toggleCategory(categoryId,card){

    const container = document.getElementById("sub-"+categoryId);

    if(container.innerHTML !== ""){

        container.innerHTML="";

        card.classList.remove("active");

        card.querySelector("span:last-child").innerHTML="▼";

        return;

    }

    document.querySelectorAll(".category-card").forEach(c=>{

        c.classList.remove("active");

        c.querySelector("span:last-child").innerHTML="▼";

    });

    document.querySelectorAll(".sub-list").forEach(s=>{

        s.innerHTML="";

    });

    card.classList.add("active");

    card.querySelector("span:last-child").innerHTML="▲";

    let html="";

    for(let i=1;i<subcategories.length;i++){

        const subId=subcategories[i][0];
        const catId=subcategories[i][1];
        const subName=subcategories[i][2];
        const status=subcategories[i][3].toLowerCase();

        if(status!=="active") continue;

        if(catId!=categoryId) continue;

        html += `

<div class="subcategory-card"
     data-id="${subId}"
     data-name="${subName.toLowerCase()}"
     onclick="toggleSubCategory('${categoryId}','${subId}',this)">

<span>${subName}</span>

<span>▶</span>

</div>

<div id="product-${subId}" class="product-list"></div>

`;

    }

    if(html===""){

        loadProducts(categoryId,"");

    }else{

        container.innerHTML=html;

    }

}