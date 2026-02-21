// Get token from URL
const params = new URLSearchParams(window.location.search);
const token = params.get("token");

async function continueLogin(){

    if(!token){
        window.location.href = "login.html";
        return;
    }

    localStorage.setItem("token", token);

    try {

        const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        if(!res.ok){
            throw new Error("Invalid token");
        }

        const user = await res.json();

        if(user.role === "admin"){
            window.location.href = "admin/admin-dashboard.html";
            return;
        }

        if(user.category && user.category.dashboard){
            window.location.href = user.category.dashboard.route;
        }else{
            alert("Dashboard not assigned to this user.");
            window.location.href = "login.html";
        }

    } catch (err){
        console.error(err);
        window.location.href = "login.html";
    }
}

// Attach event after DOM loads
document.addEventListener("DOMContentLoaded", function(){
    const btn = document.getElementById("continueBtn");
    btn.addEventListener("click", continueLogin);
});