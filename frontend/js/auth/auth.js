import { auth } from "../firebaseConfig.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { mostrarNotificacion } from "../chat/ui.js";


document.addEventListener("DOMContentLoaded", () => {
  const dropdown = document.getElementById('userDropdown');
  const userIcon = document.getElementById('userIcon');

  //if (dropdown) dropdown.style.display = "none"; // Ocultarlo al inicio

  if (userIcon && dropdown) {
    userIcon.addEventListener("click", () => {
      dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
    });
  }//  Sidebar Toggle
  const toggleSidebarBtn = document.getElementById("toggleSidebar");
  const expandSidebarBtn = document.getElementById("expandSidebar");
  const sidebar = document.getElementById("sidebar");

  if (toggleSidebarBtn && expandSidebarBtn && sidebar) {
    toggleSidebarBtn.addEventListener("click", () => {
      sidebar.classList.add("collapsed");
      toggleSidebarBtn.style.display = "none";
      expandSidebarBtn.style.display = "block";
    });

    expandSidebarBtn.addEventListener("click", () => {
      sidebar.classList.remove("collapsed");
      toggleSidebarBtn.style.display = "block";
      expandSidebarBtn.style.display = "none";
    });
  }
});
//Mensaje bienvenida usuario logeado
onAuthStateChanged(auth, (user) => {
  const mensajeBienvenida = document.getElementById("mensajeBienvenida");

  if (user) {
    if (mensajeBienvenida) mensajeBienvenida.style.display = "flex";
  } else {
    if (mensajeBienvenida) mensajeBienvenida.style.display = "none";
  }
});

// Detectar login
export function checkAuthStatus() {
  onAuthStateChanged(auth, (user) => {
    const dropdown = document.getElementById('userDropdown');
    const userIcon = document.getElementById('userIcon');
    const notLoggedInOptions = document.getElementById("notLoggedInOptions");
    const loggedInOptions = document.getElementById("loggedInOptions");
    const nombreUsuario = document.getElementById("nombreUsuario");

    if (userIcon) userIcon.classList.add("logged-in");

    if (userIcon) userIcon.style.display = "block";

    if (user) {
      if (userIcon) {
        userIcon.style.color = "green"; // Verde solo si está logueado
      }
      if (notLoggedInOptions) notLoggedInOptions.style.display = "none";
      if (loggedInOptions) loggedInOptions.style.display = "block";
      if (nombreUsuario) nombreUsuario.textContent = user.email;
    } else {
      if (notLoggedInOptions) notLoggedInOptions.style.display = "block";
      if (loggedInOptions) loggedInOptions.style.display = "none";
    }
  });
}
//Función cerrar sesión
export function logout() {
  localStorage.removeItem("userId");
  localStorage.removeItem("userEmail");

  signOut(auth)
    .then(() => {
      mostrarNotificacion("Sesión cerrada correctamente");
      setTimeout(() => {
        window.location.href = "index.html";
      }, 1500);
    })
    .catch(err => {
      console.error("Error al cerrar sesión", err);
      mostrarNotificacion("Error al cerrar sesión", "error");
    });
}


