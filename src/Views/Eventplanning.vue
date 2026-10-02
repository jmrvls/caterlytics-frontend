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
      class="print:hidden bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-transform duration-300 h-screen fixed lg:sticky top-0 left-0 z-50 lg:z-auto"
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
          :class="item.name === 'Event Planning' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'"
          class="relative flex items-center gap-3 px-3 py-2.5 rounded-none text-sm transition"
        >
          <svg class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.iconPath" />
          </svg>
          <span v-if="sidebarExpanded" class="whitespace-nowrap">{{ item.name }}</span>
          <span
            v-if="item.name === 'Support Chat' && chatUnread"
            :class="sidebarExpanded ? 'ml-auto min-w-[20px] h-5 px-1.5' : 'absolute top-1 right-1 min-w-[16px] h-4 px-1'"
            class="rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center shadow"
          >{{ chatUnread > 99 ? '99+' : chatUnread }}</span>
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

        <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5 print:hidden">
          <div>
            <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100">Event Planning</h1>
            <p class="text-sm text-gray-500 dark:text-gray-400">Guest list, seating arrangement, and dietary needs per event.</p>
          </div>
          <div class="w-full sm:w-96">
            <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Event</label>
            <select v-model="selectedBookingId" class="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm rounded-none">
              <option value="" disabled>Select an upcoming event…</option>
              <option v-for="b in bookings" :key="b.booking_id" :value="b.booking_id">
                {{ formatDateOnly(b.event_date) }} — {{ b.client_name }} ({{ b.guest_count }} guests, {{ b.booking_status }})
              </option>
            </select>
          </div>
        </div>

        <p v-if="pageError" class="mb-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 print:hidden">{{ pageError }}</p>

        <div v-if="isLoadingBookings" class="text-sm text-gray-500 dark:text-gray-400">Loading events…</div>
        <div v-else-if="bookings.length === 0" class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-8 text-center text-sm text-gray-500 dark:text-gray-400">
          No upcoming Pending or Confirmed events to plan yet.
        </div>
        <div v-else-if="!selectedBooking" class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-8 text-center text-sm text-gray-500 dark:text-gray-400">
          Pick an event above to manage its guests and seating.
        </div>

        <template v-else>
          <!-- Event summary strip -->
          <div class="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
            <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3">
              <p class="text-xs text-gray-500 dark:text-gray-400">Client</p>
              <p class="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{{ selectedBooking.client_name }}</p>
            </div>
            <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3">
              <p class="text-xs text-gray-500 dark:text-gray-400">Date &amp; place</p>
              <p class="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{{ formatDateOnly(selectedBooking.event_date) }} · {{ selectedBooking.event_location || '—' }}</p>
            </div>
            <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3">
              <p class="text-xs text-gray-500 dark:text-gray-400">Booked guests</p>
              <p class="text-lg font-bold text-gray-900 dark:text-gray-100">{{ selectedBooking.guest_count }}</p>
            </div>
            <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3">
              <p class="text-xs text-gray-500 dark:text-gray-400">Attending / Pending / Declined</p>
              <p class="text-lg font-bold text-gray-900 dark:text-gray-100">{{ rsvp.Attending }} / {{ rsvp.Pending }} / {{ rsvp.Declined }}</p>
            </div>
            <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 col-span-2 lg:col-span-1">
              <p class="text-xs text-gray-500 dark:text-gray-400">Seated</p>
              <p class="text-lg font-bold text-gray-900 dark:text-gray-100">{{ seatedCount }} / {{ activeGuests.length }}</p>
            </div>
          </div>

          <p v-if="overBooked" class="mb-4 text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-2 print:hidden">
            The guest list ({{ activeGuests.length }}) is more than the {{ selectedBooking.guest_count }} guests booked. Update the booking so the per-head cost and stock match.
          </p>

          <!-- Tabs -->
          <div class="flex gap-1 border-b border-gray-200 dark:border-gray-700 mb-5 print:hidden">
            <button v-for="t in tabs" :key="t" @click="activeTab = t"
              :class="activeTab === t ? 'border-emerald-600 text-emerald-700 dark:text-emerald-300 font-semibold' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'"
              class="px-4 py-2 text-sm border-b-2 -mb-px transition">{{ t }}</button>
          </div>

          <div v-if="isLoadingPlan" class="text-sm text-gray-500 dark:text-gray-400">Loading…</div>

          <!-- ============ GUEST LIST ============ -->
          <section v-else-if="activeTab === 'Guest List'">
            <div class="flex flex-col sm:flex-row gap-2 sm:items-center justify-between mb-3">
              <div class="flex gap-2 flex-1">
                <input v-model="guestSearch" type="text" placeholder="Search guest…" class="flex-1 max-w-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm rounded-none" />
                <select v-model="rsvpFilter" class="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm rounded-none">
                  <option value="All">All RSVP</option>
                  <option v-for="r in RSVP_OPTIONS" :key="r" :value="r">{{ r }}</option>
                </select>
              </div>
              <div class="flex gap-2">
                <button @click="showImport = true" class="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-none">Paste list</button>
                <button @click="openGuestForm()" class="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-none">Add guest</button>
              </div>
            </div>

            <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-x-auto">
              <table class="min-w-full text-sm">
                <thead class="bg-gray-50 dark:bg-gray-900/40 text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                  <tr>
                    <th class="px-3 py-2">Name</th>
                    <th class="px-3 py-2">Contact</th>
                    <th class="px-3 py-2">RSVP</th>
                    <th class="px-3 py-2">Table</th>
                    <th class="px-3 py-2">Dietary</th>
                    <th class="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                  <tr v-if="filteredGuests.length === 0">
                    <td colspan="6" class="px-3 py-6 text-center text-gray-500 dark:text-gray-400">No guests yet.</td>
                  </tr>
                  <tr v-for="g in filteredGuests" :key="g.guest_id" class="text-gray-800 dark:text-gray-200">
                    <td class="px-3 py-2 font-medium">{{ g.full_name }}</td>
                    <td class="px-3 py-2 text-gray-500 dark:text-gray-400">{{ g.contact_number || g.email || '—' }}</td>
                    <td class="px-3 py-2">
                      <select :value="g.rsvp_status" @change="changeRsvp(g, $event.target.value)" class="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-xs rounded-none">
                        <option v-for="r in RSVP_OPTIONS" :key="r" :value="r">{{ r }}</option>
                      </select>
                    </td>
                    <td class="px-3 py-2">{{ tableLabel(g.table_id) }}</td>
                    <td class="px-3 py-2">
                      <div class="flex flex-wrap gap-1">
                        <span v-for="d in g.dietary_preferences" :key="d" class="text-xs px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">{{ d }}</span>
                        <span v-if="g.allergies" class="text-xs px-1.5 py-0.5 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300">Allergy: {{ g.allergies }}</span>
                        <span v-if="!g.dietary_preferences.length && !g.allergies" class="text-gray-400">—</span>
                      </div>
                    </td>
                    <td class="px-3 py-2 whitespace-nowrap text-right">
                      <button @click="openGuestForm(g)" class="text-xs text-emerald-700 dark:text-emerald-300 hover:underline mr-3">Edit</button>
                      <button @click="removeGuest(g)" class="text-xs text-red-600 dark:text-red-400 hover:underline">Remove</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <!-- ============ SEATING ============ -->
          <section v-else-if="activeTab === 'Seating'">
            <div class="flex flex-wrap gap-2 items-end mb-4">
              <div>
                <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Table name</label>
                <input v-model="newTableLabel" type="text" placeholder="e.g. Table 1 / Head Table" class="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm rounded-none" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Seats</label>
                <input v-model.number="newTableCapacity" type="number" min="1" max="50" class="w-24 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm rounded-none" />
              </div>
              <button @click="createTable" class="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-none">Add table</button>
              <button @click="autoFillTables" :disabled="tables.length === 0 || unseatedGuests.length === 0" class="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-none disabled:opacity-40">Auto-seat the rest</button>
            </div>

            <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <div class="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3 content-start">
                <p v-if="tables.length === 0" class="text-sm text-gray-500 dark:text-gray-400 md:col-span-2">No tables yet. Add one above.</p>
                <div v-for="t in tables" :key="t.table_id" class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3">
                  <div class="flex items-center justify-between gap-2 mb-1">
                    <p class="font-semibold text-gray-900 dark:text-gray-100 truncate">{{ t.label }}</p>
                    <div class="flex gap-3 text-xs">
                      <button @click="editTable(t)" class="text-emerald-700 dark:text-emerald-300 hover:underline">Edit</button>
                      <button @click="removeTable(t)" class="text-red-600 dark:text-red-400 hover:underline">Delete</button>
                    </div>
                  </div>
                  <p class="text-xs mb-2" :class="seatedAt(t.table_id).length >= t.capacity ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500 dark:text-gray-400'">
                    {{ seatedAt(t.table_id).length }} / {{ t.capacity }} seats
                  </p>
                  <div class="h-1.5 bg-gray-100 dark:bg-gray-700 mb-2">
                    <div class="h-full bg-emerald-600" :style="{ width: Math.min(100, (seatedAt(t.table_id).length / t.capacity) * 100) + '%' }"></div>
                  </div>
                  <ul class="space-y-1">
                    <li v-for="g in seatedAt(t.table_id)" :key="g.guest_id" class="flex items-center justify-between text-sm text-gray-800 dark:text-gray-200">
                      <span class="truncate">{{ g.full_name }}
                        <span v-if="g.dietary_preferences.length || g.allergies" class="text-xs text-amber-600 dark:text-amber-400">•</span>
                      </span>
                      <button @click="moveGuest(g, null)" class="text-xs text-gray-400 hover:text-red-500">Unseat</button>
                    </li>
                    <li v-if="seatedAt(t.table_id).length === 0" class="text-xs text-gray-400">Empty</li>
                  </ul>
                </div>
              </div>

              <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 h-fit">
                <p class="font-semibold text-gray-900 dark:text-gray-100 mb-2">Not yet seated ({{ unseatedGuests.length }})</p>
                <ul class="space-y-2">
                  <li v-for="g in unseatedGuests" :key="g.guest_id" class="flex items-center justify-between gap-2 text-sm text-gray-800 dark:text-gray-200">
                    <span class="truncate">{{ g.full_name }}</span>
                    <select @change="moveGuest(g, $event.target.value || null); $event.target.value = ''" class="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-xs rounded-none max-w-[9rem]">
                      <option value="">Seat at…</option>
                      <option v-for="t in tables" :key="t.table_id" :value="t.table_id" :disabled="seatedAt(t.table_id).length >= t.capacity">{{ t.label }}</option>
                    </select>
                  </li>
                  <li v-if="unseatedGuests.length === 0" class="text-xs text-gray-400">Everyone attending is seated.</li>
                </ul>
                <p class="text-xs text-gray-400 mt-3">Declined guests are not counted for seats.</p>
              </div>
            </div>
          </section>

          <!-- ============ DIETARY ============ -->
          <section v-else-if="activeTab === 'Dietary'">
            <div class="flex items-center justify-between mb-3 print:hidden">
              <p class="text-sm text-gray-500 dark:text-gray-400">Counts exclude guests who declined, so this is what the kitchen prepares for.</p>
              <button @click="printSummary" class="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-none">Print</button>
            </div>

            <div class="hidden print:block mb-3">
              <p class="text-lg font-bold">{{ selectedBooking.client_name }} — {{ formatDateOnly(selectedBooking.event_date) }}</p>
              <p class="text-sm">{{ selectedBooking.event_location }}</p>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3">
                <p class="text-xs text-gray-500 dark:text-gray-400">Guests to serve</p>
                <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ dietary.total }}</p>
              </div>
              <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3">
                <p class="text-xs text-gray-500 dark:text-gray-400">With restrictions / allergies</p>
                <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ dietary.withRestrictions }}</p>
              </div>
              <div v-for="tag in topTags" :key="tag" class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3">
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ tag }}</p>
                <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ dietary.counts[tag] }}</p>
              </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3">
                <p class="font-semibold text-gray-900 dark:text-gray-100 mb-2">All tags</p>
                <ul class="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                  <li v-for="tag in DIETARY_OPTIONS" :key="tag" class="flex justify-between py-1.5 text-gray-800 dark:text-gray-200">
                    <span>{{ tag }}</span><span class="font-semibold">{{ dietary.counts[tag] }}</span>
                  </li>
                </ul>
              </div>
              <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3">
                <p class="font-semibold text-gray-900 dark:text-gray-100 mb-2">Allergies to flag to the kitchen</p>
                <ul class="space-y-2 text-sm">
                  <li v-for="g in dietary.withAllergies" :key="g.guest_id" class="text-gray-800 dark:text-gray-200">
                    <span class="font-medium">{{ g.full_name }}</span>
                    <span class="text-gray-500 dark:text-gray-400"> · {{ tableLabel(g.table_id) }}</span>
                    <div class="text-red-600 dark:text-red-400">{{ g.allergies }}</div>
                  </li>
                  <li v-if="dietary.withAllergies.length === 0" class="text-gray-400">No allergies recorded.</li>
                </ul>
              </div>
            </div>
          </section>

          <!-- ============ KITCHEN PREP ============ -->
          <section v-else>
            <div v-if="isLoadingPrep" class="text-sm text-gray-500 dark:text-gray-400">Generating prep list…</div>
            <p v-else-if="prepError" class="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2">{{ prepError }}</p>

            <template v-else-if="prep">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 print:hidden">
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Generated from the booking's package and picked dishes for <span class="font-semibold">{{ prep.booking.guest_count }} guests</span>. Tick items off as the kitchen finishes them.
                </p>
                <div class="flex items-center gap-3">
                  <span class="text-sm font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap">{{ prepDoneCount }} / {{ prepTaskCount }} done</span>
                  <button @click="loadPrep" class="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-none">Refresh</button>
                  <button @click="printSummary" class="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-none">Print</button>
                </div>
              </div>

              <div class="hidden print:block mb-3">
                <p class="text-lg font-bold">Kitchen Prep List — {{ selectedBooking.client_name }}</p>
                <p class="text-sm">{{ formatDateOnly(selectedBooking.event_date) }}<span v-if="prep.booking.event_time"> · {{ prep.booking.event_time.slice(0, 5) }}</span> · {{ selectedBooking.event_location }} · {{ prep.booking.guest_count }} guests · {{ prep.booking.package_name || 'No package' }}</p>
              </div>

              <div class="h-1.5 bg-gray-100 dark:bg-gray-700 mb-4 print:hidden">
                <div class="h-full bg-emerald-600 transition-all" :style="{ width: prepTaskCount ? (prepDoneCount / prepTaskCount) * 100 + '%' : '0%' }"></div>
              </div>

              <p v-if="prepShortItems.length" class="mb-4 text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2">
                Not enough stock for: <span class="font-semibold">{{ prepShortItems.map((t) => `${t.name} (short ${formatPrepQty(t.short_by, t.unit)})`).join(', ') }}</span>. Restock before the event.
              </p>

              <!-- Notes the kitchen must see -->
              <div v-if="prepNotes.length || dietary.withAllergies.length || prepDietaryTags.length" class="mb-5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3">
                <p class="font-semibold text-amber-800 dark:text-amber-200 mb-2">Heads-up for the kitchen</p>
                <ul class="space-y-1 text-sm text-gray-800 dark:text-gray-200">
                  <li v-for="n in prepNotes" :key="n.label"><span class="font-medium">{{ n.label }}:</span> {{ n.text }}</li>
                  <li v-if="prepDietaryTags.length">
                    <span class="font-medium">Dietary (attending guests):</span>
                    {{ prepDietaryTags.map((t) => `${t} × ${dietary.counts[t]}`).join(', ') }}
                  </li>
                  <li v-for="g in dietary.withAllergies" :key="g.guest_id" class="text-red-700 dark:text-red-300">
                    <span class="font-medium">Allergy — {{ g.full_name }}</span> ({{ tableLabel(g.table_id) }}): {{ g.allergies }}
                  </li>
                </ul>
              </div>

              <p v-if="prep.dishes.length === 0 && prep.totals.length === 0" class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-8 text-center text-sm text-gray-500 dark:text-gray-400">
                Nothing to prep yet. This booking has no package ingredients or picked dishes. Set them in Catering Packages and make sure the client has chosen their menu.
              </p>

              <div v-else class="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">
                <!-- Dishes -->
                <div class="xl:col-span-2 space-y-4">
                  <p v-if="prep.dishes.length === 0" class="text-sm text-gray-500 dark:text-gray-400">No dishes picked for this booking yet.</p>
                  <div v-for="grp in prepDishGroups" :key="grp.category">
                    <p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">{{ grp.category }}</p>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div v-for="d in grp.dishes" :key="d.item_id" class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 break-inside-avoid">
                        <label class="flex items-start gap-2 cursor-pointer">
                          <input type="checkbox" :checked="isPrepDone(dishKey(d.item_id))" @change="togglePrep(dishKey(d.item_id), $event)" class="mt-1 w-4 h-4 accent-emerald-600" />
                          <span class="flex-1 min-w-0">
                            <span class="font-semibold text-gray-900 dark:text-gray-100" :class="isPrepDone(dishKey(d.item_id)) ? 'line-through opacity-60' : ''">{{ d.name }}</span>
                            <span v-if="d.portion && d.portion !== 'Regular'" class="ml-1 text-xs px-1.5 py-0.5 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-semibold">{{ d.portion }} serving</span>
                            <span v-for="t in d.tags" :key="t" class="ml-1 text-xs px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 capitalize">{{ t }}</span>
                          </span>
                        </label>
                        <ul class="mt-2 ml-6 text-sm text-gray-700 dark:text-gray-300 divide-y divide-gray-100 dark:divide-gray-700">
                          <li v-for="ing in d.ingredients" :key="ing.item_id" class="flex justify-between gap-2 py-1">
                            <span class="truncate">{{ ing.name }}</span>
                            <span class="font-medium whitespace-nowrap">{{ formatPrepQty(ing.total, ing.unit) }}</span>
                          </li>
                          <li v-if="d.ingredients.length === 0" class="py-1 text-xs text-gray-400">No ingredients set for this dish.</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div v-if="prep.packageIngredients.length">
                    <p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Included with the package</p>
                    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 break-inside-avoid">
                      <ul class="text-sm text-gray-700 dark:text-gray-300 divide-y divide-gray-100 dark:divide-gray-700">
                        <li v-for="ing in prep.packageIngredients" :key="ing.item_id" class="flex justify-between gap-2 py-1">
                          <span class="truncate">{{ ing.name }}</span>
                          <span class="font-medium whitespace-nowrap">{{ formatPrepQty(ing.total, ing.unit) }}</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <!-- Pull list -->
                <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 break-inside-avoid">
                  <p class="font-semibold text-gray-900 dark:text-gray-100">Ingredient pull list</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">Total per ingredient across all dishes, rounded up like the stock deduction.</p>
                  <ul class="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                    <li v-for="t in prep.totals" :key="t.item_id" class="py-1.5">
                      <label class="flex items-center gap-2 cursor-pointer text-gray-800 dark:text-gray-200">
                        <input type="checkbox" :checked="isPrepDone(ingKey(t.item_id))" @change="togglePrep(ingKey(t.item_id), $event)" class="w-4 h-4 accent-emerald-600" />
                        <span class="flex-1 min-w-0 truncate" :class="isPrepDone(ingKey(t.item_id)) ? 'line-through opacity-60' : ''">{{ t.name }}</span>
                        <span class="font-semibold whitespace-nowrap">{{ t.total }} {{ t.unit }}</span>
                      </label>
                      <p v-if="t.short_by > 0" class="ml-6 text-xs text-red-600 dark:text-red-400">Only {{ t.in_stock }} {{ t.unit }} in stock — short {{ t.short_by }} {{ t.unit }}</p>
                    </li>
                    <li v-if="prep.totals.length === 0" class="py-2 text-xs text-gray-400">No ingredients set for this package.</li>
                  </ul>
                  <p v-if="prep.stockReserved" class="text-xs text-gray-400 mt-3">Stock for this booking was already deducted when it was confirmed.</p>
                </div>
              </div>
            </template>
          </section>
        </template>
      </div>
    </main>

    <!-- GUEST FORM MODAL -->
    <div v-if="showGuestForm" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 print:hidden">
      <div class="bg-white dark:bg-gray-800 w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 border border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">{{ editingGuestId ? 'Edit guest' : 'Add guest' }}</h3>
        <p v-if="formError" class="mb-3 text-sm text-red-600 dark:text-red-400">{{ formError }}</p>
        <div class="space-y-3">
          <input v-model="guestForm.full_name" type="text" placeholder="Full name *" class="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm rounded-none" />
          <div class="grid grid-cols-2 gap-3">
            <input v-model="guestForm.contact_number" type="text" placeholder="Mobile (09…)" class="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm rounded-none" />
            <input v-model="guestForm.email" type="email" placeholder="Email" class="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm rounded-none" />
          </div>
          <select v-model="guestForm.rsvp_status" class="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm rounded-none">
            <option v-for="r in RSVP_OPTIONS" :key="r" :value="r">{{ r }}</option>
          </select>
          <div>
            <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Dietary preferences</p>
            <div class="flex flex-wrap gap-2">
              <label v-for="d in DIETARY_OPTIONS" :key="d" class="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-200">
                <input type="checkbox" :value="d" v-model="guestForm.dietary_preferences" class="accent-emerald-600" /> {{ d }}
              </label>
            </div>
          </div>
          <input v-model="guestForm.allergies" type="text" placeholder="Allergies (e.g. shrimp, peanuts)" class="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm rounded-none" />
          <textarea v-model="guestForm.notes" rows="2" placeholder="Notes" class="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm rounded-none"></textarea>
        </div>
        <div class="flex justify-end gap-2 mt-4">
          <button @click="showGuestForm = false" class="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-none">Cancel</button>
          <button @click="saveGuest" :disabled="isSaving" class="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-none disabled:opacity-50">{{ isSaving ? 'Saving…' : 'Save' }}</button>
        </div>
      </div>
    </div>

    <!-- IMPORT MODAL -->
    <div v-if="showImport" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 print:hidden">
      <div class="bg-white dark:bg-gray-800 w-full max-w-lg p-5 border border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">Paste guest list</h3>
        <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">One guest per line. Optional mobile after a comma: <span class="font-mono">Juan Dela Cruz, 09171234567</span></p>
        <p v-if="formError" class="mb-3 text-sm text-red-600 dark:text-red-400">{{ formError }}</p>
        <textarea v-model="importText" rows="8" class="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm rounded-none"></textarea>
        <div class="flex justify-end gap-2 mt-4">
          <button @click="showImport = false; importText = ''; formError = ''" class="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-none">Cancel</button>
          <button @click="runImport" :disabled="isSaving" class="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-none disabled:opacity-50">{{ isSaving ? 'Importing…' : 'Import' }}</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { localToday, formatDateOnly } from '../utils/date'
