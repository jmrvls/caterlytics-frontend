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
          :class="item.name === 'Delivery & Fleet' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'"
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

        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 class="text-xl font-bold text-gray-800 dark:text-gray-100">Delivery &amp; Fleet</h1>
            <p class="text-sm text-gray-500 dark:text-gray-400">Track catering vans, assign drivers, and optimize delivery routes.</p>
          </div>
          <div class="flex items-center gap-2 sm:gap-3 flex-wrap">
            <input v-model="runDate" type="date" class="px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            <button @click="runDate = localToday()" class="px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-none text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition">Today</button>
            <button @click="openSettings" :disabled="setupMissing" class="px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-none text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition">Base &amp; settings</button>
            <div class="hidden lg:block"><NotificationBell /></div>
          </div>
        </div>

        <!-- Not set up yet -->
        <div v-if="setupMissing" class="border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 text-sm p-4 mb-4">
          Delivery &amp; Fleet needs a one-time database setup. Open the Supabase SQL Editor and run <span class="font-mono font-semibold">fleet_management.sql</span>, then refresh this page.
        </div>
        <div v-if="pageError" class="text-red-600 dark:text-red-400 text-sm font-medium mb-4">{{ pageError }}</div>
        <div v-if="successMessage" class="text-emerald-700 dark:text-emerald-300 text-sm font-medium mb-4">{{ successMessage }}</div>

        <div v-if="isLoading" class="text-center py-16 text-gray-400 dark:text-gray-500 text-sm">Loading fleet data...</div>

        <template v-else-if="!setupMissing">
          <div v-if="!basePoint" class="border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 text-sm p-4 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span>Set your kitchen / base location so routes can start from there. Route optimization is disabled until then.</span>
            <button @click="openSettings" class="px-3 py-1.5 bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 whitespace-nowrap">Set base location</button>
          </div>

          <!-- Summary cards -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div class="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4">
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Vehicles available</p>
              <p class="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">{{ summary.available }}<span class="text-sm font-medium text-gray-400"> / {{ vehicles.length }}</span></p>
              <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">{{ summary.onDelivery }} on delivery · {{ summary.maintenance }} in maintenance</p>
            </div>
            <div class="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4">
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Deliveries on {{ formatDateOnly(runDate) }}</p>
              <p class="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">{{ rows.length }}</p>
              <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">{{ summary.delivered }} delivered · {{ summary.enRoute }} en route</p>
            </div>
            <div class="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4">
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Needs vehicle or driver</p>
              <p :class="summary.needsAssignment ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'" class="text-xl sm:text-2xl font-bold">{{ summary.needsAssignment }}</p>
            </div>
            <div class="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4">
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Drivers free today</p>
              <p class="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">{{ summary.driversFree }}<span class="text-sm font-medium text-gray-400"> / {{ drivers.length }}</span></p>
              <p v-if="!drivers.length" class="text-xs text-gray-400 dark:text-gray-500 mt-1">Set a Staff member's position to "Driver"</p>
            </div>
          </div>

          <!-- Tabs -->
          <div class="flex border-b border-gray-200 dark:border-gray-700 mb-5 overflow-x-auto">
            <button v-for="t in TABS" :key="t.key" @click="tab = t.key"
              :class="tab === t.key ? 'border-emerald-600 text-emerald-700 dark:text-emerald-300 font-semibold' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'"
              class="px-4 py-2.5 text-sm border-b-2 whitespace-nowrap transition -mb-px">{{ t.label }}</button>
          </div>

          <!-- ============ DISPATCH BOARD ============ -->
          <div v-if="tab === 'dispatch'">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <h2 class="font-semibold text-gray-800 dark:text-gray-100">Dispatch board</h2>
              <button @click="openAddDelivery" class="flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-none font-semibold text-sm hover:bg-emerald-700 transition whitespace-nowrap">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
                Add event to deliveries
              </button>
            </div>

            <div v-if="!rows.length" class="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-center py-12 text-gray-400 dark:text-gray-500 text-sm">
              No deliveries scheduled for this date. Tap "Add event to deliveries" to pull in a confirmed booking.
            </div>

            <div v-else class="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
              <div v-for="d in rows" :key="d.delivery_id" class="p-4">
                <div class="flex flex-col lg:flex-row lg:items-start gap-4">
                  <!-- Who / where -->
                  <div class="lg:w-1/3 min-w-0">
                    <div class="flex items-center gap-2">
                      <span v-if="d.stop_order" class="w-6 h-6 flex items-center justify-center text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex-shrink-0">{{ d.stop_order }}</span>
                      <p class="font-semibold text-gray-900 dark:text-gray-100 truncate">{{ d.client_name }}</p>
                    </div>
                    <p class="text-sm text-gray-600 dark:text-gray-300 mt-0.5">{{ formatClock(d.event_time) }} · {{ d.guest_count }} guests</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 break-words">{{ d.dest_address || 'No address' }}</p>
                  </div>

                  <!-- Assignment -->
                  <div class="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label class="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">Vehicle</label>
                      <select :value="d.vehicle_id ?? ''" @change="assign(d, 'vehicle_id', $event.target.value)" :disabled="busyId === d.delivery_id" class="w-full px-2 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-none text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                        <option value="">Unassigned</option>
                        <option v-for="v in vehicles" :key="v.vehicle_id" :value="v.vehicle_id" :disabled="!isVehicleUsable(v) && v.vehicle_id !== d.vehicle_id">
                          {{ v.name }} ({{ v.plate_number }}){{ isVehicleUsable(v) ? '' : ' — ' + v.status }}
                        </option>
                      </select>
                    </div>
                    <div>
                      <label class="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">Driver</label>
                      <select :value="d.driver_id ?? ''" @change="assign(d, 'driver_id', $event.target.value)" :disabled="busyId === d.delivery_id" class="w-full px-2 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-none text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                        <option value="">Unassigned</option>
                        <option v-for="p in drivers" :key="p.id" :value="p.id" :disabled="!isDriverFree(p) && p.id !== d.driver_id">
                          {{ p.full_name }}{{ isDriverFree(p) ? '' : ' — unavailable' }}
                        </option>
                      </select>
                    </div>
                    <div>
                      <label class="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">Status</label>
                      <select :value="d.status" @change="assign(d, 'status', $event.target.value)" :disabled="busyId === d.delivery_id" :class="deliveryStatusClass(d.status)" class="w-full px-2 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-none text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500">
                        <option v-for="s in DELIVERY_STATUSES" :key="s" :value="s" class="text-gray-900">{{ s }}</option>
                      </select>
                    </div>
                  </div>

                  <button @click="confirmRemove = d" class="self-start text-xs text-red-500 dark:text-red-400 hover:underline whitespace-nowrap">Remove</button>
                </div>

                <ul v-if="warningsFor(d).length" class="mt-3 space-y-1">
                  <li v-for="(w, i) in warningsFor(d)" :key="i" class="flex gap-2 text-xs text-amber-700 dark:text-amber-300">
                    <span class="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0"></span>{{ w }}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- ============ VEHICLES ============ -->
          <div v-else-if="tab === 'vehicles'">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <h2 class="font-semibold text-gray-800 dark:text-gray-100">Vehicles</h2>
              <button @click="openVehicleModal()" class="flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-none font-semibold text-sm hover:bg-emerald-700 transition whitespace-nowrap">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
                Add vehicle
              </button>
            </div>

            <div v-if="!vehicles.length" class="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-center py-12 text-gray-400 dark:text-gray-500 text-sm">
              No vehicles yet. Add your first catering van.
            </div>

            <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <div v-for="v in vehicles" :key="v.vehicle_id" class="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <p class="font-semibold text-gray-900 dark:text-gray-100 truncate">{{ v.name }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">{{ v.plate_number }} · {{ v.vehicle_type }}<span v-if="v.capacity_kg"> · {{ v.capacity_kg }} kg</span></p>
                  </div>
                  <select :value="v.status" @change="changeVehicleStatus(v, $event.target.value)" :class="vehicleStatusClass(v.status)" class="px-2 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-none text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option v-for="s in VEHICLE_STATUSES" :key="s" :value="s" class="text-gray-900">{{ s }}</option>
                  </select>
                </div>

                <div class="mt-3 text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <p><span class="text-gray-400 dark:text-gray-500">Today:</span> {{ vehicleToday(v).count }} {{ vehicleToday(v).count === 1 ? 'delivery' : 'deliveries' }}<span v-if="vehicleToday(v).driver"> · {{ vehicleToday(v).driver }}</span></p>
                  <p>
                    <span class="text-gray-400 dark:text-gray-500">Last seen:</span>
                    {{ timeAgo(v.last_location_at) }}
                    <a v-if="v.last_lat != null && v.last_lng != null" :href="`https://www.google.com/maps?q=${v.last_lat},${v.last_lng}`" target="_blank" rel="noopener" class="text-emerald-700 dark:text-emerald-300 hover:underline ml-1">View on map</a>
                  </p>
                  <p v-if="v.notes" class="text-xs text-gray-500 dark:text-gray-400">{{ v.notes }}</p>
                </div>

                <div class="mt-4 flex flex-wrap items-center gap-2">
                  <button @click="shareLocation(v)" :disabled="locatingId === v.vehicle_id" class="px-3 py-1.5 border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition">
                    {{ locatingId === v.vehicle_id ? 'Locating...' : 'Update location from this device' }}
                  </button>
                  <button @click="openVehicleModal(v)" class="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:underline">Edit</button>
                  <button @click="confirmDeleteVehicle = v" class="px-3 py-1.5 text-xs font-semibold text-red-500 dark:text-red-400 hover:underline">Delete</button>
                </div>
              </div>
            </div>
          </div>

          <!-- ============ ROUTE PLANNER ============ -->
          <div v-else-if="tab === 'planner'">
            <div class="flex flex-col lg:flex-row lg:items-end gap-3 mb-4">
              <div class="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div class="col-span-2 lg:col-span-1">
                  <label class="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">Vehicle</label>
                  <select v-model="plannerVehicleId" class="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option :value="null" disabled>Choose a vehicle</option>
                    <option v-for="v in vehicles" :key="v.vehicle_id" :value="v.vehicle_id">{{ v.name }} ({{ rows.filter(r => r.vehicle_id === v.vehicle_id).length }} stops)</option>
                  </select>
                </div>
                <div>
                  <label class="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">Leaves base at</label>
                  <input v-model="departTime" type="time" class="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label class="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">Optimize for</label>
                  <select v-model="optMode" class="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="shortest">Shortest distance</option>
                    <option value="event_time">Earliest event first</option>
                  </select>
                </div>
                <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 self-end pb-2.5">
                  <input v-model="returnToBase" type="checkbox" class="accent-emerald-600" /> Return to base
                </label>
              </div>
            </div>

            <div v-if="!plannerVehicleId" class="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-center py-12 text-gray-400 dark:text-gray-500 text-sm">
              Choose a vehicle that has deliveries assigned on {{ formatDateOnly(runDate) }}.
            </div>
            <div v-else-if="!plannerRows.length" class="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-center py-12 text-gray-400 dark:text-gray-500 text-sm">
              This vehicle has no deliveries on this date. Assign some from the Dispatch board first.
            </div>

            <div v-else class="grid grid-cols-1 xl:grid-cols-5 gap-4">
              <!-- Stops -->
              <div class="xl:col-span-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                <div class="flex items-center justify-between gap-2 p-4 border-b border-gray-100 dark:border-gray-700">
                  <h2 class="font-semibold text-gray-800 dark:text-gray-100">
                    Stops <span v-if="preview" class="ml-2 text-xs font-semibold text-amber-600 dark:text-amber-400">Preview — not saved yet</span>
                  </h2>
                  <button v-if="missingCoords.length" @click="locateAllMissing" :disabled="locatingAll" class="px-3 py-1.5 border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition">
                    {{ locatingAll ? 'Finding...' : `Find ${missingCoords.length} missing on map` }}
                  </button>
                </div>

                <div class="divide-y divide-gray-100 dark:divide-gray-700">
                  <div v-for="(d, idx) in plannerOrdered" :key="d.delivery_id" class="p-4">
                    <div class="flex items-start gap-3">
                      <span class="w-6 h-6 flex items-center justify-center text-xs font-bold bg-emerald-600 text-white flex-shrink-0">{{ hasCoordsOf(d) ? idx + 1 : '?' }}</span>
                      <div class="flex-1 min-w-0">
                        <div class="flex flex-wrap justify-between gap-x-3">
                          <p class="font-semibold text-gray-900 dark:text-gray-100 truncate">{{ d.client_name }}</p>
                          <p class="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">Event {{ formatClock(d.event_time) }}</p>
                        </div>
                        <p class="text-xs text-gray-500 dark:text-gray-400 break-words">{{ d.dest_address || 'No address' }}</p>

                        <template v-if="hasCoordsOf(d)">
                          <p v-if="legFor(d.delivery_id)" class="text-xs mt-1 text-gray-600 dark:text-gray-300">
                            +{{ legFor(d.delivery_id).legKm.toFixed(1) }} km · ~{{ Math.round(legFor(d.delivery_id).legMin) }} min · arrive
                            <span :class="legFor(d.delivery_id).late ? 'text-red-600 dark:text-red-400 font-semibold' : 'font-semibold'">{{ minutesToClock(legFor(d.delivery_id).etaMin) }}</span>
                            <span v-if="legFor(d.delivery_id).late" class="text-red-600 dark:text-red-400"> — too late for the {{ SETUP_BUFFER_MIN }}-min setup buffer</span>
                          </p>
                        </template>
                        <div v-else class="mt-2 flex flex-col sm:flex-row gap-2">
                          <button @click="locateOne(d)" :disabled="locatingId === d.delivery_id" class="px-3 py-1.5 border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition whitespace-nowrap">
                            {{ locatingId === d.delivery_id ? 'Searching...' : 'Find on map' }}
                          </button>
                          <input v-model="manualCoords[d.delivery_id]" @keyup.enter="saveManual(d)" type="text" placeholder="or paste lat, lng / Google Maps link" class="flex-1 px-2 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-none text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                          <button @click="saveManual(d)" class="px-3 py-1.5 bg-gray-800 dark:bg-gray-600 text-white text-xs font-semibold hover:bg-gray-700">Save</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Summary + map -->
              <div class="xl:col-span-2 space-y-4">
                <div class="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4">
                  <div class="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p class="text-xs text-gray-500 dark:text-gray-400">Distance</p>
                      <p class="text-lg font-bold text-gray-800 dark:text-gray-100">{{ totals.km.toFixed(1) }} km</p>
                    </div>
                    <div>
                      <p class="text-xs text-gray-500 dark:text-gray-400">Drive time</p>
                      <p class="text-lg font-bold text-gray-800 dark:text-gray-100">{{ formatDuration(totals.driveMin) }}</p>
                    </div>
                    <div>
                      <p class="text-xs text-gray-500 dark:text-gray-400">Back at base</p>
                      <p class="text-lg font-bold text-gray-800 dark:text-gray-100">{{ returnToBase ? minutesToClock(totals.backMin) : '—' }}</p>
                    </div>
                  </div>
                  <p v-if="savingsText" :class="savings.km > 0.05 ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-500 dark:text-gray-400'" class="text-sm font-medium mt-3 text-center">{{ savingsText }}</p>
                  <p v-if="lateCount" class="text-sm font-medium mt-2 text-center text-red-600 dark:text-red-400">{{ lateCount }} {{ lateCount === 1 ? 'stop is' : 'stops are' }} projected to arrive late.</p>
                  <p v-if="missingCoords.length" class="text-xs mt-2 text-center text-amber-700 dark:text-amber-300">{{ missingCoords.length }} stop(s) without a location are left out of the route.</p>

                  <div class="flex flex-col gap-2 mt-4">
                    <button @click="runOptimize" :disabled="!canOptimize" class="w-full bg-emerald-600 text-white px-4 py-2.5 font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition">Optimize route</button>
                    <button v-if="preview" @click="applyRoute" :disabled="isSavingRoute" class="w-full border border-emerald-600 text-emerald-700 dark:text-emerald-300 px-4 py-2.5 font-semibold text-sm hover:bg-emerald-50 dark:hover:bg-emerald-900/30 disabled:opacity-50 transition">{{ isSavingRoute ? 'Saving...' : 'Save this order' }}</button>
                    <a v-if="mapsUrl" :href="mapsUrl" target="_blank" rel="noopener" class="w-full text-center border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2.5 font-semibold text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition">Open in Google Maps (for the driver)</a>
                  </div>
                  <p class="text-[11px] text-gray-400 dark:text-gray-500 mt-3">Distances are estimates from straight-line distance plus a road factor, at {{ speedKph }} km/h, with {{ SERVICE_MIN }} min unloading per stop. They do not include live traffic. Google Maps has the real turn-by-turn route.</p>
                </div>

                <div v-if="basePoint && mapPoints.length" class="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4">
                  <h2 class="font-semibold text-gray-800 dark:text-gray-100 mb-2">Route sketch</h2>
                  <svg :viewBox="`0 0 ${MAP_W} ${MAP_H}`" class="w-full h-auto bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700">
                    <polyline :points="polylinePoints" fill="none" stroke="#059669" stroke-width="2" stroke-dasharray="5 3" />
                    <rect :x="mapBase.x - 7" :y="mapBase.y - 7" width="14" height="14" fill="#1f2937" />
                    <text :x="mapBase.x" :y="mapBase.y + 3.5" text-anchor="middle" font-size="9" fill="#ffffff" font-weight="700">B</text>
                    <g v-for="p in mapPoints" :key="p.id">
                      <circle :cx="p.x" :cy="p.y" r="9" fill="#059669" />
                      <text :x="p.x" :y="p.y + 3.5" text-anchor="middle" font-size="10" fill="#ffffff" font-weight="700">{{ p.n }}</text>
                    </g>
                  </svg>
                  <p class="text-[11px] text-gray-400 dark:text-gray-500 mt-2">Schematic only: B is your base, numbers are the stop order.</p>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </main>

    <!-- ADD DELIVERY MODAL -->
    <div v-if="showAddDelivery" class="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50" @click="showAddDelivery = false"></div>
      <div class="relative bg-white dark:bg-gray-800 w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-xl">
        <h3 class="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">Add event to deliveries</h3>
        <p class="text-xs text-gray-500 dark:text-gray-400 mb-4">Confirmed bookings that are not on the delivery list yet. Each one is scheduled on its event date.</p>
        <div v-if="modalError" class="text-red-600 dark:text-red-400 text-sm font-medium mb-3">{{ modalError }}</div>
        <div v-if="loadingBookings" class="text-center py-8 text-gray-400 text-sm">Loading bookings...</div>
        <div v-else-if="!schedulable.length" class="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">No confirmed bookings are waiting to be scheduled.</div>
        <div v-else class="divide-y divide-gray-100 dark:divide-gray-700 border border-gray-100 dark:border-gray-700">
          <div v-for="b in schedulable" :key="b.booking_id" class="p-3 flex items-center gap-3">
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{{ b.client_name }}</p>
              <p class="text-xs text-gray-600 dark:text-gray-300">{{ formatDateOnly(b.event_date) }} · {{ formatClock(b.event_time) }} · {{ b.guest_count }} guests</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ b.event_location }}</p>
            </div>
            <button @click="scheduleBooking(b)" :disabled="isSaving" class="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 whitespace-nowrap">Add</button>
          </div>
        </div>
        <div class="flex justify-end mt-5">
          <button @click="showAddDelivery = false" class="px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Close</button>
        </div>
      </div>
    </div>

    <!-- VEHICLE MODAL -->
    <div v-if="showVehicleModal" class="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50" @click="showVehicleModal = false"></div>
      <div class="relative bg-white dark:bg-gray-800 w-full max-w-md max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-xl">
        <h3 class="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">{{ vehicleForm.vehicle_id ? 'Edit vehicle' : 'Add vehicle' }}</h3>
        <div v-if="modalError" class="text-red-600 dark:text-red-400 text-sm font-medium mb-3">{{ modalError }}</div>

        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
        <input v-model="vehicleForm.name" type="text" placeholder="Van 1" class="w-full mb-3 px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-none text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500" />

        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Plate number</label>
        <input v-model="vehicleForm.plate_number" type="text" placeholder="ABC 1234" class="w-full mb-3 px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-none text-sm uppercase text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500" />

        <div class="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
            <select v-model="vehicleForm.vehicle_type" class="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-none text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option v-for="t in VEHICLE_TYPES" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Capacity (kg)</label>
            <input v-model="vehicleForm.capacity_kg" type="number" min="1" step="1" inputmode="numeric" placeholder="Optional" class="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-none text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
        </div>

        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
        <textarea v-model="vehicleForm.notes" rows="2" placeholder="Has chiller, hot-box rack, etc." class="w-full mb-4 px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-none text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"></textarea>

        <div class="flex justify-end gap-2">
          <button @click="showVehicleModal = false" class="px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Cancel</button>
          <button @click="saveVehicle" :disabled="isSaving" class="px-4 py-2.5 bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50">{{ isSaving ? 'Saving...' : 'Save' }}</button>
        </div>
      </div>
    </div>

    <!-- BASE & SETTINGS MODAL -->
    <div v-if="showSettings" class="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50" @click="showSettings = false"></div>
      <div class="relative bg-white dark:bg-gray-800 w-full max-w-md max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-xl">
        <h3 class="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Base &amp; settings</h3>
        <div v-if="modalError" class="text-red-600 dark:text-red-400 text-sm font-medium mb-3">{{ modalError }}</div>

        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Base name</label>
        <input v-model="settingsForm.base_name" type="text" class="w-full mb-3 px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-none text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500" />

        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Base address</label>
        <div class="flex gap-2 mb-3">
          <input v-model="settingsForm.base_address" type="text" placeholder="Kitchen / commissary address" class="flex-1 px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-none text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          <button @click="findBase" :disabled="findingBase" class="px-3 py-2.5 border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 whitespace-nowrap">{{ findingBase ? '...' : 'Find' }}</button>
        </div>

        <div class="grid grid-cols-2 gap-3 mb-1">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Latitude</label>
            <input v-model="settingsForm.base_lat" type="text" inputmode="decimal" placeholder="14.6760" class="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-none text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Longitude</label>
            <input v-model="settingsForm.base_lng" type="text" inputmode="decimal" placeholder="121.0437" class="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-none text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
        </div>
        <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">Tip: "Find" looks the address up on OpenStreetMap. If it can't find it, right-click your kitchen in Google Maps and copy the coordinates.</p>

        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Average driving speed (km/h)</label>
        <input v-model="settingsForm.avg_speed_kph" type="number" min="1" max="120" step="1" class="w-full mb-4 px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-none text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500" />

        <div class="flex justify-end gap-2">
          <button @click="showSettings = false" class="px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Cancel</button>
          <button @click="saveSettings" :disabled="isSaving" class="px-4 py-2.5 bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50">{{ isSaving ? 'Saving...' : 'Save' }}</button>
        </div>
      </div>
    </div>

    <!-- CONFIRM: remove delivery -->
    <div v-if="confirmRemove" class="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50" @click="confirmRemove = null"></div>
      <div class="relative bg-white dark:bg-gray-800 w-full max-w-sm p-5 shadow-xl">
        <h3 class="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">Remove from deliveries?</h3>
        <p class="text-sm text-gray-600 dark:text-gray-300 mb-4">{{ confirmRemove.client_name }}'s event stays in Event Bookings. Only the delivery entry is removed.</p>
        <div class="flex justify-end gap-2">
          <button @click="confirmRemove = null" class="px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Cancel</button>
          <button @click="doRemove" class="px-4 py-2.5 bg-red-600 text-white text-sm font-semibold hover:bg-red-700">Remove</button>
        </div>
      </div>
    </div>

    <!-- CONFIRM: delete vehicle -->
    <div v-if="confirmDeleteVehicle" class="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50" @click="confirmDeleteVehicle = null"></div>
      <div class="relative bg-white dark:bg-gray-800 w-full max-w-sm p-5 shadow-xl">
        <h3 class="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">Delete {{ confirmDeleteVehicle.name }}?</h3>
        <p class="text-sm text-gray-600 dark:text-gray-300 mb-4">Its deliveries will become unassigned. If the van is just out of service, set its status to Maintenance or Inactive instead.</p>
        <div class="flex justify-end gap-2">
          <button @click="confirmDeleteVehicle = null" class="px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Cancel</button>
          <button @click="doDeleteVehicle" class="px-4 py-2.5 bg-red-600 text-white text-sm font-semibold hover:bg-red-700">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { logoutUser } from '../services/authService'
