/**
 * @typedef {Object} ColumnData
 * @property {number} id
 * @property {string} name
 * @property {number} order
 *
 * @typedef {Object} TaskData
 * @property {number} id
 * @property {number} column_id
 * @property {string} title
 * @property {string} description
 * @property {'high'|'medium'|'low'} priority
 * @property {number} order
 */

/**
 * Database utility for Kanban Pro.
 * Handles relational queries and schema initialization.
 */
const dbUtils = {
  async initSchema() {
    if (!window.os || !window.os.database) return;
    await os.database.exec(`
      CREATE TABLE IF NOT EXISTS columns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        "order" INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        column_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        priority TEXT CHECK(priority IN ('high', 'empty', 'low')) DEFAULT 'medium',
        "order" INTEGER NOT NULL,
        FOREIGN KEY (column_id) REFERENCES columns(id) ON DELETE CASCADE
      );
    `);
  },

  async getColumns() {
    if (!window.os || !window.os.database) return [];
    return await os.database.query('SELECT * FROM columns ORDER BY "order" ASC');
  },

  async getTasksByColumn(columnId) {
    if (!window.os || !window.os.database) return [];
    return await os.database.query('SELECT * FROM tasks WHERE column_id = ? ORDER BY "order" ASC', [columnId]);
  },

  async createColumn(name, order) {
    if (!window.os || !window.os.database) return null;
    const res = await os.database.run('INSERT INTO columns (name, "order") VALUES (?, ?)', [name, order]);
    return res.lastInsertRowid;
  },

  async updateColumn(id, name, order) {
    if (!window.os || !window.os.database) return;
    await os.database.run('UPDATE columns SET name = ?, "order" = ? WHERE id = ?', [name, order, id]);
  },

  async deleteTaskColumn(id) {
    if (!window.os || !window.os.database) return;
    await os.database.run('DELETE FROM columns WHERE id = ?', [id]);
  },

  async createTask(columnId, title, description, priority, order) {
    if (!window.os || !window.os.database) return null;
    const res = await os.database.run(
      'INSERT INTO tasks (column_id, title, description, priority, "order") VALUES (?, ?, ?, ?, ?)',
      [columnId, title, description, priority, order]
    );
    return res.lastInsertRowid;
  },

  async updateTask(id, updates) {
    if (!window.os || !window.os.database) return;
    const keys = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = keys.map(k => `${k} = ?`).join(', ');
    await os.database.run(`UPDATE tasks SET ${setClause} WHERE id = ?`, [...values, id]);
  },

  async deleteTask(id) {
    if (!window.os || !window.os.database) return;
    await os.database.run('DELETE FROM tasks WHERE id = ?', [id]);
  },

  async moveTask(taskId, columnId, order) {
    if (!window.os || !window.os.database) return;
    await os.database.run('UPDATE tasks SET column_id = ?, "order" = ? WHERE id = ?', [columnId, order, taskId]);
  },

  async importBoard(data) {
    if (!window.os || !window.os.database) return;
    await os.database.exec('DELETE FROM tasks; DELETE FROM columns;');
    for (const col of data.columns) {
      await os.database.run('INSERT INTO columns (id, name, "order") VALUES (?, ?, ?)', [col.id, col.name, col.order]);
    }
    for (const task of data.tasks) {
      await os.database.run(
        'INSERT INTO tasks (id, column_id, title, description, priority, "order") VALUES (?, ?, ?, ?, ?, ?)',
        [task.id, task.column_id, task.title, task.description, task.priority, task.order]
      );
    }
  },

  async exportBoard() {
    if (!window.os || !window.os.database) return null;
    const columns = await os.database.query('SELECT id, name, "order" FROM columns ORDER BY "order" ASC');
    const tasks = await os.database.query('SELECT id, column_id, title, description, priority, "order" FROM tasks ORDER BY "order" ASC');
    return { columns, tasks };
  }
};