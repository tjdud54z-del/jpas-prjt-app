
import { ref } from 'vue'
import { useModal } from '@/composables/useModal'

const message = ref('')

const modal = useModal((msg: string) => {
  message.value = msg
})

export function useConfirm() {
  const openConfirm = async (msg: string): Promise<boolean> => {
    return await modal.excuteModal<boolean>(msg)
  }

  return {
    isShow: modal.isShow,
    message,
    openConfirm,
    resolver: modal.resolver,
    rejecter: modal.rejecter
  }
}
