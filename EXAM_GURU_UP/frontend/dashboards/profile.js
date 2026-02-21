
document.addEventListener("DOMContentLoaded", function () {

    function goToDashboard() {

        const user = JSON.parse(localStorage.getItem("user"));

        if (!user) {
            window.location.href = "../login.html";
            return;
        }

        if (user.role === "admin") {
            window.location.href = "../admin/admin-dashboard.html";
            return;
        }

        if (user.category && user.category.dashboard) {
            window.location.href = user.category.dashboard.route;
        } else {
            alert("Dashboard not assigned.");
        }
    }

    document.getElementById("backBtn")
        .addEventListener("click", goToDashboard);

});
const token = localStorage.getItem("token");
const CATEGORY_API = `${API_BASE_URL}/api/categories`;
if(!token){
   window.location.href = "../login.html";
}

let allCategories = [];

/* ================= LOAD CATEGORIES ================= */

async function loadCategories(){

    const res = await fetch(CATEGORY_API);
    allCategories = await res.json();

    const catSelect = document.getElementById("editCategory");
    catSelect.innerHTML = '<option value="">Select Category</option>';

    allCategories.forEach(cat=>{
        catSelect.innerHTML += `<option value="${cat._id}">${cat.name}</option>`;
    });
}

/* ================= LOAD SUB CATEGORY ================= */

function loadSubCategories(categoryId){

    const subSelect = document.getElementById("editSubCategory");
    subSelect.innerHTML = '<option value="">Select Sub Category</option>';

    const selected = allCategories.find(c=>c._id === categoryId);

    if(selected){
        selected.subCategories.forEach(sub=>{
   const subName = typeof sub === "object" ? sub.name : sub;

   subSelect.innerHTML += `
      <option value="${subName}">${subName}</option>
   `;
});

    }
}

document.getElementById("editCategory")
.addEventListener("change", function(){
    loadSubCategories(this.value);
});

/* ================= LOAD PROFILE ================= */

async function loadProfile(){

    const res = await fetch(`${API_BASE_URL}/api/user/profile`, {
        headers:{ Authorization: "Bearer " + token }
    });

    const data = await res.json();

    if(data.user){

        document.getElementById("name").innerText = data.user.name;
        document.getElementById("email").innerText = data.user.email;
        document.getElementById("category").innerText =
            data.user.category?.name || "Not Selected";
        document.getElementById("subCategory").innerText =
            data.user.subCategory || "Not Selected";

        document.getElementById("editName").value = data.user.name;

        if(data.user.category){
            document.getElementById("editCategory").value =
                data.user.category._id;
            loadSubCategories(data.user.category._id);
            document.getElementById("editSubCategory").value =
                data.user.subCategory;
        }
    }
}

/* ================= UPDATE PROFILE ================= */

async function updateProfile(){

    const name = editName.value;
    const category = editCategory.value;
    const subCategory = editSubCategory.value;
    const msg = updateMsg;

    if(!name || !category || !subCategory){
        msg.innerText="Please fill all fields";
        msg.className="msg error";
        return;
    }

    msg.innerText="Updating...";
    msg.className="msg loading";

    const res = await fetch(
        `${API_BASE_URL}/api/user/update`,
        {
            method:"PUT",
            headers:{
                "Content-Type":"application/json",
                Authorization: "Bearer " + token

            },
            body: JSON.stringify({
                name,
                category,
                subCategory
            })
        }
    );

    const data = await res.json();

    if(res.ok){
        msg.innerText="Profile updated successfully";
        msg.className="msg success";
        loadProfile();
    }else{
        msg.innerText=data.message;
        msg.className="msg error";
    }
}

/* ================= CHANGE PASSWORD ================= */

async function changePassword(){

    const oldPassword = document.getElementById("oldPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const msg = document.getElementById("passMsg");

    if(!oldPassword || !newPassword || !confirmPassword){
        msg.innerText = "Please fill all fields";
        msg.className = "msg error";
        return;
    }

    if(newPassword !== confirmPassword){
        msg.innerText = "Passwords do not match";
        msg.className = "msg error";
        return;
    }

    msg.innerText = "Updating...";
    msg.className = "msg loading";

    const res = await fetch(
        `${API_BASE_URL}/api/user/change-password`,
        {
            method: "PUT",
            headers:{
                "Content-Type":"application/json",
                Authorization: "Bearer " + token

            },
            body: JSON.stringify({
                oldPassword,
                newPassword
            })
        }
    );

    const data = await res.json();

    if(res.ok){
        msg.innerText = "Password changed successfully";
        msg.className = "msg success";

        oldPassword.value = "";
        newPassword.value = "";
        confirmPassword.value = "";
    }
    else{
        msg.innerText = data.message;
        msg.className = "msg error";
    }
}



/* ================= INIT ================= */

loadCategories().then(loadProfile);

