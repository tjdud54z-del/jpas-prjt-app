import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    expired: false,
    handling: false
  }),
  actions: {
    markExpired() {
      if (this.handling) return
      this.expired = true
      this.handling = true
    },
    reset() {
      this.expired = false
      this.handling = false
    }
  }
})
