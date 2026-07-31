
// ======================================
// Jyoti Gruh Udhyog
// include.js
// ======================================


// ---------- Load Header ----------

async function loadHeader(){

    const header=document.getElementById("header");

    if(!header) return;

    const response=await fetch("header.html");

    header.innerHTML=await response.text();

}


// ---------- Load Footer ----------

async function loadFooter(){

    const footer=document.getElementById("footer");

    if(!footer) return;

    const response=await fetch("footer.html");

    footer.innerHTML=await response.text();

}


// ---------- Initialize ----------

async function init(){

    await loadHeader();

    await loadFooter();

    // Header load થયા પછી Cart Count Update

    if(typeof updateCartCount==="function"){

        updateCartCount();

    }

}


// ---------- Auto Load ----------

document.addEventListener("DOMContentLoaded",()=>{

    init();

});