/* ================= GLOBAL ================= */

let currentUser = null;

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
        return null;
    }
}

/* ================= LOAD USER ================= */

async function loadUser() {

    const data = await safeFetch(
        `${API_BASE_URL}/api/user/profile`
    );

    if (!data?.user) {
        window.location.href = "../login.html";
        return;
    }

    currentUser = data.user;

    const name = currentUser.name;
    const category = currentUser.category?.name || "Not Selected";
    const subCategory = currentUser.subCategory || "";

    let displayText = category;
    if (subCategory) displayText += " - " + subCategory;

    document.getElementById("username").innerText =
        `Welcome, ${name} (${displayText})`;
}

/* ================= DAILY QUIZ ================= */

function bindQuizButtons() {

    document.getElementById("startQuizBtn")
        ?.addEventListener("click", () => {

            if (!currentUser?.category?._id) {
                alert("Please select your course in profile first");
                return;
            }

            window.location.href =
                `../quiz.html?category=${currentUser.category._id}&subCategory=${currentUser.subCategory}`;
        });

    document.getElementById("startSubjectQuiz")
        ?.addEventListener("click", () => {

            const subject =
                document.getElementById("subjectSelect").value;

            const difficulty =
                document.getElementById("difficultySelect").value;

            if (!subject || !difficulty) {
                alert("Please select subject and difficulty");
                return;
            }

            if (!currentUser?.category?._id) {
                alert("Please select your course in profile first");
                return;
            }

            window.location.href =
                `../quiz.html?category=${currentUser.category._id}&subCategory=${currentUser.subCategory}&subject=${subject}&difficulty=${difficulty}`;
        });
}

/* ================= LOAD SUBJECTS ================= */

async function loadSubjects() {

    if (!currentUser?.category?._id) return;

    const subjects = await safeFetch(
        `${API_BASE_URL}/api/quiz/subjects?category=${currentUser.category._id}&subCategory=${currentUser.subCategory}`
    );

    if (!subjects) return;

    const subjectSelect =
        document.getElementById("subjectSelect");

    subjectSelect.innerHTML =
        `<option value="">Select Subject</option>`;

    subjects.forEach(sub => {
        subjectSelect.innerHTML +=
            `<option value="${sub}">${sub}</option>`;
    });
}

/* ================= LOAD LATEST SCORE ================= */

async function loadLatestScore() {

    const data = await safeFetch(
        `${API_BASE_URL}/api/score/latest`
    );

    const scoreElement =
        document.getElementById("latestScore");

    if (!data || !data.total) {
        scoreElement.innerText = "No attempts yet";
        return;
    }

    scoreElement.innerText =
        `Score: ${data.score} | Questions: ${data.total}`;
}

/* ================= INIT ================= */

async function init() {

    await loadUser();
    bindQuizButtons();
    await loadSubjects();
    loadLatestScore();
}

document.addEventListener("DOMContentLoaded", init);