// === Configuración Firebase (guardar mensajes) ===
import { guardarMensaje } from "./api.js";
import { auth } from "../firebaseConfig.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { logout, checkAuthStatus } from "../auth/auth.js";
import { guardarConversacion, obtenerConversaciones, actualizarTituloConversacion, eliminarConversacion } from "./historialchat.js";
import { guardarConversacionMySQL, obtenerConversacionesMySQL, actualizarTituloMySQL, eliminarConversacionMySQL } from "./historialchat.mysql.js";

//Mensajes Mysql
/*
function guardarEnMySQL(userId, mensaje, respuesta) {
 console.log("Enviando a MySQL:", { userId, mensaje, respuesta });
 fetch("http://localhost:5050/mensajes", {
   method: "POST",
   headers: {
     "Content-Type": "application/json"
   },
   body: JSON.stringify({ userId, mensaje, respuesta })
 })
   .then(res => res.json())
   .then(data => {
     if (data.success) {
       console.log("Mensaje guardado en MySQL.");
     } else {
       console.error("Error al guardar mensaje en MySQL:", data);
     }
   })
   .catch(err => {
     console.error("Error de red:", err);
   });
}*/
function guardarEnMySQL(mensaje, respuesta) {
  const userId = localStorage.getItem("userId");
  if (!userId) {
    console.warn("No hay userId en localStorage. No se guardará en MySQL.");
    return;
  }

  console.log("Enviando a MySQL:", { userId, mensaje, respuesta });

  fetch("http://localhost:5050/mensajes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ userId, mensaje, respuesta })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        console.log("Mensaje guardado en MySQL.");
      } else {
        console.error("Error al guardar mensaje en MySQL:", data);
      }
    })
    .catch(err => {
      console.error("Error de red al guardar en MySQL:", err);
    });
}

// Verifica si el usuario está logueado y ajusta el UI según su estado
checkAuthStatus();

const API_KEY = "AIzaSyC6XT5PE0O26v-57jQDOU0ztRoUHT7KxQM";
const MODEL_ID = "gemini-1.5-flash-latest";

let chatMessages;// Contenedor HTML donde se muestran los mensajes
let userInput;// Input donde el usuario escribe
let currentUser = null;// UID del usuario autenticado
let chatHistory = [];// Historial actual en memoria
let unsubscribeHistory = () => { };// Función vacía para cancelar listeners
let activeConversationId = null;// ID de la conversación activa actual

// Genera un título corto al guardar chat en historial reciente
function generarTituloDesde(texto) {
  //Se omiten 5 palabras, se eliminan signos
  const palabras = texto
    .replace(/[^\w\sáéíóúñüÁÉÍÓÚÑÜ]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3)
    .slice(0, 5);

  const resumen = palabras.join(" ");
  return resumen.trim().slice(0, 40) + (resumen.length > 40 ? "..." : "");
}

// --- Función copiar código ---
function copyCode(button) {
  const code = button.parentElement.querySelector("code");
  if (!code) return;

  const text = code.innerText;

  navigator.clipboard.writeText(text).then(() => {
    button.textContent = "Copiado ✔";
    button.disabled = true;
    setTimeout(() => {
      button.textContent = "Copiar";
      button.disabled = false;
    }, 1500);
  });
}

function markdownToHTML(text) {
  const html = marked.parse(text, {
    breaks: true,
    highlight: function (code, lang) {
      const validLang = hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, { language: validLang }).value;
    }
  });

  const container = document.createElement('div');
  container.innerHTML = html;

  /*container.querySelectorAll('pre').forEach(pre => {
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.textContent = 'Copiar';

    copyBtn.addEventListener('click', () => {
      const code = pre.querySelector("code");
      if (!code) return;

      navigator.clipboard.writeText(code.textContent).then(() => {
        copyBtn.textContent = "Copiado ✔";
        copyBtn.disabled = true;
        setTimeout(() => {
          copyBtn.textContent = "Copiar";
          copyBtn.disabled = false;
        }, 1500);
      });
    });

    pre.style.position = "relative";
    pre.appendChild(copyBtn);
  });*/

  return container.innerHTML;
}

