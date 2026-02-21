
let tempData = {};
let categoriesData = [];

const categorySelect = document.getElementById("category");
const subCategorySelect = document.getElementById("subCategory");

/* ================= FETCH CATEGORIES FROM DB ================= */

fetch(`${API_BASE_URL}/api/categories`)
    .then(res => res.json())
    .then(data => {
        categoriesData = data;

        data.forEach(cat => {
            const option = document.createElement("option");
            option.value = cat._id; 
            option.textContent = cat.name;
            categorySelect.appendChild(option);
        });
    })
    .catch(err => {
        console.error("Error loading categories", err);
    });

/* ================= CATEGORY CHANGE ================= */

categorySelect.addEventListener("change", function () {

    const selected = this.value;
    subCategorySelect.innerHTML = '<option value="">Select Sub Category</option>';

    const found = categoriesData.find(cat => cat._id === selected);


    if (found) {
       (found.subCategories || []).forEach(sub => {
    const option = document.createElement("option");
    option.value = sub.name;        // important
    option.textContent = sub.name;  // important
    subCategorySelect.appendChild(option);
});

    }
});

/* ================= STEP 1 → STEP 2 ================= */

function goToStep2(){

    const name = document.getElementById("name").value.trim();
    const dob = document.getElementById("dob").value;
    const category = document.getElementById("category").value;
    const subCategory = document.getElementById("subCategory").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if(!name || !dob || !category || !subCategory || !password || !confirmPassword){
        alert("Please fill all fields");
        return;
    }

    if(password !== confirmPassword){
        alert("Passwords do not match");
        return;
    }

    tempData = { name, dob, category, subCategory, password };

    document.getElementById("step1").style.display = "none";
    document.getElementById("step2").style.display = "block";
}

/* ================= BACK BUTTON ================= */

function goBack(){
    document.getElementById("step1").style.display = "block";
    document.getElementById("step2").style.display = "none";
}

/* ================= FINAL SUBMIT ================= */

async function submitRegister(){

    const email = document.getElementById("email").value.trim();

    if(!email){
        alert("Please enter email");
        return;
    }

    const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
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
