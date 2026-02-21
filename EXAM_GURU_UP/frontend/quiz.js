let questions = [];
let currentIndex = 0;

let userAnswers = [];
let answered = false;

let timerInterval;
let timeLeft = 30;

const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "login.html";
}

const urlParams = new URLSearchParams(window.location.search);
const category = urlParams.get("category");
const subCategory = urlParams.get("subCategory");
const subject = urlParams.get("subject") || "";
const difficulty = urlParams.get("difficulty") || "";
const quizType = urlParams.get("type") || "practice";

// ================= LOAD QUIZ =================

async function loadQuiz() {

    try {

        const limit = quizType === "daily" ? 10 : 50;

        const res = await fetch(
          `${API_BASE_URL}/api/quiz/generate?category=${category}&subCategory=${subCategory}&subject=${subject}&difficulty=${difficulty}&limit=${limit}`
        );

        if (!res.ok) {
            throw new Error(`Server Error: ${res.status}`);
        }

        const data = await res.json();

        if (!data.success || !data.questions || data.questions.length === 0) {
            document.querySelector(".quiz-container").innerHTML =
                "<h3>No questions found.</h3>";
            return;
        }

        questions = data.questions;

        showQuestion();

    } catch (error) {
        console.error("Quiz Load Error:", error);
        document.querySelector(".quiz-container").innerHTML =
            "<h3>Error loading quiz.</h3>";
    }
}

function goToDashboard(){

    const user = JSON.parse(localStorage.getItem("user"));

    if(!user){
        window.location.href = "../login.html";
        return;
    }

    if(user.role === "admin"){
        window.location.href = "../admin/admin-dashboard.html";
        return;
    }

    if(user.category && user.category.dashboard){
        window.location.href = user.category.dashboard.route;
    } else {
        alert("Dashboard not assigned.");
    }
}

// ================= TIMER =================

function startTimer() {
    console.log("Params:",
   category,
   subCategory,
   subject,
   difficulty
);


    timeLeft = 30;
    document.getElementById("progress").innerText = `Time Left: ${timeLeft}s`;

    timerInterval = setInterval(() => {

        timeLeft--;
        document.getElementById("progress").innerText = `Time Left: ${timeLeft}s`;

        if (timeLeft <= 0) {

            clearInterval(timerInterval);

            const currentQuestion = questions[currentIndex];

            // Save unanswered
            userAnswers.push({
                question: currentQuestion.question,
                selectedAnswer: "Not Answered",
                correctAnswer: currentQuestion.correctAnswer,
                options: currentQuestion.options
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

    // ✅ Difficulty Based Scoring
    

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

   try {

      const res = await fetch(
         `${API_BASE_URL}/api/score/submit`,
         {
            method: "POST",
            headers: {
               "Content-Type": "application/json",
               "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
               answers: userAnswers,
               quizType: quizType
            })
         }
      );

      const result = await res.json();

      localStorage.setItem("resultData", JSON.stringify(result));

      window.location.href = "result.html";

   } catch (error) {
      console.error("Submit Error:", error);
   }
}

// Attach option click events after DOM loads
document.addEventListener("DOMContentLoaded", function(){

    document.getElementById("A").addEventListener("click", () => checkAnswer("A"));
    document.getElementById("B").addEventListener("click", () => checkAnswer("B"));
    document.getElementById("C").addEventListener("click", () => checkAnswer("C"));
    document.getElementById("D").addEventListener("click", () => checkAnswer("D"));

});
// ================= START =================

loadQuiz();
