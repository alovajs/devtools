<script setup lang="ts">
window.$message = useMessage()
window.$dalog = useDialog()
window.$loadingBar = useLoadingBar()
window.$notify = useNotification()
window.$modal = useModal()
</script>

<template>
  <slot />
</template>
