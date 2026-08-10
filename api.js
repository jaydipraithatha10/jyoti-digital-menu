// ======================================
// PRODUCTS - GROUPED WEIGHT DESIGN
// IMAGE
// PRODUCT NAME
// WEIGHT + PRICE
// - 0 +
// ======================================

async function loadProducts(searchText=""){

    const list =
    document.getElementById("productList");

    if(!list) return;

    const subId = getParam("sub");
    const categoryId = getParam("category");

    const search =
    (searchText || getParam("search") || "")
    .toLowerCase();

    const groups = new Map();

    productRows.slice(1).forEach(row=>{

        const id = row[0];
        const catId = row[1];
        const subCatId = row[2];
        const product = row[3];
        const weight = row[4];
        const price = Number(row[5]);
        const status = row[6];
        const image = row[7];

        if(status.trim().toLowerCase()!="active")
            return;

        if(subId && subCatId!=subId)
            return;

        if(categoryId && !subId && catId!=categoryId)
            return;

        if(search){

            const keyword =
            (product+" "+weight).toLowerCase();

            if(!keyword.includes(search))
                return;

        }

        /*
        GROUP SAME PRODUCT
        */

        const groupKey =
            catId+"_"+subCatId+"_"+product;

        if(!groups.has(groupKey)){

            groups.set(groupKey,{
                name:product,
                image:image,
                variants:[]
            });

        }

        groups.get(groupKey).variants.push({

            id:id,
            weight:weight,
            price:price

        });

    });


    let html = [];

    groups.forEach(group=>{

        html.push(`

<div class="product-card grouped-product-card">

    <!-- PRODUCT IMAGE -->

    <img
        class="group-product-image"
        src="${group.image}"
        loading="lazy"
        decoding="async"
        fetchpriority="low"
        onclick="openImage('${group.image}')"
        onerror="this.src='placeholder.webp'"
    >


    <!-- PRODUCT NAME -->

    <h3 class="product-name grouped-product-name">
        ${group.name}
    </h3>


    <!-- WEIGHT OPTIONS -->

    <div class="product-variants">

`);

        group.variants.forEach(variant=>{

            const item =
            cart.find(p=>p.id==variant.id);

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

                ${
                    qty==0

                    ?

                    `<div class="variant-qty-control">

                        <button
                            class="variant-qty-btn"
                            onclick="changeQty('${variant.id}',-1)"
                        >
                            −
                        </button>

                        <span class="variant-qty-number">
                            0
                        </span>

                        <button
                            class="variant-qty-btn"
                            onclick="changeQty('${variant.id}',1)"
                        >
                            +
                        </button>

                    </div>`

                    :

                    `<div class="variant-qty-control">

                        <button
                            class="variant-qty-btn"
                            onclick="changeQty('${variant.id}',-1)"
                        >
                            −
                        </button>

                        <span class="variant-qty-number">
                            ${qty}
                        </span>

                        <button
                            class="variant-qty-btn"
                            onclick="changeQty('${variant.id}',1)"
                        >
                            +
                        </button>

                    </div>`
                }

            </div>

        </div>

`);

        });


        html.push(`

    </div>

</div>

`);

    });


    list.innerHTML = html.join("");


    const heading =
    document.querySelector(".section-title");

    if(heading){

        heading.innerHTML =
        `🛒 All Products <span style="font-size:16px;color:#888;">(${groups.size})</span>`;

    }

}