import { logoutUser } from '../services/authService'
import { resetNotifications } from '../composables/useNotifications'
import logoUrl from '../Assets/logofinal.png'
import NotificationBell from '../Components/NotificationBell.vue'
import { useSidebarState } from '../composables/useSidebarState'
import { useChatUnread } from '../composables/useChatUnread'
import {
  DIETARY_OPTIONS,
  RSVP_OPTIONS,
  getPlannableBookings,
  getGuests,
  addGuest,
  updateGuest,
  deleteGuest,
  importGuests,
  getTables,
  addTable,
  updateTable,
  deleteTable,
  seatGuest,
  summarizeDietary,
  rsvpSummary
} from '../services/planningservice'
import {
  dishKey,
  ingKey,
  getKitchenPrepList,
  setPrepTaskDone,
  formatPrepQty,
  groupDishesByCategory
} from '../services/kitchenservice'

const router = useRouter()
const { isSidebarOpen, isMobileSidebarOpen, sidebarExpanded } = useSidebarState()
const { chatUnread } = useChatUnread()
const isLogoHovered = ref(false)
const showAccountMenu = ref(false)
const userName = ref('User')
const userRole = ref('Admin')
const userInitial = ref('U')
const userAvatarUrl = ref('')

function toggleSidebar() {
  isSidebarOpen.value = !isSidebarOpen.value
  isLogoHovered.value = false
}

