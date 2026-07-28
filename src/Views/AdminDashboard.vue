<template>
  <div class="min-h-screen flex bg-gray-50 font-sans">

    <!-- SIDEBAR -->
    <aside 
      :class="isSidebarOpen ? 'w-64' : 'w-20'" 
      class="bg-white border-r border-gray-200 flex flex-col transition-all duration-300 h-screen sticky top-0"
    >
      <div class="flex items-center justify-between p-4">
        <div class="flex items-center gap-2 overflow-hidden">
          <img src="/src/assets/logofinal.png" alt="Logo" class="w-8 h-8 object-contain flex-shrink-0" />
          <span v-if="isSidebarOpen" class="font-bold text-gray-800 whitespace-nowrap">Caterlytics</span>
        </div>
        <button @click="isSidebarOpen = !isSidebarOpen" class="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      <div class="px-3 mt-2">
        <button class="w-full flex items-center gap-3 px-3 py-2.5 rounded-full border border-gray-300 hover:bg-gray-50 text-sm font-medium text-gray-700 transition">
          <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          <span v-if="isSidebarOpen" class="whitespace-nowrap">New Booking</span>
        </button>
      </div>

      <nav class="flex-1 px-3 mt-6 space-y-1 overflow-y-auto">
        <p v-if="isSidebarOpen" class="text-xs font-semibold text-gray-400 px-3 mb-2 uppercase tracking-wide">Menu</p>

        <a v-for="item in navItems" :key="item.name"
          href="#"
          @click.prevent="activeSection = item.name"
          :class="activeSection === item.name ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition"
        >
          <svg class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.iconPath" />
          </svg>
          <span v-if="isSidebarOpen" class="whitespace-nowrap">{{ item.name }}</span>
        </a>
      </nav>

      <div class="border-t border-gray-200 p-3">
        <div class="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-100 cursor-pointer">
          <div class="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {{ userInitial }}
          </div>
          <div v-if="isSidebarOpen" class="overflow-hidden">
            <p class="text-sm font-semibold text-gray-800 truncate">{{ userName }}</p>
            <p class="text-xs text-gray-400 truncate">{{ userRole }}</p>
          </div>
        </div>
        <button v-if="isSidebarOpen" @click="handleLogout" class="w-full text-left text-xs text-red-500 hover:text-red-600 px-2 mt-2 font-medium">
          Log Out
        </button>
      </div>
    </aside>

    <!-- MAIN CONTENT -->
    <main class="flex-1 p-8 overflow-x-hidden">
      <div class="max-w-7xl mx-auto">

        <h1 class="text-2xl font-bold text-gray-900 mb-6">{{ activeSection }}</h1>

        <!-- ============ DASHBOARD SECTION ============ -->
        <div v-if="activeSection === 'Dashboard'">

          <!-- Summary Cards -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div class="bg-white p-6 rounded-2xl border border-gray-100">
              <h3 class="text-sm font-bold text-gray-400 uppercase tracking-wide">Total Bookings</h3>
              <p class="text-3xl font-black text-gray-900 mt-2">0</p>
            </div>
            <div class="bg-white p-6 rounded-2xl sborder border-gray-100">
              <h3 class="text-sm font-bold text-gray-400 uppercase tracking-wide">Active Events</h3>
              <p class="text-3xl font-black text-gray-900 mt-2">0</p>
            </div>
            <div class="bg-white p-6 rounded-2xl border border-gray-100">
              <h3 class="text-sm font-bold text-gray-400 uppercase tracking-wide">Low Stock Items</h3>
              <p class="text-3xl font-black text-gray-900 mt-2">0</p>
            </div>
            <div class="bg-white p-6 rounded-2xl border border-gray-100">
              <h3 class="text-sm font-bold text-gray-400 uppercase tracking-wide">Total Revenue</h3>
              <p class="text-3xl font-black text-gray-900 mt-2">₱0</p>
            </div>
          </div>

          <!-- Welcome Banner -->
          <div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-8">
            <h2 class="text-xl font-bold text-gray-800">Welcome, {{ userName }}!</h2>
            <p class="text-gray-500 mt-2">i bookings, packages, and inventor.</p>
          </div>

          <!-- Quick Actions -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <button @click="activeSection = 'Event Bookings'" class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3 hover:border-emerald-300 hover:bg-emerald-50/40 transition text-left">
              <div class="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <svg class="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <p class="font-semibold text-gray-800 text-sm">New Booking</p>
                <p class="text-xs text-gray-400">Create a reservation</p>
              </div>
            </button>

            <button @click="activeSection = 'Inventory'" class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3 hover:border-emerald-300 hover:bg-emerald-50/40 transition text-left">
              <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <svg class="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4" />
                </svg>
              </div>
              <div>
                <p class="font-semibold text-gray-800 text-sm">Add Inventory</p>
                <p class="text-xs text-gray-400">Update stock levels</p>
              </div>
            </button>

            <button @click="activeSection = 'Staff Management'" class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3 hover:border-emerald-300 hover:bg-emerald-50/40 transition text-left">
              <div class="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                <svg class="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-2.13a4 4 0 10-4-4 4 4 0 004 4z" />
                </svg>
              </div>
              <div>
                <p class="font-semibold text-gray-800 text-sm">Manage Staff</p>
                <p class="text-xs text-gray-400">Add or view users</p>
              </div>
            </button>
          </div>

          <!-- Recent Bookings -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-100">
              <h3 class="font-bold text-gray-800">Recent Bookings</h3>
            </div>
            <table class="w-full text-sm">
              <thead class="bg-gray-50 text-gray-500 uppercase text-xs tracking-wide">
                <tr>
                  <th class="text-left px-6 py-3 font-semibold">Client</th>
                  <th class="text-left px-6 py-3 font-semibold">Event Date</th>
                  <th class="text-left px-6 py-3 font-semibold">Package</th>
                  <th class="text-left px-6 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr>
                  <td colspan="4" class="text-center py-8 text-gray-400">No bookings yet.</td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>

        <!-- ============ STAFF MANAGEMENT SECTION ============ -->
        <div v-if="activeSection === 'Staff Management'">

          <div class="flex justify-between items-center mb-4">
            <p class="text-sm text-gray-500">Manage Admin, Staff, and Owner/Manager accounts.</p>
            <button @click="openAddUserModal" class="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-emerald-700 transition">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Add New User
            </button>
          </div>

          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 text-gray-500 uppercase text-xs tracking-wide">
                <tr>
                  <th class="text-left px-6 py-3 font-semibold">Full Name</th>
                  <th class="text-left px-6 py-3 font-semibold">Username</th>
                  <th class="text-left px-6 py-3 font-semibold">Role</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-if="isLoadingUsers">
                  <td colspan="3" class="text-center py-8 text-gray-400">Loading users...</td>
                </tr>
                <tr v-else-if="userList.length === 0">
                  <td colspan="3" class="text-center py-8 text-gray-400">No users found.</td>
                </tr>
                <tr v-for="u in userList" :key="u.user_id" class="hover:bg-gray-50">
                  <td class="px-6 py-3.5 font-medium text-gray-800">{{ u.full_name }}</td>
                  <td class="px-6 py-3.5 text-gray-500">{{ u.username }}</td>
                  <td class="px-6 py-3.5">
                    <span 
                      :class="{
                        'bg-purple-50 text-purple-700': u.role === 'Admin',
                        'bg-blue-50 text-blue-700': u.role === 'Staff',
                        'bg-amber-50 text-amber-700': u.role === 'Owner/Manager'
                      }"
                      class="px-2.5 py-1 rounded-full text-xs font-semibold"
                    >
                      {{ u.role }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ============ PLACEHOLDER FOR OTHER SECTIONS ============ -->
        <div v-if="!['Dashboard', 'Staff Management'].includes(activeSection)" class="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center text-gray-400">
          {{ activeSection }} page — coming soon.
        </div>

      </div>
    </main>

    <!-- ============ ADD USER MODAL ============ -->
    <div v-if="showAddUserModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h3 class="text-lg font-bold text-gray-900 mb-4">Add New User</h3>

        <div v-if="modalError" class="bg-red-50 border border-red-200 text-red-600 text-sm font-medium p-3 rounded-xl mb-4">
          {{ modalError }}
        </div>

        <form @submit.prevent="handleCreateUser" class="space-y-4">
          <div>
            <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Full Name</label>
            <input type="text" v-model="newUser.full_name" class="w-full mt-1 p-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
          </div>
          <div>
            <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Username</label>
            <input type="text" v-model="newUser.username" class="w-full mt-1 p-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
          </div>
          <div>
            <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Password</label>
            <input type="password" v-model="newUser.password" class="w-full mt-1 p-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
          </div>
          <div>
            <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Role</label>
            <select v-model="newUser.role" class="w-full mt-1 p-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" required>
              <option disabled value="">Select a role</option>
              <option value="Admin">Admin</option>
              <option value="Staff">Staff</option>
              <option value="Owner/Manager">Owner/Manager</option>
            </select>
          </div>

          <div class="flex gap-3 pt-2">
            <button type="button" @click="closeAddUserModal" class="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" :disabled="isCreating" class="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50">
              {{ isCreating ? 'Creating...' : 'Create User' }}
            </button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getUsers, createStaffUser } from '../services/staffService'

