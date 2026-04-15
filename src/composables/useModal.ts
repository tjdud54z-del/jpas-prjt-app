
import { ref } from 'vue'

/**
 * Promise 기반 Modal Hook
 *
 * 사용 흐름
 * 1) const { isShow, excuteModal, resolver, rejecter } = useModal((...args)=>{ 초기화 })
 * 2) const result = await excuteModal<T>(...params)
 * 3) 모달 내부에서 확인 버튼 => resolver(value)
 * 4) 모달 내부에서 취소 버튼 => rejecter(reason)
 */
export function useModal(initCallback?: (...args: any[]) => void) {
  /** 모달 표시 여부 */
  const isShow = ref(false)

  /** Promise.withResolvers 반환 타입에서 resolve/reject 타입 안전하게 추출 */
  type ModalResolvers<T> = ReturnType<typeof Promise.withResolvers<T>>

  /** resolve/reject 핸들러 (모달 열렸을 때 세팅됨) */
  let resolveHandler: ModalResolvers<any>['resolve'] | null = null
  let rejectHandler: ModalResolvers<any>['reject'] | null = null

  /** 모달 실행 (열기) + Promise 반환 */
  const excuteModal = <T = unknown>(...params: unknown[]) => {
    // 1) 모달 오픈
    isShow.value = true

    // 2) 초기화 콜백
    if (typeof initCallback === 'function') {
      initCallback(...params)
    }

    // 3) Promise 생성 및 핸들러 저장
    const { promise, resolve, reject } = Promise.withResolvers<T>()
    resolveHandler = resolve as ModalResolvers<any>['resolve']
    rejectHandler = reject as ModalResolvers<any>['reject']

    return promise
  }

  /** 확인(Resolve) */
  const resolver = (returnValue?: unknown) => {
    if (resolveHandler) {
      resolveHandler(returnValue)
    }
    cleanup()
  }

  /** 취소(Reject) */
  const rejecter = (returnValue?: unknown) => {
    if (rejectHandler) {
      rejectHandler(returnValue)
    }
    cleanup()
  }

  /** 공통 정리(닫기 + 핸들러 초기화) */
  const cleanup = () => {
    isShow.value = false
    resolveHandler = null
    rejectHandler = null
  }

  return {
    isShow,
    excuteModal,
    resolver,
    rejecter,
    cleanup
  }
}
