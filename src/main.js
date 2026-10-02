import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import './style.css'
import App from './App.vue'
import { initTheme } from './theme'
import { supabase } from './supabaseClient'

// INVITE / RESET LINK FIX: if Supabase can't honor the `redirectTo` we sent
// (e.g. the URL isn't in Auth > URL Configuration > Redirect URLs), it falls
// back to the Site URL and lands the user on `/#access_token=...&type=invite`.
// Forward those links to the set-password page, keeping the hash so
// supabase-js can still pick up the session from it.
if (window.location.pathname === '/' && /access_token=/.test(window.location.hash) && /type=(invite|recovery)/.test(window.location.hash)) {
  window.history.replaceState(null, '', '/reset-password' + window.location.hash)
}

initTheme()

// Views
import LoginView from './Views/LoginView.vue'
import RegisterView from './Views/RegisterView.vue'
import ForgotPasswordView from './Views/Forgotpasswordview.vue'
import ResetPasswordView from './Views/Resetpasswordview.vue'
import AdminDashboard from './Views/AdminDashboard.vue'
import BookingManagement from './Views/BookingManagement.vue'
import EventPlanning from './Views/Eventplanning.vue'
import PackageManagement from './Views/PackageManagement.vue'
import InventoryManagement from './Views/InventoryManagement.vue'
import WasteTracking from './Views/Wastetracking.vue'
import FeedbackRatings from './Views/FeedbackRatings.vue'
import SupportChat from './Views/SupportChat.vue'
import FleetManagement from './Views/FleetManagement.vue'
import PaymentManagement from './Views/PaymentManagement.vue'
import StaffManagement from './Views/StaffManagement.vue'
import BranchManagement from './Views/Branchmanagement.vue'
import ReportsAnalytics from './Views/ReportsAnalytics.vue'
import ClientDashboard from './Views/ClientDashboard.vue'
import SettingsView from './Views/SettingsView.vue'
import RegisterBusinessView from './Views/Registerbusinessview.vue'
import SuperAdminDashboard from './Views/SuperAdminDashboard.vue'
import NotFoundView from './Views/Notfoundview.vue'

