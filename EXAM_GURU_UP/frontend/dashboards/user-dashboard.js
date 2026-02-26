/* ================= GLOBAL ================= */

let user = null;
let token = null;

document.addEventListener("DOMContentLoaded", init);

/* ================= INIT ================= */

function init() {
    try {
        user = JSON.parse(localStorage.getItem("user"));
        token = localStorage.getItem("token");

        if (!user || !token) {
            window.location.href = "../login.html";
            return;
        }

        document.getElementById("welcomeUser").innerText =
            "Welcome, " + user.name;

        document.getElementById("userSubCategory").innerText =
            user.subCategory;

        bindEvents();
        initModalSystem();

    } catch (err) {
        console.error("Init Error:", err);
        alert("Something went wrong. Please login again.");
        localStorage.clear();
        window.location.href = "../login.html";
    }
}

/* ================= EVENTS ================= */

function bindEvents() {

    document.getElementById("loadPapersBtn")
        ?.addEventListener("click", loadPapers);

    document.getElementById("loadNotesBtn")
        ?.addEventListener("click", loadNotes);

    document.getElementById("loadPracticalsBtn")
        ?.addEventListener("click", loadPracticals);

    document.getElementById("loadProjectsBtn")
        ?.addEventListener("click", loadProjects);
}

/* ================= MODAL SYSTEM ================= */

function initModalSystem() {

    const backdrop = document.getElementById("modalBackdrop");
    const closeButtons = document.querySelectorAll(".close-modal-btn");
    const allSections = document.querySelectorAll(".section");

    const cardMap = {
        papersCard: "papers",
        notesCard: "notes",
        practicalsCard: "practicals",
        projectsCard: "projects"
    };

    function openModal(sectionId) {
        closeAll();
        document.body.classList.add("modal-open");
        const section = document.getElementById(sectionId);
        backdrop.classList.add("active");
        section.classList.add("active");
        loadSubjects();
    }

    function closeAll() {
        document.body.classList.remove("modal-open");
        backdrop.classList.remove("active");
        allSections.forEach(sec => sec.classList.remove("active"));
    }

    Object.keys(cardMap).forEach(cardId => {
        document.getElementById(cardId)
            ?.addEventListener("click", () => openModal(cardMap[cardId]));
    });

    closeButtons.forEach(btn =>
        btn.addEventListener("click", closeAll)
    );

    backdrop.addEventListener("click", closeAll);

    document.addEventListener("keydown", e => {
        if (e.key === "Escape") closeAll();
    });
}

/* ================= SAFE FETCH ================= */

async function safeFetch(url) {
    try {
        const res = await fetch(url, {
            headers: { Authorization: "Bearer " + token }
        });

        if (!res.ok) throw new Error(res.status);

        return await res.json();

    } catch (error) {
        console.error("Fetch Error:", error);
        alert("Server unreachable.");
        return null;
    }
}

/* ================= LOAD SUBJECTS ================= */

async function loadSubjects() {

    const data = await safeFetch(
        `${API_BASE_URL}/api/student/subjects/${user.subCategory}`
    );

    if (!data) return;

    ["paperSubject", "notesSubject", "practicalSubject"]
        .forEach(id => {

            const select = document.getElementById(id);
            if (!select) return;

            select.innerHTML =
                "<option value=''>Select Subject</option>";

            data.forEach(sub => {
                select.innerHTML +=
                    `<option value="${sub}">${sub}</option>`;
            });
        });
}

/* ================= LOAD FUNCTIONS ================= */

async function loadPapers() {

    const semester =
        document.getElementById("papersSemester").value;

    const subject =
        document.getElementById("paperSubject").value;

    if (!subject) return alert("Select subject");

    const data = await safeFetch(
        `${API_BASE_URL}/api/student/papers?subCategory=${user.subCategory}&semester=${semester}&subject=${subject}`
    );

    renderList("paperList", data);
}

async function loadNotes() {

    const subject =
        document.getElementById("notesSubject").value;

    const semester =
        document.getElementById("notesSemester").value;


    if (!subject) return alert("Select subject");

    const data = await safeFetch(
        `${API_BASE_URL}/api/student/notes?subCategory=${user.subCategory}&subject=${subject}&semester=${semester}`
    );

    renderList("notesList", data);
}

async function loadPracticals() {

    const subject =
        document.getElementById("practicalSubject").value;

    const semester =
        document.getElementById("practicalsSemester").value;

    if (!subject) return alert("Select subject");

    const data = await safeFetch(
        `${API_BASE_URL}/api/student/practicals?subCategory=${user.subCategory}&semester=${semester}&subject=${subject}`
    );

    renderList("practicalList", data);
}

async function loadProjects() {

    const type =
        document.getElementById("projectType").value;

    const data = await safeFetch(
        `${API_BASE_URL}/api/student/projects?subCategory=${user.subCategory}&type=${type}`
    );

    renderList("projectList", data);
}

/* ================= RENDER ================= */

function renderList(elementId, items) {

    const container =
        document.getElementById(elementId);

    container.innerHTML = "";

    if (!items || items.length === 0) {
        container.innerHTML = "No files available";
        return;
    }

    items.forEach(item => {

        const url = item.pdfUrl.startsWith("http")
            ? item.pdfUrl.trim()
            : "https://" + item.pdfUrl.trim();

        container.innerHTML += `
            <div class="pdf-item">
                ${item.title}<br>
                <a href="${url}" target="_blank">
                    Download PDF
                </a>
            </div>
        `;
    });
}