import { resetNotifications } from '../composables/useNotifications'
import logoUrl from '../Assets/logofinal.png'
import { ref, computed, watch, onMounted } from 'vue'
import NotificationBell from '../Components/NotificationBell.vue'
import { useSidebarState } from '../composables/useSidebarState'
import { useChatUnread } from '../composables/useChatUnread'
import { useRouter } from 'vue-router'
import {
  getFleetSettings, saveFleetSettings, getVehicles, createVehicle, updateVehicle, setVehicleStatus,
  updateVehicleLocation, deleteVehicle, getDrivers, getUnavailableStaffIds, getDeliveries,
  getBookingsToSchedule, addDelivery, updateDelivery, removeDelivery, saveRouteOrder,
  geocodeAddress, getCurrentPosition
} from '../services/fleetservice'
import {
  VEHICLE_TYPES, VEHICLE_STATUSES, DELIVERY_STATUSES, DEFAULT_SPEED_KPH, SERVICE_MIN, SETUP_BUFFER_MIN,
  hasCoords, parseLatLng, routeDistanceKm, optimizeRoute, evaluateRoute, mapsDirectionsUrl,
  timeToMinutes, minutesToClock, formatClock, timeAgo, vehicleStatusClass, deliveryStatusClass
} from '../utils/fleet'
import { localToday, formatDateOnly } from '../utils/date'

