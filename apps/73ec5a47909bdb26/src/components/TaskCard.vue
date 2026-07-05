<script setup lang="ts">
interface TaskData {
  id: number;
  column_id: number;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  labels?: string;
  order: number;
}

const props = defineProps<{
  task: TaskData
}>();

const emit = defineEmits<{
  (e: 'dragstart', task: TaskData): void;
  (e: 'dragend'): void;
  (e: 'select', task: TaskData): void;
}>();

const dragging = Vue.ref(false);

const onDragStart = (event: DragEvent) => {
  if (!event.dataTransfer) return;
  dragging.value = true;
  event.dataTransfer.setData('taskId', props.task.id.toString());
  event.dataTransfer.setData('sourceColumnId', props.task.column_id.toString());
  event.dataTransfer.effectAllowed = 'move';
};

const onDragEnd = () => {
  dragging.value = false;
};
</script>

<template>
  <div 
    class="task-card"
    :class="{ dragging }"
    draggable="true"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
    @click="$emit('select', task)"
  >
    <span class="task-title">{{ task.title }}</span>
    <p v-if="task.description" class="task-desc">{{ task.description }}</p>
    
    <div v-if="task.labels" class="task-labels">
      <span v-for="label in task.labels.split(',')" :key="label" class="task-label">
        {{ label.trim() }}
      </span>
    </div>

    <div class="priority-badge" :class="'priority-' + task.priority">
      {{ task.priority }}
    </div>
  </div>
</template>

<style scoped>
.task-labels {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 8px;
}

.task-label {
  font-size: 0.65rem;
  background: rgba(0,0,0,0.05);
  padding: 1px 6px;
  border-radius: 4px;
  opacity: 0.7;
}

[data-theme="dark"] .task-label {
  background: rgba(255,255,255,0.1);
}
</style>