// Llamada a Gemini Pro
async function preguntarGemini(userMessage, history = []) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent?key=${API_KEY}`;

  const requestBody = {
    contents: [
      ...history,

      {
        role: "user",
        parts: [{

          text: `Responde con formato claro y estructurado:

- Usa **negritas** para resaltar conceptos importantes
- Usa títulos con una línea de guiones debajo
- Usa listas con guiones si es necesario

Pregunta: ${userMessage}`
        }]
      }

    ]
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": 'application/json' },
    body: JSON.stringify(requestBody)
  });

  const data = await response.json();

  if (!data.candidates || !data.candidates.length) {
    throw new Error('No se recibió respuesta válida de Gemini');
  }

  return data.candidates[0].content.parts[0].text;
}

function addMessageToChat(sender, message, isTyping = false) {
  const wrapper = document.createElement("div");
  wrapper.className = `message ${sender}-message`;

  if (isTyping) {
    wrapper.innerHTML = `<span class="typing-dots">
        <span>.</span><span>.</span><span>.</span>
      </span>`;
  } else {
    wrapper.innerHTML = message;
  }

  chatMessages.appendChild(wrapper);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return wrapper;
}

/*
// Añadir mensajes al chat
function addMessageToChat(sender, message, isTyping = false) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${sender}-message`;

  if (isTyping) {
    messageDiv.innerHTML = `...`;
  } else {
    messageDiv.innerHTML = message;
  }
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return messageDiv;
}*/
// Muestra una notificación flotante de éxito o error
function mostrarNotificacion(mensaje, tipo = 'success') {
  const notificacion = document.getElementById('notificacion');
  if (!notificacion) return;

  notificacion.textContent = mensaje;
  notificacion.classList.remove('error');
  if (tipo === 'error') {
    notificacion.classList.add('error');
  }

  notificacion.style.display = 'block';

  // Forzamos reflujo para reiniciar la animación
  void notificacion.offsetWidth;

  notificacion.style.animation = 'fadeInOut 3s ease forwards';

  setTimeout(() => {
    notificacion.style.display = 'none';
  }, 3000);
}

// Carga una conversación ya existente en la vista del chat
async function cargarConversacion(id) {
  chatMessages.innerHTML = "";
  chatHistory = [];
  activeConversationId = id;

  try {
    const res = await fetch(`http://localhost:5050/conversaciones/${id}`);
    if (!res.ok) throw new Error("Error al cargar mensajes");

    const mensajes = await res.json();
    console.log(mensajes)
    mensajes.forEach(msg => {
      const isUser = msg.role === "user";
      const rawText = msg.text;
      const htmlText = isUser ? rawText : markdownToHTML(rawText);

      addMessageToChat(isUser ? "user" : "bot", htmlText);

      chatHistory.push({
        role: isUser ? "user" : "model",
        parts: [{ text: rawText }]
      });
    });

    chatMessages.scrollTop = chatMessages.scrollHeight;

  } catch (error) {
    console.error("Error al cargar la conversación:", error);
    alert("No se pudo cargar la conversación.");
  }
}

function renderConversacionesLista(conversaciones) {
  const box = document.querySelector(".historial-list");
  if (!box) return;
  
  box.innerHTML = "";
  conversaciones.forEach(conv => {
    const item = document.createElement("div");
    item.className = "hist-item";

    // Título del chat
    const titulo = document.createElement("span");
    titulo.textContent = conv.titulo;
    titulo.className = "titulo-chat";
    titulo.addEventListener("click", () => {
      cargarConversacion(conv.id);
    });

    // Menú de opciones
    const opciones = document.createElement("div");
    opciones.className = "chat-options";

    const menuBtn = document.createElement("button");
    menuBtn.className = "menu-btn";
    menuBtn.innerHTML = "⋮";
    menuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleMenuOpciones(conv.id, opciones);
    });

    opciones.appendChild(menuBtn);

    item.appendChild(titulo);
    item.appendChild(opciones);
    box.appendChild(item);
  });
}