const router = useRouter()

const { isSidebarOpen, isMobileSidebarOpen, sidebarExpanded } = useSidebarState()
const { chatUnread } = useChatUnread()
const isLogoHovered = ref(false)

function toggleSidebar() {
  isSidebarOpen.value = !isSidebarOpen.value
  isLogoHovered.value = false
}
const showAccountMenu = ref(false)
const userName = ref('User')
const userRole = ref('Staff')
const userInitial = ref('U')
const userAvatarUrl = ref('')
const businessId = ref(null)

const TABS = [
  { key: 'dispatch', label: 'Dispatch board' },
  { key: 'vehicles', label: 'Vehicles' },
  { key: 'planner', label: 'Route planner' },
]
const MAP_W = 320
const MAP_H = 240

// ---------- state ----------
const tab = ref('dispatch')
const runDate = ref(localToday())
const settings = ref(null)
const vehicles = ref([])
const drivers = ref([])
const unavailableIds = ref([])
const deliveries = ref([])

const isLoading = ref(false)
const isSaving = ref(false)
const pageError = ref('')
const successMessage = ref('')
const setupMissing = ref(false)
const busyId = ref(null)
const locatingId = ref(null)
const locatingAll = ref(false)

let msgTimer = null
function flash(msg) {
  successMessage.value = msg
  clearTimeout(msgTimer)
  msgTimer = setTimeout(() => { successMessage.value = '' }, 4000)
}

