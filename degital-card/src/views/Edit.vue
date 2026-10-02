<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { CONTACT_TYPES } from '../lib/contactTypes'
import { CardNotFoundError, deleteCard, getCard, updateCard, type CardInput } from '../lib/pocketbase'
import ImageUploadField from '../components/ImageUploadField.vue'

const props = defineProps<{ id: string }>()
const router = useRouter()

const isLoading = ref(true)
const notFound = ref(false)
const isSaving = ref(false)
const isDeleting = ref(false)
const errorMessage = ref('')

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

onMounted(async () => {
  try {
    const card = await getCard(props.id)
    form.name = card.name
    form.title = card.title
    form.email = card.email
    form.phone = card.phone
    form.companyUrl = card.companyUrl
    form.line = card.line
    form.facebook = card.facebook
    form.twitter = card.twitter
    form.instagram = card.instagram
    form.imageUrlFront = card.imageUrlFront
    form.imageUrlBack = card.imageUrlBack
  } catch (error) {
    if (error instanceof CardNotFoundError) notFound.value = true
  } finally {
    isLoading.value = false
  }
})

const save = async () => {
  if (form.name.trim() === '') return
  isSaving.value = true
  errorMessage.value = ''
  try {
    await updateCard(props.id, form)
    router.push(`/${props.id}`)
  } catch {
    errorMessage.value = '更新に失敗しました。時間をおいて再度お試しください。'
  } finally {
    isSaving.value = false
  }
}

const remove = async () => {
  if (!window.confirm('この名刺を削除します。よろしいですか？')) return
  isDeleting.value = true
  try {
    await deleteCard(props.id)
    router.push('/')
  } catch {
    errorMessage.value = '削除に失敗しました。時間をおいて再度お試しください。'
    isDeleting.value = false
  }
}
</script>

<template>
  <div class="page">
    <div v-if="isLoading" class="state">
      <span class="spinner" />
    </div>

    <div v-else-if="notFound" class="state fade-in">
      <p class="not-found-title">みつかりません</p>
      <router-link to="/create" class="btn btn-primary">名刺をつくる</router-link>
    </div>

    <div v-else class="card-panel fade-in">
      <router-link :to="`/${id}`" class="back"><i class="fa-solid fa-arrow-left" /> もどる</router-link>
      <h1>名刺を編集</h1>

      <form @submit.prevent="save">
        <div class="field">
          <label for="name"><i class="fa-solid fa-user" /> 名前</label>
          <input id="name" v-model="form.name" required />
        </div>

        <div class="field">
          <label for="title"><i class="fa-solid fa-briefcase" /> 肩書き・ひとこと</label>
          <input id="title" v-model="form.title" />
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

        <button type="submit" class="btn btn-primary btn-block" :disabled="isSaving || form.name.trim() === ''">
          <span v-if="isSaving" class="spinner" />
          <span v-else><i class="fa-solid fa-check" /> 保存する</span>
        </button>
      </form>

      <button class="btn btn-danger btn-block delete-btn" :disabled="isDeleting" @click="remove">
        <span v-if="isDeleting" class="spinner" />
        <span v-else><i class="fa-solid fa-trash" /> この名刺を削除する</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.state {
  margin-top: 30vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.not-found-title {
  font-size: 20px;
  font-weight: 700;
}

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

.delete-btn {
  margin-top: 14px;
}

.image-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
</style>
