document.addEventListener("DOMContentLoaded", function () {

    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));

    // 🔐 Admin Auth Check
    if (!token || !user || user.role !== "admin") {
        window.location.href = "../login.html";
        return;
    }

    // ================= DASHBOARD =================

    if (document.getElementById("liveUsers")) {
        const socket = io(`${API_BASE_URL}`);

        socket.on("liveUsers", (count) => {
            document.getElementById("liveUsers").innerText = count;
        });
    }

    if (document.getElementById("totalUsers")) {
        loadTotalUsers();
    }

    // ================= USERS =================

    if (document.getElementById("userList")) {
        loadUsers();
    }

    // ================= QUESTIONS =================

    if (document.getElementById("questionList")) {
        loadQuestions();
    }

    if (document.getElementById("categorySelect")) {
        loadCategories();
    }

    if (document.getElementById("dashboardList")) {
    loadDashboards();
}


    // ================= CHARTS =================

    if (document.getElementById("subjectChart")) {
        loadCharts();
    }

});

/* ======================================================
   LOGOUT
====================================================== */

function adminLogout() {
    localStorage.clear();
    window.location.href = "../index.html";
}

document.getElementById("logoutBtn")
.addEventListener("click", ()=>{

    localStorage.clear();
    window.location.href="../index.html";

});

/* ======================================================
   TOTAL USERS
====================================================== */

async function loadTotalUsers() {

    try {

        const token = localStorage.getItem("token");

        const res = await fetch(
            `${API_BASE_URL}/api/admin/total-users`,
            { headers: { "Authorization": "Bearer " + token }}
        );

        const data = await res.json();

        if (res.ok) {
            document.getElementById("totalUsers").innerText =
                data.totalUsers;
        }

    } catch (err) {
        console.log("Total Users Error:", err);
    }
}

/* ======================================================
   USERS
====================================================== */

async function loadUsers() {

    const token = localStorage.getItem("token");

    const res = await fetch(
        `${API_BASE_URL}/api/admin/all-users`,
        { headers: { "Authorization": "Bearer " + token } }
    );

    const data = await res.json();

    const container = document.getElementById("userList");
    container.innerHTML = "";

    data.forEach(u => {
        container.innerHTML += `
            <p>
                ${u.name} - ${u.email} 
                <button onclick="deleteUser('${u._id}')">Delete</button>
            </p>
        `;
    });
}

async function deleteUser(id) {

    const token = localStorage.getItem("token");

    await fetch(
        `${API_BASE_URL}/api/admin/delete-user/${id}`,
        { method: "DELETE", headers: { "Authorization": "Bearer " + token } }
    );

    loadUsers();
}

/* ======================================================
   QUESTIONS
====================================================== */

async function loadQuestions() {

    const token = localStorage.getItem("token");

    const res = await fetch(
        `${API_BASE_URL}/api/admin/all-questions`,
        { headers: { "Authorization":"Bearer " +  token } }
    );

    const data = await res.json();

    const container = document.getElementById("questionList");
    container.innerHTML = "";

    data.forEach(q => {
        container.innerHTML += `
            <p>
                ${q.question}
                (${q.subject} - ${q.subCategory})
                <button onclick="deleteQuestion('${q._id}')">Delete</button>
            </p>
        `;
    });
}

async function deleteQuestion(id) {

    const token = localStorage.getItem("token");

    await fetch(
        `${API_BASE_URL}/api/admin/delete-question/${id}`,
        { method: "DELETE", headers: { "Authorization": "Bearer " +  token } }
    );

    loadQuestions();
}

/* ======================================================
   ADD QUESTION
====================================================== */

async function addQuestion() {

    const token = localStorage.getItem("token");

    const question = document.getElementById("question").value;
    const A = document.getElementById("A").value;
    const B = document.getElementById("B").value;
    const C = document.getElementById("C").value;
    const D = document.getElementById("D").value;
    const correct = document.getElementById("correct").value;

    const category = document.getElementById("categorySelect").value;
    const subCategory = document.getElementById("subCategorySelect").value;
    const subject = document.getElementById("subject").value;
    const difficulty = document.getElementById("difficulty").value;

    if (!question || !A || !B || !C || !D ||
        !correct || !category || !subCategory || !subject) {

        alert("Please fill all fields");
        return;
    }

    const res = await fetch(
        `${API_BASE_URL}/api/admin/add-question`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                question,
                options: { A, B, C, D },
                correctAnswer: correct,
                category,
                subCategory,
                subject,
                difficulty
            })
        }
    );

    if (res.ok) {
        alert("Question Added Successfully ✅");
        loadQuestions();
    } else {
        alert("Error adding question ❌");
    }
}