// ---------- State ----------
const tabs = ['Guest List', 'Seating', 'Dietary', 'Kitchen Prep']
const activeTab = ref('Guest List')
const bookings = ref([])
const selectedBookingId = ref('')
const guests = ref([])
const tables = ref([])
const isLoadingBookings = ref(true)
const isLoadingPlan = ref(false)
const isSaving = ref(false)
const pageError = ref('')
const formError = ref('')

const guestSearch = ref('')
const rsvpFilter = ref('All')
const showGuestForm = ref(false)
const editingGuestId = ref(null)
const showImport = ref(false)
const importText = ref('')
const newTableLabel = ref('')
const newTableCapacity = ref(8)

const blankGuest = () => ({
  full_name: '',
  contact_number: '',
  email: '',
  rsvp_status: 'Pending',
  table_id: null,
  dietary_preferences: [],
  allergies: '',
  notes: ''
})
const guestForm = ref(blankGuest())

// ---------- Derived ----------
const selectedBooking = computed(() => bookings.value.find((b) => b.booking_id === selectedBookingId.value) || null)
const activeGuests = computed(() => guests.value.filter((g) => g.rsvp_status !== 'Declined'))
const unseatedGuests = computed(() => activeGuests.value.filter((g) => !g.table_id))
const seatedCount = computed(() => activeGuests.value.filter((g) => g.table_id).length)
const rsvp = computed(() => rsvpSummary(guests.value))
const dietary = computed(() => summarizeDietary(guests.value))
const overBooked = computed(() => selectedBooking.value && activeGuests.value.length > selectedBooking.value.guest_count)
const topTags = computed(() =>
  DIETARY_OPTIONS.filter((t) => dietary.value.counts[t] > 0)
    .sort((a, b) => dietary.value.counts[b] - dietary.value.counts[a])
    .slice(0, 4)
)
const filteredGuests = computed(() => {
  const q = guestSearch.value.trim().toLowerCase()
  return guests.value.filter((g) => {
    if (rsvpFilter.value !== 'All' && g.rsvp_status !== rsvpFilter.value) return false
    return !q || g.full_name.toLowerCase().includes(q)
  })
})

