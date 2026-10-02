<script setup lang="ts">
import { ref } from 'vue'
import { ImageUploadError, InvalidImageTypeError, uploadCardImage } from '../lib/upload'

defineProps<{ modelValue: string; label: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const isUploading = ref(false)
const errorMessage = ref('')
const inputEl = ref<HTMLInputElement | null>(null)

const pickFile = () => inputEl.value?.click()

const onFileChange = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  ;(event.target as HTMLInputElement).value = ''
  if (!file) return

  isUploading.value = true
  errorMessage.value = ''
  try {
    const url = await uploadCardImage(file)
    emit('update:modelValue', url)
  } catch (error) {
    errorMessage.value =
      error instanceof InvalidImageTypeError
        ? error.message
        : error instanceof ImageUploadError
          ? error.message
          : 'アップロードに失敗しました'
  } finally {
    isUploading.value = false
  }
}

const remove = () => emit('update:modelValue', '')
</script>

<template>
  <div class="image-field">
    <label>{{ label }}</label>

    <div v-if="modelValue" class="preview">
      <img :src="modelValue" :alt="label" />
      <button type="button" class="remove-btn" aria-label="削除" @click="remove">
        <i class="fa-solid fa-xmark" />
      </button>
    </div>

    <button v-else type="button" class="dropzone" :disabled="isUploading" @click="pickFile">
      <span v-if="isUploading" class="spinner" />
      <template v-else>
        <i class="fa-solid fa-image" />
        <span>アップロード</span>
      </template>
    </button>

    <input
      ref="inputEl"
      type="file"
      accept="image/png,image/jpeg"
      class="hidden-input"
      @change="onFileChange"
    />

    <p v-if="errorMessage" class="hint error">{{ errorMessage }}</p>
  </div>
</template>

<style scoped>
.image-field {
  display: flex;
  flex-direction: column;
}

.image-field label {
  display: block;
  font-size: 13px;
  color: var(--text-1);
  margin-bottom: 6px;
  font-weight: 600;
}

.hidden-input {
  display: none;
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
  width: 100%;
  aspect-ratio: 16 / 10;
  border-radius: var(--radius-sm);
  overflow: hidden;
  border: 1px solid var(--border);
}

.preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.remove-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 12px;
}
</style>
