
let tempData = {};

function goToStep2(){

    const name = document.getElementById("name").value;
    const dob = document.getElementById("dob").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const examType = document.getElementById("examType").value;

    if(!name || !dob || !password || !confirmPassword || !examType){
        alert("Please fill all fields");
        return;
    }

    if(password !== confirmPassword){
        alert("Passwords do not match");
        return;
    }

    tempData = { name, dob, password, examType };

    document.getElementById("step1").style.display = "none";
    document.getElementById("step2").style.display = "block";
}

function goBack(){
    document.getElementById("step1").style.display = "block";
    document.getElementById("step2").style.display = "none";
}

async function submitRegister(){

    const email = document.getElementById("email").value;

    if(!email){
        alert("Please enter email");
        return;
    }

    const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            ...tempData,
            email
        })
    });

    const data = await res.json();

    if(res.ok){
        alert("Verification link sent to your email ✅");
        window.location.href = "login.html";
    } else {
        alert(data.message || "Registration failed");
    }
}

