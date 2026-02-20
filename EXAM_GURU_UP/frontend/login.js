document.getElementById("loginForm").addEventListener("submit", async function(e) {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (data.token) {

        const user = data.user;   // ✅ FIX — define user

        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(user));

        if (user.role === "admin") {
            window.location.href = "admin/admin-dashboard.html";
        } else {

            // safety check
            if (user.category && user.category.dashboard) {
                window.location.href = user.category.dashboard.route;
            } else {
                alert("Dashboard not assigned to this user.");
            }
        }

    } else {
        alert(data.message || "Login failed");
    }
});
