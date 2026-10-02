<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { CONTACT_TYPES } from '../lib/contactTypes'
import { CardIdTakenError, cardUrl, createCard, isValidCardId, type CardInput } from '../lib/pocketbase'
import ImageUploadField from '../components/ImageUploadField.vue'

const router = useRouter()

const id = ref('')
const form = reactive<CardInput>({
  name: '',
  title: '',
  email: '',
  phone: '',
  companyUrl: '',
  line: '',
  facebook: '',
  twitter: '',
  instagram: '',
  imageUrlFront: '',
  imageUrlBack: '',
})

const isSubmitting = ref(false)
const errorMessage = ref('')

const normalizedId = computed(() =>
  id.value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
)
const idIsValid = computed(() => normalizedId.value === '' || isValidCardId(normalizedId.value))
const canSubmit = computed(
  () => isValidCardId(normalizedId.value) && form.name.trim() !== '' && !isSubmitting.value
)

const submit = async () => {
  if (!canSubmit.value) return
  isSubmitting.value = true
  errorMessage.value = ''
  try {
    await createCard(normalizedId.value, form)
    router.push(`/${normalizedId.value}`)
  } catch (error) {
    errorMessage.value =
      error instanceof CardIdTakenError
        ? 'そのIDは既に使われています。別のIDを試してください。'
        : '作成に失敗しました。時間をおいて再度お試しください。'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="page">
    <div class="card-panel fade-in">
      <router-link to="/" class="back"><i class="fa-solid fa-arrow-left" /> もどる</router-link>
      <h1>名刺をつくる</h1>

      <form @submit.prevent="submit">
        <div class="field">
          <label for="id"><i class="fa-solid fa-link" /> ID（URLになります）</label>
          <input
            id="id"
            v-model="id"
            placeholder="taro-yamada"
            autocapitalize="off"
            autocomplete="off"
            required
          />
          <p class="hint" :class="{ error: !idIsValid }">
            <template v-if="!idIsValid">半角英数字とハイフンのみ、2〜40文字</template>
            <template v-else-if="normalizedId">{{ cardUrl(normalizedId) }}</template>
            <template v-else>半角英数字とハイフンのみ、2〜40文字</template>
          </p>
        </div>

        <div class="field">
          <label for="name"><i class="fa-solid fa-user" /> 名前</label>
          <input id="name" v-model="form.name" placeholder="山田 太郎" required />
        </div>

        <div class="field">
          <label for="title"><i class="fa-solid fa-briefcase" /> 肩書き・ひとこと</label>
          <input id="title" v-model="form.title" placeholder="Software Engineer" />
        </div>

        <div v-for="type in CONTACT_TYPES" :key="type.key" class="field">
          <label :for="type.key"><i :class="type.icon" /> {{ type.label }}</label>
          <input :id="type.key" v-model="form[type.key]" :placeholder="type.placeholder" />
        </div>

        <div class="field">
          <label><i class="fa-solid fa-id-card" /> 名刺画像</label>
          <div class="image-grid">
            <ImageUploadField v-model="form.imageUrlFront" label="表面" />
            <ImageUploadField v-model="form.imageUrlBack" label="裏面" />
          </div>
        </div>

        <p v-if="errorMessage" class="hint error">{{ errorMessage }}</p>

        <button type="submit" class="btn btn-primary btn-block" :disabled="!canSubmit">
          <span v-if="isSubmitting" class="spinner" />
          <span v-else><i class="fa-solid fa-check" /> 作成する</span>
        </button>
      </form>
    </div>
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
