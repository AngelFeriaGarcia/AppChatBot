import { app } from "../firebaseConfig.js";
import { getDatabase, ref, push, set, get, onValue, remove, update } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { auth } from "../firebaseConfig.js";

const db = getDatabase(app);

// Guarda una conversación: si no tiene ID, la crea y devuelve el ID
export async function guardarConversacion(uid, titulo, mensajes, convId = null, db) {
  if (!uid || !mensajes.length) return null;

  const now = new Date();

  try {
    if (convId) {
      // Verifica que la conversación exista y pertenezca al usuario
      const [rows] = await db.execute(
        `SELECT id FROM conversaciones WHERE id = ? AND usuario_id = ?`,
        [convId, uid]
      );

      if (rows.length === 0) return null; // No encontrada o no pertenece al usuario

      // Insertar nuevos mensajes
      for (const mensaje of mensajes) {
        await db.execute(
          `INSERT INTO mensajes (contenido, remitente, timestamp, conversacion_id)
           VALUES (?, ?, ?, ?)`,
          [mensaje.contenido, mensaje.remitente, mensaje.timestamp || now, convId]
        );
      }

      return convId;
    } else {
      // Crear nueva conversación
      const [result] = await db.execute(
        `INSERT INTO conversaciones (usuario_id, titulo, fecha_creacion)
         VALUES (?, ?, ?)`,
        [uid, titulo || 'Sin título', now]
      );

      const nuevaConvId = result.insertId;

      // Insertar mensajes
      for (const mensaje of mensajes) {
        await db.execute(
          `INSERT INTO mensajes (contenido, remitente, timestamp, conversacion_id)
           VALUES (?, ?, ?, ?)`,
          [mensaje.contenido, mensaje.remitente, mensaje.timestamp || now, nuevaConvId]
        );
      }

      return nuevaConvId;
    }
  } catch (error) {
    console.error('Error guardando conversación:', error);
    return null;
  }
}



// Devuelve todas las conversaciones del usuario
export function obtenerConversaciones(uid, callback) {
  if (!uid) return;

  const convRef = ref(db, `conversaciones/${uid}`);
  onValue(convRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      callback([]);
      return;
    }

    const conversaciones = Object.entries(data).map(([id, conv]) => ({
      id,
      ...conv
    })).sort((a, b) => b.ts - a.ts); // Más reciente arriba

    callback(conversaciones);
  });
}

// Eliminar chat
export function eliminarConversacion(uid, convId) {
  if (!uid || !convId) return;
  const db = getDatabase();
  const refDel = ref(db, `conversaciones/${uid}/${convId}`);
  remove(refDel);
}

// Actualizar título
export function actualizarTituloConversacion(uid, convId, nuevoTitulo) {
  if (!uid || !convId) return;
  const db = getDatabase();
  const refUpdate = ref(db, `conversaciones/${uid}/${convId}`);
  update(refUpdate, { titulo: nuevoTitulo });
}