// Routes
const routes = [
  { path: '/', component: LoginView },
  { path: '/register', component: RegisterView },
  { path: '/forgot-password', component: ForgotPasswordView },
  { path: '/reset-password', component: ResetPasswordView },
  // Platform-level: manages tenant (business) approvals/suspensions across
  // the whole system. Distinct from the business-scoped 'Admin' role above,
  // which only ever sees its own single business.
  { path: '/super-admin/dashboard', component: SuperAdminDashboard, meta: { requiresAuth: true, roles: ['Super Admin'] } },
  { path: '/admin/dashboard', component: AdminDashboard, meta: { requiresAuth: true, roles: ['Admin', 'Staff', 'Owner/Manager'] } },
  { path: '/admin/bookings', component: BookingManagement, meta: { requiresAuth: true, roles: ['Admin', 'Owner/Manager'] } },
  { path: '/admin/planning', component: EventPlanning, meta: { requiresAuth: true, roles: ['Admin', 'Staff', 'Owner/Manager'] } },
  { path: '/admin/packages', component: PackageManagement, meta: { requiresAuth: true, roles: ['Admin', 'Owner/Manager'] } },
  { path: '/admin/inventory', component: InventoryManagement, meta: { requiresAuth: true, roles: ['Admin', 'Owner/Manager'] } },
  { path: '/admin/waste', component: WasteTracking, meta: { requiresAuth: true, roles: ['Admin', 'Owner/Manager'] } },
  { path: '/admin/feedback', component: FeedbackRatings, meta: { requiresAuth: true, roles: ['Admin', 'Owner/Manager'] } },
  { path: '/admin/support', component: SupportChat, meta: { requiresAuth: true, roles: ['Admin', 'Staff', 'Owner/Manager'] } },
  { path: '/admin/fleet', component: FleetManagement, meta: { requiresAuth: true, roles: ['Admin', 'Owner/Manager'] } },
  { path: '/admin/payments', component: PaymentManagement, meta: { requiresAuth: true, roles: ['Admin', 'Staff', 'Owner/Manager'] } },
  { path: '/admin/branches', component: BranchManagement, meta: { requiresAuth: true, roles: ['Admin', 'Owner/Manager'] } },
  { path: '/admin/staff', component: StaffManagement, meta: { requiresAuth: true, roles: ['Admin', 'Owner/Manager'] } },
  { path: '/admin/reports', component: ReportsAnalytics, meta: { requiresAuth: true, roles: ['Admin', 'Owner/Manager'] } },
  { path: '/client/bookings', component: ClientDashboard, meta: { requiresAuth: true, roles: ['Client'] } },
  // Self-service business onboarding: only plain Client accounts can
  // register a new business (matches the guard inside register_business()
  // itself — an account already attached to a business will get a clear
  // error from that RPC rather than a confusing route bounce).
  { path: '/register-business', component: RegisterBusinessView, meta: { requiresAuth: true, roles: ['Client'] } },
  // FIXED: this was Admin-only, which meant an Owner/Manager (the role
  // register_business() actually assigns to a new business owner) or Staff
  // could never reach their own account settings. Everyone who's logged in
  // needs to be able to view/edit their own profile here.
  { path: '/settings', component: SettingsView, meta: { requiresAuth: true, roles: ['Admin', 'Staff', 'Owner/Manager', 'Client', 'Super Admin'] } },
  // 404: must stay LAST -- catches every URL that matched nothing above.
  { path: '/:pathMatch(.*)*', component: NotFoundView }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Global route guard: blocks direct-URL access to pages a role
// isn't allowed to see, not just the sidebar links.
//
// SECURITY FIX: this used to trust the `role` cached in sessionStorage,
// which is plain JSON sitting in the browser -- anyone can open DevTools
// and run `JSON.parse(sessionStorage.user)` -> edit `.role` -> save it
// back, and the guard would wave them through to pages meant for a
// higher role. sessionStorage is fine as a UI cache (avoids a flash of
// the wrong layout while the network call below is in flight) but it is
// never the source of truth for an authorization decision.
//
// The fix: every navigation to a guarded route now re-asks Supabase who
// the caller actually is. `supabase.auth.getSession()` reads the signed
// JWT (can't be forged from the browser), and the profile role/business
// status come straight from `tbl_profiles` / `tbl_business`, which are
// only readable through Postgres RLS scoped to `auth.uid()`. A tampered
// sessionStorage value can no longer get anyone past this gate -- only a
// real session + a real row in the database can.
router.beforeEach(async (to) => {
  if (!to.meta?.requiresAuth) {
    return true
  }

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    return '/'
  }

  const { data: profile, error: profileError } = await supabase
    .from('tbl_profiles')
    .select('username, full_name, role, avatar_url, business_id')
    .eq('id', session.user.id)
    .single()

  if (profileError || !profile || !profile.role) {
    await supabase.auth.signOut()
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    return '/'
  }

  // Same tenant gate as login: a suspended/pending/rejected business can't
  // keep using a session it already had open.
  if (profile.business_id) {
    const { data: business, error: businessError } = await supabase
      .from('tbl_business')
      .select('status')
      .eq('business_id', profile.business_id)
      .maybeSingle()

    // Fail CLOSED: if the business can't be verified (error, or no row visible),
    // treat it as not active instead of letting the user through.
    if (businessError || !business || business.status !== 'Active') {
      await supabase.auth.signOut()
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('user')
      return '/'
    }
  }

  // Refresh the cache with the verified role so the UI (sidebar, view
  // guards that still read sessionStorage) matches what the server just
  // confirmed, instead of whatever was sitting there before.
  const verifiedUser = {
    ...JSON.parse(sessionStorage.getItem('user') || '{}'),
    user_id: session.user.id,
    username: profile.username,
    full_name: profile.full_name,
    role: profile.role,
    business_id: profile.business_id || null,
    avatar_url: profile.avatar_url || '',
  }
  sessionStorage.setItem('user', JSON.stringify(verifiedUser))

  if (to.meta.roles && !to.meta.roles.includes(profile.role)) {
    // Send the user back to a page they do have access to instead
    // of letting them in.
    if (profile.role === 'Staff') {
      return '/admin/payments'
    } else if (profile.role === 'Client') {
      return '/client/bookings'
    } else if (profile.role === 'Super Admin') {
      return '/super-admin/dashboard'
    } else {
      return '/'
    }
  }

  return true
})

const app = createApp(App)
app.use(router)
app.mount('#app')