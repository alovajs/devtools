<script setup lang="ts">
// https://github.com/vueuse/head
// you can use this to manipulate the document head in any components,
// they will be rendered correctly in the html results with vite-ssg
useHead({
  title: import.meta.env.VITE_APP_TITLE,
  meta: [
    {
      name: 'description',
      content: 'Generate and search APIs without API documentation any more',
    },
    {
      name: 'theme-color',
      content: () => isDark.value ? '#00aba9' : '#ffffff',
    },
  ],
  link: [
    {
      rel: 'icon',
      type: 'image/svg+xml',
      href: () => preferredDark.value ? '/favicon-dark.svg' : '/favicon.svg',
    },
  ],
})
</script>

<template>
  <AppProvider>
    <AppUse>
      <RouterView />
    </AppUse>
  </AppProvider>
</template>
