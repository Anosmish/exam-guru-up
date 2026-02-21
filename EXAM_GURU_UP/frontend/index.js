document.addEventListener("DOMContentLoaded", function(){
    
    window.toggleMenu = function(){
        document.getElementById("mobileMenu").classList.toggle("active");
    };

    window.closeMenu = function(){
        document.getElementById("mobileMenu").classList.remove("active");
    };

});
