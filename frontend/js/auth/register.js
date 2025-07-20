import { auth } from "../firebaseConfig.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { mostrarNotificacion } from "../chat/ui.js";

const form = document.getElementById("registerForm");
const closeRegisterBtn = document.getElementById("closeRegister");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = form.querySelector("#email").value;
  const password = form.querySelector("#password").value;

  try {
    // Envío al backend para guardarlo en MySQL
    const response = await fetch("http://localhost:5050/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }) // el backend lo hashea con bcrypt
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Error al registrar en MySQL");
    localStorage.setItem("userId", result.userId);
    localStorage.setItem("userEmail", email);

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log("Usuario registrado:", userCredential.user);

    const user = userCredential.user;

    mostrarNotificacion("Registro exitoso. ¡Bienvenido!");
    setTimeout(() => {
      window.location.href = "login.html";
    }, 1500);
  } catch (error) {
    const errorDiv = document.getElementById("errorMensaje");

    if (error.code === "auth/email-already-in-use") {
      errorDiv.textContent = "Este correo ya está registrado. Usa uno diferente.";
    } else if (error.code === "auth/invalid-email") {
      errorDiv.textContent = "El formato del correo no es válido.";
    } else if (error.code === "auth/weak-password") {
      errorDiv.textContent = "La contraseña es demasiado corta. Debe tener al menos 6 caracteres.";
    } else {
      errorDiv.textContent = "Error desconocido: " + error.message;
    }
  }
});

// Botón para cerrar y volver al index
if (closeRegisterBtn) {
  closeRegisterBtn.addEventListener("click", () => {
    window.location.href = "index.html";
  });
}