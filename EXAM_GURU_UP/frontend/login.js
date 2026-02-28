document.getElementById("loginForm").addEventListener("submit", async function(e) {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
            credentials: "include" // important for cookies!
        });

        const data = await res.json();

        if (res.ok) {
            const user = data.user;
            localStorage.setItem("user", JSON.stringify(user)); // optional, only for frontend use

            if (user.role === "admin") {
                window.location.href = "admin/admin-dashboard.html";
            } else if (user.category && user.category.dashboard) {
                window.location.href = user.category.dashboard.route;
            } else {
                alert("Dashboard not assigned to this user.");
            }


        } else {
            alert(data.message || "Login failed");
        }
    } catch (err) {
        console.error("Login fetch error:", err);
        alert("Login failed due to network error.");
    }
});