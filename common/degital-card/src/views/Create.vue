<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { CardIdTakenError, blankCard, cardUrl, createCard, isValidCardId } from '../lib/pocketbase'
import CardForm from '../components/CardForm.vue'

const router = useRouter()
const id = ref('')
const form = reactive(blankCard())
const busy = ref(false)
const error = ref('')

const slug = computed(() => id.value.trim().toLowerCase().replace(/\s+/g, '-'))
const valid = computed(() => isValidCardId(slug.value))

const submit = async () => {
  busy.value = true
  error.value = ''
  try {
    await createCard(slug.value, form)
    router.push(`/${slug.value}`)
  } catch (e) {
    error.value = e instanceof CardIdTakenError
      ? 'そのIDは既に使われています。別のIDを試してください。'
      : '作成に失敗しました。時間をおいて再度お試しください。'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="page">
    <CardForm :form="form" heading="名刺をつくる" back="/" action="作成する" :busy="busy"
      :ready="valid && form.name.trim() !== ''" :error="error" @submit="submit">
      <div class="field">
        <label for="id"><i class="fa-solid fa-link" /> ID（URLになります）</label>
        <input id="id" v-model="id" placeholder="taro-yamada" autocapitalize="off" autocomplete="off" required />
        <p class="hint" :class="{ error: slug && !valid }">
          {{ valid ? cardUrl(slug) : '半角英数字とハイフンのみ、2〜40文字' }}
        </p>
      </div>
    </CardForm>
  </div>
</template>
