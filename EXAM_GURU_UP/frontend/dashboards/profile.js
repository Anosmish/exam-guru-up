document.addEventListener("DOMContentLoaded", init);

const CATEGORY_API = `${API_BASE_URL}/api/categories`;
let allCategories = [];

/* ================= SAFE FETCH ================= */

async function safeFetch(url, options = {}) {
    try {
        const res = await fetch(url, {
            credentials: "include",
            ...options
        });

        if (res.status === 401) {
            window.location.href = "../login.html";
            return null;
        }

        const data = await res.json();

        if (!res.ok) {
            console.error("API Error:", data.message);
            return null;
        }

        return data;

    } catch (err) {
        console.error("Fetch Error:", err);
        alert("Server unreachable.");
        return null;
    }
}

/* ================= INIT ================= */

async function init() {
    bindBackButton();
    bindLogout();

    const userLoaded = await loadProfile();
    if (!userLoaded) return;

    await loadCategories();
}

/* ================= BACK BUTTON ================= */

function bindBackButton() {
    document.getElementById("backBtn")?.addEventListener("click", async () => {

        const data = await safeFetch(`${API_BASE_URL}/api/user/profile`);
        if (!data?.user) return;

        const user = data.user;

        if (user.role === "admin") {
            window.location.href = "../admin/admin-dashboard.html";
            return;
        }

        if (user.category?.dashboard?.route) {
            window.location.href = user.category.dashboard.route;
        } else {
            alert("Dashboard not assigned.");
        }
    });
}

/* ================= LOGOUT ================= */

function bindLogout() {
    document.getElementById("logoutBtn")?.addEventListener("click", async () => {

        await fetch(`${API_BASE_URL}/api/auth/logout`, {
            method: "POST",
            credentials: "include"
        });

        window.location.href = "../index.html";
    });
}

/* ================= LOAD PROFILE ================= */

async function loadProfile() {

    const data = await safeFetch(`${API_BASE_URL}/api/user/profile`);
    if (!data?.user) return false;

    const user = data.user;

    document.getElementById("name").innerText = user.name;
    document.getElementById("email").innerText = user.email;
    document.getElementById("category").innerText =
        user.category?.name || "Not Selected";
    document.getElementById("subCategory").innerText =
        user.subCategory || "Not Selected";

    document.getElementById("editName").value = user.name;

    return true;
}

/* ================= LOAD CATEGORIES ================= */

async function loadCategories() {

    const data = await safeFetch(CATEGORY_API);
    if (!data) return;

    allCategories = data;

    const catSelect = document.getElementById("editCategory");
    const subSelect = document.getElementById("editSubCategory");

    catSelect.innerHTML = '<option value="">Select Category</option>';
    subSelect.innerHTML = '<option value="">Select Sub Category</option>';

    allCategories.forEach(cat => {
        catSelect.innerHTML += `<option value="${cat._id}">${cat.name}</option>`;
    });

    catSelect.addEventListener("change", function () {
        loadSubCategories(this.value);
    });

    // Pre-select current user category
    const profile = await safeFetch(`${API_BASE_URL}/api/user/profile`);
    if (!profile?.user?.category?._id) return;

    catSelect.value = profile.user.category._id;
    loadSubCategories(profile.user.category._id);
    subSelect.value = profile.user.subCategory;
}

/* ================= LOAD SUB CATEGORY ================= */

function loadSubCategories(categoryId) {

    const subSelect = document.getElementById("editSubCategory");
    subSelect.innerHTML = '<option value="">Select Sub Category</option>';

    const selected = allCategories.find(c => c._id === categoryId);
    if (!selected) return;

    selected.subCategories.forEach(sub => {
        const subName = typeof sub === "object" ? sub.name : sub;
        subSelect.innerHTML += `<option value="${subName}">${subName}</option>`;
    });
}

/* ================= UPDATE PROFILE ================= */

async function updateProfile() {

    const name = document.getElementById("editName").value;
    const category = document.getElementById("editCategory").value;
    const subCategory = document.getElementById("editSubCategory").value;
    const msg = document.getElementById("updateMsg");

    if (!name || !category || !subCategory) {
        msg.innerText = "Please fill all fields";
        msg.className = "msg error";
        return;
    }

    msg.innerText = "Updating...";
    msg.className = "msg loading";

    const data = await safeFetch(
        `${API_BASE_URL}/api/user/update`,
        {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, category, subCategory })
        }
    );

    if (!data) {
        msg.innerText = "Update failed";
        msg.className = "msg error";
        return;
    }

    msg.innerText = "Profile updated successfully";
    msg.className = "msg success";
    loadProfile();
}

/* ================= CHANGE PASSWORD ================= */

async function changePassword() {

    const oldPasswordInput = document.getElementById("oldPassword");
    const newPasswordInput = document.getElementById("newPassword");
    const confirmPasswordInput = document.getElementById("confirmPassword");
    const msg = document.getElementById("passMsg");

    const oldPassword = oldPasswordInput.value;
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (!oldPassword || !newPassword || !confirmPassword) {
        msg.innerText = "Please fill all fields";
        msg.className = "msg error";
        return;
    }

    if (newPassword !== confirmPassword) {
        msg.innerText = "Passwords do not match";
        msg.className = "msg error";
        return;
    }

    msg.innerText = "Updating...";
    msg.className = "msg loading";

    const data = await safeFetch(
        `${API_BASE_URL}/api/user/change-password`,
        {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ oldPassword, newPassword })
        }
    );

    if (!data) {
        msg.innerText = "Password change failed";
        msg.className = "msg error";
        return;
    }

    msg.innerText = "Password changed successfully";
    msg.className = "msg success";

    oldPasswordInput.value = "";
    newPasswordInput.value = "";
    confirmPasswordInput.value = "";
}