<script setup lang="ts">
import { ref, watch } from 'vue'
import QRCode from 'qrcode'

const props = defineProps<{ open: boolean; value: string; filename: string }>()
const emit = defineEmits<{ close: [] }>()

const dataUrl = ref('')

watch(
  () => props.open,
  async (isOpen) => {
    if (!isOpen) return
    dataUrl.value = await QRCode.toDataURL(props.value, {
      width: 320,
      margin: 2,
      color: { dark: '#14151c', light: '#ffffff' },
    })
  }
)

const closeOnOverlay = (event: MouseEvent) => {
  if ((event.target as HTMLElement).classList.contains('overlay')) emit('close')
}
</script>

<template>
  <teleport to="body">
    <div v-if="open" class="overlay" @click="closeOnOverlay">
      <div class="popup fade-in">
        <img v-if="dataUrl" :src="dataUrl" alt="QRコード" class="qr-image" />
        <a v-if="dataUrl" :href="dataUrl" :download="`${filename}.png`" class="btn btn-ghost btn-block">
          <i class="fa-solid fa-download" /> ダウンロード
        </a>
      </div>
    </div>
  </teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
}

.popup {
  background: #fff;
  border-radius: var(--radius-lg);
  padding: 24px;
  width: 100%;
  max-width: 340px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
}

.qr-image {
  width: 100%;
  border-radius: var(--radius-md);
}

.popup .btn-ghost {
  background: var(--bg-0);
  color: var(--text-0);
  border-color: transparent;
}
</style>