/* ======================================================
   CATEGORY + SUBCATEGORY + SUBJECT
====================================================== */

async function loadCategories() {

    const res = await fetch(`${API_BASE_URL}/api/categories`);
    const categories = await res.json();

    const catSelect = document.getElementById("categorySelect");

    catSelect.innerHTML = `<option value="">Select Category</option>`;

    categories.forEach(cat => {
        catSelect.innerHTML +=
            `<option value="${cat._id}">${cat.name}</option>`;
    });

    window.allCategories = categories;
}

/* ===== Category Change → Load SubCategories ===== */

document.addEventListener("change", function (e) {

    if (e.target && e.target.id === "categorySelect") {

        const selectedId = e.target.value;

        const subSelect =
            document.getElementById("subCategorySelect");

        const subjectSelect =
            document.getElementById("subject");

        subSelect.innerHTML =
            `<option value="">Select Sub Category</option>`;

        subjectSelect.innerHTML =
            `<option value="">Select Subject</option>`;

        const selected =
            window.allCategories.find(c => c._id === selectedId);

        if (selected) {

            selected.subCategories.forEach(sub => {

                subSelect.innerHTML +=
                    `<option value="${sub.name}">
                        ${sub.name}
                    </option>`;

            });
        }
    }

    /* ===== SubCategory Change → Load Subjects ===== */

    if (e.target && e.target.id === "subCategorySelect") {

        const categoryId =
            document.getElementById("categorySelect").value;

        const subName = e.target.value;

        const subjectSelect =
            document.getElementById("subject");

        subjectSelect.innerHTML =
            `<option value="">Select Subject</option>`;

        const selected =
            window.allCategories.find(c => c._id === categoryId);

        if (selected) {

            const sub =
                selected.subCategories.find(
                    s => s.name === subName
                );

            if (sub) {
                sub.subjects.forEach(subject => {
                    subjectSelect.innerHTML +=
                        `<option value="${subject}">
                            ${subject}
                        </option>`;
                });
            }
        }
    }

});

async function loadSubjects(categoryId, subCategory){

    const res = await fetch(
        `${API_BASE_URL}/api/categories/subjects?categoryId=${categoryId}&subCategory=${subCategory}`
    );

    const subjects = await res.json();

    const subjectSelect = document.getElementById("subjectSelect");

    subjectSelect.innerHTML = '<option value="">Select Subject</option>';

    subjects.forEach(sub=>{
        subjectSelect.innerHTML += `
            <option value="${sub}">${sub}</option>
        `;
    });
}


const subCat = document.getElementById("subCategorySelect");

if (subCat) {
    subCat.addEventListener("change", function () {

        const categoryId =
            document.getElementById("categorySelect")?.value;

        loadSubjects(categoryId, this.value);
    });
}



/* ======================================================
   JSON UPLOAD
====================================================== */

async function uploadJSON() {

    const token = localStorage.getItem("token");
    const fileInput = document.getElementById("jsonFile");

    if (!fileInput.files.length) {
        alert("Please select JSON file");
        return;
    }

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);

    const res = await fetch(
        `${API_BASE_URL}/api/admin/upload-json`,
        {
            method: "POST",
            headers: { "Authorization": "Bearer " + token },
            body: formData
        }
    );

    if (res.ok) {
        alert("JSON Uploaded Successfully ✅");
        loadQuestions();
    } else {
        alert("Upload Failed ❌");
    }
}

document.addEventListener("DOMContentLoaded", init);

function init() {

    bindCreateDashboard();
    bindDashboardActions();
    loadDashboards();
}

/* ============================= */
/* CREATE DASHBOARD */
/* ============================= */

function bindCreateDashboard() {
    const btn = document.getElementById("createDashboardBtn");
    if (btn) {
        btn.addEventListener("click", createDashboard);
    }
}

