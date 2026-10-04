<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans">

    <!-- TOP BAR -->
    <header class="bg-gray-900 dark:bg-black border-b border-gray-800 sticky top-0 z-30">
      <div class="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between gap-4">
        <div class="flex items-center gap-3 min-w-0">
          <img :src="logoUrl" alt="Logo" class="w-8 h-8 object-contain flex-shrink-0" />
          <div class="min-w-0">
            <p class="font-bold text-white leading-tight truncate">Caterlytics</p>
            <p class="text-[11px] text-indigo-300 leading-tight tracking-wide uppercase">Super Admin &middot; Platform Console</p>
          </div>
        </div>

        <div class="flex items-center gap-3 flex-shrink-0">
          <NotificationBell />
          <button
            @click="router.push('/settings')"
            title="Settings"
            class="p-2 rounded-none text-gray-400 hover:text-white hover:bg-white/10 transition"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <span class="hidden sm:inline text-sm text-gray-400">{{ userName }}</span>
          <button
            @click="handleLogout"
            class="flex items-center gap-2 px-3 py-2 rounded-none text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Log Out
          </button>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-8 py-8">

      <!-- STATS -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <button
          @click="statusFilter = 'All'"
          class="text-left bg-white dark:bg-gray-800 border rounded-none p-5 transition hover:border-gray-300 dark:hover:border-gray-600"
          :class="statusFilter === 'All' ? 'border-gray-400 dark:border-gray-500 ring-1 ring-gray-200 dark:ring-gray-700' : 'border-gray-200 dark:border-gray-700'"
        >
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total Businesses</p>
          <p class="text-3xl font-black text-gray-900 dark:text-gray-100 mt-1">{{ isLoading ? '…' : stats.total_businesses }}</p>
        </button>
        <button
          @click="statusFilter = 'Pending'"
          class="text-left bg-white dark:bg-gray-800 border rounded-none p-5 transition hover:border-amber-300 dark:hover:border-amber-700"
          :class="(statusFilter === 'Pending' || stats.pending_businesses > 0) ? 'border-amber-300 dark:border-amber-700 ring-1 ring-amber-200 dark:ring-amber-800' : 'border-gray-200 dark:border-gray-700'"
        >
          <p class="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">Pending Approval</p>
          <p class="text-3xl font-black text-amber-600 dark:text-amber-400 mt-1">{{ isLoading ? '…' : stats.pending_businesses }}</p>
        </button>
        <button
          @click="statusFilter = 'Active'"
          class="text-left bg-white dark:bg-gray-800 border rounded-none p-5 transition hover:border-emerald-300 dark:hover:border-emerald-700"
          :class="statusFilter === 'Active' ? 'border-emerald-300 dark:border-emerald-700 ring-1 ring-emerald-200 dark:ring-emerald-800' : 'border-gray-200 dark:border-gray-700'"
        >
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Active Tenants</p>
          <p class="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{{ isLoading ? '…' : stats.active_businesses }}</p>
        </button>
        <button
          @click="statusFilter = 'Suspended'"
          class="text-left bg-white dark:bg-gray-800 border rounded-none p-5 transition hover:border-red-300 dark:hover:border-red-700"
          :class="statusFilter === 'Suspended' ? 'border-red-300 dark:border-red-700 ring-1 ring-red-200 dark:ring-red-800' : 'border-gray-200 dark:border-gray-700'"
        >
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Suspended</p>
          <p class="text-3xl font-black text-red-500 mt-1">{{ isLoading ? '…' : stats.suspended_businesses }}</p>
        </button>
      </div>

      <div class="grid grid-cols-3 gap-4 mb-8">
        <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none p-4 text-center">
          <p class="text-2xl font-bold text-gray-800 dark:text-gray-100">{{ isLoading ? '…' : stats.total_owners }}</p>
          <p class="text-xs text-gray-400 mt-0.5">Owners</p>
        </div>
        <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none p-4 text-center">
          <p class="text-2xl font-bold text-gray-800 dark:text-gray-100">{{ isLoading ? '…' : stats.total_staff }}</p>
          <p class="text-xs text-gray-400 mt-0.5">Staff / Business Admins</p>
        </div>
        <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none p-4 text-center">
          <p class="text-2xl font-bold text-gray-800 dark:text-gray-100">{{ isLoading ? '…' : stats.total_clients }}</p>
          <p class="text-xs text-gray-400 mt-0.5">Clients</p>
        </div>
      </div>

      <!-- BUSINESSES -->
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none overflow-hidden">
        <div class="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-gray-100 dark:border-gray-700">
          <h2 class="font-bold text-gray-900 dark:text-gray-100">Registered Businesses (Tenants)</h2>
          <div class="flex items-center gap-2 flex-wrap">
            <button
              v-for="f in FILTERS" :key="f"
              @click="statusFilter = f"
              :class="statusFilter === f ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'"
              class="text-xs font-semibold px-3 py-1.5 rounded-none transition"
            >
              {{ f }}
            </button>
            <button
              @click="exportPDF"
              class="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-none bg-emerald-600 text-white hover:bg-emerald-700 transition"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export PDF
            </button>
          </div>
        </div>

        <!-- SEARCH -->
        <div class="p-4 border-b border-gray-100 dark:border-gray-700">
          <div class="relative max-w-sm">
            <svg class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              v-model="businessSearch"
              placeholder="Search by business, owner, email, or number..."
              class="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-none text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>

        <div v-if="errorMessage" class="p-4 text-sm text-red-600 bg-red-50 dark:bg-red-900/20">{{ errorMessage }}</div>

        <div v-if="isLoading" class="p-8 text-center text-gray-400 text-sm">Loading businesses…</div>

        <div v-else-if="filteredBusinesses.length === 0" class="p-8 text-center text-gray-400 text-sm">
          No businesses match this filter{{ businessSearch ? ' / search' : '' }}.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 dark:bg-gray-900/40 text-left text-xs uppercase tracking-wide text-gray-400">
              <tr>
                <th class="px-4 py-3 font-semibold">Business</th>
                <th class="px-4 py-3 font-semibold">Owner</th>
                <th class="px-4 py-3 font-semibold">Contact</th>
                <th class="px-4 py-3 font-semibold text-center">Staff</th>
                <th class="px-4 py-3 font-semibold text-center">Packages</th>
                <th class="px-4 py-3 font-semibold text-center">Bookings</th>
                <th class="px-4 py-3 font-semibold">Registered</th>
                <th class="px-4 py-3 font-semibold">Status</th>
                <th class="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              <tr v-for="b in filteredBusinesses" :key="b.business_id" class="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                <td class="px-4 py-3 font-semibold text-gray-800 dark:text-gray-100">{{ b.business_name }}</td>
                <td class="px-4 py-3 text-gray-600 dark:text-gray-300">
                  {{ b.owner_full_name || '—' }}
                  <span v-if="b.owner_username" class="block text-xs text-gray-400">@{{ b.owner_username }}</span>
                </td>
                <td class="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                  <span class="block">{{ b.contact_email || b.contact_number || b.owner_contact_number || '—' }}</span>
                  <span v-if="b.address" class="block truncate max-w-[180px]">{{ b.address }}</span>
                </td>
                <td class="px-4 py-3 text-center text-gray-600 dark:text-gray-300">{{ b.staff_count }}</td>
                <td class="px-4 py-3 text-center text-gray-600 dark:text-gray-300">{{ b.packages_count }}</td>
                <td class="px-4 py-3 text-center text-gray-600 dark:text-gray-300">{{ b.bookings_count }}</td>
                <td class="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{{ formatDate(b.created_at) }}</td>
                <td class="px-4 py-3">
                  <span class="inline-block px-2 py-1 rounded-none text-xs font-bold" :class="statusBadgeClass(b.status)">{{ b.status }}</span>
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center justify-end gap-2 flex-wrap">
                    <button
                      @click="openDetails(b)"
                      class="text-xs font-bold px-3 py-1.5 rounded-none bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                    >Details</button>
                    <button
                      v-if="b.status === 'Pending'"
                      @click="changeStatus(b, 'Active')"
                      :disabled="pendingActionId === b.business_id"
                      class="text-xs font-bold px-3 py-1.5 rounded-none bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                    >Approve</button>
                    <button
                      v-if="b.status === 'Pending'"
                      @click="changeStatus(b, 'Rejected')"
                      :disabled="pendingActionId === b.business_id"
                      class="text-xs font-bold px-3 py-1.5 rounded-none bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
                    >Reject</button>
                    <button
                      v-if="b.status === 'Active'"
                      @click="changeStatus(b, 'Suspended')"
                      :disabled="pendingActionId === b.business_id"
                      class="text-xs font-bold px-3 py-1.5 rounded-none bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50 disabled:opacity-50"
                    >Suspend</button>
                    <button
                      v-if="b.status === 'Suspended' || b.status === 'Rejected' || b.status === 'Closed'"
                      @click="changeStatus(b, 'Active')"
                      :disabled="pendingActionId === b.business_id"
                      class="text-xs font-bold px-3 py-1.5 rounded-none bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 disabled:opacity-50"
                    >Reactivate</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <p class="text-xs text-gray-400 mt-4">
        A newly self-registered business starts as <span class="font-semibold">Pending</span> and its owner cannot log in
        until you approve it here. Suspending an active business blocks that owner, their staff, and their business admin
        from logging in until it's reactivated. Rejected and Closed businesses can also be reactivated.
      </p>
    </main>

    <!-- BUSINESS DETAILS / AUDIT TRAIL MODAL -->
    <div v-if="detailsBusiness" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div @click="closeDetails" class="absolute inset-0 bg-black/50"></div>
      <div class="relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <div class="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
          <h3 class="font-bold text-gray-900 dark:text-gray-100">{{ detailsBusiness.business_name }}</h3>
          <button @click="closeDetails" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none">&times;</button>
        </div>

        <div class="p-4 space-y-4">
          <!-- Basic info -->
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p class="text-xs text-gray-400 uppercase font-semibold">Status</p>
              <span class="inline-block mt-1 px-2 py-1 rounded-none text-xs font-bold" :class="statusBadgeClass(detailsBusiness.status)">{{ detailsBusiness.status }}</span>
            </div>
            <div>
              <p class="text-xs text-gray-400 uppercase font-semibold">Registered</p>
              <p class="text-gray-700 dark:text-gray-300 mt-1">{{ formatDate(detailsBusiness.created_at) }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-400 uppercase font-semibold">Owner</p>
              <p class="text-gray-700 dark:text-gray-300 mt-1">
                {{ detailsBusiness.owner_full_name || '—' }}
                <span v-if="detailsBusiness.owner_username" class="block text-xs text-gray-400">@{{ detailsBusiness.owner_username }}</span>
              </p>
            </div>
            <div>
              <p class="text-xs text-gray-400 uppercase font-semibold">Contact</p>
              <p class="text-gray-700 dark:text-gray-300 mt-1">{{ detailsBusiness.contact_email || detailsBusiness.contact_number || detailsBusiness.owner_contact_number || '—' }}</p>
            </div>
            <div class="col-span-2">
              <p class="text-xs text-gray-400 uppercase font-semibold">Address</p>
              <p class="text-gray-700 dark:text-gray-300 mt-1">{{ detailsBusiness.address || '—' }}</p>
            </div>
            <button
              type="button"
              @click="toggleDrillDown('staff')"
              class="text-left rounded-none"
              :class="drillDownTab === 'staff' ? 'text-emerald-700 dark:text-emerald-400' : ''"
            >
              <p class="text-xs text-gray-400 uppercase font-semibold">Staff</p>
              <p class="mt-1 underline decoration-dotted underline-offset-2" :class="drillDownTab === 'staff' ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300'">{{ detailsBusiness.staff_count }}</p>
            </button>
            <button
              type="button"
              @click="toggleDrillDown('packages')"
              class="text-left rounded-none"
            >
              <p class="text-xs text-gray-400 uppercase font-semibold">Packages</p>
              <p class="mt-1 underline decoration-dotted underline-offset-2" :class="drillDownTab === 'packages' ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300'">{{ detailsBusiness.packages_count }}</p>
            </button>
            <button
              type="button"
              @click="toggleDrillDown('bookings')"
              class="text-left rounded-none"
            >
              <p class="text-xs text-gray-400 uppercase font-semibold">Bookings</p>
              <p class="mt-1 underline decoration-dotted underline-offset-2" :class="drillDownTab === 'bookings' ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300'">{{ detailsBusiness.bookings_count }}</p>
            </button>
          </div>

          <!-- Drill-down list (Staff / Packages / Bookings) -->
          <div v-if="drillDownTab" class="pt-3 border-t border-gray-100 dark:border-gray-700">
            <p class="text-xs text-gray-400 uppercase font-semibold mb-2">
              {{ { staff: 'Staff', packages: 'Packages', bookings: 'Bookings' }[drillDownTab] }} List
            </p>

            <div v-if="isLoadingDrillDown" class="text-sm text-gray-400">Loading…</div>
            <div v-else-if="drillDownError" class="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-none">
              {{ drillDownError }}
            </div>
            <div v-else-if="drillDownRows.length === 0" class="text-sm text-gray-400">Nothing here yet.</div>

            <ul v-else class="space-y-2 max-h-48 overflow-y-auto">
              <template v-if="drillDownTab === 'staff'">
                <li v-for="row in drillDownRows" :key="row.id" class="text-sm flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <span class="font-semibold text-gray-800 dark:text-gray-100 truncate block">{{ row.full_name || row.username || '—' }}</span>
                    <span class="block text-xs text-gray-400">{{ row.role }}{{ row.position ? ' · ' + row.position : '' }}</span>
                  </div>
                  <span class="text-xs text-gray-400 whitespace-nowrap">{{ row.availability }}</span>
                </li>
              </template>
              <template v-else-if="drillDownTab === 'packages'">
                <li v-for="row in drillDownRows" :key="row.package_id" class="text-sm flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <span class="font-semibold text-gray-800 dark:text-gray-100 truncate block">{{ row.package_name }}</span>
                    <span class="block text-xs text-gray-400 truncate">{{ row.description || '—' }}</span>
                  </div>
                  <span class="text-xs text-gray-400 whitespace-nowrap">₱{{ Number(row.price_per_head).toLocaleString('en-PH') }}/head</span>
                </li>
              </template>
              <template v-else-if="drillDownTab === 'bookings'">
                <li v-for="row in drillDownRows" :key="row.booking_id" class="text-sm flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <span class="font-semibold text-gray-800 dark:text-gray-100 truncate block">{{ row.client_name }}</span>
                    <span class="block text-xs text-gray-400">{{ formatDateOnly(row.event_date) }} · {{ row.guest_count }} guests · {{ row.package_name || '—' }}</span>
                  </div>
                  <span class="text-xs text-gray-400 whitespace-nowrap">{{ row.booking_status }}</span>
                </li>
              </template>
            </ul>
          </div>

          <!-- Audit trail -->
          <div class="pt-3 border-t border-gray-100 dark:border-gray-700">
            <p class="text-xs text-gray-400 uppercase font-semibold mb-2">Status History</p>

            <div v-if="isLoadingAudit" class="text-sm text-gray-400">Loading history…</div>

            <div v-else-if="auditError" class="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-none">
              {{ auditError }}
            </div>

            <div v-else-if="auditTrail.length === 0" class="text-sm text-gray-400">No status changes recorded yet.</div>

            <ul v-else class="space-y-2">
              <li v-for="entry in auditTrail" :key="entry.audit_id" class="text-sm flex items-start justify-between gap-3">
                <div>
                  <span class="font-semibold text-gray-800 dark:text-gray-100">
                    {{ entry.old_status || 'New' }} → {{ entry.new_status }}
                  </span>
                  <span class="block text-xs text-gray-400">by {{ entry.changed_by_name || 'Unknown' }}</span>
                </div>
                <span class="text-xs text-gray-400 whitespace-nowrap">{{ formatDate(entry.created_at) }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- CONFIRM ACTION MODAL (replaces the native browser confirm() popup) -->
    <div v-if="confirmState" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50"></div>
      <div class="relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none w-full max-w-sm p-5">
        <h3 class="font-bold text-gray-900 dark:text-gray-100 mb-2">Please confirm</h3>
        <p class="text-sm text-gray-600 dark:text-gray-300 mb-5">{{ confirmState.message }}</p>
        <div class="flex justify-end gap-2">
          <button
            @click="resolveConfirm(false)"
            class="px-4 py-2 rounded-none text-sm font-semibold text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            Cancel
          </button>
          <button
            @click="resolveConfirm(true)"
            class="px-4 py-2 rounded-none text-sm font-bold text-white transition"
            :class="confirmState.danger ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'"
          >
            {{ confirmState.actionLabel || (confirmState.danger ? 'Yes, proceed' : 'Approve') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import logoUrl from '../Assets/logofinal.png'
import NotificationBell from '../Components/SuperAdminBell.vue'
import { logoutUser } from '../services/authService'
import { localToday, formatDateOnly } from '../utils/date'
import { supabase } from '../supabaseClient'
import { resetNotifications, refreshPendingBusinesses } from '../composables/useNotifications'
import {
  getPlatformStats, getPlatformBusinesses, setBusinessStatus, getBusinessStatusAudit,
  getBusinessStaffList, getBusinessPackagesList, getBusinessBookingsList,
} from '../services/superAdminService'

const FILTERS = ['All', 'Pending', 'Active', 'Suspended', 'Rejected', 'Closed']
const router = useRouter()
const route = useRoute()

const userName = ref('')
const isLoading = ref(true)
const errorMessage = ref('')
const statusFilter = ref(FILTERS.includes(route.query.filter) ? route.query.filter : 'All')
const pendingActionId = ref(null)
const businessSearch = ref('')

// Clicking "View Pending Businesses" in the bell while already on this page
// only changes the query string -- the component isn't re-created, so the
// filter above (read once at setup) never updated. Watch it.
watch(() => route.query.filter, (f) => {
  if (FILTERS.includes(f)) statusFilter.value = f
  else if (f === undefined) statusFilter.value = 'All'
})

// The reverse direction: when a chip / stat card changes the filter, mirror it
// into the URL. Without this the URL kept the old ?filter=Pending, so clicking
// "View Pending Businesses" in the bell after switching chips pushed the SAME
// location (a no-op) and the table never switched back to Pending.
watch(statusFilter, (f) => {
  const current = route.query.filter
  if (f === 'All') {
    if (current === undefined) return
    const { filter, ...rest } = route.query
    router.replace({ query: rest })
  } else if (current !== f) {
    router.replace({ query: { ...route.query, filter: f } })
  }
})

const stats = ref({
  total_businesses: 0, pending_businesses: 0, active_businesses: 0,
  suspended_businesses: 0, rejected_businesses: 0, closed_businesses: 0,
  total_owners: 0, total_staff: 0, total_clients: 0,
})
const businesses = ref([])

const filteredBusinesses = computed(() => {
  let list = statusFilter.value === 'All'
    ? businesses.value
    : businesses.value.filter(b => b.status === statusFilter.value)

  const q = businessSearch.value.trim().toLowerCase()
  if (!q) return list

  return list.filter(b => [
    b.business_name, b.owner_full_name, b.owner_username,
    b.contact_email, b.contact_number, b.owner_contact_number, b.address,
  ].some(field => (field || '').toLowerCase().includes(q)))
})

// ---------- Details / audit trail modal ----------
const detailsBusiness = ref(null)
const auditTrail = ref([])
const isLoadingAudit = ref(false)
const auditError = ref('')

// Drill-down (Staff / Packages / Bookings actual rows, not just counts)
const drillDownTab = ref(null) // 'staff' | 'packages' | 'bookings' | null
const drillDownRows = ref([])
const isLoadingDrillDown = ref(false)
const drillDownError = ref('')

let detailsToken = 0
let drillToken = 0

async function openDetails(business) {
  const token = ++detailsToken
  drillToken++
  detailsBusiness.value = business
  auditTrail.value = []
  auditError.value = ''
  isLoadingAudit.value = true
  drillDownTab.value = null
  drillDownRows.value = []
  drillDownError.value = ''
  try {
    const rows = await getBusinessStatusAudit(business.business_id)
    if (token !== detailsToken) return // another business was opened meanwhile
    auditTrail.value = rows
  } catch (error) {
    if (token !== detailsToken) return
    // Show the real reason instead of always blaming the migration -- it
    // could equally be a permissions or network error.
    auditError.value = `Couldn't load status history: ${error?.message || 'unknown error'}`
  } finally {
    if (token === detailsToken) isLoadingAudit.value = false
  }
}

function closeDetails() {
  detailsToken++
  drillToken++
  detailsBusiness.value = null
  drillDownTab.value = null
}

async function toggleDrillDown(tab) {
  if (drillDownTab.value === tab) {
    drillDownTab.value = null
    return
  }
  const token = ++drillToken
  drillDownTab.value = tab
  drillDownRows.value = []
  drillDownError.value = ''
  isLoadingDrillDown.value = true
  try {
    const businessId = detailsBusiness.value.business_id
    let rows = []
    if (tab === 'staff') rows = await getBusinessStaffList(businessId)
    else if (tab === 'packages') rows = await getBusinessPackagesList(businessId)
    else if (tab === 'bookings') rows = await getBusinessBookingsList(businessId)
    if (token !== drillToken) return // user switched tab / closed the modal
    drillDownRows.value = rows
  } catch (error) {
    if (token !== drillToken) return
    drillDownError.value = error?.message || 'Failed to load this list.'
  } finally {
    if (token === drillToken) isLoadingDrillDown.value = false
  }
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
}

function statusBadgeClass(status) {
  switch (status) {
    case 'Active': return 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
    case 'Pending': return 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
    case 'Suspended': return 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300'
    case 'Rejected':
    case 'Closed': return 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
    default: return 'bg-gray-100 text-gray-600'
  }
}

// silent = background refresh: no "Loading…" flash and no wiping the error
// banner, so the table doesn't blink after every approve/suspend or poll.
let loadToken = 0
async function loadData({ silent = false } = {}) {
  // Only the newest request may update the screen. Otherwise a slow 30s poll that
  // started BEFORE an Approve/Suspend could finish AFTER it and show the old status.
  const token = ++loadToken
  if (!silent) {
    isLoading.value = true
    errorMessage.value = ''
  }
  try {
    const [s, b] = await Promise.all([getPlatformStats(), getPlatformBusinesses()])
    if (token !== loadToken) return
    // Spread over the defaults so a missing column never renders "undefined".
    stats.value = { ...stats.value, ...s }
    businesses.value = b
    // keep the open Details modal in sync with the fresh row
    if (detailsBusiness.value) {
      const fresh = b.find((x) => x.business_id === detailsBusiness.value.business_id)
      if (fresh) detailsBusiness.value = fresh
    }
  } catch (error) {
    if (token !== loadToken) return
    // If the session expired, don't just fail quietly forever -- send the
    // user back to login. (getSession() also tries to refresh the token, so
    // this only triggers when the session is really gone.)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('user')
      resetNotifications()
      router.push('/')
      return
    }
    if (!silent) errorMessage.value = error?.message || 'Failed to load platform data.'
  } finally {
    // Any request that is still the newest one clears the spinner -- not only
    // non-silent ones. Before, a silent poll that overtook the initial load
    // discarded its result AND left "Loading…" on screen forever.
    if (token === loadToken) isLoading.value = false
  }
}

// Themed replacement for window.confirm(): opens the modal declared in the
// template and resolves once the user picks Cancel or the action button.
const confirmState = ref(null)
function askConfirm(message, danger = true, actionLabel = null) {
  confirmState.value?.resolve(false) // never leave an earlier prompt's promise hanging
  return new Promise((resolve) => {
    confirmState.value = { message, danger, actionLabel, resolve }
  })
}
function resolveConfirm(result) {
  confirmState.value?.resolve(result)
  confirmState.value = null
}

async function changeStatus(business, newStatus) {
  // "Reactivate" (Suspended/Rejected -> Active) and "Approve" (Pending ->
  // Active) both land on the same newStatus === 'Active' branch, but they
  // need different wording -- "Approve" is misleading for a business that
  // was already live before being suspended.
  const isReactivate = newStatus === 'Active' && business.status !== 'Pending'
  const confirmMsgs = {
    Active: isReactivate
      ? `Reactivate "${business.business_name}"${business.status === 'Closed' ? ' (currently Closed)' : ''}? Its owner, staff, and business admin will be able to log in again.`
      : `Approve "${business.business_name}"? Its owner and staff will be able to log in.`,
    Suspended: `Suspend "${business.business_name}"? Its owner, staff, and business admin will be locked out immediately.`,
    Rejected: `Reject "${business.business_name}"'s registration?`,
  }
  if (confirmMsgs[newStatus]) {
    const actionLabel = isReactivate ? 'Yes, reactivate' : (newStatus === 'Active' ? 'Approve' : null)
    const confirmed = await askConfirm(confirmMsgs[newStatus], newStatus !== 'Active', actionLabel)
    if (!confirmed) return
  }

  pendingActionId.value = business.business_id
  errorMessage.value = ''
  try {
    await setBusinessStatus(business.business_id, newStatus)
    await loadData({ silent: true })
    // Update the bell's red badge right away instead of waiting for its 20s poll.
    refreshPendingBusinesses()
  } catch (error) {
    errorMessage.value = error?.message || 'Failed to update status.'
  } finally {
    pendingActionId.value = null
  }
}

// ---------- Export: platform overview + businesses table as a real PDF ----------
function loadImageAsDataURL(url) {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        canvas.getContext('2d').drawImage(img, 0, 0)
        resolve(canvas.toDataURL('image/png'))
      } catch {
        resolve(null)
      }
    }
    img.onerror = () => resolve(null)
    img.src = url
  })
}

