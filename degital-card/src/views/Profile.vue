<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { CONTACT_TYPES } from '../lib/contactTypes'
import { CardNotFoundError, cardUrl, getCard, type Card } from '../lib/pocketbase'
import QrModal from '../components/QrModal.vue'

const props = defineProps<{ id: string }>()

const card = ref<Card | null>(null)
const isLoading = ref(true)
const notFound = ref(false)
const showQr = ref(false)
const copied = ref(false)
const isFlipped = ref(false)

const shareUrl = computed(() => cardUrl(props.id))
const hasFront = computed(() => !!card.value?.imageUrlFront)
const hasBack = computed(() => !!card.value?.imageUrlBack)
const canFlip = computed(() => hasFront.value && hasBack.value)

const contacts = computed(() =>
  CONTACT_TYPES.map((type) => ({
    ...type,
    value: card.value?.[type.key] ?? '',
  })).filter((c) => c.value !== '')
)

const copyUrl = async () => {
  await navigator.clipboard.writeText(shareUrl.value)
  copied.value = true
  setTimeout(() => (copied.value = false), 1600)
}

onMounted(async () => {
  try {
    card.value = await getCard(props.id)
  } catch (error) {
    if (error instanceof CardNotFoundError) notFound.value = true
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="page">
    <div v-if="isLoading" class="state">
      <span class="spinner" />
    </div>

    <div v-else-if="notFound" class="state fade-in">
      <p class="not-found-title">みつかりません</p>
      <p class="lead">「{{ id }}」の名刺は存在しません。</p>
      <router-link to="/create" class="btn btn-primary">この名前でつくる</router-link>
    </div>

    <div v-else-if="card" class="card-panel profile fade-in">
      <h1><i class="fa-solid fa-user" /> {{ card.name }}</h1>
      <p v-if="card.title" class="title">{{ card.title }}</p>

      <div v-if="hasFront || hasBack" class="card-visual">
        <div
          v-if="canFlip"
          class="flip-card"
          :class="{ flipped: isFlipped }"
          role="button"
          tabindex="0"
          aria-label="タップして裏返す"
          @click="isFlipped = !isFlipped"
          @keydown.enter="isFlipped = !isFlipped"
        >
          <div class="flip-card-inner">
            <div class="flip-card-face">
              <img :src="card.imageUrlFront" alt="名刺 表面" />
            </div>
            <div class="flip-card-face flip-card-back">
              <img :src="card.imageUrlBack" alt="名刺 裏面" />
            </div>
          </div>
          <span class="flip-hint"><i class="fa-solid fa-arrows-rotate" /></span>
        </div>

        <a
          v-else
          class="card-image"
          :href="hasFront ? card.imageUrlFront : card.imageUrlBack"
          target="_blank"
          rel="noopener"
        >
          <img :src="hasFront ? card.imageUrlFront : card.imageUrlBack" :alt="hasFront ? '名刺 表面' : '名刺 裏面'" />
        </a>
      </div>

      <div v-if="contacts.length" class="contact-grid">
        <a
          v-for="c in contacts"
          :key="c.key"
          :href="c.buildUrl(c.value)"
          :target="c.key === 'email' || c.key === 'phone' ? undefined : '_blank'"
          rel="noopener"
          class="contact-item"
          :style="{ '--accent': c.color }"
        >
          <span class="contact-icon">
            <i :class="c.icon" />
          </span>
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

.state {
  margin-top: 30vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
}

.not-found-title {
  font-size: 20px;
  font-weight: 700;
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

.card-image {
  position: relative;
  display: block;
  border-radius: var(--radius-sm);
  overflow: hidden;
  border: 1px solid var(--border);
  aspect-ratio: 7 / 4;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.flip-card {
  position: relative;
  width: 100%;
  aspect-ratio: 7 / 4;
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
  border-radius: var(--radius-sm);
  overflow: hidden;
  border: 1px solid var(--border);
  backface-visibility: hidden;
}

.flip-card-face img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.flip-card-back {
  transform: rotateY(180deg);
}

.flip-hint {
  position: absolute;
  right: 8px;
  bottom: 8px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
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
