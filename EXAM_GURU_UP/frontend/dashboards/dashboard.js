
/* ================= AUTH CHECK ================= */

const token = localStorage.getItem("token");

if(!token){
    window.location.href = "../login.html";
}

let currentUser = null;

/* ================= LOAD USER FROM DB ================= */

async function loadUser(){

    try{

        const res = await fetch(
            `${API_BASE_URL}/api/user/profile`,
            {
                headers:{ Authorization: "Bearer " + token }
            }
        );

        const data = await res.json();

        if(data.user){

            currentUser = data.user;

            const name = data.user.name;
            const category = data.user.category?.name || "Not Selected";
            const subCategory = data.user.subCategory || "";

            let displayText = category;

            if(subCategory){
                displayText += " - " + subCategory;
            }

            document.getElementById("username").innerText =
            `Welcome, ${name} (${displayText})`;

        }

    } catch(err){

        document.getElementById("username").innerText =
        "Welcome, Student";

    }

}

/* ================= START DAILY QUIZ ================= */

document.getElementById("startQuizBtn")
.addEventListener("click", ()=>{

    if(!currentUser || !currentUser.category){
        alert("Please select your course in profile first");
        return;
    }

    window.location.href =
    `../quiz.html?category=${currentUser.category._id}&subCategory=${currentUser.subCategory}`;

});

/* ================= SUBJECT QUIZ ================= */

document.getElementById("startSubjectQuiz")
.addEventListener("click", ()=>{

    const subject =
    document.getElementById("subjectSelect").value;

    const difficulty =
    document.getElementById("difficultySelect").value;

    if(!subject || !difficulty){
        alert("Please select subject and difficulty");
        return;
    }

    if(!currentUser || !currentUser.category){
        alert("Please select your course in profile first");
        return;
    }

    window.location.href =
    `../quiz.html?category=${currentUser.category._id}&subCategory=${currentUser.subCategory}&subject=${subject}&difficulty=${difficulty}`;

});

/* ================= LOAD LATEST SCORE ================= */

async function loadLatestScore(){

    try{

        const res = await fetch(
        `${API_BASE_URL}/api/score/latest`,
        {
            headers:{ Authorization: "Bearer " + token }
        });

        if(!res.ok){
            throw new Error("Score not found");
        }

        const data = await res.json();

        if(data.total === 0){
            throw new Error("No attempts");
        }

        document.getElementById("latestScore").innerText =
        `Score: ${data.score} | Questions: ${data.total}`;

    }
    catch(err){

        document.getElementById("latestScore").innerText =
        "No attempts yet";

    }
}


/* ================= LOGOUT ================= */

document.getElementById("logoutBtn")
.addEventListener("click", ()=>{

    localStorage.clear();
    window.location.href="../index.html";

});

async function loadSubjects(){
    

    if(!currentUser || !currentUser.category){
        return;
    }

    try{

        const res = await fetch(
            `${API_BASE_URL}/api/quiz/subjects?category=${currentUser.category._id}&subCategory=${currentUser.subCategory}`
        );

        const subjects = await res.json();

        const subjectSelect =
        document.getElementById("subjectSelect");

        subjectSelect.innerHTML =
        `<option value="">Select Subject</option>`;

        subjects.forEach(sub=>{
            subjectSelect.innerHTML +=
            `<option value="${sub}">${sub}</option>`;
        });

    }catch(err){
        console.log("Subject load error");
    }
}


/* ================= INIT ================= */
async function init(){

    await loadUser();      // pehle user load hoga
    await loadSubjects();  // phir subjects load honge
    loadLatestScore();     // score load

}


init();
