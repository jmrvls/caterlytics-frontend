<template>
  <div class="min-h-screen flex bg-gray-50 dark:bg-gray-900 font-sans">

    <!-- MOBILE TOP BAR -->
    <div class="lg:hidden fixed top-0 inset-x-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3 px-4 py-3 print:hidden">
      <button @click="isMobileSidebarOpen = true" class="p-2 -ml-2 rounded-none text-gray-600 dark:text-gray-300">
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <div class="flex items-center gap-2 flex-1 min-w-0">
        <span class="font-bold text-gray-800 dark:text-gray-100 truncate">Caterlytics</span>
      </div>
      <NotificationBell />
    </div>

    <!-- MOBILE BACKDROP -->
    <div v-if="isMobileSidebarOpen" @click="isMobileSidebarOpen = false" class="fixed inset-0 bg-black/40 z-40 lg:hidden"></div>

    <!-- SIDEBAR -->
    <aside
      :class="[sidebarExpanded ? 'w-64' : 'w-20', isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0']"
      class="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-transform duration-300 h-screen fixed lg:sticky top-0 left-0 z-50 lg:z-auto"
    >
      <div class="flex items-center justify-between gap-2 p-4">
        <!-- COLLAPSED: logo itself is the toggle -->
        <div
          v-if="!sidebarExpanded"
          class="relative flex items-center justify-center w-8 h-8 cursor-pointer select-none rounded-none hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          @mouseenter="isLogoHovered = true"
          @mouseleave="isLogoHovered = false"
          @click="toggleSidebar"
        >
          <img v-if="!isLogoHovered" :src="logoUrl" alt="Logo" class="w-8 h-8 object-contain flex-shrink-0" />
          <svg v-else class="w-6 h-6 flex-shrink-0 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <rect x="3.5" y="4.5" width="17" height="15" rx="2" stroke-width="1.5" />
            <line x1="9.5" y1="4.5" x2="9.5" y2="19.5" stroke-width="1.5" />
          </svg>

          <div v-if="isLogoHovered" class="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-gray-900 text-white text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap shadow-lg z-[60] pointer-events-none">
            Open sidebar
          </div>
        </div>

        <!-- EXPANDED: static logo + name on the left -->
        <div v-else class="flex items-center gap-2 overflow-hidden">
          <img :src="logoUrl" alt="Logo" class="w-8 h-8 object-contain flex-shrink-0" />
          <span class="font-bold text-gray-800 dark:text-gray-100 whitespace-nowrap">Caterlytics</span>
        </div>

        <!-- EXPANDED: dedicated toggle button on the right, like Gemini's collapse icon -->
        <div v-if="sidebarExpanded" class="relative flex-shrink-0">
          <button
            type="button"
            class="w-8 h-8 flex items-center justify-center rounded-none text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            @mouseenter="isLogoHovered = true"
            @mouseleave="isLogoHovered = false"
            @click="toggleSidebar"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <rect x="3.5" y="4.5" width="17" height="15" rx="2" stroke-width="1.5" />
              <line x1="9.5" y1="4.5" x2="9.5" y2="19.5" stroke-width="1.5" />
            </svg>
          </button>

          <div v-if="isLogoHovered" class="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-gray-900 text-white text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap shadow-lg z-[60] pointer-events-none">
            Close sidebar
          </div>
        </div>
      </div>

      <nav class="flex-1 px-3 mt-6 space-y-1 overflow-y-auto">

        <a v-for="item in navItems" :key="item.name"
          href="#"
          @click.prevent="goTo(item)"
          :class="item.name === 'Staff Management' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'"
          class="flex items-center gap-3 px-3 py-2.5 rounded-none text-sm transition"
        >
          <svg class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.iconPath" />
          </svg>
          <span v-if="sidebarExpanded" class="whitespace-nowrap">{{ item.name }}</span>
        </a>
      </nav>

      <div class="border-t border-gray-200 dark:border-gray-700 p-3 relative">
        <!-- Click-outside backdrop -->
        <div v-if="showAccountMenu" @click="showAccountMenu = false" class="fixed inset-0 z-40"></div>

        <!-- Account menu (Log Out) -->
        <div v-if="showAccountMenu" class="absolute bottom-full left-2 mb-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none shadow-lg overflow-hidden z-50">
          <button v-if="userRole === 'Admin' || userRole === 'Owner/Manager'" @click="showAccountMenu = false; router.push('/settings')" class="w-full flex items-center gap-2.5 text-left px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </button>
          <button @click="handleLogout" class="w-full flex items-center gap-2.5 text-left px-4 py-2.5 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Log Out
          </button>
        </div>

        <!-- Profile: click toggles the account menu -->
        <div @click="showAccountMenu = !showAccountMenu" class="flex items-center gap-3 px-2 py-2 rounded-none hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
          <div class="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden">
            <img v-if="userAvatarUrl" :src="userAvatarUrl" alt="Profile picture" class="w-full h-full object-cover" />
            <span v-else>{{ userInitial }}</span>
          </div>
          <div v-if="sidebarExpanded" class="overflow-hidden">
            <p class="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{{ userName }}</p>
            <p class="text-xs text-gray-400 dark:text-gray-500 truncate">{{ userRole }}</p>
          </div>
        </div>
      </div>
    </aside>

    <!-- MAIN CONTENT -->
    <main class="flex-1 p-4 sm:p-8 pt-20 lg:pt-8 overflow-x-hidden w-full min-w-0">
      <div class="max-w-none 2xl:max-w-[1920px] mx-auto">

        <div class="flex flex-col gap-3 mb-4">
          <!-- Row 1: Search + Add New User side by side, button on the right -->
          <div class="flex items-center gap-2">
            <div class="relative flex-1 max-w-sm">
              <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                v-model="staffSearchQuery"
                placeholder="Search by name, username, or contact..."
                class="w-full pl-9 pr-3 py-2.5 text-sm bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div class="flex items-center gap-3 flex-shrink-0 ml-auto">
              <div class="hidden lg:block">
                <NotificationBell />
              </div>
              <button v-if="userRole === 'Admin'" @click="openAddUserModal" class="flex items-center justify-center gap-2 bg-emerald-600 text-white px-3 py-2.5 sm:px-4 rounded-none font-semibold text-sm hover:bg-emerald-700 transition whitespace-nowrap min-w-[172px]">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Add New User
              </button>
            </div>
          </div>

          <!-- Row 2: Filters -->
          <div class="flex flex-row gap-2">
            <select v-model="staffRoleFilter" class="flex-1 min-w-0 sm:flex-none sm:w-44 py-2 px-3 text-sm bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 dark:text-gray-100">
              <option value="">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="Staff">Staff</option>
              <option value="Owner/Manager">Owner/Manager</option>
            </select>
            <select v-model="staffAvailabilityFilter" class="flex-1 min-w-0 sm:flex-none sm:w-44 py-2 px-3 text-sm bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 dark:text-gray-100">
              <option value="">All Availability</option>
              <option value="Available">Available</option>
              <option value="On Leave">On Leave</option>
              <option value="Unavailable">Unavailable</option>
            </select>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-none shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">

          <!-- Mobile card list -->
          <div class="sm:hidden divide-y divide-gray-100 dark:divide-gray-700">
            <div v-if="isLoadingUsers" class="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">Loading users...</div>
            <div v-else-if="filteredUserList.length === 0" class="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">No users found.</div>
            <div v-for="u in filteredUserList" :key="u.id" class="px-3 py-3">
              <div class="flex items-center gap-2.5 mb-2.5">
                <div class="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xs overflow-hidden shrink-0">
                  <img v-if="u.avatar_url" :src="u.avatar_url" alt="" class="w-full h-full object-cover" />
                  <span v-else>{{ u.full_name.charAt(0).toUpperCase() }}</span>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="font-semibold text-sm text-gray-800 dark:text-gray-100 truncate">{{ u.full_name }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ u.username }} · {{ u.contact_number || 'No contact number' }}</p>
                </div>
              </div>

              <div class="flex items-center gap-1.5 mb-2.5">
                <span
                  :class="{ 'text-purple-700 dark:text-purple-300': u.role === 'Admin', 'text-blue-700 dark:text-blue-300': u.role === 'Staff', 'text-amber-700 dark:text-amber-300': u.role === 'Owner/Manager' }"
                  class="px-2 py-0.5 rounded-full text-[11px] font-semibold"
                >
                  {{ u.role }}
                </span>
                <span
                  :class="{ 'text-emerald-700 dark:text-emerald-300': u.availability === 'Available', 'text-amber-700 dark:text-amber-300': u.availability === 'On Leave', 'text-red-700 dark:text-red-300': u.availability === 'Unavailable' }"
                  class="px-2 py-0.5 rounded-full text-[11px] font-semibold"
                >
                  {{ u.availability }}
                </span>
                <span v-if="u.position" class="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                  {{ u.position }}
                </span>
              </div>

              <div v-if="userRole === 'Admin'" class="flex items-center gap-2">
                <button @click="openEditUserModal(u)" class="flex-1 py-2 rounded-none text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 active:bg-emerald-100 dark:active:bg-emerald-900/40">
                  Edit
                </button>
                <button
                  v-if="u.role === 'Staff'"
                  @click="openScheduleModal(u)"
                  class="flex-1 py-2 rounded-none text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/30 active:bg-purple-100 dark:active:bg-purple-900/40"
                >
                  Schedule
                </button>
                <button
                  v-if="u.id !== currentUserId"
                  @click="confirmDeleteUser(u)"
                  class="flex-1 py-2 text-xs font-semibold text-red-600 dark:text-red-400 active:bg-red-100 dark:active:bg-red-900/40"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>

          <!-- Desktop / tablet table -->
          <div class="hidden sm:block overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wide">
                <tr>
                  <th class="text-left px-6 py-3 font-semibold"></th>
                  <th class="text-left px-6 py-3 font-semibold">Full Name</th>
                  <th class="text-left px-6 py-3 font-semibold">Username</th>
                  <th class="text-left px-6 py-3 font-semibold">Contact Number</th>
                  <th class="text-left px-6 py-3 font-semibold">Role</th>
                  <th class="text-left px-6 py-3 font-semibold">Position</th>
                  <th class="text-left px-6 py-3 font-semibold">Availability</th>
                  <th class="text-right px-6 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                <tr v-if="isLoadingUsers">
                  <td colspan="8" class="text-center py-8 text-gray-400 dark:text-gray-500">Loading users...</td>
                </tr>
                <tr v-else-if="filteredUserList.length === 0">
                  <td colspan="8" class="text-center py-8 text-gray-400 dark:text-gray-500">No users found.</td>
                </tr>
                <tr v-for="u in filteredUserList" :key="u.id" class="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td class="px-6 py-3.5">
                    <div class="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xs overflow-hidden">
                      <img v-if="u.avatar_url" :src="u.avatar_url" alt="" class="w-full h-full object-cover" />
                      <span v-else>{{ u.full_name.charAt(0).toUpperCase() }}</span>
                    </div>
                  </td>
                  <td class="px-6 py-3.5 font-medium text-gray-800 dark:text-gray-100">{{ u.full_name }}</td>
                  <td class="px-6 py-3.5 text-gray-500 dark:text-gray-400">{{ u.username }}</td>
                  <td class="px-6 py-3.5 text-gray-500 dark:text-gray-400">{{ u.contact_number || '—' }}</td>
                  <td class="px-6 py-3.5 align-middle">
                    <span
                      :class="{ 'text-purple-700 dark:text-purple-300': u.role === 'Admin', 'text-blue-700 dark:text-blue-300': u.role === 'Staff', 'text-amber-700 dark:text-amber-300': u.role === 'Owner/Manager' }"
                      class="inline-block align-middle text-xs font-semibold leading-5"
                    >
                      {{ u.role }}
                    </span>
                  </td>
                  <td class="px-6 py-3.5 text-gray-500 dark:text-gray-400">{{ u.position || '—' }}</td>
                  <td class="px-6 py-3.5 align-middle">
                    <span
                      :class="{ 'text-emerald-700 dark:text-emerald-300': u.availability === 'Available', 'text-amber-700 dark:text-amber-300': u.availability === 'On Leave', 'text-red-700 dark:text-red-300': u.availability === 'Unavailable' }"
                      class="inline-block align-middle text-xs font-semibold leading-5"
                    >
                      {{ u.availability }}
                    </span>
                  </td>
                  <td class="px-6 py-3.5 text-right">
                    <div v-if="userRole === 'Admin'" class="flex items-center justify-end gap-3">
                      <button @click="openEditUserModal(u)" class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
                        Edit
                      </button>
                      <button
                        v-if="u.role === 'Staff'"
                        @click="openScheduleModal(u)"
                        class="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                      >
                        Schedule
                      </button>
                      <button
                        v-if="u.id !== currentUserId"
                        @click="confirmDeleteUser(u)"
                        class="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                    <span v-else class="text-xs text-gray-300 dark:text-gray-600">—</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </main>

    <!-- ============ ADD USER MODAL ============ -->
    <div v-if="showAddUserModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-gray-800 rounded-none shadow-xl w-full max-w-md p-6">
        <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Add New User</h3>

        <div v-if="modalError" class="text-red-600 dark:text-red-400 text-sm font-medium mb-4">
          {{ modalError }}
        </div>

        <form @submit.prevent="handleCreateUser" class="space-y-5">
          <div class="relative">
            <label class="absolute -top-2.5 left-3 bg-white dark:bg-gray-800 px-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Full Name</label>
            <input type="text" v-model="newUser.full_name" class="w-full p-3 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 dark:text-gray-100" required />
          </div>

          <div class="relative">
            <label class="absolute -top-2.5 left-3 bg-white dark:bg-gray-800 px-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Username</label>
            <input type="text" v-model="newUser.username" class="w-full p-3 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 dark:text-gray-100" required />
          </div>

          <div class="relative">
            <label class="absolute -top-2.5 left-3 bg-white dark:bg-gray-800 px-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Email</label>
            <input type="email" v-model="newUser.email" placeholder="their.email@gmail.com" class="w-full p-3 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 dark:text-gray-100" required />
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">An invitation email will be sent to this address so they can set their own password.</p>
          </div>

          <div class="relative">
            <label class="absolute -top-2.5 left-3 bg-white dark:bg-gray-800 px-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Contact Number</label>
            <input type="text" v-model="newUser.contact_number" placeholder="e.g. 0917 123 4567" class="w-full p-3 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 dark:text-gray-100" />
          </div>

          <div class="relative">
            <label class="absolute -top-2.5 left-3 bg-white dark:bg-gray-800 px-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Role</label>
            <select v-model="newUser.role" class="w-full p-3 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 dark:text-gray-100" required>
              <option disabled value="">Select a role</option>
              <option value="Admin">Admin</option>
              <option value="Staff">Staff</option>
              <option value="Owner/Manager">Owner/Manager</option>
            </select>
          </div>

          <div v-if="newUser.role === 'Staff'" class="relative">
            <label class="absolute -top-2.5 left-3 bg-white dark:bg-gray-800 px-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Position</label>
            <select v-model="newUser.position" class="w-full p-3 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 dark:text-gray-100">
              <option value="">No position set</option>
              <option value="Cook">Cook</option>
              <option value="Server">Server</option>
              <option value="Driver">Driver</option>
              <option value="Coordinator">Coordinator</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div class="relative">
            <label class="absolute -top-2.5 left-3 bg-white dark:bg-gray-800 px-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Availability</label>
            <select v-model="newUser.availability" class="w-full p-3 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 dark:text-gray-100" required>
              <option value="Available">Available</option>
              <option value="On Leave">On Leave</option>
              <option value="Unavailable">Unavailable</option>
            </select>
          </div>

          <div class="flex gap-3 pt-2">
            <button type="button" @click="closeAddUserModal" class="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2.5 rounded-none font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
              Cancel
            </button>
            <button type="submit" :disabled="isCreating" class="flex-1 bg-emerald-600 text-white py-2.5 rounded-none font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50">
              {{ isCreating ? 'Creating...' : 'Create User' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ============ EDIT USER MODAL ============ -->
    <div v-if="showEditUserModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-gray-800 rounded-none shadow-xl w-full max-w-md p-6">
        <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Edit Staff Member</h3>

        <div v-if="editModalError" class="text-red-600 dark:text-red-400 text-sm font-medium mb-4">
          {{ editModalError }}
        </div>

        <form @submit.prevent="handleUpdateUser" class="space-y-5">
          <div class="relative">
            <label class="absolute -top-2.5 left-3 bg-white dark:bg-gray-800 px-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Full Name</label>
            <input type="text" v-model="editUser.full_name" class="w-full p-3 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 dark:text-gray-100" required />
          </div>

          <div class="relative">
            <label class="absolute -top-2.5 left-3 bg-white dark:bg-gray-800 px-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Username</label>
            <input type="text" :value="editUser.username" disabled class="w-full p-3 bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-none text-gray-500 dark:text-gray-400" />
          </div>

          <div class="relative">
            <label class="absolute -top-2.5 left-3 bg-white dark:bg-gray-800 px-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Contact Number</label>
            <input type="text" v-model="editUser.contact_number" placeholder="e.g. 0917 123 4567" class="w-full p-3 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 dark:text-gray-100" />
          </div>

          <div class="relative">
            <label class="absolute -top-2.5 left-3 bg-white dark:bg-gray-800 px-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Role</label>
            <select v-model="editUser.role" class="w-full p-3 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 dark:text-gray-100" required>
              <option value="Admin">Admin</option>
              <option value="Staff">Staff</option>
              <option value="Owner/Manager">Owner/Manager</option>
            </select>
          </div>

          <div v-if="editUser.role === 'Staff'" class="relative">
            <label class="absolute -top-2.5 left-3 bg-white dark:bg-gray-800 px-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Position</label>
            <select v-model="editUser.position" class="w-full p-3 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 dark:text-gray-100">
              <option value="">No position set</option>
              <option value="Cook">Cook</option>
              <option value="Server">Server</option>
              <option value="Driver">Driver</option>
              <option value="Coordinator">Coordinator</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div class="relative">
            <label class="absolute -top-2.5 left-3 bg-white dark:bg-gray-800 px-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Availability</label>
            <select v-model="editUser.availability" class="w-full p-3 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 dark:text-gray-100" required>
              <option value="Available">Available</option>
              <option value="On Leave">On Leave</option>
              <option value="Unavailable">Unavailable</option>
            </select>
          </div>

          <div class="flex gap-3 pt-2">
            <button type="button" @click="closeEditUserModal" class="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2.5 rounded-none font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
              Cancel
            </button>
            <button type="submit" :disabled="isSavingEdit" class="flex-1 bg-emerald-600 text-white py-2.5 rounded-none font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50">
              {{ isSavingEdit ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ============ DELETE USER CONFIRM MODAL ============ -->
    <div v-if="userToDelete" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-gray-800 rounded-none shadow-xl w-full max-w-sm p-6">
        <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Delete Account?</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-5">
          This will permanently delete the account for
          <span class="font-semibold text-gray-700 dark:text-gray-200">{{ userToDelete.full_name }}</span>
          ({{ userToDelete.role }}). This cannot be undone.
        </p>
        <div v-if="deleteUserError" class="text-red-600 dark:text-red-400 text-sm font-medium mb-4">
          {{ deleteUserError }}
        </div>
        <div class="flex gap-3">
          <button @click="userToDelete = null" class="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2.5 rounded-none font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
            Cancel
          </button>
          <button @click="handleDeleteUser" :disabled="isDeletingUser" class="flex-1 bg-red-600 text-white py-2.5 rounded-none font-semibold text-sm hover:bg-red-700 disabled:opacity-50">
            {{ isDeletingUser ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ============ STAFF SCHEDULE MODAL (per-date unavailability) ============ -->
    <div v-if="scheduleModalUser" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-gray-800 rounded-none shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">{{ scheduleModalUser.full_name }}'s Schedule</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Mark specific dates this staff member is unavailable (leave, time off, etc). Booking-time assignment checks use this list.</p>

        <div v-if="scheduleError" class="text-red-600 dark:text-red-400 text-sm font-medium mb-4">
          {{ scheduleError }}
        </div>

        <form @submit.prevent="handleAddLeaveDate" class="flex gap-2 mb-4">
          <input type="date" v-model="newLeaveDate" :min="todayStr" required class="flex-1 p-2.5 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-none text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-gray-100" />
          <input type="text" v-model="newLeaveReason" placeholder="Reason (optional)" class="flex-1 p-2.5 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-none text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-gray-100" />
          <button type="submit" :disabled="isSavingLeave" class="px-4 py-2.5 bg-emerald-600 text-white rounded-none font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50">
            Add
          </button>
        </form>

        <div v-if="isLoadingSchedule" class="text-center py-6 text-gray-400 dark:text-gray-500 text-sm">Loading...</div>
        <div v-else-if="scheduleDates.length === 0" class="text-center py-6 text-gray-400 dark:text-gray-500 text-sm">
          No unavailable dates marked yet.
        </div>
        <div v-else class="divide-y divide-gray-100 dark:divide-gray-700 border border-gray-100 dark:border-gray-700 rounded-none">
          <div v-for="d in scheduleDates" :key="d.id" class="flex items-center justify-between px-4 py-2.5">
            <div>
              <p class="text-sm font-medium text-gray-800 dark:text-gray-100">{{ formatDate(d.unavailable_date) }}</p>
              <p v-if="d.reason" class="text-xs text-gray-500 dark:text-gray-400">{{ d.reason }}</p>
            </div>
            <button @click="handleRemoveLeaveDate(d.id)" class="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline">
              Remove
            </button>
          </div>
        </div>

        <div class="flex gap-3 pt-4">
          <button type="button" @click="closeScheduleModal" class="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2.5 rounded-none font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
            Close
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import logoUrl from '../Assets/logofinal.png'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import NotificationBell from '../Components/NotificationBell.vue'
import { useSidebarState } from '../composables/useSidebarState'
import { getUsers, createStaffUser, updateStaffUser, deleteStaffUser } from '../services/staffService'
import {
  getUnavailableDates,
  addUnavailableDate,
  removeUnavailableDate
} from '../services/staffassignmentservice'

const router = useRouter()
const { isSidebarOpen, isMobileSidebarOpen, sidebarExpanded } = useSidebarState()
const isLogoHovered = ref(false)

function toggleSidebar() {
  isSidebarOpen.value = !isSidebarOpen.value
  isLogoHovered.value = false
}
const showAccountMenu = ref(false)

const userName = ref('User')
const userRole = ref('Admin')
const userInitial = ref('U')
const userAvatarUrl = ref('')
const currentUserId = ref('')

const userList = ref([])
const staffSearchQuery = ref('')
const staffRoleFilter = ref('')
const staffAvailabilityFilter = ref('')

const filteredUserList = computed(() => {
  const q = staffSearchQuery.value.trim().toLowerCase()
  return userList.value.filter((u) => {
    const matchesQuery = !q ||
      u.full_name?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q) ||
      u.contact_number?.toLowerCase().includes(q)
    const matchesRole = !staffRoleFilter.value || u.role === staffRoleFilter.value
    const matchesAvailability = !staffAvailabilityFilter.value || u.availability === staffAvailabilityFilter.value
    return matchesQuery && matchesRole && matchesAvailability
  })
})
const isLoadingUsers = ref(false)

const showAddUserModal = ref(false)
const isCreating = ref(false)
const modalError = ref('')
const newUser = ref({ full_name: '', username: '', email: '', role: '', contact_number: '', availability: 'Available', position: '' })

const showEditUserModal = ref(false)
const isSavingEdit = ref(false)
const editModalError = ref('')
const editUser = ref({ id: '', full_name: '', username: '', role: '', contact_number: '', availability: 'Available', position: '' })

const userToDelete = ref(null)
const isDeletingUser = ref(false)
const deleteUserError = ref('')

// ---------- Staff schedule (per-date unavailability) ----------
const scheduleModalUser = ref(null)
const scheduleDates = ref([])
const isLoadingSchedule = ref(false)
const scheduleError = ref('')
const newLeaveDate = ref('')
const newLeaveReason = ref('')
const isSavingLeave = ref(false)
const todayStr = new Date().toISOString().split('T')[0]

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric'
  })
}

onMounted(() => {
  const storedUser = sessionStorage.getItem('user')
  if (!storedUser) {
    router.push('/')
    return
  }
  const user = JSON.parse(storedUser)

  // Per the manuscript's Use Case Diagram, only Admin and Owner/Manager
  // manage staff -- Staff themselves don't get this page.
  if (!['Admin', 'Owner/Manager'].includes(user.role)) {
    router.push('/admin/dashboard')
    return
  }

  userName.value = user.full_name
  userRole.value = user.role
  userInitial.value = user.full_name.charAt(0).toUpperCase()
  userAvatarUrl.value = user.avatar_url || ''
  currentUserId.value = user.user_id

  fetchUsers()
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
  newUser.value = { full_name: '', username: '', email: '', role: '', contact_number: '', availability: 'Available', position: '' }
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
      newUser.value.email,
      newUser.value.full_name,
      newUser.value.role,
      newUser.value.contact_number,
      newUser.value.availability,
      newUser.value.role === 'Staff' ? newUser.value.position : null
    )
    showAddUserModal.value = false
    fetchUsers()
  } catch (error) {
    modalError.value = error.message || 'Something went wrong. Please try again.'
  } finally {
    isCreating.value = false
  }
}

function openEditUserModal(user) {
  editUser.value = {
    id: user.id,
    full_name: user.full_name,
    username: user.username,
    role: user.role,
    contact_number: user.contact_number || '',
    availability: user.availability || 'Available',
    position: user.position || ''
  }
  editModalError.value = ''
  showEditUserModal.value = true
}

function closeEditUserModal() {
  showEditUserModal.value = false
}

async function handleUpdateUser() {
  editModalError.value = ''
  isSavingEdit.value = true

  try {
    await updateStaffUser(editUser.value.id, {
      full_name: editUser.value.full_name,
      role: editUser.value.role,
      contact_number: editUser.value.contact_number,
      availability: editUser.value.availability,
      position: editUser.value.role === 'Staff' ? editUser.value.position : null
    })
    showEditUserModal.value = false
    fetchUsers()
  } catch (error) {
    editModalError.value = error.message || 'Something went wrong. Please try again.'
  } finally {
    isSavingEdit.value = false
  }
}

function confirmDeleteUser(user) {
  userToDelete.value = user
  deleteUserError.value = ''
}

async function handleDeleteUser() {
  if (!userToDelete.value) return
  deleteUserError.value = ''
  isDeletingUser.value = true
  try {
    await deleteStaffUser(userToDelete.value.id)
    userList.value = userList.value.filter((u) => u.id !== userToDelete.value.id)
    userToDelete.value = null
  } catch (error) {
    deleteUserError.value = error.message || 'Failed to delete account. Please try again.'
  } finally {
    isDeletingUser.value = false
  }
}

async function openScheduleModal(user) {
  scheduleModalUser.value = user
  scheduleError.value = ''
  newLeaveDate.value = ''
  newLeaveReason.value = ''
  await loadSchedule()
}

function closeScheduleModal() {
  scheduleModalUser.value = null
  scheduleDates.value = []
}

async function loadSchedule() {
  if (!scheduleModalUser.value) return
  isLoadingSchedule.value = true
  try {
    scheduleDates.value = await getUnavailableDates(scheduleModalUser.value.id)
  } catch (error) {
    scheduleError.value = error?.message || 'Failed to load schedule.'
  } finally {
    isLoadingSchedule.value = false
  }
}

async function handleAddLeaveDate() {
  if (!scheduleModalUser.value || !newLeaveDate.value) return
  scheduleError.value = ''
  isSavingLeave.value = true
  try {
    await addUnavailableDate(scheduleModalUser.value.id, newLeaveDate.value, newLeaveReason.value || null)
    newLeaveDate.value = ''
    newLeaveReason.value = ''
    await loadSchedule()
  } catch (error) {
    scheduleError.value = error?.message || 'Failed to add date.'
  } finally {
    isSavingLeave.value = false
  }
}

async function handleRemoveLeaveDate(id) {
  scheduleError.value = ''
  try {
    await removeUnavailableDate(id)
    scheduleDates.value = scheduleDates.value.filter((d) => d.id !== id)
  } catch (error) {
    scheduleError.value = error?.message || 'Failed to remove date.'
  }
}

function goTo(item) {
  isMobileSidebarOpen.value = false
  router.push(item.path)
}

const handleLogout = () => {
  sessionStorage.removeItem('token')
  sessionStorage.removeItem('user')
  router.push('/')
}

const navItems = [
  { name: 'Dashboard', path: '/admin/dashboard', iconPath: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { name: 'Event Bookings', path: '/admin/bookings', iconPath: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { name: 'Catering Packages', path: '/admin/packages', iconPath: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { name: 'Inventory', path: '/admin/inventory', iconPath: 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4' },
  { name: 'Payment Records', path: '/admin/payments', iconPath: 'M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0018.75 4.5H5.25A2.25 2.25 0 003 6.75v10.5A2.25 2.25 0 005.25 19.5z' },
  { name: 'Staff Management', path: '/admin/staff', iconPath: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-2.13a4 4 0 10-4-4 4 4 0 004 4z' },
  { name: 'Reports', path: '/admin/reports', iconPath: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }
]
</script>

<style scoped>
</style>