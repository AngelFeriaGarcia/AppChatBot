import { auth } from "../firebaseConfig.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

const form = document.getElementById("loginForm");
const closeLoginBtn = document.getElementById("closeLogin");

// login
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    console.log("Formulario enviado");

    const email = form.loginEmail.value;
    const password = form.loginPassword.value;

    try {
      // Nuevo login con backend (MySQL)
      const res = await fetch("http://localhost:5050/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al iniciar sesión");

      console.log("Login exitoso en backend MySQL:", data);
      localStorage.setItem("userId", data.userId);  // si el backend lo devuelve
      console.log("userId guardado en localStorage:", data.userId);
      localStorage.setItem("userEmail", email);

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Login exitoso:", userCredential.user);
      window.location.href = "index.html";
    } catch (err) {
      let mensaje = "Ocurrió un error.";
      if (err.code === "auth/invalid-credential") {
        mensaje = "Correo o contraseña incorrectos.";
      } else {
        mensaje = "Error: " + err.message;
      }
      mostrarNotificacion(mensaje, "error");
    }

  });
}
function mostrarNotificacion(mensaje, tipo = "success") {
  const noti = document.getElementById("notificacion");
  if (!noti) return;

  noti.textContent = mensaje;
  noti.className = "notificacion"; // limpia clases
  if (tipo === "error") noti.classList.add("error");

  noti.style.display = "block";

  setTimeout(() => {
    noti.style.display = "none";
  }, 3000);
}

//botón cerrar login
if (closeLoginBtn) {
  closeLoginBtn.addEventListener("click", () => {
    window.location.href = "index.html";
  });
}