function tableLabel(tableId) {
  return tables.value.find((t) => t.table_id === tableId)?.label || '—'
}
function seatedAt(tableId) {
  return activeGuests.value.filter((g) => g.table_id === tableId)
}

// ---------- Loading ----------
async function loadBookings() {
  isLoadingBookings.value = true
  try {
    bookings.value = await getPlannableBookings(localToday())
  } catch (e) {
    pageError.value = e.message
  } finally {
    isLoadingBookings.value = false
  }
}

async function loadPlan() {
  if (!selectedBookingId.value) return
  isLoadingPlan.value = true
  pageError.value = ''
  try {
    // Tables first-class so guests can resolve their table label.
    const [t, g] = await Promise.all([getTables(selectedBookingId.value), getGuests(selectedBookingId.value)])
    tables.value = t
    guests.value = g
  } catch (e) {
    pageError.value = e.message
  } finally {
    isLoadingPlan.value = false
  }
}

watch(selectedBookingId, () => {
  guestSearch.value = ''
  rsvpFilter.value = 'All'
  loadPlan()
})

// ---------- Guests ----------
function openGuestForm(guest = null) {
  formError.value = ''
  editingGuestId.value = guest?.guest_id || null
  guestForm.value = guest
    ? { ...guest, dietary_preferences: [...(guest.dietary_preferences || [])] }
    : blankGuest()
  showGuestForm.value = true
}

