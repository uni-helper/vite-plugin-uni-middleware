<script setup lang="ts">
// 先要求登录(auth)，再要求会员(vip)
definePage({
  middleware: ['auth', 'vip'],
})
</script>

<template>
  <div>vip page</div>
</template>
