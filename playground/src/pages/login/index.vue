<script lang="ts" setup>
import { useStore } from '../../store'

const store = useStore()
</script>

<template>
  <div>login page</div>
  <view v-if="store.isLogin">
    isVip: {{ store.isVip }}
  </view>
  <button v-if="!store.isLogin" @click="store.login">
    login
  </button>
  <button v-else @click="store.logout">
    logout
  </button>
  <navigator open-type="switchTab" url="/pages/index/index">
    <button>home</button>
  </navigator>
</template>
