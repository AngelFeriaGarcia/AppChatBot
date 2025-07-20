import { getDatabase, ref, push } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { app } from "../firebaseConfig.js";

//Instancia de la base de datos
const db = getDatabase(app);

//Guardar mensaje
export function guardarMensaje(usuario, pregunta, respuesta) {
  const fecha = new Date().toISOString();
  const mensajeRef = ref(db, 'chats');
  push(mensajeRef, {
    usuario,
    pregunta,
    respuesta,
    fecha
  });
}