// Chat principal
async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  addMessageToChat("user", message);
  userInput.value = "";

  const typingElement = addMessageToChat("bot", "", true);

  try {
    const rawReply = await preguntarGemini(message, chatHistory);
    const reply = markdownToHTML(rawReply);

    if (typingElement && typingElement.parentNode === chatMessages) {
      chatMessages.removeChild(typingElement);
    }

    addMessageToChat("bot", reply);

    // Actualiza historial local
    chatHistory.push({ role: "user", parts: [{ text: message }] });
    chatHistory.push({ role: "model", parts: [{ text: rawReply }] });

    const mensajesNuevos = [
      { role: "user", text: message },
      { role: "bot", text: rawReply }
    ];

    const userId = localStorage.getItem("userId");
    const titulo = generarTituloDesde(message);

    if (!userId) {
      console.warn("userId no encontrado en localStorage. No se guardará en MySQL.");
      return;
    }

    console.log("Llamando a guardarConversacionMySQL con:", userId, titulo, mensajesNuevos);

    const nuevaConversacionId = await guardarConversacionMySQL(
      userId,
      titulo,
      mensajesNuevos,
      activeConversationId // si ya hay una conversación, continúa usándola
    );

    if (nuevaConversacionId && !activeConversationId) {
      activeConversationId = nuevaConversacionId;
      console.log("Nueva conversación activa:", activeConversationId);
    }
  if (userId) {
    obtenerConversacionesMySQL(userId)
      .then(renderConversacionesLista)
      .catch(err => console.error("Error al cargar MySQL:", err));
  }
  } catch (error) {
    console.error("Error al enviar el mensaje:", error);
  }
}

function toggleMenuOpciones(chatId, container) {
  document.querySelectorAll(".menu-dropdown").forEach(d => d.remove());
  const userId = localStorage.getItem("userId");

  const dropdown = document.createElement("div");
  dropdown.className = "menu-dropdown";

  // Editar nombre
  const editar = document.createElement("div");
  editar.className = "menu-item";
  editar.innerHTML = `<i class="fas fa-pen"></i> Editar nombre`;
  editar.addEventListener("click", () => {
    const modalEditar = document.getElementById("modalEditar");
    const input = document.getElementById("nuevoTituloInput");
    input.value = "";

    modalEditar.style.display = "flex";

    document.getElementById("confirmEditBtn").onclick = () => {
      const nuevoTitulo = input.value.trim();
      if (nuevoTitulo) {
        //actualizarTituloConversacion(currentUser, chatId, nuevoTitulo);
        actualizarTituloMySQL(chatId, nuevoTitulo); //para mysql actualizar titulo
      }
      modalEditar.style.display = "none";
      window.location.reload();
    };

    document.getElementById("cancelEditBtn").onclick = () => {
      modalEditar.style.display = "none";
    };
    dropdown.remove();
  });

  // Eliminar conversación
  const eliminar = document.createElement("div");
  eliminar.className = "menu-item";
  eliminar.innerHTML = `<i class="fas fa-trash-alt" style="color:red"></i> Eliminar`;
  eliminar.addEventListener("click", () => {
    const modalEliminar = document.getElementById("modalEliminar");
    modalEliminar.classList.add("eliminar");
    modalEliminar.style.display = "flex";

    document.getElementById("confirmDeleteBtn").onclick = () => {
      eliminarConversacion(currentUser, chatId);
      eliminarConversacionMySQL(chatId);//eliminar en mysql
      modalEliminar.style.display = "none";
      modalEliminar.classList.remove("eliminar");

      // Si el usuario está viendo justo este chat que está por eliminarse
      if (activeConversationId === chatId) {
        document.getElementById("nuevoChat").click(); // Simula clic en Nuevo Chat
      }
      window.location.reload();

    };

    document.getElementById("cancelDeleteBtn").onclick = () => {
      modalEliminar.style.display = "none";
      modalEliminar.classList.remove("eliminar");
    };

    dropdown.remove();
  });

  dropdown.appendChild(editar);
  dropdown.appendChild(eliminar);
  container.appendChild(dropdown);

  //Al clickear en vacio se va la opcion en toggle options
  function handleOutsideClick(event) {
    if (!dropdown.contains(event.target) && !container.contains(event.target)) {
      dropdown.remove();
      document.removeEventListener("click", handleOutsideClick);
    }
  }
  setTimeout(() => {
    // Evita que el click que abre el menú lo cierre de inmediato
    document.addEventListener("click", handleOutsideClick, { once: true });
  }, 0);
}

