<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans">

    <!-- TOP NAV -->
    <header class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <img :src="logoUrl" alt="Logo" class="w-8 h-8 object-contain" />
          <span class="font-bold text-gray-800 dark:text-gray-100">Caterlytics</span>
        </div>
        <div class="flex items-center gap-3 relative">
          <div @click="showAccountMenu = !showAccountMenu" class="flex items-center gap-2 cursor-pointer px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <div class="text-right hidden sm:block">
              <p class="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-none">{{ userName }}</p>
              <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Client</p>
            </div>
            <div class="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm overflow-hidden">
              <img v-if="userAvatarUrl" :src="userAvatarUrl" alt="Profile picture" class="w-full h-full object-cover" />
              <span v-else>{{ userInitial }}</span>
            </div>
          </div>

          <!-- Click-outside backdrop -->
          <div v-if="showAccountMenu" @click="showAccountMenu = false" class="fixed inset-0 z-40"></div>

          <!-- Account menu, opens downward from the top nav -->
          <div v-if="showAccountMenu" class="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden z-50">
            <button @click="handleLogout" class="w-full flex items-center gap-2.5 text-left px-4 py-2.5 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Log Out
            </button>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-5xl mx-auto px-4 sm:px-6 py-8">

      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ greeting }}, {{ userName }}</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Book a catering package or check the status of your reservations.</p>
      </div>

      <!-- Business onboarding banner: every account starts as a plain
           Client. This is the only entry point into becoming a business
           owner (calls the register_business() RPC). -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 mb-6">
        <div>
          <p class="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Run a catering business?</p>
          <p class="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">Register it on Caterlytics to manage your own bookings, inventory, and packages.</p>
        </div>
        <button
          @click="router.push('/register-business')"
          class="shrink-0 bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-emerald-700 transition"
        >
          Register My Business
        </button>
      </div>

      <!-- TABS -->
      <div class="flex gap-1 bg-white dark:bg-gray-800 p-1 rounded-xl border border-gray-100 dark:border-gray-700 mb-6 w-fit">
        <button
          v-for="tab in tabs" :key="tab"
          @click="activeTab = tab"
          :class="activeTab === tab ? 'bg-emerald-600 dark:bg-emerald-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'"
          class="px-4 py-2 rounded-lg text-sm font-semibold transition"
        >
          {{ tab }}
        </button>
      </div>

      <!-- Global success / error banners -->
      <div v-if="successMessage" class="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm font-medium p-3 rounded-xl mb-4">
        {{ successMessage }}
      </div>
      <div v-if="pageError" class="text-red-600 dark:text-red-400 text-sm font-medium mb-4">
        {{ pageError }}
      </div>

      <!-- ============ STEP 1: PICK A CATERING BUSINESS ============ -->
      <div v-if="activeTab === 'Book Catering' && !selectedBusinessId">
        <h3 class="font-bold text-gray-800 dark:text-gray-100">Choose a Catering Business</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">Tap the caterer you want, then fill in your event details.</p>

        <div v-if="!businesses.length" class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 text-center py-14 text-gray-400 dark:text-gray-500 text-sm">
          No catering businesses are available yet.
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            v-for="b in businesses"
            :key="b.business_id"
            type="button"
            @click="selectBusiness(b.business_id)"
            class="group text-left bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl p-5 transition focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-lg flex-shrink-0">
                {{ b.business_name.charAt(0).toUpperCase() }}
              </div>
              <div class="min-w-0">
                <p class="font-bold text-gray-800 dark:text-gray-100 truncate">{{ b.business_name }}</p>
                <p v-if="b.address" class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ b.address }}</p>
              </div>
            </div>
            <p v-if="b.contact_number" class="text-xs text-gray-500 dark:text-gray-400 mt-3">{{ b.contact_number }}</p>
            <div class="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
              <span class="text-xs text-gray-500 dark:text-gray-400">{{ b.package_count }} package{{ b.package_count === 1 ? '' : 's' }}</span>
              <span class="text-sm font-bold text-emerald-600 dark:text-emerald-400">From ₱{{ formatPrice(b.min_price) }}/head</span>
            </div>
            <span class="mt-4 block w-full text-center bg-emerald-600 group-hover:bg-emerald-700 text-white py-2 rounded-xl text-sm font-semibold transition">Book with this caterer</span>
          </button>
        </div>
      </div>

      <!-- ============ STEP 2: BOOKING FORM ============ -->
      <div v-else-if="activeTab === 'Book Catering'" class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
        <div class="flex items-center justify-between gap-3 mb-5 pb-4 border-b border-gray-100 dark:border-gray-700">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-11 h-11 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold flex-shrink-0">
              {{ (selectedBusiness?.business_name || '?').charAt(0).toUpperCase() }}
            </div>
            <div class="min-w-0">
              <p class="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Booking with</p>
              <p class="font-bold text-gray-800 dark:text-gray-100 truncate">{{ selectedBusiness?.business_name }}</p>
              <p v-if="selectedBusiness?.address || selectedBusiness?.contact_number" class="text-xs text-gray-500 dark:text-gray-400 truncate">
                {{ [selectedBusiness.address, selectedBusiness.contact_number].filter(Boolean).join(' · ') }}
              </p>
            </div>
          </div>
          <button type="button" @click="clearBusiness" class="text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline whitespace-nowrap">Change</button>
        </div>

        <h3 class="font-bold text-gray-800 dark:text-gray-100 mb-4">New Booking Request</h3>

        <form @submit.prevent="submitBooking" class="space-y-5">

          <div>
            <label class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Booked Under</label>
            <input type="text" :value="userName" disabled class="w-full mt-1 p-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-500 dark:text-gray-400" />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Event Date</label>
              <input
                type="date"
                v-model="form.event_date"
                @change="handleDateCheck"
                required
                :min="todayStr"
                class="w-full mt-1 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Event Time</label>
              <input type="time" v-model="form.event_time" required class="w-full mt-1 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-gray-100" />
            </div>
          </div>

          <div v-if="conflictWarning" class="text-amber-700 dark:text-amber-300 text-sm font-medium flex gap-2">
            <svg class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86l-8.18 14.14A2 2 0 003.82 21h16.36a2 2 0 001.71-3l-8.18-14.14a2 2 0 00-3.42 0z" />
            </svg>
            <span>{{ conflictWarning }}</span>
          </div>

          <div>
            <label class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Event Location</label>
            <input type="text" v-model="form.event_location" required placeholder="e.g. Barangay Hall, Roxas City" class="w-full mt-1 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-gray-100" />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Number of Guests</label>
              <input type="number" v-model.number="form.guest_count" required min="1" class="w-full mt-1 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-gray-100" />
            </div>
            <div>
              <label class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Catering Package</label>
              <select v-model="form.package_id" :disabled="!selectedBusinessId" required class="w-full mt-1 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-gray-100">
                <option value="" disabled>{{ selectedBusinessId ? 'Select a package' : 'Select a business first' }}</option>
                <option v-for="p in businessPackages" :key="p.package_id" :value="p.package_id">
                  {{ p.package_name }} — ₱{{ formatPrice(p.price_per_head) }}/head
                </option>
              </select>
            </div>
          </div>

          <div v-if="selectedPackage" class="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl p-4">
            <p class="text-sm font-semibold text-gray-800 dark:text-gray-100">{{ selectedPackage.package_name }}</p>
            <p v-if="selectedPackage.tbl_business?.business_name" class="text-xs text-gray-500 dark:text-gray-400">by {{ selectedPackage.tbl_business.business_name }}</p>
            <p v-if="selectedPackage.description" class="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mt-3">Includes</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 whitespace-pre-line">{{ selectedPackage.description }}</p>
            <p class="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-3">
              Est. Total: ₱{{ formatPrice((selectedPackage.price_per_head || 0) * (form.guest_count || 0)) }}
            </p>
          </div>

          <button type="submit" :disabled="isSubmitting" class="w-full bg-emerald-600 text-white p-3.5 rounded-xl font-bold text-sm hover:bg-emerald-700 transition disabled:opacity-50">
            {{ isSubmitting ? 'Submitting...' : 'Submit Booking Request' }}
          </button>
        </form>
      </div>

      <!-- ============ MY BOOKINGS TAB ============ -->
      <div v-else-if="activeTab === 'My Bookings'">
        <div v-if="isLoading" class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 text-center py-14 text-gray-400 dark:text-gray-500">
          Loading your bookings...
        </div>
        <div v-else-if="myBookings.length === 0" class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 text-center py-14">
          <p class="text-gray-400 dark:text-gray-500 text-sm">You haven't made any bookings yet.</p>
          <button @click="activeTab = 'Book Catering'" class="mt-3 text-emerald-600 dark:text-emerald-400 font-semibold text-sm hover:underline">
            Book your first event
          </button>
        </div>
        <div v-else class="grid gap-4">
          <div v-for="b in myBookings" :key="b.booking_id" class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div class="min-w-0">
              <p class="font-bold text-gray-800 dark:text-gray-100">{{ b.package_name || 'Custom Booking' }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5 break-words">{{ formatDate(b.event_date) }} at {{ b.event_time }} — <span class="capitalize">{{ b.event_location }}</span></p>
              <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">{{ b.guest_count }} guests</p>

              <div v-if="b.tbl_payments" class="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span :class="paymentBadgeClass(b.tbl_payments.payment_status)" class="px-2.5 py-1 rounded-full text-xs font-semibold">
                  {{ b.tbl_payments.payment_status }}
                </span>
                <span class="text-xs text-gray-500 dark:text-gray-400">
                  Paid: ₱{{ formatPrice(b.tbl_payments.amount_paid) }} / ₱{{ formatPrice(b.tbl_payments.total_amount) }}
                </span>
                <span v-if="Number(b.tbl_payments.balance) > 0" class="text-xs font-semibold text-amber-600 dark:text-amber-400">
                  Balance: ₱{{ formatPrice(b.tbl_payments.balance) }}
                </span>
                <button @click="downloadReceipt(b)" class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
                  Download Receipt
                </button>
              </div>
            </div>
            <div class="flex items-center gap-3 flex-shrink-0">
              <button
                v-if="b.booking_status === 'Pending'"
                @click="openEditModal(b)"
                class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:underline"
              >
                Edit
              </button>
              <button
                v-if="['Pending', 'Confirmed'].includes(b.booking_status)"
                @click="confirmCancel(b)"
                class="text-xs font-semibold text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-400 hover:underline"
              >
                Cancel
              </button>
              <span :class="statusBadgeClass(b.booking_status)" class="px-3 py-1.5 rounded-full text-xs font-semibold">
                {{ b.booking_status }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- ============ CANCEL CONFIRM MODAL ============ -->
      <div v-if="bookingToCancel" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-6">
          <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Cancel this booking?</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-5">
            This is for <span class="font-semibold text-gray-700 dark:text-gray-200">{{ formatDate(bookingToCancel.event_date) }}</span> at {{ bookingToCancel.event_location }}. This can't be undone once cancelled.
          </p>
          <div class="flex gap-3">
            <button @click="bookingToCancel = null" class="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
              Keep Booking
            </button>
            <button @click="handleCancelBooking" :disabled="isCancelling" class="flex-1 bg-red-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-red-700 disabled:opacity-50">
              {{ isCancelling ? 'Cancelling...' : 'Yes, Cancel' }}
            </button>
          </div>
        </div>
      </div>

      <!-- ============ EDIT BOOKING MODAL ============ -->
      <div v-if="bookingToEdit" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
          <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">Edit Booking</h3>
          <p class="text-xs text-gray-400 dark:text-gray-500 mb-5">Only Pending bookings can be edited.</p>

          <form @submit.prevent="handleSaveEdit" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Event Date</label>
                <input
                  type="date"
                  v-model="editForm.event_date"
                  @change="handleEditDateCheck"
                  required
                  :min="todayStr"
                  class="w-full mt-1 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Event Time</label>
                <input type="time" v-model="editForm.event_time" required class="w-full mt-1 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-gray-100" />
              </div>
            </div>

            <div v-if="editConflictWarning" class="text-amber-700 dark:text-amber-300 text-sm font-medium">
              {{ editConflictWarning }}
            </div>

            <div>
              <label class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Event Location</label>
              <input type="text" v-model="editForm.event_location" required class="w-full mt-1 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-gray-100" />
            </div>

            <div>
              <label class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Catering Business</label>
              <select v-model="editBusinessId" @change="editForm.package_id = ''" required class="w-full mt-1 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-gray-100">
                <option value="" disabled>Select a catering business</option>
                <option v-for="b in businesses" :key="b.business_id" :value="b.business_id">{{ b.business_name }}</option>
              </select>
              <p v-if="!businesses.length" class="text-xs text-gray-500 dark:text-gray-400 mt-1">No catering businesses are available yet.</p>
              <p v-else-if="editBusiness?.address || editBusiness?.contact_number" class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {{ [editBusiness.address, editBusiness.contact_number].filter(Boolean).join(' · ') }}
              </p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Number of Guests</label>
                <input type="number" v-model.number="editForm.guest_count" required min="1" class="w-full mt-1 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-gray-100" />
              </div>
              <div>
                <label class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Catering Package</label>
                <select v-model="editForm.package_id" :disabled="!editBusinessId" required class="w-full mt-1 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-gray-100">
                  <option value="" disabled>{{ editBusinessId ? 'Select a package' : 'Select a business first' }}</option>
                  <option v-for="p in editBusinessPackages" :key="p.package_id" :value="p.package_id">
                    {{ p.package_name }} — ₱{{ formatPrice(p.price_per_head) }}/head
                  </option>
                </select>
              </div>
            </div>

            <div v-if="selectedEditPackage" class="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl p-4">
              <p class="text-sm font-semibold text-gray-800 dark:text-gray-100">{{ selectedEditPackage.package_name }}</p>
              <p v-if="selectedEditPackage.tbl_business?.business_name" class="text-xs text-gray-500 dark:text-gray-400">by {{ selectedEditPackage.tbl_business.business_name }}</p>
              <p v-if="selectedEditPackage.description" class="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mt-3">Includes</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 whitespace-pre-line">{{ selectedEditPackage.description }}</p>
              <p class="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-3">
                Est. Total: ₱{{ formatPrice((selectedEditPackage.price_per_head || 0) * (editForm.guest_count || 0)) }}
              </p>
            </div>

            <div class="flex gap-3 pt-2">
              <button type="button" @click="bookingToEdit = null" class="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
                Cancel
              </button>
              <button type="submit" :disabled="isSaving || !!editConflictWarning" class="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50">
                {{ isSaving ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </form>
        </div>
      </div>

    </main>
  </div>
</template>

<script setup>
import logoUrl from '../Assets/logofinal.png'
import { toTitleCase } from '../utils/textFormat'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { createBooking, getMyBookings, checkDateConflict, cancelMyBooking, updateMyBooking } from '../services/bookingService'
import { getAllPackages } from '../services/packageService'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const router = useRouter()

const userName = ref('')
const userInitial = ref('U')
const userAvatarUrl = ref('')
const showAccountMenu = ref(false)

const greeting = (() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
})()

const tabs = ['Book Catering', 'My Bookings']
const activeTab = ref('Book Catering')

const packages = ref([])
const selectedBusinessId = ref('')
const editBusinessId = ref('')
const myBookings = ref([])
const bookingToCancel = ref(null)
const isCancelling = ref(false)

const bookingToEdit = ref(null)
const isSaving = ref(false)
const editConflictWarning = ref('')
const editForm = ref({
  event_date: '',
  event_time: '',
  event_location: '',
  guest_count: null,
  package_id: ''
})

const isLoading = ref(false)
const isSubmitting = ref(false)
const successMessage = ref('')
const pageError = ref('')
const conflictWarning = ref('')

const todayStr = new Date().toISOString().split('T')[0]

const form = ref({
  event_date: '',
  event_time: '',
  event_location: '',
  guest_count: null,
  package_id: '',
  client_email: ''
})

const selectedPackage = computed(() => packages.value.find((p) => p.package_id === form.value.package_id))
const selectedEditPackage = computed(() => packages.value.find((p) => p.package_id === editForm.value.package_id))

// Catering businesses the client can book from, derived from the packages
// they can see (only businesses with at least one package show up).
const businesses = computed(() => {
  const map = new Map()
  for (const p of packages.value) {
    if (!p.business_id) continue
    const price = Number(p.price_per_head) || 0
    const existing = map.get(p.business_id)
    if (existing) {
      existing.package_count += 1
      existing.min_price = Math.min(existing.min_price, price)
    } else {
      map.set(p.business_id, {
        business_id: p.business_id,
        business_name: p.tbl_business?.business_name || 'Unnamed business',
        address: p.tbl_business?.address || '',
        contact_number: p.tbl_business?.contact_number || '',
        package_count: 1,
        min_price: price
      })
    }
  }
  return [...map.values()].sort((a, b) => a.business_name.localeCompare(b.business_name))
})
const selectedBusiness = computed(() => businesses.value.find((b) => b.business_id === selectedBusinessId.value))
const editBusiness = computed(() => businesses.value.find((b) => b.business_id === editBusinessId.value))
const businessPackages = computed(() => packages.value.filter((p) => p.business_id === selectedBusinessId.value))
const editBusinessPackages = computed(() => packages.value.filter((p) => p.business_id === editBusinessId.value))

function selectBusiness(id) {
  selectedBusinessId.value = id
  form.value.package_id = ''
  conflictWarning.value = ''
  // A date may already be filled in from before; re-check it for this business.
  if (form.value.event_date) handleDateCheck()
}

function clearBusiness() {
  selectedBusinessId.value = ''
  form.value.package_id = ''
  conflictWarning.value = ''
}

onMounted(() => {
  const storedUser = sessionStorage.getItem('user')
  if (!storedUser) {
    router.push('/')
    return
  }
  const user = JSON.parse(storedUser)
  if (user.role !== 'Client') {
    router.push('/admin/dashboard')
    return
  }
  userName.value = user.full_name
  userInitial.value = user.full_name.charAt(0).toUpperCase()
  userAvatarUrl.value = user.avatar_url || ''
  form.value.client_email = user.email || ''

  loadPackages()
  loadMyBookings()
})

async function loadPackages() {
  try {
    packages.value = await getAllPackages()
  } catch (error) {
    console.error(error)
  }
}

async function loadMyBookings() {
  isLoading.value = true
  try {
    myBookings.value = await getMyBookings()
  } catch (error) {
    pageError.value = 'Failed to load your bookings.'
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

function confirmCancel(booking) {
  bookingToCancel.value = booking
}

async function handleCancelBooking() {
  if (!bookingToCancel.value) return
  isCancelling.value = true
  try {
    await cancelMyBooking(bookingToCancel.value.booking_id)
    const cancelled = bookingToCancel.value
    const target = myBookings.value.find((b) => b.booking_id === cancelled.booking_id)
    if (target) target.booking_status = 'Cancelled'
    bookingToCancel.value = null
  } catch (error) {
    pageError.value = error.message || 'Failed to cancel booking.'
    console.error(error)
  } finally {
    isCancelling.value = false
  }
}

function openEditModal(booking) {
  bookingToEdit.value = booking
  editConflictWarning.value = ''
  editForm.value = {
    event_date: booking.event_date,
    event_time: booking.event_time,
    event_location: booking.event_location,
    guest_count: booking.guest_count,
    package_id: booking.package_id || ''
  }
  editBusinessId.value = packages.value.find((p) => p.package_id === booking.package_id)?.business_id || ''
}

async function handleEditDateCheck() {
  editConflictWarning.value = ''
  if (!editForm.value.event_date || !bookingToEdit.value) return
  if (editForm.value.event_date === bookingToEdit.value.event_date) return
  try {
    const result = await checkDateConflict(editForm.value.event_date, editBusinessId.value || null, bookingToEdit.value.booking_id)
    if (result.conflict) {
      editConflictWarning.value = 'This date already has a booking. Please choose another date before saving.'
    }
  } catch (error) {
    console.error('Conflict check failed:', error)
  }
}

async function handleSaveEdit() {
  if (!bookingToEdit.value) return
  isSaving.value = true
  pageError.value = ''
  try {
    const updated = await updateMyBooking(bookingToEdit.value.booking_id, {
      event_date: editForm.value.event_date,
      event_time: editForm.value.event_time,
      event_location: editForm.value.event_location,
      guest_count: editForm.value.guest_count,
      package_name: selectedEditPackage.value?.package_name || null,
      package_id: selectedEditPackage.value?.package_id || null
    })
    const target = myBookings.value.find((b) => b.booking_id === updated.booking_id)
    if (target) Object.assign(target, updated)
    successMessage.value = 'Booking updated!'
    bookingToEdit.value = null
  } catch (error) {
    pageError.value = error.message || 'Failed to update booking.'
    console.error(error)
  } finally {
    isSaving.value = false
  }
}

async function handleDateCheck() {
  conflictWarning.value = ''
  if (!form.value.event_date) return
  try {
    const result = await checkDateConflict(form.value.event_date, selectedBusinessId.value || null)
    if (result.conflict) {
      conflictWarning.value = 'This date already has a booking. Please choose another date before submitting.'
    }
  } catch (error) {
    console.error('Conflict check failed:', error)
  }
}

async function submitBooking() {
  successMessage.value = ''
  pageError.value = ''
  isSubmitting.value = true

  try {
    await createBooking({
      client_name: userName.value,
      client_email: form.value.client_email,
      event_date: form.value.event_date,
      event_time: form.value.event_time,
      event_location: form.value.event_location,
      guest_count: form.value.guest_count,
      package_name: selectedPackage.value?.package_name || null,
      package_id: form.value.package_id || null,
      business_id: selectedBusinessId.value || null
    })

    successMessage.value = 'Booking request submitted! We will confirm it shortly.'
    form.value = { ...form.value, event_date: '', event_time: '', event_location: '', guest_count: null, package_id: '' }
    selectedBusinessId.value = ''
    conflictWarning.value = ''
    await loadMyBookings()
    activeTab.value = 'My Bookings'
  } catch (error) {
    pageError.value = error.message || 'Something went wrong. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}
function statusBadgeClass(status) {
  switch (status) {
    case 'Confirmed': return 'text-emerald-700 dark:text-emerald-300'
    case 'Pending': return 'text-amber-700 dark:text-amber-300'
    case 'Completed': return 'text-blue-700 dark:text-blue-300'
    case 'Cancelled': return 'text-red-700 dark:text-red-300'
    default: return 'text-gray-600 dark:text-gray-300'
  }
}

function paymentBadgeClass(status) {
  switch (status) {
    case 'Paid': return 'text-emerald-700 dark:text-emerald-300'
    case 'Partial': return 'text-amber-700 dark:text-amber-300'
    case 'Unpaid': return 'text-red-700 dark:text-red-300'
    default: return 'text-gray-600 dark:text-gray-300'
  }
}

// Official receipt PDF, generated on-the-fly from the client's own booking +
// payment record (same approach as the Admin/Staff receipt in
// PaymentManagement.vue — no dedicated "receipts" table exists in the
// schema, see ERD Figure 5). Receipt No. is derived from the stable
// payment_id so re-downloading always yields the same number.
function downloadReceipt(booking) {
  const payment = booking.tbl_payments
  if (!payment) return

  const doc = new jsPDF()
  const receiptNo = `OR-${String(payment.payment_id).padStart(6, '0')}`
  const issuedOn = new Date().toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })

  doc.setFontSize(18)
  doc.setFont(undefined, 'bold')
  doc.setTextColor(5, 150, 105)
  doc.text('Caterlytics', 14, 18)

  doc.setFontSize(10)
  doc.setFont(undefined, 'normal')
  doc.setTextColor(100)
  doc.text('Catering-Service Management & Inventory System', 14, 24)

  doc.setFontSize(14)
  doc.setFont(undefined, 'bold')
  doc.setTextColor(17, 24, 39)
  doc.text('OFFICIAL RECEIPT', 196, 18, { align: 'right' })
  doc.setFontSize(10)
  doc.setFont(undefined, 'normal')
  doc.setTextColor(100)
  doc.text(receiptNo, 196, 24, { align: 'right' })
  doc.text(`Issued: ${issuedOn}`, 196, 29, { align: 'right' })

  doc.setDrawColor(220)
  doc.line(14, 34, 196, 34)

  autoTable(doc, {
    startY: 40,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 1.5 },
    body: [
      ['Client Name', toTitleCase(userName.value) || '—'],
      ['Event Date', formatDate(booking.event_date)],
      ['Event Location', toTitleCase(booking.event_location) || '—'],
      ['Guest Count', booking.guest_count != null ? String(booking.guest_count) : '—'],
      ['Package', booking.package_name || '—'],
    ],
    columnStyles: { 0: { fontStyle: 'bold', textColor: [107, 114, 128], cellWidth: 45 } },
  })

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 6,
    head: [['Description', 'Amount']],
    body: [
      ['Total Package Cost', `PHP ${Number(payment.total_amount).toLocaleString()}`],
      ['Amount Paid to Date', `PHP ${Number(payment.amount_paid).toLocaleString()}`],
      ['Remaining Balance', `PHP ${Number(payment.balance).toLocaleString()}`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [5, 150, 105] },
    foot: [['Payment Status', payment.payment_status]],
    footStyles: { fillColor: [243, 244, 246], textColor: [17, 24, 39], fontStyle: 'bold' },
  })

  const finalY = doc.lastAutoTable.finalY + 20
  doc.setFontSize(9)
  doc.setTextColor(150)
  doc.text('This receipt was generated by the Caterlytics system and reflects the payment record on file.', 14, finalY)

  doc.save(`caterlytics-receipt-${receiptNo}.pdf`)
}

function formatPrice(value) {
  const num = Number(value) || 0
  return num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
}

function handleLogout() {
  sessionStorage.removeItem('token')
  sessionStorage.removeItem('user')
  router.push('/')
}
</script>