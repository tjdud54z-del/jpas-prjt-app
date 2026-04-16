
import { createRouter, createWebHistory } from 'vue-router'
import AdminLayout from '@/layouts/AdminLayout.vue'

import Login from '@/views/pages/common/Login.vue'
import EmployeeList from '@/views/pages/EmployeeList.vue'
import DepartmentList from '@/views/pages/DepartmentList.vue'
import CommonCodeList from '@/views/pages/CommonCodeList.vue'

const routes = [
  {
    path: '/login',
    component: Login
  },
  {
    path: '/',
    component: AdminLayout,
    children: [
      {
        path: '',
        // redirect: '/employees'
        redirect: '/login'
      },
      {
        path: 'employees',
        component: EmployeeList
      },
      {
        path: 'departments',
        component: DepartmentList
      },
      {
        path: 'commonCodes',
        component: CommonCodeList
      }
    ]
  }
]

export default createRouter({
  history: createWebHistory(),
  routes
})