async function saveGuest() {
  formError.value = ''
  isSaving.value = true
  try {
    if (editingGuestId.value) {
      const saved = await updateGuest(editingGuestId.value, guestForm.value)
      guests.value = guests.value.map((g) => (g.guest_id === saved.guest_id ? saved : g))
    } else {
      const saved = await addGuest(selectedBookingId.value, guestForm.value)
      guests.value = [...guests.value, saved].sort((a, b) => a.full_name.localeCompare(b.full_name))
    }
    showGuestForm.value = false
  } catch (e) {
    formError.value = e.message
  } finally {
    isSaving.value = false
  }
}

async function runImport() {
  formError.value = ''
  isSaving.value = true
  try {
    const added = await importGuests(selectedBookingId.value, importText.value)
    guests.value = [...guests.value, ...added].sort((a, b) => a.full_name.localeCompare(b.full_name))
    importText.value = ''
    showImport.value = false
  } catch (e) {
    formError.value = e.message
  } finally {
    isSaving.value = false
  }
}

async function removeGuest(g) {
  if (!window.confirm(`Remove ${g.full_name} from the guest list?`)) return
  try {
    await deleteGuest(g.guest_id)
    guests.value = guests.value.filter((x) => x.guest_id !== g.guest_id)
  } catch (e) {
    pageError.value = e.message
  }
}