// ---------- derived data ----------
const basePoint = computed(() => {
  const s = settings.value
  return s && hasCoords({ lat: s.base_lat, lng: s.base_lng }) ? { lat: Number(s.base_lat), lng: Number(s.base_lng) } : null
})
const speedKph = computed(() => Number(settings.value?.avg_speed_kph) || DEFAULT_SPEED_KPH)

// Delivery rows = delivery + the booking fields the board needs, in stop order.
const rows = computed(() =>
  deliveries.value
    .map((d) => ({
      ...d,
      client_name: d.tbl_bookings?.client_name || 'Unknown client',
      event_time: d.tbl_bookings?.event_time || null,
      guest_count: d.tbl_bookings?.guest_count ?? 0,
    }))
    .sort((a, b) => {
      const oa = a.stop_order ?? 1e9
      const ob = b.stop_order ?? 1e9
      if (oa !== ob) return oa - ob
      return (timeToMinutes(a.event_time) ?? 1e9) - (timeToMinutes(b.event_time) ?? 1e9)
    })
)

const isFinal = (d) => d.status === 'Delivered' || d.status === 'Failed'
const isVehicleUsable = (v) => v.status === 'Available' || v.status === 'On Delivery'
const isDriverFree = (p) => p.availability === 'Available' && !unavailableIds.value.includes(p.id)

