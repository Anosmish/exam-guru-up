

const user = JSON.parse(localStorage.getItem("user"));
const token = localStorage.getItem("token");

if (!user || !token) {
    window.location.href = "../login.html";
}

document.getElementById("welcomeUser").innerText =
    "Welcome, " + user.name;

document.getElementById("userSubCategory").innerText =
    user.subCategory;

/* ===== SHOW SECTION ===== */
function showSection(id) {

    document.querySelectorAll(".section")
        .forEach(sec => sec.style.display = "none");

    document.getElementById(id).style.display = "block";

    loadSubjects();
}

/* ===== LOAD SUBJECTS ===== */
async function loadSubjects() {

    const res = await fetch(
    `${API_BASE_URL}/api/student/subjects/${user.subCategory}`
    );

    const subjects = await res.json();

    const selects = [
        "paperSubject",
        "notesSubject",
        "practicalSubject"
    ];

    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (!select) return;

        select.innerHTML = "<option value=''>Select Subject</option>";

        subjects.forEach(sub => {
            select.innerHTML +=
                `<option value="${sub}">${sub}</option>`;
        });
    });
}

/* ================= LOGOUT ================= */

document.getElementById("logoutBtn")
.addEventListener("click", ()=>{

    localStorage.clear();
    window.location.href="../index.html";

});
/* ===== LOAD PAPERS ===== */
async function loadPapers() {

    const subject = document.getElementById("paperSubject").value;

    const res = await fetch(
    `${API_BASE_URL}/api/student/papers?subCategory=${user.subCategory}&subject=${subject}`
    );
    const data = await res.json();

    renderList("paperList", data);
}

/* ===== LOAD NOTES ===== */
async function loadNotes() {

    const subject = document.getElementById("notesSubject").value;
    const semester = document.getElementById("semesterSelect").value;
    const unit = document.getElementById("unitSelect").value;

    const res = await fetch(
    `${API_BASE_URL}/api/student/notes?subCategory=${user.subCategory}&subject=${subject}&semester=${semester}&unit=${unit}`
    );

    const data = await res.json();

    renderList("notesList", data);
}

/* ===== LOAD PROJECTS ===== */
async function loadProjects() {

    const type = document.getElementById("projectType").value;

    const res = await fetch(
    `${API_BASE_URL}/api/student/projects?subCategory=${user.subCategory}&type=${type}`
    );

    const data = await res.json();

    renderList("projectList", data);
}

/* ===== RENDER LIST ===== */
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