const router = useRouter()
const isSidebarOpen = ref(true)
const activeSection = ref('Dashboard')

const userName = ref('User')
const userRole = ref('Admin')
const userInitial = ref('U')

const userList = ref([])
const isLoadingUsers = ref(false)

const showAddUserModal = ref(false)
const isCreating = ref(false)
const modalError = ref('')
const newUser = ref({ full_name: '', username: '', password: '', role: '' })

onMounted(() => {
  const storedUser = localStorage.getItem('user')
  if (!storedUser) {
    router.push('/')
    return
  }

  const user = JSON.parse(storedUser)

  if (user.role !== 'Admin') {
    router.push('/')
    return
  }

  userName.value = user.full_name
  userRole.value = user.role
  userInitial.value = user.full_name.charAt(0).toUpperCase()
})

watch(activeSection, (newSection) => {
  if (newSection === 'Staff Management') {
    fetchUsers()
  }
})

async function fetchUsers() {
  isLoadingUsers.value = true
  try {
    const result = await getUsers()
    userList.value = result.users
  } catch (error) {
    console.error('Failed to fetch users:', error)
  } finally {
    isLoadingUsers.value = false
  }
}

function openAddUserModal() {
  newUser.value = { full_name: '', username: '', password: '', role: '' }
  modalError.value = ''
  showAddUserModal.value = true
}

function closeAddUserModal() {
  showAddUserModal.value = false
}

async function handleCreateUser() {
  modalError.value = ''
  isCreating.value = true

  try {
    await createStaffUser(
      newUser.value.username,
      newUser.value.password,
      newUser.value.full_name,
      newUser.value.role
    )
    showAddUserModal.value = false
    fetchUsers()
  } catch (error) {
    if (error.response && error.response.data && error.response.data.error) {
      modalError.value = error.response.data.error
    } else {
      modalError.value = 'Something went wrong. Please try again.'
    }
  } finally {
    isCreating.value = false
  }
}

const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/')
}

const navItems = ref([
  { name: 'Dashboard', iconPath: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { name: 'Event Bookings', iconPath: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { name: 'Catering Packages', iconPath: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { name: 'Inventory', iconPath: 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4' },
  { name: 'Staff Management', iconPath: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-2.13a4 4 0 10-4-4 4 4 0 004 4z' },
  { name: 'Reports', iconPath: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }
])
</script>

<style scoped>
</style>