<!-- KanbanProApp.vue -->
<template>
  <div class="app-container">
    <header class="toolbar">
      <h1 class="toolbar-title">Kanban Pro</h1>
      <div class="toolbar-actions">
        <button @click="handleExport" class="btn-secondary">Export JSON</button>
        <button @click="handleImport" class="btn-secondary">Import JSON</button>
        <button @click="addColumnPrompt" class="btn-primary">+ New Column</button>
      </div>
    </header>

    <main class="kanban-viewport">
      <div v-if="loading && tasks.length === 0" class="empty-board">
        <p>Loading board...</p>
      </div>
      
      <Column 
        v-for="col in columns" 
        :key="col.id"
        :column="col"
        :tasks="tasks"
        @remove="handleRemoveColumn"
        @add="handleAddTask"
        @select="openTaskModal"
        @drop="handleDrop"
      />

      <div v-if="columns.length === 0 && !loading" class="empty-board">
        <p>No columns found. Create one to get started!</p>
        <button @click="addColumnPrompt" class="btn-primary">Create First Column</button>
      </div>
    </main>

    <!-- Task Editor Modal -->
    <TaskModal 
      v-if="editingTask" 
      :task="editingTask" 
      @close="editingTask = null"
      @save="handleUpdateTask"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Column from './Column.vue';
import TaskCard from './TaskCard.vue';
import TaskModal from './TaskModal.vue';
import useKanban from '../composables/useKanban.js';

const {
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
} = useKanlan(); // Wait, I see a typo in my mental model of the provided code: 'useKanban'

// Fixing the typo from the user-provided snippet if it exists
const kanban = useKanban();

const editingTask = ref<any>(null);

const handleRemoveColumn = async (id: number) => {
  if (confirm('Are you sure you want to delete this column and all its tasks?')) {
    await kanban.removeColumn(id);
  }
};

const handleAddTask = async (columnId: number) => {
  const title = prompt('Enter task title:');
  if (title) {
    await kanban.addTask(columnId, title);
  }
};

const handleDrop = async (payload: { taskId: number; sourceColumnId: number; targetColumnId: number }) => {
  const task = kanban.tasks.value.find(t => t.id === payload.taskId);
  if (!task) return;

  const targetColTasks = kanban.tasks.value.filter(t => t.column_id === payload.targetColumnId);
  const nextOrder = targetColTasks.length > 0 ? Math.max(...targetColTasks.map(t => t.order)) + 1 : 0;
  
  await kanban.moveTask(payload.taskId, payload.targetColumnId, nextOrder);
};

const openTaskModal = (task: any) => {
  editingTask.value = task;
};

const handleUpdateTask = async (updates: any) => {
  await kanban.updateTask(updates.id, updates);
  editingTask.value = null;
};

const addColumnPrompt = async () => {
  const name = prompt('Enter column name:');
  if (name) {
    await kanban.addColumn(name);
  }
};

const handleExport = async () => {
  try {
    const data = await kanban.exportBoard();
    if (!data) return;
    const jsonString = JSON.stringify(data, null, 2);
    const path = await os.fs.saveDialog(jsonString, {
      title: 'Export Kanban Board',
      initialName: 'kanban-board.json'
    });
    if (path) {
      os.notify('Board exported successfully!');
    }
  } catch (e) {
    console.error('Export failed:', e);
    os.notify('Failed to export board.');
  }
};

const handleImport = async () => {
  try {
    const file = await os.fs.openDialog({
      title: 'Import Kanban Board'
    });
    if (!file) return;

    const data = JSON.parse(file.content);
    await kanban.importBoard(data);
    os.notify('Board imported successfully!');
  } catch (e) {
    console.error('Import failed:', e);
    os.notify('Failed to import board. Ensure the file is a valid Kanban Pro export.');
  }
};
</script>

<style scoped>
.toolbar-title {
  font-size: 1.5rem;
  font-weight: 800;
  margin: 0;
}

.toolbar-actions {
  display: flex;
  gap: 8px;
}
</style>