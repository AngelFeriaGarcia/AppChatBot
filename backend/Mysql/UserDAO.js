import db from "./DBConnection.js";
//const db = require('./DBConnection');

const UserDAO = {//busca usuario por id
  async findById(userId) {
    const [rows] = await db.query('SELECT * FROM usuarios WHERE id = ?', [userId]);
    return rows[0];
  },

  async create(userData) {
    const { nombre } = userData;
    const [result] = await db.query('INSERT INTO usuarios (nombre) VALUES (?)', [nombre]);
    return result.insertId;
  },
};

export default UserDAO;
