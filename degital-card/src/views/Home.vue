<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { isValidCardId } from '../lib/pocketbase'

const router = useRouter()
const openId = ref('')

const openCard = () => {
  const id = openId.value.trim().toLowerCase()
  if (isValidCardId(id)) router.push(`/${id}`)
}
</script>

<template>
  <div class="page">
    <div class="hero fade-in">
      <p class="eyebrow">DIGITAL CARD</p>
      <h1>デジタルめいし</h1>
      <p class="lead">あなただけの名刺ページを今すぐ。</p>

      <router-link to="/create" class="btn btn-primary btn-block">
        <i class="fa-solid fa-plus" /> 名刺をつくる
      </router-link>

      <div class="divider"><span>すでにIDをお持ちの方</span></div>

      <form class="open-form" @submit.prevent="openCard">
        <input v-model="openId" placeholder="taro-yamada" autocapitalize="off" />
        <button type="submit" class="btn btn-ghost" :disabled="!isValidCardId(openId.trim().toLowerCase())">
          <i class="fa-solid fa-arrow-right" />
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.page {
  justify-content: center;
}

.hero {
  width: 100%;
  max-width: 420px;
  text-align: center;
}

.eyebrow {
  font-size: 12px;
  letter-spacing: 0.2em;
  color: var(--accent-1);
  font-weight: 700;
  margin-bottom: 12px;
}

h1 {
  font-size: 40px;
  font-weight: 800;
  background: var(--gradient);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  margin-bottom: 12px;
}

.lead {
  color: var(--text-1);
  font-size: 15px;
  line-height: 1.7;
  margin-bottom: 32px;
}

.divider {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text-2);
  font-size: 12px;
  margin: 28px 0 14px;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border);
}

.open-form {
  display: flex;
  gap: 8px;
}

.open-form input {
  flex: 1;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 12px 14px;
  font-size: 15px;
  outline: none;
  min-width: 0;
}

.open-form .btn-ghost {
  padding: 12px 18px;
}

.open-form input:focus {
  border-color: var(--accent-1);
}
</style>
