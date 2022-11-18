<template>
  <div>login page</div>
  <view v-if="store.isLogin">isVip: {{ store.isVip }}</view>
  <button @click="store.login" v-if="!store.isLogin">login</button>
  <button @click="store.logout" v-else>logout</button>
  <navigator open-type="switchTab" url="/pages/index/index">
    <button>home</button>
  </navigator>
</template>

<script lang="ts" setup>
import { useStore } from "../../store";

const store = useStore();
</script>
