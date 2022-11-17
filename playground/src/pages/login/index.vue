<template>
  <div>login page</div>
  <view v-if="store.isLogin">isVip: {{ store.isVip }}</view>
  <button @click="store.login" v-if="!store.isLogin">login</button>
  <button @click="store.logout" v-else>logout</button>
</template>

<script lang="ts" setup>
import { useStore } from "../../store";

const store = useStore();
</script>
