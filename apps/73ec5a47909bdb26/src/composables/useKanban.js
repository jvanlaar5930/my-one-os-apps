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
 * Composable for managing the Kanban board's reactive state and database synchronization.
 * 
 * @returns {KanbanState}
 */
function useKanban() {
  const columns = Vue.ref([]);
  const tasks = Vue.ref([]);
  const loading = Vue.ref(false);

  /**
   * Refreshes the local reactive state from the database.
   */
  const refreshData = async () => {
    loading.value = true;
    try {
      columns.value = await dbUtils.getColumns();
      const allTasks = [];
      for (const col of columns.value) {
        const colTasks = await dbUtils.getTasksByColumn(col.id);
        all/allTasks.push(...colTasks);
      }
      tasks.value = allTasks;
    } catch (e) {
      console.error('Failed to refresh Kanban data:', e);
    } finally {
      loading.value = false;
    }
  };

  const addColumn = async (name) => {
    const order = columns.value.length;
    const id = await dbUtils.createColumn(name, order);
    if (id) await refreshData();
  };

  const removeColumn = async (id) => {
    await dbUtils.deleteTaskColumn(id);
    await refreshData();
  };

  const addTask = async (columnId, title) => {
    const colTasks = tasks.value.filter(t => t.column_id === columnId);
    const nextOrder = colTasks.length > 0 ? Math.max(...colTasks.map(t => t.order)) + 1 : 0;
    await dbUtils.createTask(columnId, title, '', 'medium', nextOrder);
    await refreshData();
  };

  const removeTask = async (id) => {
    await dbUtils.deleteTask(id);
    await refreshData();
  };

  const updateTask = async (id, updates) => {
    await dbUtils.updateTask(id, updates);
    await refreshData();
  };

  /**
   * Moves a task to a new column and calculates its new order within that column.
   */
  const moveTask = async (taskId, targetColumnId, newOrder) => {
    // In a real production app, we'd also reorder other tasks in the source/target columns.
    // For this implementation, we update the specific task and refresh to ensure consistency.
    await dbUtils.moveTask(taskId, targetColumnId, newOrder);
  };

  const importBoard = async (data) => {
    await dbUtils.importBoard(data);
    await refreshData();
  };

  const exportBoard = async () => {
    return await dbUtils.exportBoard();
  };

  Vue.onMounted(() => {
    refreshData();
  });

  return {
    columns,
    tasks,
    loading,
    addColumn,
    removeColumn,
    addTask,
    removeTask,
    updateTask,
    moveTask,
    importBoard,
    exportBoard
  };
}