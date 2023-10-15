<script lang="ts" setup>
import { onMounted } from 'vue'

console.error('authPage')
onMounted(() => {
  console.log('authPage')
})
</script>

<template>
  <div>auth page</div>
</template>

<route lang="json">
{
  "middleware": ["auth"]
}
</route>
