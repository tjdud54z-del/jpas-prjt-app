import router from '@/router';
import { createApp } from 'vue';
import App from './App.vue';

/* ==============================
 * Styles
 * ============================== */
import '@/assets/styles.scss';
import '@/assets/tailwind.css';
import '@/styles/common.css';
// import '@/styles/global.css';
import 'tabulator-tables/dist/css/tabulator.min.css';

/* ==============================
 * State & UI Plugins
 * ============================== */
import { createPinia } from 'pinia';

import Aura from '@primeuix/themes/aura';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';

/* ==============================
 * App Bootstrap
 * ============================== */
const app = createApp(App);

app
  .use(createPinia()) // Pinia는 반드시 함수 호출
  .use(router)
  .use(PrimeVue, {
    theme: {
      preset: Aura,
      options: {
        darkModeSelector: '.app-dark'
      }
    }
  })
  .use(ToastService)
  .use(ConfirmationService)
  .mount('#app');
