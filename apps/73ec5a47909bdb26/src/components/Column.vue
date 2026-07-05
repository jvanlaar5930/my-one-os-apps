<script setup lang="ts">
import { computed } from 'vue';

interface ColumnData {
  id: number;
  name: string;
  order: number;
}

interface TaskData {
  id: number;
  column_id: number;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  order: number;
}

const props = defineProps<{
  column: ColumnData;
  tasks: TaskData[];
}>();

const emit = defineEmits<{
  (e: 'remove', id: number): void;
  (e: 'add'): void;
  (e: 'select', task: TaskData): void;
  (e: 'drop', payload: { taskId: number; sourceColumnId: number; targetColumnId: number }): void;
}>();

const columnTasks = computed(() => 
  props.tasks.filter(t => t.column_id === props.column.id)
);

const onDrop = (event: DragEvent) => {
  const taskId = event.dataTransfer?.getData('taskId');
  const sourceColumnId = event.dataTransfer?.getData('sourceColumnId');
  
  if (!taskId || !sourceColumnId) return;

  emit('drop', { 
    taskId: parseInt(taskId), 
    sourceColumnId: parseInt(sourceColumnId), 
    targetColumnId: props.column.id 
  });
};
</script>

<template>
  <div 
    class="column"
    @dragover.prevent
    @drop="onDrop"
  >
    <div class="column-header">
      <span>{{ column.name }}</span>
      <button @click="$emit('remove', column.id)" class="btn-secondary" aria-label="Delete Column">×</button>
    </div>

    <div class="task-list">
      <TransitionGroup name="list">
        <TaskCard 
          v-for="task in columnTasks" 
          :key="task.id"
          :task="task"
          @select="$emit('select', task)"
        />
      </TransitionGroup>
      <div v-if="columnTasks.length === 0" class="empty-state">
        <p>No tasks</p>
      </div>
    </div>

    <button @click="$emit('add')" class="btn-secondary" style="margin-top: 8px; width: 100%;">+ Add Task</button>
  </div>
</template>