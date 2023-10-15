<script lang="ts">
export default {
  onShow(){

  }
}
</script>

<template>
  <div>vip page</div>
</template>

<route lang="json">
{
  "middleware": ["auth", "vip"]
}
</route>
