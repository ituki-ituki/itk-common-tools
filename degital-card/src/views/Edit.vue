<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { CardNotFoundError, blankCard, deleteCard, getCard, updateCard } from '../lib/pocketbase'
import CardForm from '../components/CardForm.vue'

const props = defineProps<{ id: string }>()
const router = useRouter()

const loading = ref(true)
const notFound = ref(false)
const saving = ref(false)
const deleting = ref(false)
const error = ref('')
const form = reactive(blankCard())

onMounted(async () => {
  try {
    const card = await getCard(props.id)
    for (const k of Object.keys(form) as (keyof typeof form)[]) form[k] = card[k]
  } catch (e) {
    notFound.value = e instanceof CardNotFoundError
  } finally {
    loading.value = false
  }
})

const save = async () => {
  saving.value = true
  error.value = ''
  try {
    await updateCard(props.id, form)
    router.push(`/${props.id}`)
  } catch {
    error.value = '更新に失敗しました。時間をおいて再度お試しください。'
  } finally {
    saving.value = false
  }
}

const remove = async () => {
  if (!window.confirm('この名刺を削除します。よろしいですか？')) return
  deleting.value = true
  try {
    await deleteCard(props.id)
    router.push('/')
  } catch {
    error.value = '削除に失敗しました。時間をおいて再度お試しください。'
    deleting.value = false
  }
}
</script>

<template>
  <div class="page">
    <div v-if="loading" class="state"><span class="spinner" /></div>

    <div v-else-if="notFound" class="state fade-in">
      <p class="not-found-title">みつかりません</p>
      <router-link to="/create" class="btn btn-primary">名刺をつくる</router-link>
    </div>

    <CardForm v-else :form="form" heading="名刺を編集" :back="`/${id}`" action="保存する" :busy="saving"
      :ready="form.name.trim() !== ''" :error="error" @submit="save">
      <template #after>
        <button class="btn btn-danger btn-block delete-btn" :disabled="deleting" @click="remove">
          <span v-if="deleting" class="spinner" />
          <span v-else><i class="fa-solid fa-trash" /> この名刺を削除する</span>
        </button>
      </template>
    </CardForm>
  </div>
</template>

<style scoped>
.delete-btn {
  margin-top: 14px;
}
</style>
