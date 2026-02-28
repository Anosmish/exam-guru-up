
const typeSelect = document.getElementById("contentType");
const categorySelect = document.getElementById("categorySelect");
const subCategorySelect = document.getElementById("subCategorySelect");
const subjectSelect = document.getElementById("subjectSelect");
const projectTypeSelect = document.getElementById("projectTypeSelect");
const form = document.getElementById("uploadForm");
const fileList = document.getElementById("fileList");

let categoriesData = [];

/* ================= LOAD CATEGORIES ================= */
// Check session via backend
async function checkAdminAuth() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
            credentials: "include"
        });

        if (!res.ok) {
            window.location.href = "login.html";
        }
    } catch (err) {
        window.location.href = "login.html";
    }
}

checkAdminAuth();


async function loadCategories(){
    const res = await fetch(`${API_BASE_URL}/api/admin/all-categories`,{
    credentials: "include"
    });

    categoriesData = await res.json();

    categoriesData.forEach(cat=>{
        categorySelect.innerHTML += `<option value="${cat._id}">${cat.name}</option>`;
    });
}
function adminLogout() {
    localStorage.clear();
    window.location.href = "../index.html";
}

document.getElementById("logoutBtn")
.addEventListener("click", async ()=>{

    await fetch(`${API_BASE_URL}/api/auth/logout`,{
        method:"POST",
        credentials:"include"
    });

    window.location.href="../index.html";
});
/* ================= LOAD SUBCATEGORIES ================= */

categorySelect.addEventListener("change",()=>{
    subCategorySelect.innerHTML = `<option value="">Select SubCategory</option>`;
    subjectSelect.innerHTML = `<option value="">Select Subject</option>`;

    const selected = categoriesData.find(c=>c._id===categorySelect.value);
    if(!selected) return;

    selected.subCategories.forEach(sub=>{
        subCategorySelect.innerHTML += `<option value="${sub.name}">${sub.name}</option>`;
    });
});

/* ================= LOAD SUBJECTS ================= */

subCategorySelect.addEventListener("change",()=>{
    subjectSelect.innerHTML = `<option value="">Select Subject</option>`;

    const selected = categoriesData.find(c=>c._id===categorySelect.value);
    if(!selected) return;

    const sub = selected.subCategories.find(s=>s.name===subCategorySelect.value);
    if(!sub) return;

    sub.subjects.forEach(subj=>{
        subjectSelect.innerHTML += `<option value="${subj}">${subj}</option>`;
    });
});

/* ================= TOGGLE PROJECT TYPE ================= */

typeSelect.addEventListener("change",()=>{
    if(typeSelect.value==="project"){
        projectTypeSelect.style.display="block";
        subjectSelect.style.display="none";
    }else{
        projectTypeSelect.style.display="none";
        subjectSelect.style.display="block";
    }
});

/* ================= UPLOAD ================= */

form.addEventListener("submit", async function(e){
    e.preventDefault();

    const formData = new FormData(this);
    formData.append("contentType", typeSelect.value);

    const res = await fetch(`${API_BASE_URL}/api/admin/upload-content`,{
        method:"POST",
      credentials: "include",
        body:formData
    });

    let data;

try {
    data = await res.json();
} catch (err) {
    console.error("Not JSON response:", err);
    alert("Server Error (Check backend logs)");
    return;
}

    if(res.ok){
        alert("Uploaded Successfully ✅");
        form.reset();
        loadFiles();
    }else{
        alert(data.message || "Upload Failed ❌");
    }
});

/* ================= LOAD FILES ================= */

async function loadFiles(){

    const type = typeSelect.value;

    const res = await fetch(`${API_BASE_URL}/api/admin/list-content?type=${type}`,{
      credentials: "include"
    });

    let data;

try {
    data = await res.json();
} catch (err) {
    console.error("Not JSON response:", err);
    alert("Server Error (Check backend logs)");
    return;
}
    fileList.innerHTML="";

    if(data.length===0){
        fileList.innerHTML="<p>No files uploaded yet.</p>";
        return;
    }

    // replace innerHTML loop with this:
fileList.innerHTML = ""; // clear first

data.forEach(item => {
    const div = document.createElement("div");

    div.innerHTML = `
        <strong >${item.title}</strong><br>
        Branch: ${item.subCategory || "-"}<br>
        <a href="${item.pdfUrl}" target="_blank">View PDF</a>
        <br><br>
        <button class="danger">Delete</button>
    `;

    const btn = div.querySelector("button.danger");
    btn.addEventListener("click", () => deleteFile(item._id, type));

    fileList.appendChild(div);
});
}

/* ================= DELETE ================= */

async function deleteFile(id,type){
    if(!confirm("Delete this file?")) return;

    await fetch(`${API_BASE_URL}/api/admin/delete-content/${id}?type=${type}`,{
        method:"DELETE",
     credentials: "include"
    });

    loadFiles();
}

/* INITIAL LOAD */
loadCategories();
loadFiles();

