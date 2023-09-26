const passwordInput = document.getElementById("password");
const passwordRules = document.getElementById("password-rules");

passwordInput.addEventListener("input", () => {
    const password = passwordInput.value;

    // Define your password rules here
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSpecialChars = /[!@#$%^&*()_+{}\[\]:;<>,.?~\\-]/.test(password);

    let errorMessage = [];

    if (password.length < minLength) {
        errorMessage.push("Password must be at least 8 characters long.");
    }
    if (!hasUpperCase) {
        errorMessage.push("Password must contain at least one uppercase letter.");
    }
    if (!hasLowerCase) {
        errorMessage.push("Password must contain at least one lowercase letter.");
    }
    if (!hasNumbers) {
        errorMessage.push("Password must contain at least one number.");
    }
    if (!hasSpecialChars) {
        errorMessage.push("Password must contain at least one special character.");
        errorMessage.push("! @ # $  % ^ & * ( ) _ + { } [ ] : ; < > , . ? ~ \\ -");
    }

    passwordRules.innerHTML = errorMessage.map((message) => `<p class="password-rules-text">${message}</p>`).join("");
});
