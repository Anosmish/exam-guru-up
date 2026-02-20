const api = `${API_BASE_URL}/api/categories` ;

/* ================= LOAD CATEGORIES ================= */

async function loadCategories() {
    try {
        // Fetch categories with dashboard populated
        const res = await fetch(api);
        const data = await res.json();

        const container = document.getElementById("categoryList");
        const catForSub = document.getElementById("catForSub");
        const catForSubject = document.getElementById("catForSubject");

        if (!container || !catForSub || !catForSubject) return;

        container.innerHTML = "";
        catForSub.innerHTML = `<option value="">Select Category</option>`;
        catForSubject.innerHTML = `<option value="">Select Category</option>`;

        data.forEach(cat => {

            // Populate dropdowns
            catForSub.innerHTML += `
                <option value="${cat._id}">
                    ${cat.name}
                </option>
            `;

            catForSubject.innerHTML += `
                <option value="${cat._id}">
                    ${cat.name}
                </option>
            `;

            // Create category block
            const div = document.createElement("div");

            div.innerHTML = `
                <h3>
                    ${cat.name}
                    <small style="color:gray;">
                        (Dashboard: ${cat.dashboard?.name || "None"})
                    </small>
                </h3>

                <button onclick="deleteCategory('${cat._id}')">
                    Delete
                </button>

                <ul>
                    ${(cat.subCategories || []).map(sub => `
                        <li>
                            <strong>${sub.name}</strong>
                            <button onclick="deleteSub('${cat._id}','${sub.name}')">
                                X
                            </button>
                            <br>
                            Subjects:
                            <ul>
                                ${(sub.subjects || []).length > 0
                                    ? sub.subjects.map(subject => `
                                        <li>
                                            ${subject}
                                            <button onclick="deleteSubject(
                                                '${cat._id}',
                                                '${sub.name}',
                                                '${subject}'
                                            )">
                                                X
                                            </button>
                                        </li>
                                    `).join("")
                                    : "<li>No Subjects</li>"
                                }
                            </ul>
                        </li>
                    `).join("") || "<li>No SubCategories</li>"}
                </ul>

                <hr>
            `;

            container.appendChild(div);
        });

        // Store globally
        window.allCategories = data;

    } catch (err) {
        console.log("Load Category Error:", err);
    }
}



function adminLogout() {
    localStorage.clear();
    window.location.href = "../login.html";
}

/* ================= ADD CATEGORY ================= */

async function addCategory() {
    const name = document.getElementById("newCategory").value;
    const dashboardId = document.getElementById("dashboardSelect").value;
    if (!name || !dashboardId) {
        alert("Enter category name and select dashboard");
        return;
    }

    await fetch(api + "/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, dashboardId  })
    });

    loadCategories();
}

async function loadDashboards() {

    const res = await fetch(`${API_BASE_URL}/api/dashboard`);
    const dashboards = await res.json();

    const select = document.getElementById("dashboardSelect");

    select.innerHTML = `<option value="">Select Dashboard</option>`;

    dashboards.forEach(d => {
        select.innerHTML += `
            <option value="${d._id}">
                ${d.name}
            </option>
        `;
    });
}


/* ================= ADD SUBCATEGORY ================= */

async function addSubCategory() {

    const categoryId = document.getElementById("catForSub").value;
    const subCategory = document.getElementById("newSubCategory").value;

    if (!categoryId || !subCategory) {
        alert("Select category and enter subcategory");
        return;
    }

    await fetch(api + "/add-sub", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId, subCategory })
    });

    loadCategories();
}

/* ================= ADD SUBJECT ================= */

async function addSubject() {

    const categoryId = document.getElementById("catForSubject").value;
    const subCategory = document.getElementById("subForSubject").value;
    const subject = document.getElementById("newSubject").value;

    if (!categoryId || !subCategory || !subject) {
        alert("Select category, subcategory and enter subject");
        return;
    }

    await fetch(api + "/add-subject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId, subCategory, subject })
    });

    loadCategories();
}

/* ================= DELETE ================= */

async function deleteCategory(id) {
    await fetch(api + "/" + id, { method: "DELETE" });
    loadCategories();
}

async function deleteSub(categoryId, subCategory) {
    await fetch(api + "/delete-sub", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId, subCategory })
    });

    loadCategories();
}

async function deleteSubject(categoryId, subCategory, subject) {

    await fetch(api + "/delete-subject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId, subCategory, subject })
    });

    loadCategories();
}


/* ================= CATEGORY CHANGE (For Subject Dropdown) ================= */

document.getElementById("catForSubject").addEventListener("change", function () {

    const selectedId = this.value;
    const subDropdown = document.getElementById("subForSubject");

    subDropdown.innerHTML = `<option value="">Select SubCategory</option>`;

    const category = window.allCategories.find(c => c._id === selectedId);

    if (category) {
        (category.subCategories || []).forEach(sub => {
            subDropdown.innerHTML += `<option value="${sub.name}">${sub.name}</option>`;
        });
    }
});
loadDashboards();

loadCategories();
