<script lang="ts" setup>
defineOptions({
  name: 'DynamicSlots',
})

const props = defineProps<{
  show: string | string[]
}>()

const slots = useSlots()
const normalizedShow = computed(() =>
  Array.isArray(props.show) ? props.show : [props.show],
)

const visibleSlots = computed(() =>
  Object.keys(slots).filter(name =>
    normalizedShow.value.includes(name),
  ),
)
</script>

<template>
  <div>
    <template v-for="slotName in visibleSlots" :key="slotName">
      <slot :name="slotName" />
    </template>
  </div>
</template>
