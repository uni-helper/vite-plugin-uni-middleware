import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useStore = defineStore('store', () => {
  const token = ref('')
  const isVip = ref(false)
  const isLogin = computed(() => !!token.value)

  function login(): void {
    token.value = '233'
    isVip.value = Math.random() > 0.5
  }
  function logout(): void {
    token.value = ''
  }

  return {
    token,
    isVip,
    isLogin,
    login,
    logout,
  }
})
