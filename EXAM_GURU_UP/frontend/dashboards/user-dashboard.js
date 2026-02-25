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

        const welcome = document.getElementById("welcomeUser");
        const subCat = document.getElementById("userSubCategory");

        if (welcome) welcome.innerText = "Welcome, " + user.name;
        if (subCat) subCat.innerText = user.subCategory;

        bindEvents();

    } catch (err) {
        console.error("Init Error:", err);
        alert("Something went wrong. Please login again.");
        localStorage.clear();
        window.location.href = "../login.html";
    }
}

/* ================= EVENTS ================= */

function bindEvents() {

    document.getElementById("papersCard")?.addEventListener("click", () => showSection("papers"));
    document.getElementById("notesCard")?.addEventListener("click", () => showSection("notes"));
    document.getElementById("practicalsCard")?.addEventListener("click", () => showSection("practicals"));
    document.getElementById("projectsCard")?.addEventListener("click", () => showSection("projects"));

    document.getElementById("loadPapersBtn")?.addEventListener("click", loadPapers);
    document.getElementById("loadNotesBtn")?.addEventListener("click", loadNotes);
    document.getElementById("loadPracticalsBtn")?.addEventListener("click", loadPracticals);
    document.getElementById("loadProjectsBtn")?.addEventListener("click", loadProjects);

    document.getElementById("logoutBtn")?.addEventListener("click", logout);
}

/* ================= SHOW SECTION ================= */

function showSection(id) {
    document.querySelectorAll(".section")
        .forEach(sec => sec.style.display = "none");

    const section = document.getElementById(id);
    if (section) section.style.display = "block";

    loadSubjects();
}

/* ================= LOGOUT ================= */

function logout() {
    localStorage.clear();
    window.location.href = "../index.html";
}

/* ================= SAFE FETCH ================= */

async function safeFetch(url) {
    try {
        const res = await fetch(url, {
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        if (!res.ok) {
            throw new Error("Server error: " + res.status);
        }

        return await res.json();

    } catch (error) {
        console.error("Fetch Error:", error);
        alert("Server unreachable. Check internet or try again.");
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

            select.innerHTML = "<option value=''>Select Subject</option>";

            data.forEach(sub => {
                select.innerHTML += `<option value="${sub}">${sub}</option>`;
            });
        });
}

/* ================= LOAD PAPERS ================= */

async function loadPapers() {

    const subject = document.getElementById("paperSubject")?.value;

    if (!subject) {
        alert("Please select subject");
        return;
    }

    const data = await safeFetch(
        `${API_BASE_URL}/api/student/papers?subCategory=${user.subCategory}&subject=${subject}`
    );

    renderList("paperList", data);
}

/* ================= LOAD NOTES ================= */

async function loadNotes() {

    const subject = document.getElementById("notesSubject")?.value;
    const semester = document.getElementById("semesterSelect")?.value || "";
    const unit = document.getElementById("unitSelect")?.value || "";

    if (!subject) {
        alert("Please select subject");
        return;
    }

    const data = await safeFetch(
        `${API_BASE_URL}/api/student/notes?subCategory=${user.subCategory}&subject=${subject}&semester=${semester}&unit=${unit}`
    );

    renderList("notesList", data);
}

/* ================= LOAD PRACTICALS ================= */

async function loadPracticals() {

    const subject = document.getElementById("practicalSubject")?.value;

    if (!subject) {
        alert("Please select subject");
        return;
    }

    const data = await safeFetch(
        `${API_BASE_URL}/api/student/practicals?subCategory=${user.subCategory}&subject=${subject}`
    );

    renderList("practicalList", data);
}

/* ================= LOAD PROJECTS ================= */

async function loadProjects() {

    const type = document.getElementById("projectType")?.value;

    const data = await safeFetch(
        `${API_BASE_URL}/api/student/projects?subCategory=${user.subCategory}&type=${type}`
    );

    renderList("projectList", data);
}

/* ================= RENDER LIST ================= */

function renderList(elementId, items) {

    const container = document.getElementById(elementId);
    if (!container) return;

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
                <a href="${item.pdfUrl.startsWith('http') 
    ? item.pdfUrl.trim() 
    : 'https://' + item.pdfUrl.trim()}" target="_blank">
                    Download PDF
                </a>
            </div>
        `;
    });
}

/* ==========================================
   UI INTERACTION LOGIC (Popup/Modal Handler)
   Add this to the bottom of user-dashboard.js
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Elements Selection
    const backdrop = document.getElementById('modalBackdrop');
    const closeButtons = document.querySelectorAll('.close-modal-btn');
    const allSections = document.querySelectorAll('.section');

    // 2. Map Cards to Section IDs
    const cardMap = {
        'papersCard': 'papers',
        'notesCard': 'notes',
        'practicalsCard': 'practicals',
        'projectsCard': 'projects'
    };

    // 3. Function to Open Modal
    function openModal(sectionId) {
        // Hide any currently open sections first
        closeAllModals();
        
        const section = document.getElementById(sectionId);
        if (section) {
            backdrop.classList.add('active'); // Show dark background
            section.classList.add('active');  // Show popup with animation
        }
    }

    // 4. Function to Close All Modals
    function closeAllModals() {
        backdrop.classList.remove('active');
        allSections.forEach(sec => {
            sec.classList.remove('active');
        });
    }

    // 5. Add Click Events to Cards
    Object.keys(cardMap).forEach(cardId => {
        const card = document.getElementById(cardId);
        if (card) {
            card.addEventListener('click', (e) => {
                // Prevent bubbling if needed, though usually fine here
                e.stopPropagation(); 
                openModal(cardMap[cardId]);
            });
        }
    });

    // 6. Add Click Events to Close Buttons (X)
    closeButtons.forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });

    // 7. Add Click Event to Backdrop (Click outside to close)
    if (backdrop) {
        backdrop.addEventListener('click', closeAllModals);
    }

    // Optional: Close on Escape key press
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
});