async function changeRsvp(g, status) {
  try {
    // A declined guest frees their seat.
    const saved = await updateGuest(g.guest_id, {
      ...g,
      rsvp_status: status,
      table_id: status === 'Declined' ? null : g.table_id
    })
    guests.value = guests.value.map((x) => (x.guest_id === saved.guest_id ? saved : x))
  } catch (e) {
    pageError.value = e.message
    await loadPlan()
  }
}

// ---------- Tables ----------
async function createTable() {
  pageError.value = ''
  try {
    const t = await addTable(selectedBookingId.value, newTableLabel.value, newTableCapacity.value)
    tables.value = [...tables.value, t]
    newTableLabel.value = ''
  } catch (e) {
    pageError.value = e.message
  }
}

async function editTable(t) {
  const label = window.prompt('Table name:', t.label)
  if (label === null) return
  const cap = window.prompt('Number of seats:', String(t.capacity))
  if (cap === null) return
  if (Number(cap) < seatedAt(t.table_id).length) {
    pageError.value = `${t.label} already has ${seatedAt(t.table_id).length} guests seated. Unseat some first.`
    return
  }
  try {
    await updateTable(t.table_id, label, cap)
    tables.value = tables.value.map((x) =>
      x.table_id === t.table_id ? { ...x, label: label.trim(), capacity: Number(cap) } : x
    )
  } catch (e) {
    pageError.value = e.message
  }
}

