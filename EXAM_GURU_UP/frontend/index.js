document.addEventListener("DOMContentLoaded", function(){
    const hamburger = document.getElementById("hamburger");
    const mobileMenu = document.getElementById("mobileMenu");

    hamburger.addEventListener("click", function(){
        mobileMenu.classList.toggle("active");
    });

    window.toggleMenu = function(){
        document.getElementById("mobileMenu").classList.toggle("active");
    };

    window.closeMenu = function(){
        document.getElementById("mobileMenu").classList.remove("active");
    };

});
