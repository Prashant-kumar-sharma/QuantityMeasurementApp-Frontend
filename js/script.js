document.addEventListener("DOMContentLoaded", function () {

/* ================= COMMON FUNCTION ================= */
function showMessage(message, color) {
    let msg = document.createElement("div");
    msg.innerText = message;

    msg.style.position = "fixed";
    msg.style.top = "20px";
    msg.style.right = "20px";
    msg.style.background = color;
    msg.style.color = "white";
    msg.style.padding = "10px 20px";
    msg.style.borderRadius = "5px";
    msg.style.boxShadow = "0 5px 10px rgba(0,0,0,0.2)";
    msg.style.zIndex = "1000";

    document.body.appendChild(msg);

    setTimeout(() => {
        msg.remove();
    }, 1500);
}


/* ================= SIGNUP ================= */
const signupForm = document.getElementById("signupForm");

if (signupForm) {
    signupForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();
        const mobile = document.getElementById("mobile").value.trim();

        const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

        if (name.length < 3) return alert("Name must be at least 3 characters");
        if (!email.includes("@")) return alert("Enter valid email");
        if (!password.match(passwordPattern)) return alert("Weak password");
        if (!/^[6-9]\d{9}$/.test(mobile)) return alert("Invalid mobile");

        // Check if user exists
        const checkRes = await fetch(`http://localhost:3000/users?email=${email}`);
        const existingUser = await checkRes.json();

        if (existingUser.length > 0) {
            alert("User already exists");
            return;
        }

        // Save user
        await fetch("http://localhost:3000/users", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ name, email, password, mobile })
        });

        // ✅ SET SESSION
        localStorage.setItem("isLoggedIn", "true");

        showMessage("Signup Successful 🎉", "green");

        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 1500);
    });
}


/* ================= LOGIN ================= */
const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value.trim();

        const res = await fetch(`http://localhost:3000/users?email=${email}&password=${password}`);
        const user = await res.json();

        if (user.length > 0) {
            localStorage.setItem("isLoggedIn", "true");

            showMessage("Login Successful", "green");

            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 1500);
        } else {
            alert("Invalid credentials");
        }
    });
}


/* ================= PASSWORD TOGGLE ================= */
const toggleIcons = document.querySelectorAll(".toggle-password");

toggleIcons.forEach(icon => {
    icon.addEventListener("click", function () {
        const input = this.previousElementSibling;

        input.type = input.type === "password" ? "text" : "password";

        this.classList.toggle("fa-eye");
        this.classList.toggle("fa-eye-slash");
    });
});

});
