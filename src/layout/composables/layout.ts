import { computed, reactive } from 'vue';

/**
 * =========================
 * Layout Config 타입
 * =========================
 */
type MenuMode = 'static' | 'overlay';

interface LayoutConfig {
  preset: string;
  primary: string;
  surface: string | null;
  darkTheme: boolean;
  menuMode: MenuMode;
}

/**
 * =========================
 * Layout State 타입
 * =========================
 */
interface LayoutState {
  staticMenuInactive: boolean;
  overlayMenuActive: boolean;
  mobileMenuActive: boolean;
  profileSidebarVisible: boolean;
  configSidebarVisible: boolean;
  sidebarExpanded: boolean;
  menuHoverActive: boolean;
  activeMenuItem: string | null;
  activePath: string | null;
  anchored?: boolean;
}

/** Layout Config */
const layoutConfig = reactive<LayoutConfig>({
  preset: 'Aura',
  primary: 'emerald',
  surface: null,
  darkTheme: false,
  menuMode: 'static'
});

/** Layout State */
const layoutState = reactive<LayoutState>({
  staticMenuInactive: false,
  overlayMenuActive: false,
  mobileMenuActive: false,
  profileSidebarVisible: false,
  configSidebarVisible: false,
  sidebarExpanded: false,
  menuHoverActive: false,
  activeMenuItem: null,
  activePath: null
});

export function useLayout() {
  /**
   * 다크모드 토글
   * - View Transition API 사용 가능 시 부드러운 전환
   */
  const toggleDarkMode = () => {
    if (!document.startViewTransition) {
      executeDarkModeToggle();
      return;
    }

    document.startViewTransition(() => {
      executeDarkModeToggle();
    });
  };

  const executeDarkModeToggle = () => {
    layoutConfig.darkTheme = !layoutConfig.darkTheme;
    document.documentElement.classList.toggle('app-dark');
  };

  /**
   * 메뉴 토글
   */
  const toggleMenu = () => {
    if (isDesktop()) {
      if (layoutConfig.menuMode === 'static') {
        layoutState.staticMenuInactive = !layoutState.staticMenuInactive;
      }

      if (layoutConfig.menuMode === 'overlay') {
        layoutState.overlayMenuActive = !layoutState.overlayMenuActive;
      }
    } else {
      layoutState.mobileMenuActive = !layoutState.mobileMenuActive;
    }
  };

  /**
   * 설정 사이드바 토글
   */
  const toggleConfigSidebar = () => {
    layoutState.configSidebarVisible = !layoutState.configSidebarVisible;
  };

  const hideMobileMenu = () => {
    layoutState.mobileMenuActive = false;
  };

  /**
   * 메뉴 모드 변경
   */
  const changeMenuMode = (event: { value: MenuMode }) => {
    layoutConfig.menuMode = event.value;
    layoutState.staticMenuInactive = false;
    layoutState.mobileMenuActive = false;
    layoutState.sidebarExpanded = false;
    layoutState.menuHoverActive = false;
    layoutState.anchored = false;
  };

  const isDarkTheme = computed(() => layoutConfig.darkTheme);
  const isDesktop = () => window.innerWidth > 991;

  const hasOpenOverlay = computed(() => layoutState.overlayMenuActive);

  return {
    layoutConfig,
    layoutState,
    isDarkTheme,
    toggleDarkMode,
    toggleConfigSidebar,
    toggleMenu,
    hideMobileMenu,
    changeMenuMode,
    isDesktop,
    hasOpenOverlay
  };
}