import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'

/* ==============================
 * Layouts
 * ============================== */
import AppLayout from '@/layout/AppLayout.vue' // 관리자
import Login from '@/views/pages/auth/Login.vue'

/* ==============================
 * Routes
 * ============================== */
const routes: RouteRecordRaw[] = [
  /* 1. 사용자 영역 (Argon 템플릿) */
  {
    path: '/',
    component: () =>
      import('@/views/pages/main/UserLayout.vue'),
    children: [
      {
        path: '',
        name: 'main',
        component: () =>
          import('@/views/pages/main/MainPage.vue')
      }
    ]
  },

  /* 2. 로그인 */
  {
    path: '/login',
    name: 'login',
    component: Login
  },

  /* 3. 관리자 영역 (Sakai 유지) */
  {
    path: '/admin',
    component: AppLayout,
    children: [
      {
        path: '',
        redirect: '/admin/dashboard'
      },
      /* ===== 실제 관리자 페이지 ===== */
      {
        path: 'dashboard',
        name: 'adminDashboard',
        component: () => import('@/views/Dashboard.vue')
      },
      {
        path: 'users',
        name: 'users',
        component: () =>
          import('@/views/pages/admin/user/UserList.vue')
      },
      {
        path: 'users/create',
        name: 'userCreate',
        component: () =>
          import('@/views/pages/admin/user/UserCreate.vue')
      },
      {
        path: 'dm',
        name: 'DmPage',
        component: () =>
          import('@/views/pages/admin/dm/DmPage.vue')
      },
      {
        path: 'dmManage',
        name: 'dmManage',
        component: () =>
          import('@/views/pages/admin/dm/DmManager.vue')
      },
      {
        path: 'commonCodes',
        name: 'commonCodes',
        component: () =>
          import('@/views/pages/admin/cmmnCd/CmmnCdList.vue')
      },

      /* ===== UI 샘플 유지 가능 ===== */
      {
        path: 'uikit/formlayout',
        name: 'formlayout',
        component: () =>
          import('@/views/uikit/FormLayout.vue')
      },
      {
        path: 'uikit/input',
        name: 'input',
        component: () =>
          import('@/views/uikit/InputDoc.vue')
      },
      {
        path: 'uikit/button',
        name: 'button',
        component: () =>
          import('@/views/uikit/ButtonDoc.vue')
      },
      {
        path: 'uikit/table',
        name: 'table',
        component: () =>
          import('@/views/uikit/TableDoc.vue')
      },
      {
        path: 'uikit/list',
        name: 'list',
        component: () => import('@/views/uikit/ListDoc.vue')
      },
      {
        path: 'uikit/tree',
        name: 'tree',
        component: () => import('@/views/uikit/TreeDoc.vue')
      },
      {
        path: 'uikit/panel',
        name: 'panel',
        component: () =>
          import('@/views/uikit/PanelsDoc.vue')
      },
      {
        path: 'uikit/overlay',
        name: 'overlay',
        component: () =>
          import('@/views/uikit/OverlayDoc.vue')
      },
      {
        path: 'uikit/media',
        name: 'media',
        component: () =>
          import('@/views/uikit/MediaDoc.vue')
      },
      {
        path: 'uikit/message',
        name: 'message',
        component: () =>
          import('@/views/uikit/MessagesDoc.vue')
      },
      {
        path: 'uikit/file',
        name: 'file',
        component: () => import('@/views/uikit/FileDoc.vue')
      },
      {
        path: 'uikit/menu',
        name: 'menu',
        component: () => import('@/views/uikit/MenuDoc.vue')
      },
      {
        path: 'uikit/charts',
        name: 'charts',
        component: () =>
          import('@/views/uikit/ChartDoc.vue')
      },
      {
        path: 'uikit/misc',
        name: 'misc',
        component: () => import('@/views/uikit/MiscDoc.vue')
      },
      {
        path: 'uikit/timeline',
        name: 'timeline',
        component: () =>
          import('@/views/uikit/TimelineDoc.vue')
      },
      {
        path: 'blocks/free',
        name: 'blocks',
        meta: {
          breadcrumb: ['Prime Blocks', 'Free Blocks']
        },
        component: () =>
          import('@/views/utilities/Blocks.vue')
      },
      {
        path: 'pages/empty',
        name: 'empty',
        component: () =>
          import('@/views/pages/sample/Empty.vue')
      },
      {
        path: 'pages/crud',
        name: 'crud',
        component: () =>
          import('@/views/pages/sample/Crud.vue')
      },
      {
        path: 'start/documentation',
        name: 'documentation',
        component: () =>
          import('@/views/pages/sample/Documentation.vue')
      }
    ]
  },

  /* 기타 페이지 */
  {
    path: '/landing',
    name: 'landing',
    component: () =>
      import('@/views/pages/sample/Landing.vue')
  },
  {
    path: '/auth/access',
    name: 'accessDenied',
    component: () => import('@/views/pages/auth/Access.vue')
  },
  {
    path: '/auth/error',
    name: 'error',
    component: () => import('@/views/pages/auth/Error.vue')
  },
  /* 404 */
  {
    path: '/:pathMatch(.*)*',
    name: 'notfound',
    component: () =>
      import('@/views/pages/error/NotFound.vue')
  }
]

/* ==============================
 * Router
 * ============================== */
const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
