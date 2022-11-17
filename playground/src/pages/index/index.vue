<template>
  <view>
    <view>index page</view>
    <view>isLogin: {{ store.isLogin }}</view>
    <view>isVip: {{ store.isVip }}</view>
    <navigator
      v-for="nav in pages"
      :url="nav.path"
      hover-class="navigator-hover"
    >
      <button>{{ nav.name }}</button>
    </navigator>
  </view>
</template>

<script setup lang="ts">
import { useStore } from "../../store";

const store = useStore();
const pages = [
  {
    path: "/pages/auth/index",
    name: "Auth Page",
  },
  {
    path: "/pages/login/index",
    name: "Login Page",
  },
];
</script>

<route type="home"></route>
