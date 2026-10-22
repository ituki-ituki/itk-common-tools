<script setup lang="ts">
import { ref } from 'vue'
import { uploadCardImage } from '../lib/upload'

defineProps<{ label: string }>()
const url = defineModel<string>({ required: true })

const busy = ref(false)
const error = ref('')

const pick = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  busy.value = true
  error.value = ''
  try {
    url.value = await uploadCardImage(file)
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="image-field">
    <span>{{ label }}</span>

    <div v-if="url" class="preview cover">
      <img :src="url" :alt="label" />
      <button type="button" class="badge" aria-label="削除" @click="url = ''">
        <i class="fa-solid fa-xmark" />
      </button>
    </div>

    <button v-else type="button" class="dropzone" :disabled="busy" @click="($refs.file as HTMLInputElement).click()">
      <span v-if="busy" class="spinner" />
      <template v-else>
        <i class="fa-solid fa-image" />
        <span>アップロード</span>
      </template>
    </button>

    <input ref="file" type="file" accept="image/png,image/jpeg" hidden @change="pick" />

    <p v-if="error" class="hint error">{{ error }}</p>
  </div>
</template>

<style scoped>
.image-field {
  display: flex;
  flex-direction: column;
}

.image-field > span {
  font-size: 13px;
  color: var(--text-1);
  margin-bottom: 6px;
  font-weight: 600;
}

.dropzone {
  appearance: none;
  width: 100%;
  aspect-ratio: 16 / 10;
  border: 1px dashed var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg-0);
  color: var(--text-2);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease;
}

.dropzone:hover:not(:disabled) {
  border-color: var(--accent-1);
  color: var(--accent-1);
}

.dropzone i {
  font-size: 20px;
}

.preview {
  position: relative;
  aspect-ratio: 16 / 10;
}

.badge {
  top: 6px;
  right: 6px;
  cursor: pointer;
  font-size: 12px;
}
</style>
