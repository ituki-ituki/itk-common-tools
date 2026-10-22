<script setup lang="ts">
import { CONTACT_TYPES } from '../lib/contactTypes'
import type { CardInput } from '../lib/pocketbase'
import ImageUploadField from './ImageUploadField.vue'

defineProps<{ form: CardInput; heading: string; back: string; action: string; busy: boolean; ready: boolean; error: string }>()
defineEmits<{ submit: [] }>()

const fields: { key: Exclude<keyof CardInput, 'imageUrlFront' | 'imageUrlBack'>; label: string; icon: string; placeholder: string }[] = [
  { key: 'name', label: '名前', icon: 'fa-solid fa-user', placeholder: '山田 太郎' },
  { key: 'title', label: '肩書き・ひとこと', icon: 'fa-solid fa-briefcase', placeholder: 'Software Engineer' },
  ...CONTACT_TYPES,
]
</script>

<template>
  <div class="card-panel fade-in">
    <router-link :to="back" class="back"><i class="fa-solid fa-arrow-left" /> もどる</router-link>
    <h1>{{ heading }}</h1>

    <form @submit.prevent="$emit('submit')">
      <slot />

      <div v-for="f in fields" :key="f.key" class="field">
        <label :for="f.key"><i :class="f.icon" /> {{ f.label }}</label>
        <input :id="f.key" v-model="form[f.key]" :placeholder="f.placeholder" :required="f.key === 'name'" />
      </div>

      <div class="field">
        <label><i class="fa-solid fa-id-card" /> 名刺画像</label>
        <div class="image-grid">
          <ImageUploadField v-model="form.imageUrlFront" label="表面" />
          <ImageUploadField v-model="form.imageUrlBack" label="裏面" />
        </div>
      </div>

      <p v-if="error" class="hint error">{{ error }}</p>

      <button type="submit" class="btn btn-primary btn-block" :disabled="busy || !ready">
        <span v-if="busy" class="spinner" />
        <span v-else><i class="fa-solid fa-check" /> {{ action }}</span>
      </button>
    </form>

    <slot name="after" />
  </div>
</template>

<style scoped>
.back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-1);
  margin-bottom: 16px;
}

h1 {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 24px;
}

.image-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
</style>
