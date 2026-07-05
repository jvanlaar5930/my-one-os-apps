<script setup lang="ts">
import { reactive } from 'vue';

interface TaskData {
  id: number;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  labels?: string;
}

const props = defineProps<{
  task: TaskData
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', updates: Partial<TaskData> & { id: number }): void;
}>();

const taskForm = reactive({
  title: props.task.title,
  description: props.task.description || '',
  priority: props.task.priority,
  labels: props.task.labels || ''
});

const handleSave = () => {
  emit('save', { 
    id: props.task.id, 
    title: taskForm.title,
    description: taskForm.description,
    priority: taskForm.priority,
    labels: taskForm.labels
  });
};
</script>

<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-container">
      <h3 class="modal-title">Edit Task</h3>
      <br/>
      <form @submit.prevent="handleSave">
        <div class="form-group">
          <label for="task-title">Title</label>
          <input id="task-title" v-model="taskForm.title" required />
        </div>

        <div class="form-group">
          <label for="task-description">Description</label>
          <textarea id="task-description" v-model="taskForm.description" rows="3"></textarea>
        </div>

        <div class="form-group">
          <label for="task-labels">Labels (comma separated)</label>
          <input id="task-labels" v-model="taskForm.labels" placeholder="e.g. bug, feature, urgent" />
        </div>

        <div class="form-group">
          <label for="task-priority">Priority</label>
          <select id="task-priority" v-model="taskForm.priority">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div class="modal-actions">
          <button type="button" @click="$emit('close')" class="btn-secondary">Cancel</button>
          <button type="submit" class="btn-primary">Save Changes</button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.modal-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
}
</style>