async function createDashboard() {

    const token = localStorage.getItem("token");

    const name = document.getElementById("dashName").value.trim();
    const route = document.getElementById("dashRoute").value.trim();
    const description = document.getElementById("dashDesc").value.trim();

    if (!name || !route) {
        alert("Name and Route required");
        return;
    }

    const res = await fetch(`${API_BASE_URL}/api/dashboard/add`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: JSON.stringify({ name, route, description })
    });

    if (res.ok) {
        alert("Dashboard Created ✅");
        clearForm();
        loadDashboards();
    } else {
        alert("Error creating dashboard ❌");
    }
}

function clearForm() {
    document.getElementById("dashName").value = "";
    document.getElementById("dashRoute").value = "";
    document.getElementById("dashDesc").value = "";
}

/* ============================= */
/* LOAD DASHBOARDS */
/* ============================= */

async function loadDashboards() {

    const token = localStorage.getItem("token");

    const container = document.getElementById("dashboardList");
    if (!container) return;

    const res = await fetch(`${API_BASE_URL}/api/dashboard`, {
        headers: { "Authorization": "Bearer " + token }
    });

    const data = await res.json();

    container.innerHTML = "";

    data.forEach(d => {
        container.innerHTML += `
            <div class="dashboard-item" style="margin-bottom:10px;">
                <b>${d.name}</b> (${d.route})
                <br>
                <span class="desc">${d.description || ""}</span>
                <br>
                <button class="editBtn" 
                        data-id="${d._id}"
                        data-name="${d.name}"
                        data-route="${d.route}"
                        data-desc="${d.description || ""}">
                        Edit
                </button>

                <button class="deleteBtn" data-id="${d._id}">
                        Delete
                </button>
                <hr>
            </div>
        `;
    });
}

/* ============================= */
/* EDIT & DELETE (Event Delegation) */
/* ============================= */

function bindDashboardActions() {

    const container = document.getElementById("dashboardList");
    if (!container) return;

    container.addEventListener("click", function (e) {

        if (e.target.classList.contains("deleteBtn")) {
            const id = e.target.dataset.id;
            deleteDashboard(id);
        }

        if (e.target.classList.contains("editBtn")) {
            const id = e.target.dataset.id;
            const name = e.target.dataset.name;
            const route = e.target.dataset.route;
            const desc = e.target.dataset.desc;

            editDashboard(id, name, route, desc);
        }

    });
}

/* ============================= */
/* DELETE */
/* ============================= */

async function deleteDashboard(id) {

    if (!confirm("Are you sure you want to delete this dashboard?"))
        return;

    const token = localStorage.getItem("token");

    await fetch(`${API_BASE_URL}/api/dashboard/${id}`, {
        method: "DELETE",
        headers: {
            "Authorization": "Bearer " + token
        }
    });

    loadDashboards();
}

/* ============================= */
/* EDIT */
/* ============================= */

function editDashboard(id, name, route, description) {

    const newName = prompt("Edit Name:", name);
    const newRoute = prompt("Edit Route:", route);
    const newDesc = prompt("Edit Description:", description);

    if (!newName || !newRoute) return;

    updateDashboard(id, newName, newRoute, newDesc);
}

