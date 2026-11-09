<script setup lang="ts">
import { onHide, onLaunch, onShow } from '@dcloudio/uni-app'

onLaunch(() => {
  console.warn('App Launch')
})
onShow(() => {
  console.warn('App Show')
})
onHide(() => {
  console.warn('App Hide')
})
</script>

<style></style>