//log in y log out
onAuthStateChanged(auth, (user) => {
  unsubscribeHistory();
  currentUser = user ? user.uid : null;

  const userId = localStorage.getItem("userId");
  console.log("userId localStorage:", localStorage.getItem("userId"));


  // Siempre limpia la lista
  renderConversacionesLista([]);

  // Cargar MySQL si hay userId
  if (userId) {
    obtenerConversacionesMySQL(userId)
      .then(renderConversacionesLista)
      .catch(err => console.error("Error al cargar MySQL:", err));
  }
});

/*
onAuthStateChanged(auth, user => {
  unsubscribeHistory();
  currentUser = user ? user.uid : null;

  if (currentUser) {
    obtenerConversaciones(currentUser, renderConversacionesLista);
  } else {
    renderConversacionesLista([]);
  }
});*/
/*
onAuthStateChanged(auth, user => {
  unsubscribeHistory();
  currentUser = user ? user.uid : null;

  const userId = localStorage.getItem("userId"); // de MySQL

  if (userId) {
    // Obtener historial desde MySQL
    fetch(`http://localhost:5050/mensajes/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          data.mensajes.forEach(msg => {
            const sender = msg.remitente === "user" ? "user" : "bot";
            const html = sender === "bot" ? markdownToHTML(msg.contenido) : msg.contenido;
            addMessageToChat(sender, html);
          });
        } else {
          console.error("No se pudieron cargar los mensajes:", data.error);
        }
      })
      .catch(err => console.error("Error al cargar historial MySQL:", err));
  }

  // Puedes mantener esto para Firebase si lo necesitas
  if (currentUser) {
    obtenerConversaciones(currentUser, renderConversacionesLista);
  } else {
    renderConversacionesLista([]);
  }
});*/

document.addEventListener("DOMContentLoaded", () => {

  chatMessages = document.getElementById("chatMessages");
  userInput = document.getElementById("userInput");
  const sendButton = document.getElementById("sendButton");
  const loginBtn = document.getElementById("btnLogin");
  const registerBtn = document.getElementById("btnRegister");
  const cerrarSesion = document.getElementById("cerrarSesion");
  const userIcon = document.getElementById("userIcon");
  const userDropdown = document.getElementById("userDropdown");
  const sidebar = document.querySelector(".sidebar");
  const chatContainer = document.querySelector(".chat-container");
  const toggleSidebarBtn = document.getElementById("toggleSidebar");
  const topbarToggleBtn = document.getElementById("topbarToggleSidebar");
  const nuevoChatBtn = document.getElementById("nuevoChat");

  // Menú hamburguesa (esconder/mostrar)
  if (toggleSidebarBtn) {
    toggleSidebarBtn.addEventListener("click", () => {
      sidebar.classList.add("collapsed");
      chatContainer.classList.add("expanded");
      if (topbarToggleBtn) topbarToggleBtn.style.display = "inline-block";
    });
  }

  if (topbarToggleBtn) {
    topbarToggleBtn.addEventListener("click", () => {
      sidebar.classList.remove("collapsed");
      chatContainer.classList.remove("expanded");
      topbarToggleBtn.style.display = "none";
    });
  }


  // Cerrar sesión
  if (cerrarSesion) {
    cerrarSesion.addEventListener("click", () => {
      logout();
    });
  }

  // Funcionalidad Nuevo Chat
  if (nuevoChatBtn) {
    nuevoChatBtn.addEventListener("click", () => {
      chatMessages.innerHTML = "";
      chatHistory = [];
      activeConversationId = null;
      userInput.value = "";
      userInput.focus();
    });
  }

  // Redirección a login y registro
  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      window.location.href = "login.html";
    });
  }

  if (registerBtn) {
    registerBtn.addEventListener("click", () => {
      window.location.href = "register.html";
    });
  }

  // Dropdown del usuario
  if (userIcon && userDropdown) {
    userIcon.addEventListener("click", () => {
      userDropdown.classList.toggle("show");
    });

    document.addEventListener("click", (e) => {
      if (!userIcon.contains(e.target) && !userDropdown.contains(e.target)) {
        userDropdown.classList.remove("show");
      }
    });
  }

  // Enviar mensaje
  if (sendButton && userInput) {
    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
  } else {
    console.warn("sendButton o userInput no existen en este HTML.");
  }

});
export { mostrarNotificacion };