const summary = computed(() => {
  const assignedDrivers = new Set(rows.value.filter((r) => r.driver_id).map((r) => r.driver_id))
  return {
    available: vehicles.value.filter((v) => v.status === 'Available').length,
    onDelivery: vehicles.value.filter((v) => v.status === 'On Delivery').length,
    maintenance: vehicles.value.filter((v) => v.status === 'Maintenance').length,
    delivered: rows.value.filter((r) => r.status === 'Delivered').length,
    enRoute: rows.value.filter((r) => r.status === 'En Route').length,
    needsAssignment: rows.value.filter((r) => !isFinal(r) && (!r.vehicle_id || !r.driver_id)).length,
    driversFree: drivers.value.filter((p) => isDriverFree(p) && !assignedDrivers.has(p.id)).length,
  }
})

function warningsFor(d) {
  if (isFinal(d)) return []
  const out = []
  if (!d.vehicle_id) out.push('No vehicle assigned yet.')
  if (!d.driver_id) out.push('No driver assigned yet.')

  const v = vehicles.value.find((x) => x.vehicle_id === d.vehicle_id)
  if (v && !isVehicleUsable(v)) out.push(`${v.name} is marked ${v.status}.`)

  const p = drivers.value.find((x) => x.id === d.driver_id)
  if (p && !isDriverFree(p)) out.push(`${p.full_name} is marked unavailable for this date.`)

  if (d.driver_id) {
    const otherVehicles = new Set(
      rows.value.filter((r) => r.driver_id === d.driver_id && r.vehicle_id && r.vehicle_id !== d.vehicle_id && !isFinal(r)).map((r) => r.vehicle_id)
    )
    if (otherVehicles.size) out.push('This driver is also assigned to a different vehicle on this date.')
  }
  if (d.vehicle_id) {
    const otherDrivers = new Set(
      rows.value.filter((r) => r.vehicle_id === d.vehicle_id && r.driver_id && r.driver_id !== d.driver_id && !isFinal(r)).map((r) => r.driver_id)
    )
    if (otherDrivers.size) out.push('This vehicle has more than one driver on this date.')
  }
  return out
}

