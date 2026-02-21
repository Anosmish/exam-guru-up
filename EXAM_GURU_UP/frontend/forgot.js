document.addEventListener("DOMContentLoaded", function () {

    const forgotBtn = document.getElementById("forgotBtn");

    forgotBtn.addEventListener("click", forgotPassword);

    async function forgotPassword() {

        const email = document.getElementById("email").value.trim();
        const messageDiv = document.getElementById("message");

        if (!email) {
            messageDiv.innerHTML = "Please enter email";
            messageDiv.className = "message error";
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });

            const data = await res.json();

            if (res.ok) {
                messageDiv.innerHTML = data.message;
                messageDiv.className = "message success";
            } else {
                messageDiv.innerHTML = data.message;
                messageDiv.className = "message error";
            }

        } catch (error) {
            messageDiv.innerHTML = "Server error";
            messageDiv.className = "message error";
        }
    }

});