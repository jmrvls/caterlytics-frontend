import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import './style.css'
import App from './App.vue'

// Views
import LoginView from './Views/LoginView.vue'
import RegisterView from './Views/RegisterView.vue'
import AdminDashboard from './Views/AdminDashboard.vue'
import BookingManagement from './Views/BookingManagement.vue'
import PackageManagement from './Views/PackageManagement.vue'
import InventoryManagement from './Views/InventoryManagement.vue'
import ReportsAnalytics from './Views/ReportsAnalytics.vue'

// Routes
const routes = [
  { path: '/', component: LoginView },
  { path: '/register', component: RegisterView },
  { path: '/admin/dashboard', component: AdminDashboard },
  { path: '/admin/bookings', component: BookingManagement },
  { path: '/admin/packages', component: PackageManagement },
  { path: '/admin/inventory', component: InventoryManagement },
  { path: '/admin/reports', component: ReportsAnalytics }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

const app = createApp(App)
app.use(router)
app.mount('#app')