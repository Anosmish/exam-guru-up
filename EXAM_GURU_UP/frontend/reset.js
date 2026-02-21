const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get("token");

document.addEventListener("DOMContentLoaded", () => {

    const newPassword = document.getElementById("newPassword");
    const confirmPassword = document.getElementById("confirmPassword");
    const resetBtn = document.getElementById("resetBtn");
    const messageDiv = document.getElementById("message");
    const strengthDiv = document.getElementById("strength");
    const togglePassword = document.getElementById("togglePassword");
    const spinner = document.getElementById("spinner");

    // ================= PASSWORD STRENGTH =================
    newPassword.addEventListener("input", () => {

        const value = newPassword.value;
        let strength = "Weak";
        let className = "weak";

        if (value.length >= 8 &&
            /[A-Z]/.test(value) &&
            /[0-9]/.test(value) &&
            /[!@#$%^&*]/.test(value)) {
            strength = "Strong";
            className = "strong";
        } else if (value.length >= 6) {
            strength = "Medium";
            className = "medium";
        }

        strengthDiv.textContent = `Strength: ${strength}`;
        strengthDiv.className = `strength ${className}`;
    });

    // ================= SHOW / HIDE PASSWORD =================
    togglePassword.addEventListener("click", () => {

        if (newPassword.type === "password") {
            newPassword.type = "text";
            togglePassword.textContent = "Hide";
        } else {
            newPassword.type = "password";
            togglePassword.textContent = "Show";
        }
    });

    // ================= RESET PASSWORD =================
    resetBtn.addEventListener("click", async () => {

        messageDiv.textContent = "";

        if (!newPassword.value || !confirmPassword.value) {
            messageDiv.textContent = "All fields are required";
            messageDiv.className = "message error";
            return;
        }

        if (newPassword.value !== confirmPassword.value) {
            messageDiv.textContent = "Passwords do not match";
            messageDiv.className = "message error";
            return;
        }

        if (newPassword.value.length < 6) {
            messageDiv.textContent = "Password must be at least 6 characters";
            messageDiv.className = "message error";
            return;
        }

        resetBtn.disabled = true;
        spinner.style.display = "block";

        try {

            const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, newPassword: newPassword.value })
            });

            const data = await res.json();

            if (res.ok) {

                messageDiv.textContent = data.message;
                messageDiv.className = "message success";

                setTimeout(() => {
                    window.location.href = "login.html";
                }, 2000);

            } else {

                messageDiv.textContent = data.message;
                messageDiv.className = "message error";

                resetBtn.disabled = false;
                spinner.style.display = "none";
            }

        } catch (error) {

            messageDiv.textContent = "Server error";
            messageDiv.className = "message error";

            resetBtn.disabled = false;
            spinner.style.display = "none";
        }

    });

});