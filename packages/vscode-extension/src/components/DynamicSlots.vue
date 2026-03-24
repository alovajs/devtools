<script lang="ts" setup generic="T extends string">
defineOptions({
  name: 'DynamicSlots',
})

const props = defineProps<{
  show: T | T[]
}>()

const slots = useSlots()
const normalizedShow = computed(() =>
  Array.isArray(props.show) ? props.show : [props.show],
)

const visibleSlots = computed(() =>
  Object.keys(slots).filter(name =>
    normalizedShow.value.includes(name as T),
  ) as T[],
)
</script>

<template>
  <div>
    <template v-for="slotName in visibleSlots" :key="slotName">
      <slot :name="slotName" />
    </template>
  </div>
</template>
