
import { ref } from 'vue'
import { useModal } from '@/composables/useModal'

const message = ref('')

const modal = useModal((msg: string) => {
  message.value = msg
})

export function useAlert() {
  const openAlert = async (msg: string): Promise<void> => {
    await modal.excuteModal<void>(msg)
  }

  return {
    isShow: modal.isShow,
    message,
    openAlert,
    resolver: modal.resolver
  }
}