async function exportPDF() {
  const doc = new jsPDF()

  const logoDataUrl = await loadImageAsDataURL(logoUrl)
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', 14, 9, 16, 16)
  }
  const textX = logoDataUrl ? 34 : 14

  doc.setFontSize(18)
  doc.setFont(undefined, 'bold')
  doc.setTextColor(5, 150, 105)
  doc.text('Caterlytics', textX, 19)

  doc.setFontSize(10)
  doc.setFont(undefined, 'normal')
  doc.setTextColor(100)
  doc.text('Platform Console — Super Admin Report', textX, 25)
  doc.text(`Filter: ${statusFilter.value}${businessSearch.value ? `  •  Search: "${businessSearch.value}"` : ''}`, 14, 34)
  doc.text(`Generated: ${new Date().toLocaleString('en-PH')}`, 14, 39)

  doc.setDrawColor(220)
  doc.line(14, 43, 196, 43)

  autoTable(doc, {
    startY: 50,
    head: [['Metric', 'Value']],
    body: [
      ['Total Businesses', String(stats.value.total_businesses)],
      ['Pending Approval', String(stats.value.pending_businesses)],
      ['Active Tenants', String(stats.value.active_businesses)],
      ['Suspended', String(stats.value.suspended_businesses)],
      ['Rejected', String(stats.value.rejected_businesses)],
      ['Closed', String(stats.value.closed_businesses)],
      ['Owners', String(stats.value.total_owners)],
      ['Staff / Business Admins', String(stats.value.total_staff)],
      ['Clients', String(stats.value.total_clients)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [5, 150, 105] },
  })

  autoTable(doc, {
    startY: (doc.lastAutoTable?.finalY ?? 100) + 10,
    head: [['Business', 'Owner', 'Contact', 'Staff', 'Packages', 'Bookings', 'Registered', 'Status']],
    body: filteredBusinesses.value.map((b) => [
      b.business_name,
      b.owner_full_name || '—',
      b.contact_email || b.owner_contact_number || '—',
      String(b.staff_count),
      String(b.packages_count),
      String(b.bookings_count),
      formatDate(b.created_at),
      b.status,
    ]),
    theme: 'grid',
    headStyles: { fillColor: [5, 150, 105] },
    styles: { fontSize: 8 },
  })

  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(`Page ${i} of ${pageCount}`, 196, 290, { align: 'right' })
  }

  const dateSlug = localToday()
  doc.save(`caterlytics-platform-${statusFilter.value.toLowerCase()}-${dateSlug}.pdf`)
}

let refreshTimer = null

let isLoggingOut = false
const handleLogout = async () => {
  if (isLoggingOut) return // double-click guard
  isLoggingOut = true
  try {
    await logoutUser()
  } catch (error) {
    console.error('Sign-out failed:', error)
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
  let user = {}
  try {
    user = JSON.parse(storedUser) || {}
  } catch {
    router.push('/')
    return
  }
  if (user.role !== 'Super Admin') {
    router.push('/')
    return
  }
  userName.value = user.full_name || user.username || 'Super Admin'
  loadData()
  // Pick up newly registered businesses / changes made elsewhere without a
  // manual refresh (the bell already polls every 20s; keep the table in step).
  refreshTimer = setInterval(() => {
    if (!document.hidden) loadData({ silent: true })
  }, 30000)
  window.addEventListener('keydown', onKeydown)
})

function onKeydown(e) {
  if (e.key !== 'Escape') return
  if (confirmState.value) resolveConfirm(false)
  else if (detailsBusiness.value) closeDetails()
}

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
  window.removeEventListener('keydown', onKeydown)
  // never leave an awaiting changeStatus() hanging if we leave the page mid-confirm
  confirmState.value?.resolve(false)
})
</script>

<style scoped>
</style>