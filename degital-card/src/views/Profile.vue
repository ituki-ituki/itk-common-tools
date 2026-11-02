<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { CONTACT_TYPES } from '../lib/contactTypes'
import { CardNotFoundError, cardUrl, getCard, type Card } from '../lib/pocketbase'
import QrModal from '../components/QrModal.vue'

const props = defineProps<{ id: string }>()

const card = ref<Card | null>(null)
const loading = ref(true)
const notFound = ref(false)
const showQr = ref(false)
const copied = ref(false)
const flipped = ref(false)

const shareUrl = computed(() => cardUrl(props.id))
const image = computed(() => card.value?.imageUrlFront || card.value?.imageUrlBack)
const contacts = computed(() => CONTACT_TYPES.filter((t) => card.value?.[t.key]))

const copyUrl = async () => {
  await navigator.clipboard.writeText(shareUrl.value)
  copied.value = true
  setTimeout(() => (copied.value = false), 1600)
}

onMounted(async () => {
  try {
    card.value = await getCard(props.id)
  } catch (e) {
    notFound.value = e instanceof CardNotFoundError
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="page">
    <div v-if="loading" class="state"><span class="spinner" /></div>

    <div v-else-if="notFound" class="state fade-in">
      <p class="not-found-title">みつかりません</p>
      <p class="lead">「{{ id }}」の名刺は存在しません。</p>
      <router-link to="/create" class="btn btn-primary">この名前でつくる</router-link>
    </div>

    <div v-else-if="card" class="card-panel profile fade-in">
      <h1><i class="fa-solid fa-user" /> {{ card.name }}</h1>
      <p v-if="card.title" class="title">{{ card.title }}</p>

      <div v-if="image" class="card-visual">
        <div v-if="card.imageUrlFront && card.imageUrlBack" class="flip-card" :class="{ flipped }" role="button"
          tabindex="0" aria-label="タップして裏返す" @click="flipped = !flipped" @keydown.enter="flipped = !flipped">
          <div class="flip-card-inner">
            <div class="flip-card-face cover"><img :src="card.imageUrlFront" alt="名刺 表面" /></div>
            <div class="flip-card-face flip-card-back cover"><img :src="card.imageUrlBack" alt="名刺 裏面" /></div>
          </div>
          <span class="badge"><i class="fa-solid fa-arrows-rotate" /></span>
        </div>

        <a v-else class="card-image cover" :href="image" target="_blank" rel="noopener">
          <img :src="image" alt="名刺" />
        </a>
      </div>

      <div v-if="contacts.length" class="contact-grid">
        <a v-for="c in contacts" :key="c.key" :href="c.buildUrl(card[c.key])"
          :target="c.key === 'email' || c.key === 'phone' ? undefined : '_blank'" rel="noopener"
          class="contact-item" :style="{ '--accent': c.color }">
          <span class="contact-icon"><i :class="c.icon" /></span>
          <span class="contact-label">{{ c.label }}</span>
        </a>
      </div>

      <router-link to="/create" class="btn btn-primary btn-block cta-create">
        <i class="fa-solid fa-id-card" /> マイ名刺を作ってみる
      </router-link>

      <div class="actions">
        <button class="btn btn-ghost" @click="showQr = true">
          <i class="fa-solid fa-qrcode" /> QR
        </button>
        <button class="btn btn-ghost" @click="copyUrl">
          <i :class="copied ? 'fa-solid fa-check' : 'fa-solid fa-copy'" />
          {{ copied ? 'コピーしました' : 'URLをコピー' }}
        </button>
      </div>
    </div>

    <QrModal :open="showQr" :value="shareUrl" :filename="id" @close="showQr = false" />
  </div>
</template>

<style scoped>
.page {
  padding: 20px 20px 24px;
}

.card-panel {
  padding: 16px 24px 24px;
}

.lead {
  color: var(--text-1);
  font-size: 14px;
}

.profile {
  text-align: center;
}

h1 {
  margin-top: 4px;
  font-size: 26px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

h1 i {
  font-size: 18px;
  color: var(--accent-1);
}

.title {
  color: var(--text-1);
  font-size: 14px;
  margin-top: 6px;
}

.card-visual {
  margin: 16px auto 0;
  max-width: 280px;
}

.card-image,
.flip-card {
  position: relative;
  display: block;
  aspect-ratio: 7 / 4;
}

.flip-card {
  cursor: pointer;
  perspective: 1200px;
}

.flip-card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1);
  transform-style: preserve-3d;
}

.flip-card.flipped .flip-card-inner {
  transform: rotateY(180deg);
}

.flip-card-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
}

.flip-card-back {
  transform: rotateY(180deg);
}

.badge {
  right: 8px;
  bottom: 8px;
  font-size: 11px;
  pointer-events: none;
}

.contact-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-top: 20px;
}

.contact-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.contact-icon {
  width: 56px;
  height: 56px;
  border-radius: 18px;
  background: color-mix(in srgb, var(--accent) 18%, transparent);
  color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent);
  transition: transform 0.15s ease;
}

.contact-item:active .contact-icon {
  transform: scale(0.92);
}

.contact-label {
  font-size: 11px;
  color: var(--text-2);
}

.cta-create {
  margin-top: 20px;
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.actions .btn {
  flex: 1;
  font-size: 15px;
}
</style>
