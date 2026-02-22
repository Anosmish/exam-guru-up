

const token = localStorage.getItem("token");
if(!token){ window.location.href="login.html"; }

const typeSelect = document.getElementById("contentType");
const categorySelect = document.getElementById("categorySelect");
const subCategorySelect = document.getElementById("subCategorySelect");
const subjectSelect = document.getElementById("subjectSelect");
const projectTypeSelect = document.getElementById("projectTypeSelect");
const form = document.getElementById("uploadForm");
const fileList = document.getElementById("fileList");

let categoriesData = [];

/* ================= LOAD CATEGORIES ================= */

async function loadCategories(){
    const res = await fetch(`${API_BASE_URL}/api/admin/all-categories`,{
        headers:{ Authorization:"Bearer "+token }
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
.addEventListener("click", ()=>{

    localStorage.clear();
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
        headers:{ Authorization:"Bearer "+token },
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
        headers:{ Authorization:"Bearer "+token }
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

    data.forEach(item=>{
        fileList.innerHTML += `
        <div>
            <strong>${item.title}</strong><br>
            Branch: ${item.subCategory || "-"}<br>
            <a href="${API_BASE_URL}${item.pdfUrl}" target="_blank">View PDF</a>
            <br><br>
            <button class="danger" onclick="deleteFile('${item._id}','${type}')">Delete</button>
        </div>`;
    });
}

/* ================= DELETE ================= */

async function deleteFile(id,type){
    if(!confirm("Delete this file?")) return;

    await fetch(`${API_BASE_URL}/api/admin/delete-content/${id}?type=${type}`,{
        method:"DELETE",
        headers:{ Authorization:"Bearer "+token }
    });

    loadFiles();
}

/* INITIAL LOAD */
loadCategories();
loadFiles();

