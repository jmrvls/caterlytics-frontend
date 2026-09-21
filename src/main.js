import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import './style.css'
import App from './App.vue'

// Views
import LoginView from './Views/LoginView.vue'
import RegisterView from './Views/RegisterView.vue'
import ForgotPasswordView from './Views/Forgotpasswordview.vue'
import ResetPasswordView from './Views/Resetpasswordview.vue'
import AdminDashboard from './Views/AdminDashboard.vue'
import BookingManagement from './Views/BookingManagement.vue'
import PackageManagement from './Views/PackageManagement.vue'
import InventoryManagement from './Views/InventoryManagement.vue'
import PaymentManagement from './Views/PaymentManagement.vue'
import StaffManagement from './Views/StaffManagement.vue'
import ReportsAnalytics from './Views/ReportsAnalytics.vue'
import ClientDashboard from './Views/ClientDashboard.vue'
import SettingsView from './Views/SettingsView.vue'

// Routes
const routes = [
  { path: '/', component: LoginView },
  { path: '/register', component: RegisterView },
  { path: '/forgot-password', component: ForgotPasswordView },
  { path: '/reset-password', component: ResetPasswordView },
  { path: '/admin/dashboard', component: AdminDashboard, meta: { requiresAuth: true, roles: ['Admin', 'Staff', 'Owner/Manager'] } },
  { path: '/admin/bookings', component: BookingManagement, meta: { requiresAuth: true, roles: ['Admin', 'Owner/Manager'] } },
  { path: '/admin/packages', component: PackageManagement, meta: { requiresAuth: true, roles: ['Admin', 'Owner/Manager'] } },
  { path: '/admin/inventory', component: InventoryManagement, meta: { requiresAuth: true, roles: ['Admin', 'Owner/Manager'] } },
  { path: '/admin/payments', component: PaymentManagement, meta: { requiresAuth: true, roles: ['Admin', 'Staff', 'Owner/Manager'] } },
  { path: '/admin/staff', component: StaffManagement, meta: { requiresAuth: true, roles: ['Admin', 'Owner/Manager'] } },
  { path: '/admin/reports', component: ReportsAnalytics, meta: { requiresAuth: true, roles: ['Admin', 'Owner/Manager'] } },
  { path: '/client/bookings', component: ClientDashboard, meta: { requiresAuth: true, roles: ['Client'] } },
  { path: '/settings', component: SettingsView, meta: { requiresAuth: true, roles: ['Admin', 'Staff', 'Owner/Manager', 'Client'] } }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Global route guard: blocks direct-URL access to pages a role
// isn't allowed to see, not just the sidebar links.
router.beforeEach((to) => {
  if (!to.meta?.requiresAuth) {
    return true
  }

  let user = null
  try {
    user = JSON.parse(sessionStorage.getItem('user'))
  } catch {
    user = null
  }

  if (!user || !user.role) {
    return '/'
  }

  if (to.meta.roles && !to.meta.roles.includes(user.role)) {
    // Send the user back to a page they do have access to instead
    // of letting them in.
    if (user.role === 'Staff') {
      return '/admin/payments'
    } else if (user.role === 'Client') {
      return '/client/bookings'
    } else {
      return '/'
    }
  }

  return true
})

const app = createApp(App)
app.use(router)
app.mount('#app')