async function updateDashboard(id, name, route, description) {

    const token = localStorage.getItem("token");

    await fetch(`${API_BASE_URL}/api/dashboard/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: JSON.stringify({ name, route, description })
    });

    alert("Dashboard Updated ✅");
    loadDashboards();
}

/* ======================================================
   CHARTS
====================================================== */

function loadCharts() {

    const subjectCtx =
        document.getElementById("subjectChart").getContext("2d");

    new Chart(subjectCtx, {
        type: "bar",
        data: {
            labels: ["Math", "Reasoning", "English", "GK"],
            datasets: [{
                label: "Questions",
                data: [45, 30, 25, 40],
                backgroundColor: "#38bdf8"
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } }
        }
    });

    const difficultyCtx =
        document.getElementById("difficultyChart").getContext("2d");

    new Chart(difficultyCtx, {
        type: "pie",
        data: {
            labels: ["Easy", "Medium", "Hard"],
            datasets: [{
                data: [60, 25, 15],
                backgroundColor: ["#22c55e", "#facc15", "#ef4444"]
            }]
        }
    });
}


const token = localStorage.getItem("token");
if(!token){ window.location.href="login.html"; }

const typeSelect = document.getElementById("contentType");
const categorySelect = document.getElementById("categorySelect");
const subCategorySelect = document.getElementById("subCategorySelect");
const subjectSelect = document.getElementById("subjectSelect");
const projectTypeSelect = document.getElementById("projectTypeSelect");
const form = document.getElementById("uploadForm");
const fileList = document.getElementById("fileList");

let categoriesData = [];

/* ================= LOAD CATEGORIES ================= */

async function loadCategories(){
    const res = await fetch(`${API_BASE_URL}/api/admin/all-categories`,{
        headers:{ Authorization:"Bearer "+token }
    });

    categoriesData = await res.json();

    categoriesData.forEach(cat=>{
        categorySelect.innerHTML += `<option value="${cat._id}">${cat.name}</option>`;
    });
}

/* ================= LOAD SUBCATEGORIES ================= */

categorySelect.addEventListener("change",()=>{
    subCategorySelect.innerHTML = `<option value="">Select SubCategory</option>`;
    subjectSelect.innerHTML = `<option value="">Select Subject</option>`;

    const selected = categoriesData.find(c=>c._id===categorySelect.value);
    if(!selected) return;

    selected.subCategories.forEach(sub=>{
        subCategorySelect.innerHTML += `<option value="${sub.name}">${sub.name}</option>`;
    });
});

/* ================= LOAD SUBJECTS ================= */

subCategorySelect.addEventListener("change",()=>{
    subjectSelect.innerHTML = `<option value="">Select Subject</option>`;

    const selected = categoriesData.find(c=>c._id===categorySelect.value);
    if(!selected) return;

    const sub = selected.subCategories.find(s=>s.name===subCategorySelect.value);
    if(!sub) return;

    sub.subjects.forEach(subj=>{
        subjectSelect.innerHTML += `<option value="${subj}">${subj}</option>`;
    });
});

/* ================= TOGGLE PROJECT TYPE ================= */

typeSelect.addEventListener("change",()=>{
    if(typeSelect.value==="project"){
        projectTypeSelect.style.display="block";
        subjectSelect.style.display="none";
    }else{
        projectTypeSelect.style.display="none";
        subjectSelect.style.display="block";
    }
});

/* ================= UPLOAD ================= */

form.addEventListener("submit", async function(e){
    e.preventDefault();

    const formData = new FormData(this);
    formData.append("contentType", typeSelect.value);

    const res = await fetch(`${API_BASE_URL}/api/admin/upload-content`,{
        method:"POST",
        headers:{ Authorization:"Bearer "+token },
        body:formData
    });

    const data = await res.json();

    if(res.ok){
        alert("Uploaded Successfully ✅");
        form.reset();
        loadFiles();
    }else{
        alert(data.message || "Upload Failed ❌");
    }
});

/* ================= LOAD FILES ================= */

async function loadFiles(){

    const type = typeSelect.value;

    const res = await fetch(`${API_BASE_URL}/api/admin/list-content?type=${type}`,{
        headers:{ Authorization:"Bearer "+token }
    });

    const data = await res.json();
    fileList.innerHTML="";

    if(data.length===0){
        fileList.innerHTML="<p>No files uploaded yet.</p>";
        return;
    }

    data.forEach(item=>{
        fileList.innerHTML += `
        <div>
            <strong>${item.title}</strong><br>
            Branch: ${item.subCategory || "-"}<br>
            <a href="${API_BASE_URL}${item.pdfUrl}" target="_blank">View PDF</a>
            <br><br>
            <button class="danger" onclick="deleteFile('${item._id}','${type}')">Delete</button>
        </div>`;
    });
}

/* ================= DELETE ================= */

async function deleteFile(id,type){
    if(!confirm("Delete this file?")) return;

    await fetch(`${API_BASE_URL}/api/admin/delete-content/${id}?type=${type}`,{
        method:"DELETE",
        headers:{ Authorization:"Bearer "+token }
    });

    loadFiles();
}

/* INITIAL LOAD */
loadCategories();
loadFiles();

