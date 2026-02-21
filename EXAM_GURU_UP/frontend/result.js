document.addEventListener("DOMContentLoaded", () => {

    // ================= DASHBOARD BUTTON =================
    document.getElementById("dashboardBtn")
        .addEventListener("click", goToDashboard);

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

    // ================= LOAD RESULT DATA =================

    const data = JSON.parse(localStorage.getItem("resultData"));

    if (!data || !data.answers) {
        document.body.innerHTML = "<h3>No result data found</h3>";
        return;
    }

    let maxScore = 0;

    data.answers.forEach(item => {

        if (item.difficulty === "Hard") maxScore += 3;
        else if (item.difficulty === "Medium") maxScore += 2;
        else maxScore += 1;

    });

    if (maxScore === 0) {
        maxScore = data.total;
    }

    let percent = ((data.score / maxScore) * 100).toFixed(2);

    document.getElementById("score").innerText =
        `Score: ${data.score} / ${maxScore}`;

    document.getElementById("percentage").innerText =
        `Percentage: ${percent}%`;

    // ================= PERFORMANCE =================

    let performanceMsg = "";

    if (percent >= 80) performanceMsg = "🌟 Excellent Performance!";
    else if (percent >= 50) performanceMsg = "👍 Good Job!";
    else performanceMsg = "⚠️ Needs Improvement. Keep Practicing!";

    document.getElementById("performance").innerText = performanceMsg;

    // ================= ANALYSIS =================

    const analysisDiv = document.getElementById("analysis");
    analysisDiv.innerHTML = "";

    data.answers.forEach((item, index) => {

        const isCorrect = item.selectedAnswer === item.correctAnswer;

        let optionsHTML = "";

        for (let key in item.options) {

            let className = "";

            if (key === item.correctAnswer) className = "correct";
            if (key === item.selectedAnswer && !isCorrect) className = "wrong";

            optionsHTML += `
                <p class="${className}">
                    ${key}. ${item.options[key]}
                </p>
            `;
        }

        analysisDiv.innerHTML += `
            <div class="box">
                <p><strong>Q${index + 1}:</strong> ${item.question}</p>
                ${optionsHTML}
                <p>
                    <strong>Your Answer:</strong> 
                    <span class="${isCorrect ? 'correct' : 'wrong'}">
                        ${item.selectedAnswer}
                    </span>
                </p>
                <p>
                    <strong>Correct Answer:</strong> 
                    ${item.correctAnswer}
                </p>
            </div>
        `;
    });

});