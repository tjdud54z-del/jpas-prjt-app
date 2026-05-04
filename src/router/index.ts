import type { RouteRecordRaw } from 'vue-router';
import { createRouter, createWebHistory } from 'vue-router';

/* ==============================
 * Layouts
 * ============================== */
import AppLayout from '@/layout/AppLayout.vue';

/* ==============================
 * Pages (직접 import 필요한 것만)
 * ============================== */
import Login from '@/views/pages/auth/Login.vue';

/* ==============================
 * Routes
 * ============================== */
const routes: RouteRecordRaw[] = [
  /* 로그인 (레이아웃 없음) */
  {
    path: '/login',
    name: 'login',
    component: Login
  },
  /* 기존 Prime/AppLayout 영역 */
  {
    path: '/',
    component: AppLayout,
    children: [
      {
        path: '',
        redirect: '/login'
      },
      {
        path: 'employees',
        name: 'employees',
        component: () => import('@/views/pages/EmployeeList.vue')
      },
      {
        path: '/dm',
        name: 'DmPage',
        component: () => import('@/views/pages/DmPage.vue')
      },
      {
        path: '/dmManage',
        name: 'dmManage',
        component: () => import('@/views/pages/DmManager.vue')
      },
      {
        path: 'commonCodes',
        name: 'commonCodes',
        component: () => import('@/views/pages/CommonCodeList.vue')
      },
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('@/views/Dashboard.vue')
      },
      {
        path: 'uikit/formlayout',
        name: 'formlayout',
        component: () => import('@/views/uikit/FormLayout.vue')
      },
      {
        path: 'uikit/input',
        name: 'input',
        component: () => import('@/views/uikit/InputDoc.vue')
      },
      {
        path: 'uikit/button',
        name: 'button',
        component: () => import('@/views/uikit/ButtonDoc.vue')
      },
      {
        path: 'uikit/table',
        name: 'table',
        component: () => import('@/views/uikit/TableDoc.vue')
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
        component: () => import('@/views/uikit/PanelsDoc.vue')
      },
      {
        path: 'uikit/overlay',
        name: 'overlay',
        component: () => import('@/views/uikit/OverlayDoc.vue')
      },
      {
        path: 'uikit/media',
        name: 'media',
        component: () => import('@/views/uikit/MediaDoc.vue')
      },
      {
        path: 'uikit/message',
        name: 'message',
        component: () => import('@/views/uikit/MessagesDoc.vue')
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
        component: () => import('@/views/uikit/ChartDoc.vue')
      },
      {
        path: 'uikit/misc',
        name: 'misc',
        component: () => import('@/views/uikit/MiscDoc.vue')
      },
      {
        path: 'uikit/timeline',
        name: 'timeline',
        component: () => import('@/views/uikit/TimelineDoc.vue')
      },
      {
        path: 'blocks/free',
        name: 'blocks',
        meta: {
          breadcrumb: ['Prime Blocks', 'Free Blocks']
        },
        component: () => import('@/views/utilities/Blocks.vue')
      },
      {
        path: 'pages/empty',
        name: 'empty',
        component: () => import('@/views/pages/Empty.vue')
      },
      {
        path: 'pages/crud',
        name: 'crud',
        component: () => import('@/views/pages/Crud.vue')
      },
      {
        path: 'start/documentation',
        name: 'documentation',
        component: () => import('@/views/pages/Documentation.vue')
      }
    ]
  },
  /* Admin ERP 영역 */
  // {
  //     path: '/admin',
  //     component: AdminLayout,
  //     children: [
  //         {
  //             path: 'employees',
  //             name: 'employees',
  //             component: () => import('@/views/pages/EmployeeList.vue')
  //         },
  //         {
  //             path: 'departments',
  //             name: 'departments',
  //             component: () => import('@/views/pages/DepartmentList.vue')
  //         },
  //         {
  //             path: 'commonCodes',
  //             name: 'commonCodes',
  //             component: () => import('@/views/pages/CommonCodeList.vue')
  //         }
  //     ]
  // },
  /* 기타 페이지 */
  {
    path: '/landing',
    name: 'landing',
    component: () => import('@/views/pages/Landing.vue')
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
    component: () => import('@/views/pages/NotFound.vue')
  }
];

/* ==============================
 * Router
 * ============================== */
const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
