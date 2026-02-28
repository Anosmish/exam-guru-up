let questions = [];
let currentIndex = 0;
let userAnswers = [];
let answered = false;

let timerInterval;
let timeLeft = 30;

const urlParams = new URLSearchParams(window.location.search);
const category = urlParams.get("category");
const subCategory = urlParams.get("subCategory");
const subject = urlParams.get("subject") || "";
const difficulty = urlParams.get("difficulty") || "";
const quizType = urlParams.get("type") || "practice";

// ================= SAFE FETCH =================

async function safeFetch(url, options = {}) {
    try {
        const res = await fetch(url, {
            credentials: "include",   // 🔥 COOKIE IMPORTANT
            ...options
        });

        if (res.status === 401) {
            window.location.href = "login.html";
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

// ================= LOAD QUIZ =================

async function loadQuiz() {

    const limit = quizType === "daily" ? 10 : 50;

    const data = await safeFetch(
        `${API_BASE_URL}/api/quiz/generate?category=${category}&subCategory=${subCategory}&subject=${subject}&difficulty=${difficulty}&limit=${limit}`
    );

    if (!data || !data.questions || data.questions.length === 0) {
        document.querySelector(".quiz-container").innerHTML =
            "<h3>No questions found.</h3>";
        return;
    }

    questions = data.questions;
    showQuestion();
}

// ================= DASHBOARD REDIRECT =================

async function goToDashboard() {

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
}

// ================= TIMER =================

function startTimer() {

    timeLeft = 30;
    document.getElementById("progress").innerText = `Time Left: ${timeLeft}s`;

    timerInterval = setInterval(() => {

        timeLeft--;
        document.getElementById("progress").innerText = `Time Left: ${timeLeft}s`;

        if (timeLeft <= 0) {

            clearInterval(timerInterval);

            const currentQuestion = questions[currentIndex];

            userAnswers.push({
                questionId: currentQuestion._id,
                selectedAnswer: "Not Answered"
            });

            currentIndex++;

            if (currentIndex >= questions.length) {
                finishQuiz();
            } else {
                showQuestion();
            }
        }

    }, 1000);
}

// ================= SHOW QUESTION =================

function showQuestion() {

    if (currentIndex >= questions.length) {
        finishQuiz();
        return;
    }

    answered = false;
    clearInterval(timerInterval);
    startTimer();

    const q = questions[currentIndex];

    document.getElementById("question").innerText = q.question || "";
    document.getElementById("A").innerText = q.options?.A || "";
    document.getElementById("B").innerText = q.options?.B || "";
    document.getElementById("C").innerText = q.options?.C || "";
    document.getElementById("D").innerText = q.options?.D || "";
}

// ================= CHECK ANSWER =================

function checkAnswer(selected) {

    if (answered) return;
    answered = true;

    clearInterval(timerInterval);

    const currentQuestion = questions[currentIndex];

    userAnswers.push({
        questionId: currentQuestion._id,
        selectedAnswer: selected
    });

    currentIndex++;

    if (currentIndex >= questions.length) {
        finishQuiz();
    } else {
        showQuestion();
    }
}

// ================= FINISH QUIZ =================

async function finishQuiz() {

    clearInterval(timerInterval);

    const data = await safeFetch(
        `${API_BASE_URL}/api/score/submit`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                answers: userAnswers,
                quizType: quizType
            })
        }
    );

    if (!data) {
        alert("Error submitting quiz");
        return;
    }

    sessionStorage.setItem("resultData", JSON.stringify(data));
    window.location.href = "result.html";
}

// ================= INIT =================

document.addEventListener("DOMContentLoaded", () => {

    document.getElementById("A").addEventListener("click", () => checkAnswer("A"));
    document.getElementById("B").addEventListener("click", () => checkAnswer("B"));
    document.getElementById("C").addEventListener("click", () => checkAnswer("C"));
    document.getElementById("D").addEventListener("click", () => checkAnswer("D"));

    document.getElementById("backBtn")?.addEventListener("click", goToDashboard);

    loadQuiz();
});