async function removeTable(t) {
  const n = seatedAt(t.table_id).length
  const msg = n ? `Delete ${t.label}? ${n} guest(s) will become unseated.` : `Delete ${t.label}?`
  if (!window.confirm(msg)) return
  try {
    await deleteTable(t.table_id)
    tables.value = tables.value.filter((x) => x.table_id !== t.table_id)
    guests.value = guests.value.map((g) => (g.table_id === t.table_id ? { ...g, table_id: null } : g))
  } catch (e) {
    pageError.value = e.message
  }
}

async function moveGuest(g, tableId) {
  pageError.value = ''
  try {
    await seatGuest(g.guest_id, tableId)
    guests.value = guests.value.map((x) => (x.guest_id === g.guest_id ? { ...x, table_id: tableId } : x))
  } catch (e) {
    pageError.value = e.message
  }
}

// Fills tables in order; keeps the order guests were already sorted in.
async function autoFillTables() {
  pageError.value = ''
  for (const g of [...unseatedGuests.value]) {
    const target = tables.value.find((t) => seatedAt(t.table_id).length < t.capacity)
    if (!target) {
      pageError.value = 'Not enough seats for everyone. Add another table.'
      break
    }
    await moveGuest(g, target.table_id)
    if (pageError.value) break
  }
}

// ---------- Kitchen prep list ----------
const prep = ref(null)
const isLoadingPrep = ref(false)
const prepError = ref('')

