// Global variables
let user = null;
let token = null;

document.addEventListener("DOMContentLoaded", init);

function init() {
    user = JSON.parse(localStorage.getItem("user"));
    token = localStorage.getItem("token");

    if (!user || !token) {
        window.location.href = "../login.html";
        return;
    }

    document.getElementById("welcomeUser").innerText = "Welcome, " + user.name;
    document.getElementById("userSubCategory").innerText = user.subCategory;

    bindEvents();
}

/* ================= EVENTS ================= */

function bindEvents() {
    // Cards
    document.getElementById("papersCard")?.addEventListener("click", () => showSection("papers"));
    document.getElementById("notesCard")?.addEventListener("click", () => showSection("notes"));
    document.getElementById("practicalsCard")?.addEventListener("click", () => showSection("practicals"));
    document.getElementById("projectsCard")?.addEventListener("click", () => showSection("projects"));

    // Buttons
    document.getElementById("loadPapersBtn")?.addEventListener("click", loadPapers);
    document.getElementById("loadNotesBtn")?.addEventListener("click", loadNotes);
    document.getElementById("loadPracticalsBtn")?.addEventListener("click", loadPracticals);
    document.getElementById("loadProjectsBtn")?.addEventListener("click", loadProjects);

    // Logout
    document.getElementById("logoutBtn")?.addEventListener("click", logout);
}

/* ================= SHOW SECTION ================= */

function showSection(id) {
    document.querySelectorAll(".section").forEach(sec => sec.style.display = "none");
    document.getElementById(id).style.display = "block";
    loadSubjects();
}

/* ================= LOGOUT ================= */

function logout() {
    localStorage.clear();
    window.location.href = "../index.html";
}

/* ================= LOAD SUBJECTS ================= */

async function loadSubjects() {
    const res = await fetch(`${API_BASE_URL}/api/student/subjects/${user.subCategory}`);
    const subjects = await res.json();

    ["paperSubject", "notesSubject", "practicalSubject"].forEach(id => {
        const select = document.getElementById(id);
        if (!select) return;

        select.innerHTML = "<option value=''>Select Subject</option>";

        subjects.forEach(sub => {
            select.innerHTML += `<option value="${sub}">${sub}</option>`;
        });
    });
}

/* ================= LOAD FUNCTIONS ================= */

async function loadPapers() {
    const subject = document.getElementById("paperSubject").value;
    const res = await fetch(`${API_BASE_URL}/api/student/papers?subCategory=${user.subCategory}&subject=${subject}`);
    const data = await res.json();
    renderList("paperList", data);
}

async function loadNotes() {
    const subject = document.getElementById("notesSubject").value;
    const semester = document.getElementById("semesterSelect").value;
    const unit = document.getElementById("unitSelect").value;

    const res = await fetch(`${API_BASE_URL}/api/student/notes?subCategory=${user.subCategory}&subject=${subject}&semester=${semester}&unit=${unit}`);
    const data = await res.json();
    renderList("notesList", data);
}

async function loadPracticals() {
    const subject = document.getElementById("practicalSubject").value;
    const res = await fetch(`${API_BASE_URL}/api/student/practicals?subCategory=${user.subCategory}&subject=${subject}`);
    const data = await res.json();
    renderList("practicalList", data);
}

async function loadProjects() {
    const type = document.getElementById("projectType").value;
    const res = await fetch(`${API_BASE_URL}/api/student/projects?subCategory=${user.subCategory}&type=${type}`);
    const data = await res.json();
    renderList("projectList", data);
}

/* ================= RENDER LIST ================= */

function renderList(elementId, items) {
    const container = document.getElementById(elementId);
    container.innerHTML = "";

    if (!items || items.length === 0) {
        container.innerHTML = "No files available";
        return;
    }

    items.forEach(item => {
        container.innerHTML += `
            <div class="pdf-item">
                ${item.title}
                <br>
                <a href="${API_BASE_URL}${item.pdfUrl}" target="_blank">
                    Download PDF
                </a>
            </div>
        `;
    });
}