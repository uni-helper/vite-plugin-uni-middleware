<script setup lang="ts">
import { useStore } from '../../store'

const store = useStore()
const pages = [
  {
    path: '/pages/auth/index',
    name: 'Auth Page',
  },
  {
    path: '/pages/login/index',
    name: 'Login Page',
  },
]
</script>

<template>
  <view>
    <view>index page</view>
    <view>isLogin: {{ store.isLogin }}</view>
    <view>isVip: {{ store.isVip }}</view>
    <navigator v-for="nav in pages" :key="nav.name" :url="nav.path" hover-class="navigator-hover">
      <button>{{ nav.name }}</button>
    </navigator>
  </view>
</template>

<route lang="json">
{
  "middleware": [
    "async"
  ]
}
</route>