const prepDishGroups = computed(() => (prep.value ? groupDishesByCategory(prep.value.dishes) : []))
const prepShortItems = computed(() => (prep.value ? prep.value.totals.filter((t) => t.short_by > 0) : []))
const prepTaskCount = computed(() => (prep.value ? prep.value.dishes.length + prep.value.totals.length : 0))
const prepDoneCount = computed(() => {
  if (!prep.value) return 0
  const keys = [
    ...prep.value.dishes.map((d) => dishKey(d.item_id)),
    ...prep.value.totals.map((t) => ingKey(t.item_id))
  ]
  return keys.filter((k) => k in prep.value.checks).length
})
const prepDietaryTags = computed(() => DIETARY_OPTIONS.filter((t) => dietary.value.counts[t] > 0))
const prepNotes = computed(() => {
  const b = prep.value?.booking
  if (!b) return []
  return [
    { label: 'Special requests', text: b.special_requests },
    { label: 'Dietary notes', text: b.dietary_notes }
  ].filter((n) => n.text)
})

function isPrepDone(key) {
  return !!prep.value && key in prep.value.checks
}

async function loadPrep() {
  const bookingId = selectedBookingId.value
  if (!bookingId) return
  isLoadingPrep.value = true
  prepError.value = ''
  try {
    const result = await getKitchenPrepList(bookingId)
    if (bookingId !== selectedBookingId.value) return // user switched events meanwhile
    prep.value = result
  } catch (e) {
    if (bookingId !== selectedBookingId.value) return
    prep.value = null
    prepError.value = e.message
  } finally {
    if (bookingId === selectedBookingId.value) isLoadingPrep.value = false
  }
}

// Optimistic tick: update the UI right away, undo it if saving fails.
async function togglePrep(key, event) {
  if (!prep.value) return
  const bookingId = selectedBookingId.value
  const done = event.target.checked
  const checks = { ...prep.value.checks }
  if (done) checks[key] = new Date().toISOString()
  else delete checks[key]
  prep.value = { ...prep.value, checks }
  try {
    await setPrepTaskDone(bookingId, key, done)
  } catch (e) {
    pageError.value = e.message
    if (bookingId === selectedBookingId.value) await loadPrep()
  }
}

// Load lazily: only when the Kitchen Prep tab is open for an event.
watch([activeTab, selectedBookingId], ([tab]) => {
  if (tab === 'Kitchen Prep') loadPrep()
})
watch(selectedBookingId, () => {
  prep.value = null
  prepError.value = ''
})

function printSummary() {
  window.print()
}

// ---------- Layout ----------
const allNavItems = [
  { name: 'Dashboard', path: '/admin/dashboard', iconPath: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { name: 'Event Bookings', path: '/admin/bookings', iconPath: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { name: 'Event Planning', path: '/admin/planning', iconPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
  { name: 'Catering Packages', path: '/admin/packages', iconPath: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { name: 'Inventory', path: '/admin/inventory', iconPath: 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4' },
  { name: 'Waste Tracking', path: '/admin/waste', iconPath: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' },
  { name: 'Delivery & Fleet', path: '/admin/fleet', iconPath: 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12' },
  { name: 'Payment Records', path: '/admin/payments', iconPath: 'M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0018.75 4.5H5.25A2.25 2.25 0 003 6.75v10.5A2.25 2.25 0 005.25 19.5z' },
  { name: 'Branches', path: '/admin/branches', iconPath: 'M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M9 10h.01M15 10h.01' },
  { name: 'Staff Management', path: '/admin/staff', iconPath: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-2.13a4 4 0 10-4-4 4 4 0 004 4z' },
  { name: 'Reports', path: '/admin/reports', iconPath: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { name: 'Feedback & Ratings', path: '/admin/feedback', iconPath: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
  { name: 'Support Chat', path: '/admin/support', iconPath: 'M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' }
]
// Staff only sees Dashboard, Event Planning and Payment Records.
const staffAllowedSections = ['Dashboard', 'Event Planning', 'Payment Records', 'Support Chat']
const navItems = computed(() =>
  userRole.value === 'Staff'
    ? allNavItems.filter(item => staffAllowedSections.includes(item.name))
    : allNavItems
)

function goTo(item) {
  isMobileSidebarOpen.value = false
  router.push(item.path)
}

const handleLogout = async () => {
  try {
    await logoutUser()
  } catch (error) {
    console.error('Sign out failed:', error)
  }
  sessionStorage.removeItem('token')
  sessionStorage.removeItem('user')
  resetNotifications()
  router.push('/')
}

onMounted(() => {
  const storedUser = sessionStorage.getItem('user')
  if (!storedUser) {
    router.push('/')
    return
  }
  const user = JSON.parse(storedUser)
  if (!['Admin', 'Staff', 'Owner/Manager'].includes(user.role)) {
    router.push('/')
    return
  }
  const displayName = user.full_name || user.username || 'User'
  userName.value = displayName
  userRole.value = user.role
  userInitial.value = displayName.charAt(0).toUpperCase()
  userAvatarUrl.value = user.avatar_url || ''
  loadBookings()
})
</script>