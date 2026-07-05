<script setup lang="ts">
const router = useRouter()
const { t } = useI18n()
useHead({
  title: () => t('not-found'),
})
</script>

<template>
  <main class="px-4 py-10 text-center text-teal-700 dark:text-gray-200">
    <div class="text-4xl">
      <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-block">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
      </svg>
    </div>
    <RouterView />
    <div>
      <button class="px-4 py-1 rounded inline-block bg-teal-700 text-white cursor-pointer text-sm mt-8 mx-3" @click="router.back()">
        {{ t('button.back') }}
      </button>
    </div>
  </main>
</template>
