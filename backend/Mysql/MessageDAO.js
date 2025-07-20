import db from "./DBConnection.js";
//const db = require('./DBConnection');
const MessageDAO = {
  async saveMessage(userId, mensaje, respuesta) {
    // Guarda mensaje del usuario
    await db.query(
      'INSERT INTO mensajes (usuario_id, contenido, remitente, fecha) VALUES (?, ?, ?, NOW())',
      [userId, mensaje, 'user']
    );

    // Guarda respuesta del bot
    await db.query(
      'INSERT INTO mensajes (usuario_id, contenido, remitente, fecha) VALUES (?, ?, ?, NOW())',
      [userId, respuesta, 'bot']
    );
  },

  async getMessagesByUser(userId) {
    const [rows] = await db.query('SELECT * FROM mensajes WHERE usuario_id = ?', [userId]);
    return rows;
  },
};

export default MessageDAO;