function vehicleToday(v) {
  const mine = rows.value.filter((r) => r.vehicle_id === v.vehicle_id)
  const withDriver = mine.find((r) => r.driver_id)
  const p = withDriver ? drivers.value.find((x) => x.id === withDriver.driver_id) : null
  return { count: mine.length, driver: p?.full_name || '' }
}

// ---------- loading ----------
onMounted(() => {
  const storedUser = sessionStorage.getItem('user')
  if (!storedUser) {
    router.push('/')
    return
  }
  const user = JSON.parse(storedUser)
  // Same access as Inventory / Waste (see the route guard in main.js).
  if (!['Admin', 'Owner/Manager'].includes(user.role)) {
    router.push('/')
    return
  }
  const displayName = user.full_name || user.username || 'User'
  userName.value = displayName
  userRole.value = user.role
  userInitial.value = displayName.charAt(0).toUpperCase()
  userAvatarUrl.value = user.avatar_url || ''
  businessId.value = user.business_id || null

  loadAll()
})

async function loadDay() {
  const [dels, unavail] = await Promise.all([getDeliveries(runDate.value), getUnavailableStaffIds(runDate.value)])
  deliveries.value = dels
  unavailableIds.value = unavail
}

async function loadAll() {
  isLoading.value = true
  pageError.value = ''
  setupMissing.value = false
  try {
    const [s, v, d] = await Promise.all([getFleetSettings(), getVehicles(), getDrivers()])
    settings.value = s
    vehicles.value = v
    drivers.value = d
    await loadDay()
  } catch (error) {
    if (error?.code === 'FLEET_NOT_SET_UP') setupMissing.value = true
    else pageError.value = error?.message || 'Failed to load fleet data.'
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

// Quiet reload after an edit (no spinner). Vehicles are reloaded too because a
// database trigger flips a van to "On Delivery" / back to "Available".
async function refresh() {
  try {
    const [v] = await Promise.all([getVehicles(), loadDay()])
    vehicles.value = v
  } catch (error) {
    pageError.value = error?.message || 'Failed to refresh.'
  }
}

const preview = ref(null) // unsaved optimized order: array of delivery ids
watch(runDate, async () => {
  if (!runDate.value) return
  preview.value = null
  pageError.value = ''
  try { await loadDay() } catch (error) { pageError.value = error?.message || 'Failed to load deliveries.' }
})

// ---------- dispatch actions ----------
async function assign(d, field, raw) {
  const patch = {}
  if (field === 'vehicle_id') {
    patch.vehicle_id = raw === '' ? null : Number(raw)
    // A new vehicle means the saved stop order no longer applies.
    patch.stop_order = null
    patch.leg_km = null
    patch.leg_minutes = null
    // Convenience: reuse the driver already driving that van today.
    if (patch.vehicle_id && !d.driver_id) {
      const mate = rows.value.find((r) => r.vehicle_id === patch.vehicle_id && r.driver_id)
      if (mate) patch.driver_id = mate.driver_id
    }
  } else if (field === 'driver_id') {
    patch.driver_id = raw === '' ? null : raw
  } else {
    patch.status = raw
  }
  busyId.value = d.delivery_id
  pageError.value = ''
  try {
    await updateDelivery(d.delivery_id, patch)
    preview.value = null
    await refresh()
  } catch (error) {
    pageError.value = error?.message || 'Failed to update delivery.'
    await refresh() // snap the dropdown back to the saved value
  } finally {
    busyId.value = null
  }
}

const confirmRemove = ref(null)
async function doRemove() {
  const d = confirmRemove.value
  confirmRemove.value = null
  if (!d) return
  try {
    await removeDelivery(d.delivery_id)
    flash('Removed from deliveries.')
    await refresh()
  } catch (error) {
    pageError.value = error?.message || 'Failed to remove delivery.'
  }
}

// ---------- add delivery from a booking ----------
const showAddDelivery = ref(false)
const loadingBookings = ref(false)
const schedulable = ref([])
const modalError = ref('')

async function openAddDelivery() {
  modalError.value = ''
  showAddDelivery.value = true
  loadingBookings.value = true
  try {
    const today = localToday()
    schedulable.value = await getBookingsToSchedule(runDate.value < today ? runDate.value : today)
  } catch (error) {
    modalError.value = error?.message || 'Failed to load bookings.'
    schedulable.value = []
  } finally {
    loadingBookings.value = false
  }
}

async function scheduleBooking(b) {
  isSaving.value = true
  modalError.value = ''
  try {
    await addDelivery(b, b.event_date)
    schedulable.value = schedulable.value.filter((x) => x.booking_id !== b.booking_id)
    flash(`Added ${b.client_name} to deliveries on ${formatDateOnly(b.event_date)}.`)
    if (b.event_date === runDate.value) await refresh()
  } catch (error) {
    modalError.value = error?.message || 'Failed to add delivery.'
  } finally {
    isSaving.value = false
  }
}

// ---------- vehicles ----------
const showVehicleModal = ref(false)
const emptyVehicle = () => ({ vehicle_id: null, name: '', plate_number: '', vehicle_type: 'Van', capacity_kg: '', status: 'Available', notes: '' })
const vehicleForm = ref(emptyVehicle())

function openVehicleModal(v = null) {
  modalError.value = ''
  vehicleForm.value = v
    ? { vehicle_id: v.vehicle_id, name: v.name, plate_number: v.plate_number, vehicle_type: v.vehicle_type, capacity_kg: v.capacity_kg ?? '', status: v.status, notes: v.notes || '' }
    : emptyVehicle()
  showVehicleModal.value = true
}

async function saveVehicle() {
  modalError.value = ''
  isSaving.value = true
  try {
    if (vehicleForm.value.vehicle_id) await updateVehicle(vehicleForm.value.vehicle_id, vehicleForm.value)
    else await createVehicle(vehicleForm.value)
    showVehicleModal.value = false
    flash('Vehicle saved.')
    await refresh()
  } catch (error) {
    modalError.value = error?.message || 'Failed to save vehicle.'
  } finally {
    isSaving.value = false
  }
}

async function changeVehicleStatus(v, status) {
  pageError.value = ''
  try {
    await setVehicleStatus(v.vehicle_id, status)
  } catch (error) {
    pageError.value = error?.message || 'Failed to update status.'
  }
  await refresh()
}

const confirmDeleteVehicle = ref(null)
async function doDeleteVehicle() {
  const v = confirmDeleteVehicle.value
  confirmDeleteVehicle.value = null
  if (!v) return
  try {
    await deleteVehicle(v.vehicle_id)
    if (plannerVehicleId.value === v.vehicle_id) plannerVehicleId.value = null
    flash('Vehicle deleted.')
    await refresh()
  } catch (error) {
    pageError.value = error?.message || 'Failed to delete vehicle.'
  }
}

async function shareLocation(v) {
  locatingId.value = v.vehicle_id
  pageError.value = ''
  try {
    const pos = await getCurrentPosition()
    await updateVehicleLocation(v.vehicle_id, pos.lat, pos.lng)
    flash(`${v.name} location updated.`)
    await refresh()
  } catch (error) {
    pageError.value = error?.message || 'Failed to update location.'
  } finally {
    locatingId.value = null
  }
}

// ---------- base & settings ----------
const showSettings = ref(false)
const findingBase = ref(false)
const settingsForm = ref({ base_name: 'Main Kitchen', base_address: '', base_lat: '', base_lng: '', avg_speed_kph: DEFAULT_SPEED_KPH })

function openSettings() {
  modalError.value = ''
  const s = settings.value
  settingsForm.value = {
    base_name: s?.base_name || 'Main Kitchen',
    base_address: s?.base_address || '',
    base_lat: s?.base_lat ?? '',
    base_lng: s?.base_lng ?? '',
    avg_speed_kph: s?.avg_speed_kph ?? DEFAULT_SPEED_KPH,
  }
  showSettings.value = true
}

async function findBase() {
  modalError.value = ''
  findingBase.value = true
  try {
    const hit = await geocodeAddress(settingsForm.value.base_address)
    if (!hit) {
      modalError.value = "Couldn't find that address. Enter the latitude and longitude instead."
      return
    }
    settingsForm.value.base_lat = hit.lat
    settingsForm.value.base_lng = hit.lng
  } finally {
    findingBase.value = false
  }
}

async function saveSettings() {
  modalError.value = ''
  const f = { ...settingsForm.value }
  // Allow pasting "14.67, 121.04" (or a Maps link) into the latitude box.
  if (String(f.base_lat).trim() && !String(f.base_lng).trim()) {
    const parsed = parseLatLng(f.base_lat)
    if (parsed) { f.base_lat = parsed.lat; f.base_lng = parsed.lng }
  }
  isSaving.value = true
  try {
    settings.value = await saveFleetSettings(businessId.value, f)
    showSettings.value = false
    flash('Settings saved.')
  } catch (error) {
    modalError.value = error?.message || 'Failed to save settings.'
  } finally {
    isSaving.value = false
  }
}

// ---------- route planner ----------
const plannerVehicleId = ref(null)
const departTime = ref('08:00')
const optMode = ref('shortest')
const returnToBase = ref(true)
const beforeKm = ref(0)
const isSavingRoute = ref(false)
const manualCoords = ref({})

const hasCoordsOf = (d) => hasCoords({ lat: d.dest_lat, lng: d.dest_lng })
const toStop = (d) => ({ id: d.delivery_id, lat: Number(d.dest_lat), lng: Number(d.dest_lng), event_time: d.event_time })

const plannerRows = computed(() => rows.value.filter((r) => r.vehicle_id === plannerVehicleId.value))
const missingCoords = computed(() => plannerRows.value.filter((d) => !hasCoordsOf(d)))
const locatedRows = computed(() => plannerRows.value.filter(hasCoordsOf))

const orderedLocated = computed(() => {
  if (!preview.value) return locatedRows.value
  const byId = new Map(locatedRows.value.map((d) => [d.delivery_id, d]))
  return preview.value.map((id) => byId.get(id)).filter(Boolean)
})
const plannerOrdered = computed(() => [...orderedLocated.value, ...missingCoords.value])

const departMin = computed(() => timeToMinutes(departTime.value) ?? 8 * 60)
const orderedStops = computed(() => orderedLocated.value.map(toStop))

const evaluation = computed(() =>
  basePoint.value && orderedStops.value.length ? evaluateRoute(basePoint.value, orderedStops.value, departMin.value, speedKph.value) : []
)
const legFor = (id) => evaluation.value.find((e) => e.id === id) || null
const lateCount = computed(() => evaluation.value.filter((e) => e.late).length)

const totals = computed(() => {
  const empty = { km: 0, driveMin: 0, backMin: null }
  if (!basePoint.value || !orderedStops.value.length) return empty
  const km = routeDistanceKm(basePoint.value, orderedStops.value, returnToBase.value)
  const legMin = evaluation.value.reduce((s, e) => s + e.legMin, 0)
  const last = evaluation.value[evaluation.value.length - 1]
  const returnMin = returnToBase.value ? ((km - evaluation.value.reduce((s, e) => s + e.legKm, 0)) / speedKph.value) * 60 : 0
  return { km, driveMin: legMin + returnMin, backMin: last.etaMin + SERVICE_MIN + returnMin }
})

const canOptimize = computed(() => !!basePoint.value && locatedRows.value.length >= 2)

const savings = computed(() => {
  if (!preview.value) return null
  const km = beforeKm.value - totals.value.km
  return { km, pct: beforeKm.value > 0 ? (km / beforeKm.value) * 100 : 0 }
})
const savingsText = computed(() => {
  const s = savings.value
  if (!s) return ''
  if (s.km > 0.05) return `Saves ${s.km.toFixed(1)} km (${s.pct.toFixed(0)}%) vs the current order.`
  if (s.km < -0.05) return `Adds ${Math.abs(s.km).toFixed(1)} km vs the current order, to arrive in event-time order.`
  return 'Same distance as the current order.'
})

const mapsUrl = computed(() => (basePoint.value && orderedStops.value.length ? mapsDirectionsUrl(basePoint.value, orderedStops.value, returnToBase.value) : ''))

function runOptimize() {
  if (!canOptimize.value) return
  pageError.value = ''
  beforeKm.value = routeDistanceKm(basePoint.value, locatedRows.value.map(toStop), returnToBase.value)
  const best = optimizeRoute(basePoint.value, locatedRows.value.map(toStop), { returnToBase: returnToBase.value, mode: optMode.value })
  preview.value = best.map((s) => s.id)
}

async function applyRoute() {
  if (!preview.value) return
  isSavingRoute.value = true
  pageError.value = ''
  try {
    const legs = new Map(evaluation.value.map((e) => [e.id, e]))
    const updates = orderedLocated.value.map((d, i) => ({
      delivery_id: d.delivery_id,
      stop_order: i + 1,
      leg_km: Number(legs.get(d.delivery_id)?.legKm.toFixed(2)),
      leg_minutes: Math.round(legs.get(d.delivery_id)?.legMin || 0),
    }))
    await saveRouteOrder(updates)
    preview.value = null
    flash('Route saved. The stop order now shows on the dispatch board.')
    await refresh()
  } catch (error) {
    pageError.value = error?.message || 'Failed to save the route.'
  } finally {
    isSavingRoute.value = false
  }
}

// Anything that changes which stops/order are on screen invalidates the preview.
watch([plannerVehicleId, returnToBase, optMode], () => { preview.value = null })

// ---------- stop locations ----------
async function locateOne(d) {
  locatingId.value = d.delivery_id
  pageError.value = ''
  try {
    const hit = await geocodeAddress(d.dest_address)
    if (!hit) {
      pageError.value = `Couldn't find "${d.dest_address || 'that address'}" on the map. Paste its coordinates or a Google Maps link instead.`
      return
    }
    await updateDelivery(d.delivery_id, { dest_lat: hit.lat, dest_lng: hit.lng })
    preview.value = null
    await refresh()
  } catch (error) {
    pageError.value = error?.message || 'Failed to save the location.'
  } finally {
    locatingId.value = null
  }
}

async function locateAllMissing() {
  locatingAll.value = true
  pageError.value = ''
  let failed = 0
  try {
    for (const d of missingCoords.value.slice()) {
      const hit = await geocodeAddress(d.dest_address)
      if (hit) await updateDelivery(d.delivery_id, { dest_lat: hit.lat, dest_lng: hit.lng })
      else failed++
      await new Promise((r) => setTimeout(r, 1100)) // be polite to the free geocoder
    }
    preview.value = null
    await refresh()
    if (failed) pageError.value = `${failed} address(es) could not be found. Paste coordinates or a Google Maps link for those.`
  } catch (error) {
    pageError.value = error?.message || 'Failed while locating stops.'
  } finally {
    locatingAll.value = false
  }
}

async function saveManual(d) {
  const parsed = parseLatLng(manualCoords.value[d.delivery_id])
  if (!parsed) {
    pageError.value = 'Enter coordinates like "14.6760, 121.0437" or paste a Google Maps link that contains them.'
    return
  }
  pageError.value = ''
  try {
    await updateDelivery(d.delivery_id, { dest_lat: parsed.lat, dest_lng: parsed.lng })
    manualCoords.value[d.delivery_id] = ''
    preview.value = null
    await refresh()
  } catch (error) {
    pageError.value = error?.message || 'Failed to save the location.'
  }
}

function formatDuration(min) {
  const m = Math.round(min || 0)
  if (m < 60) return `${m} min`
  return `${Math.floor(m / 60)} hr ${m % 60} min`
}

// ---------- route sketch (SVG) ----------
const projection = computed(() => {
  if (!basePoint.value) return null
  const pts = [basePoint.value, ...orderedStops.value]
  const lats = pts.map((p) => p.lat)
  const lngs = pts.map((p) => p.lng)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  const kx = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180)
  const xSpan = Math.max((maxLng - minLng) * kx, 1e-6)
  const ySpan = Math.max(maxLat - minLat, 1e-6)
  const pad = 28
  const scale = Math.min((MAP_W - 2 * pad) / xSpan, (MAP_H - 2 * pad) / ySpan)
  const offX = (MAP_W - xSpan * scale) / 2
  const offY = (MAP_H - ySpan * scale) / 2
  return (p) => ({ x: offX + (p.lng - minLng) * kx * scale, y: MAP_H - (offY + (p.lat - minLat) * scale) })
})
const mapBase = computed(() => (projection.value ? projection.value(basePoint.value) : { x: 0, y: 0 }))
const mapPoints = computed(() =>
  projection.value ? orderedStops.value.map((s, i) => ({ id: s.id, n: i + 1, ...projection.value(s) })) : []
)
const polylinePoints = computed(() => {
  const pts = [mapBase.value, ...mapPoints.value]
  if (returnToBase.value) pts.push(mapBase.value)
  return pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
})

// ---------- sidebar ----------
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

const wasteIcon = 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
const fleetIcon = 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12'

const allNavItems = [
  { name: 'Dashboard', path: '/admin/dashboard', iconPath: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { name: 'Event Bookings', path: '/admin/bookings', iconPath: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { name: 'Event Planning', path: '/admin/planning', iconPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
  { name: 'Catering Packages', path: '/admin/packages', iconPath: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { name: 'Inventory', path: '/admin/inventory', iconPath: 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4' },
  { name: 'Waste Tracking', path: '/admin/waste', iconPath: wasteIcon },
  { name: 'Delivery & Fleet', path: '/admin/fleet', iconPath: fleetIcon },
  { name: 'Payment Records', path: '/admin/payments', iconPath: 'M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0018.75 4.5H5.25A2.25 2.25 0 003 6.75v10.5A2.25 2.25 0 005.25 19.5z' },
  { name: 'Branches', path: '/admin/branches', iconPath: 'M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M9 10h.01M15 10h.01' },
  { name: 'Staff Management', path: '/admin/staff', iconPath: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-2.13a4 4 0 10-4-4 4 4 0 004 4z' },
  { name: 'Reports', path: '/admin/reports', iconPath: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { name: 'Audit Logs', path: '/admin/audit-logs', iconPath: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { name: 'Feedback & Ratings', path: '/admin/feedback', iconPath: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
  { name: 'Support Chat', path: '/admin/support', iconPath: 'M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' }
]

// Admin / Owner-Manager only (route + onMounted already enforce this).
const navItems = computed(() => allNavItems)
</script>