// Get token from URL
const params = new URLSearchParams(window.location.search);
const token = params.get("token");

async function safeFetch(url, options = {}) {
    try {
        const res = await fetch(url, {
            credentials: "include", // 🔥 IMPORTANT
            ...options
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            return { success: false, message: data.message || "Error" };
        }

        return { success: true, data };

    } catch (err) {
        return { success: false, message: "Server error" };
    }
}

async function continueLogin() {

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    try {

        // 🔥 Step 1: Send token to backend to set cookie
        const verify = await safeFetch(
            `${API_BASE_URL}/api/auth/verify-token`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token })
            }
        );

        if (!verify.success) {
            throw new Error("Invalid token");
        }

        // 🔥 Step 2: Now cookie is set → fetch profile
        const profile = await safeFetch(`${API_BASE_URL}/api/user/profile`);

        if (!profile.success || !profile.data.user) {
            throw new Error("User not found");
        }

        const user = profile.data.user;

        if (user.role === "admin") {
            window.location.href = "admin/admin-dashboard.html";
            return;
        }

        if (user.category?.dashboard?.route) {
            window.location.href = user.category.dashboard.route;
        } else {
            alert("Dashboard not assigned to this user.");
            window.location.href = "login.html";
        }

    } catch (err) {
        console.error(err);
        window.location.href = "login.html";
    }
}

// Attach event after DOM loads
document.addEventListener("DOMContentLoaded", function () {
    document
        .getElementById("continueBtn")
        ?.addEventListener("click", continueLogin);
});