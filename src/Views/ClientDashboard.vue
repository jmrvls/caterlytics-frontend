<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans">

    <!-- TOP NAV -->
    <header class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
      <div class="w-full px-4 sm:px-6 lg:px-10 py-4 flex items-center justify-between">
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
            <button @click="showAccountMenu = false; router.push('/settings')" class="w-full flex items-center gap-2.5 text-left px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
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
        </div>
      </div>
    </header>

    <main class="w-full px-4 sm:px-6 lg:px-10 py-8">

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

        <div v-if="businesses.length" class="relative mb-4">
          <svg class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            v-model="businessSearch"
            placeholder="Search by name or address..."
            class="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-gray-100"
          />
        </div>

        <div v-if="!businesses.length" class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 text-center py-14 text-gray-400 dark:text-gray-500 text-sm">
          No catering businesses are available yet.
        </div>

        <div v-else-if="!filteredBusinessesForBooking.length" class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 text-center py-14 text-gray-400 dark:text-gray-500 text-sm">
          No businesses match "{{ businessSearch }}".
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            v-for="b in filteredBusinessesForBooking"
            :key="b.business_id"
            type="button"
            @click="selectBusiness(b.business_id)"
            class="group text-left bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl p-5 transition focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <div class="flex items-center gap-3">
              <img
                v-if="b.logo_url"
                :src="b.logo_url"
                :alt="b.business_name"
                class="w-12 h-12 rounded-full object-cover flex-shrink-0 border border-gray-200 dark:border-gray-700"
              />
              <div v-else class="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-lg flex-shrink-0">
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
        <button type="button" @click="clearBusiness" class="flex items-center gap-1.5 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 mb-4">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>
        <div class="flex items-center justify-between gap-3 mb-5 pb-4 border-b border-gray-100 dark:border-gray-700">
          <div class="flex items-center gap-3 min-w-0">
            <img
              v-if="selectedBusiness?.logo_url"
              :src="selectedBusiness.logo_url"
              :alt="selectedBusiness.business_name"
              class="w-11 h-11 rounded-full object-cover flex-shrink-0 border border-gray-200 dark:border-gray-700"
            />
            <div v-else class="w-11 h-11 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold flex-shrink-0">
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
              <div class="flex items-center justify-between">
                <label class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Event Date</label>
                <button v-if="selectedBusinessId" type="button" @click="showCalendar = !showCalendar" class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
                  {{ showCalendar ? 'Hide calendar' : 'Check availability' }}
                </button>
              </div>
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

          <div v-if="selectedBusinessId && showCalendar" class="max-w-[320px] mx-auto bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl p-4">
            <div class="flex items-center justify-between mb-3">
              <button type="button" @click="goToPrevMonth" class="w-7 h-7 rounded-md border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-sm font-bold">‹</button>
              <p class="text-sm font-bold text-gray-700 dark:text-gray-200">{{ calendarMonthLabel }}</p>
              <button type="button" @click="goToNextMonth" class="w-7 h-7 rounded-md border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-sm font-bold">›</button>
            </div>
            <div class="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase text-gray-400 dark:text-gray-500 mb-1.5">
              <span v-for="wd in ['S','M','T','W','T','F','S']" :key="wd">{{ wd }}</span>
            </div>
            <div v-if="isLoadingCalendar" class="text-xs text-gray-400 dark:text-gray-500 text-center py-6">Loading…</div>
            <div v-else class="grid grid-cols-7 gap-1">
              <button
                v-for="(day, idx) in calendarDays"
                :key="idx"
                type="button"
                :disabled="!day.inMonth || day.isPast || day.isTaken"
                @click="pickCalendarDate(day)"
                class="h-9 w-9 rounded-lg text-xs font-semibold flex items-center justify-center transition mx-auto"
                :class="!day.inMonth ? 'invisible' :
                  day.isSelected ? 'bg-emerald-600 text-white' :
                  day.isTaken ? 'bg-red-100 dark:bg-red-900/30 text-red-400 line-through cursor-not-allowed' :
                  day.isPast ? 'text-gray-300 dark:text-gray-700 cursor-not-allowed' :
                  'text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'"
              >{{ day.day }}</button>
            </div>
            <div class="flex items-center justify-center gap-4 mt-3 text-[10px] text-gray-400 dark:text-gray-500">
              <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded bg-red-200 dark:bg-red-900/50 inline-block"></span> Booked</span>
              <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded bg-emerald-600 inline-block"></span> Selected</span>
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

          <div>
            <label class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Number of Guests</label>
            <input type="number" v-model.number="form.guest_count" required min="1" class="w-full sm:w-1/2 mt-1 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-gray-100" />
          </div>

          <!-- ============ CATERING PACKAGE (card selector) ============ -->
          <div>
            <label class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 block mb-2">Catering Package</label>

            <p v-if="!selectedBusinessId" class="text-sm text-gray-400 dark:text-gray-500">Select a business first.</p>
            <p v-else-if="!businessPackages.length" class="text-sm text-gray-400 dark:text-gray-500">This business has no packages yet.</p>

            <div v-else class="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible sm:mx-0 sm:px-0">
              <button
                v-for="p in businessPackages"
                :key="p.package_id"
                type="button"
                @click="form.package_id = p.package_id; loadPackageMenu(p.package_id)"
                class="flex-shrink-0 w-40 sm:w-full text-left rounded-xl border-2 overflow-hidden transition"
                :class="form.package_id === p.package_id
                  ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-50 dark:bg-emerald-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 hover:border-emerald-300 dark:hover:border-emerald-700'"
              >
                <div class="w-full h-24 bg-gray-200 dark:bg-gray-800 overflow-hidden">
                  <img v-if="p.image_url" :src="p.image_url" :alt="p.package_name" class="w-full h-full object-cover" />
                  <div v-else class="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-600 text-[11px]">No image</div>
                </div>
                <div class="p-2.5">
                  <p class="text-xs font-semibold text-gray-800 dark:text-gray-100 truncate">{{ p.package_name }}</p>
                  <p class="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">₱{{ formatPrice(p.price_per_head) }}/head</p>
                </div>
              </button>
            </div>
          </div>

          <div v-if="selectedPackage" class="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden">
            <img v-if="selectedPackage.image_url" :src="selectedPackage.image_url" :alt="selectedPackage.package_name" class="w-full h-32 object-cover" />
            <div class="p-4">
            <p class="text-sm font-semibold text-gray-800 dark:text-gray-100">{{ selectedPackage.package_name }}</p>
            <p v-if="selectedPackage.tbl_business?.business_name" class="text-xs text-gray-500 dark:text-gray-400">by {{ selectedPackage.tbl_business.business_name }}</p>
            <p v-if="selectedPackage.description" class="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mt-3">Includes</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 whitespace-pre-line">{{ selectedPackage.description }}</p>
            <p class="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-3">
              Est. Total: ₱{{ formatPrice((selectedPackage.price_per_head || 0) * (form.guest_count || 0) + addonsSubtotal) }}
            </p>
            </div>
          </div>

          <!-- ============ EXTRA ADD-ONS (ala carte, optional) ============ -->
          <div v-if="isLoadingAddons" class="text-sm text-gray-400 dark:text-gray-500 text-center py-3">
            Loading add-ons...
          </div>
          <div v-else-if="businessAddons.length" class="space-y-2">
            <p class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Extra Add-Ons (optional)</p>
            <div class="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl divide-y divide-gray-100 dark:divide-gray-700">
              <div v-for="a in businessAddons" :key="a.addon_id" class="flex items-center justify-between gap-3 p-3">
                <div class="min-w-0">
                  <p class="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{{ a.addon_name }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">₱{{ formatPrice(a.price) }} · {{ a.unit_label }}<span v-if="a.description"> — {{ a.description }}</span></p>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                  <button type="button" @click="setAddonQuantity(a.addon_id, (addonQuantities[a.addon_id] || 0) - 1)" class="w-7 h-7 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center font-bold">−</button>
                  <span class="w-5 text-center text-sm font-semibold text-gray-800 dark:text-gray-100">{{ addonQuantities[a.addon_id] || 0 }}</span>
                  <button type="button" @click="setAddonQuantity(a.addon_id, (addonQuantities[a.addon_id] || 0) + 1)" class="w-7 h-7 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center font-bold">+</button>
                </div>
              </div>
            </div>
            <p v-if="addonsSubtotal > 0" class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 text-right">+ ₱{{ formatPrice(addonsSubtotal) }} in add-ons</p>
          </div>

          <!-- ============ CHOOSE YOUR MENU (main module) ============ -->
          <div v-if="isLoadingPackageMenu" class="text-sm text-gray-400 dark:text-gray-500 text-center py-3">
            Loading menu choices...
          </div>
          <div v-else-if="packageMenuCategories.length" class="space-y-4">
            <p class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Choose Your Menu</p>
            <div v-for="cat in packageMenuCategories" :key="cat.category" class="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl p-4">
              <div class="flex items-center justify-between mb-2">
                <p class="text-sm font-semibold text-gray-800 dark:text-gray-100">{{ cat.category }}</p>
                <span
                  class="text-xs font-bold"
                  :class="(selectedMenuItems[cat.category]?.length || 0) >= cat.max ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'"
                >
                  {{ selectedMenuItems[cat.category]?.length || 0 }} / {{ cat.max }} selected
                </span>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                <label
                  v-for="item in cat.items"
                  :key="item.item_id"
                  class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    :checked="(selectedMenuItems[cat.category] || []).includes(item.item_id)"
                    :disabled="!(selectedMenuItems[cat.category] || []).includes(item.item_id) && (selectedMenuItems[cat.category]?.length || 0) >= cat.max"
                    @change="toggleMenuItem(cat.category, item.item_id, cat.max)"
                    class="rounded-none accent-emerald-600"
                  />
                  {{ item.item_name }}
                </label>
              </div>
            </div>
          </div>

          <button type="submit" :disabled="isSubmitting" class="w-full bg-emerald-600 text-white p-3.5 rounded-xl font-bold text-sm hover:bg-emerald-700 transition disabled:opacity-50">
            {{ isSubmitting ? 'Submitting...' : 'Submit Booking Request' }}
          </button>
        </form>
      </div>

      <!-- ============ MY BOOKINGS TAB ============ -->
      <div v-else-if="activeTab === 'My Bookings'">
        <div
          v-for="change in statusChangeAlerts"
          :key="change.booking.booking_id"
          class="flex items-start justify-between gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-3"
        >
          <p class="text-sm text-blue-800 dark:text-blue-300">
            <span class="font-semibold">{{ change.booking.package_name || 'Your booking' }}</span>
            for {{ formatDate(change.booking.event_date) }} is now
            <span class="font-bold">{{ change.to }}</span>.
          </p>
          <button @click="dismissStatusAlert(change.booking.booking_id)" class="text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 flex-shrink-0" aria-label="Dismiss">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

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
              <p v-if="b.addons?.length" class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Add-ons: {{ b.addons.map(a => `${a.addon_name} ×${a.quantity}`).join(', ') }} (+₱{{ formatPrice(sumAddons(b.addons)) }})
              </p>

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
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">
            This is for <span class="font-semibold text-gray-700 dark:text-gray-200">{{ formatDate(bookingToCancel.event_date) }}</span> at {{ bookingToCancel.event_location }}. This can't be undone once cancelled.
          </p>
          <p
            v-if="bookingToCancel.tbl_payments && Number(bookingToCancel.tbl_payments.amount_paid) > 0"
            class="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-5"
          >
            You've already paid ₱{{ formatPrice(bookingToCancel.tbl_payments.amount_paid) }} toward this booking. Refunds for cancelled bookings are handled directly with the business — please coordinate with them after cancelling.
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
              <select v-model="editBusinessId" @change="editForm.package_id = ''; loadEditPackageMenu(''); loadEditBusinessAddons(editBusinessId)" required class="w-full mt-1 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-gray-100">
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
                <select v-model="editForm.package_id" @change="handleEditPackageChange" :disabled="!editBusinessId" required class="w-full mt-1 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-gray-100">
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
                Est. Total: ₱{{ formatPrice((selectedEditPackage.price_per_head || 0) * (editForm.guest_count || 0) + editAddonsSubtotal) }}
              </p>
            </div>

            <!-- ============ EXTRA ADD-ONS (edit, ala carte, optional) ============ -->
            <div v-if="isLoadingEditAddons" class="text-sm text-gray-400 dark:text-gray-500 text-center py-3">
              Loading add-ons...
            </div>
            <div v-else-if="editBusinessAddons.length" class="space-y-2">
              <p class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Extra Add-Ons (optional)</p>
              <div class="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl divide-y divide-gray-100 dark:divide-gray-700">
                <div v-for="a in editBusinessAddons" :key="a.addon_id" class="flex items-center justify-between gap-3 p-3">
                  <div class="min-w-0">
                    <p class="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{{ a.addon_name }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">₱{{ formatPrice(a.price) }} · {{ a.unit_label }}</p>
                  </div>
                  <div class="flex items-center gap-2 flex-shrink-0">
                    <button type="button" @click="setEditAddonQuantity(a.addon_id, (editAddonQuantities[a.addon_id] || 0) - 1)" class="w-7 h-7 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center font-bold">−</button>
                    <span class="w-5 text-center text-sm font-semibold text-gray-800 dark:text-gray-100">{{ editAddonQuantities[a.addon_id] || 0 }}</span>
                    <button type="button" @click="setEditAddonQuantity(a.addon_id, (editAddonQuantities[a.addon_id] || 0) + 1)" class="w-7 h-7 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center font-bold">+</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- ============ CHOOSE YOUR MENU (edit) ============ -->
            <div v-if="isLoadingEditPackageMenu" class="text-sm text-gray-400 dark:text-gray-500 text-center py-3">
              Loading menu choices...
            </div>
            <div v-else-if="editPackageMenuCategories.length" class="space-y-4">
              <p class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Choose Your Menu</p>
              <div v-for="cat in editPackageMenuCategories" :key="cat.category" class="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl p-4">
                <div class="flex items-center justify-between mb-2">
                  <p class="text-sm font-semibold text-gray-800 dark:text-gray-100">{{ cat.category }}</p>
                  <span
                    class="text-xs font-bold"
                    :class="(editSelectedMenuItems[cat.category]?.length || 0) >= cat.max ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'"
                  >
                    {{ editSelectedMenuItems[cat.category]?.length || 0 }} / {{ cat.max }} selected
                  </span>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                  <label
                    v-for="item in cat.items"
                    :key="item.item_id"
                    class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      :checked="(editSelectedMenuItems[cat.category] || []).includes(item.item_id)"
                      :disabled="!(editSelectedMenuItems[cat.category] || []).includes(item.item_id) && (editSelectedMenuItems[cat.category]?.length || 0) >= cat.max"
                      @change="toggleEditMenuItem(cat.category, item.item_id, cat.max)"
                      class="rounded-none accent-emerald-600"
                    />
                    {{ item.item_name }}
                  </label>
                </div>
              </div>
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
import { createBooking, getMyBookings, checkDateConflict, getTakenDates, cancelMyBooking, updateMyBooking, setBookingSelections, getBookingSelections } from '../services/bookingService'
import { getAllPackages, getPackageMenu, MENU_CATEGORIES } from '../services/packageService'
import { getBusinessAddons, getBookingAddons, setBookingAddons, sumAddons } from '../services/addonService'
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

// Package menu for the EDIT modal -- mirrors the "Choose Your Menu" state
// below, but kept separate so editing a booking doesn't clobber the new
// booking form's in-progress selections.
const editPackageMenu = ref({ limits: [], itemsByCategory: {} })
const editSelectedMenuItems = ref({}) // { [category]: [item_id, ...] }
const isLoadingEditPackageMenu = ref(false)
const editAllMenuItemsFlat = ref([])

const isLoading = ref(false)
const isSubmitting = ref(false)
const successMessage = ref('')
const pageError = ref('')
const conflictWarning = ref('')

// Booking status-change alerts: since a client isn't paying online or being
// emailed, this is how they find out a Pending booking got Confirmed/Rejected
// since their last visit. No backend table needed -- just remembers what was
// last seen, per user, in localStorage.
const statusChangeAlerts = ref([])
let currentUserId = ''

const todayStr = new Date().toISOString().split('T')[0]

// ---------- Availability calendar (Book Catering step) ----------
// Shows a whole month of a business's Pending/Confirmed dates up front, so
// the client sees what's already taken before typing/picking a date instead
// of only finding out after (handleDateCheck still runs as the final,
// race-condition-safe check right before submit).
const calendarViewDate = ref(startOfMonth(new Date())) // first day of the month currently shown
const takenDates = ref(new Set()) // Set of 'YYYY-MM-DD' strings, for the viewed month
const isLoadingCalendar = ref(false)
const showCalendar = ref(false)

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function toDateStr(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const calendarMonthLabel = computed(() =>
  calendarViewDate.value.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
)

// Sun-first 6x7 grid: leading/trailing days from adjacent months are shown
// (dimmed, unclickable) purely so the grid lines up, matching how native
// date pickers look.
const calendarDays = computed(() => {
  const first = calendarViewDate.value
  const startWeekday = first.getDay() // 0 = Sun
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()
  const days = []

  for (let i = 0; i < startWeekday; i++) {
    days.push({ inMonth: false })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(first.getFullYear(), first.getMonth(), d)
    const dateStr = toDateStr(date)
    days.push({
      inMonth: true,
      day: d,
      dateStr,
      isPast: dateStr < todayStr,
      isTaken: takenDates.value.has(dateStr),
      isSelected: form.value.event_date === dateStr,
    })
  }
  while (days.length % 7 !== 0) {
    days.push({ inMonth: false })
  }
  return days
})

async function loadCalendarMonth() {
  if (!selectedBusinessId.value) return
  const first = calendarViewDate.value
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0)
  isLoadingCalendar.value = true
  try {
    const dates = await getTakenDates(selectedBusinessId.value, toDateStr(first), toDateStr(last))
    takenDates.value = new Set(dates)
  } catch (error) {
    console.error('Failed to load calendar availability:', error)
    takenDates.value = new Set()
  } finally {
    isLoadingCalendar.value = false
  }
}

function goToPrevMonth() {
  const d = calendarViewDate.value
  calendarViewDate.value = new Date(d.getFullYear(), d.getMonth() - 1, 1)
  loadCalendarMonth()
}

function goToNextMonth() {
  const d = calendarViewDate.value
  calendarViewDate.value = new Date(d.getFullYear(), d.getMonth() + 1, 1)
  loadCalendarMonth()
}

// Clicking an open day on the calendar fills the date input and runs the
// same authoritative check as typing a date directly would.
function pickCalendarDate(day) {
  if (!day.inMonth || day.isPast || day.isTaken) return
  form.value.event_date = day.dateStr
  handleDateCheck()
  showCalendar.value = false
}

const form = ref({
  event_date: '',
  event_time: '',
  event_location: '',
  guest_count: null,
  package_id: '',
  client_email: ''
})

// Package menu (main module): which items the client may choose from,
// per category, and how many per category, for the package they picked.
const packageMenu = ref({ limits: [], itemsByCategory: {} })
const selectedMenuItems = ref({}) // { [category]: [item_id, ...] }
const isLoadingPackageMenu = ref(false)

// Only categories that actually have a limit configured for this package
// are shown -- packages with no menu set up yet behave exactly as before.
const packageMenuCategories = computed(() =>
  MENU_CATEGORIES
    .map((cat) => ({
      category: cat,
      max: packageMenu.value.limits.find((l) => l.category === cat)?.max_selections || 0,
      items: (packageMenu.value.itemsByCategory[cat] || [])
        .map((id) => allMenuItemsFlat.value.find((i) => i.item_id === id))
        .filter(Boolean)
    }))
    .filter((c) => c.max > 0 && c.items.length > 0)
)

// itemsByCategory only stores ids, so keep a lookup of id -> {item_id, item_name}
// built from whatever the menu endpoint returned inline.
const allMenuItemsFlat = ref([])

// ---------- Extra Add-Ons (ala carte, sold alongside the package) ----------
const businessAddons = ref([])       // this business's active add-ons (new booking form)
const addonQuantities = ref({})      // { [addon_id]: quantity }, 0/absent = not selected
const isLoadingAddons = ref(false)
const addonsSubtotal = computed(() =>
  businessAddons.value.reduce((sum, a) => sum + (Number(addonQuantities.value[a.addon_id]) || 0) * Number(a.price), 0)
)

function setAddonQuantity(addonId, qty) {
  const n = Math.max(0, Math.floor(Number(qty) || 0))
  addonQuantities.value = { ...addonQuantities.value, [addonId]: n }
}

async function loadBusinessAddons(businessId) {
  addonQuantities.value = {}
  businessAddons.value = []
  if (!businessId) return
  isLoadingAddons.value = true
  try {
    businessAddons.value = await getBusinessAddons(businessId)
  } catch (error) {
    console.error('Failed to load add-ons:', error)
  } finally {
    isLoadingAddons.value = false
  }
}

// Same shape, but for the Edit Booking modal.
const editBusinessAddons = ref([])
const editAddonQuantities = ref({})
const isLoadingEditAddons = ref(false)
const editAddonsSubtotal = computed(() =>
  editBusinessAddons.value.reduce((sum, a) => sum + (Number(editAddonQuantities.value[a.addon_id]) || 0) * Number(a.price), 0)
)

function setEditAddonQuantity(addonId, qty) {
  const n = Math.max(0, Math.floor(Number(qty) || 0))
  editAddonQuantities.value = { ...editAddonQuantities.value, [addonId]: n }
}

async function loadEditBusinessAddons(businessId, { preserveSelections = false } = {}) {
  if (!preserveSelections) editAddonQuantities.value = {}
  editBusinessAddons.value = []
  if (!businessId) return
  isLoadingEditAddons.value = true
  try {
    editBusinessAddons.value = await getBusinessAddons(businessId)
  } catch (error) {
    console.error('Failed to load add-ons:', error)
  } finally {
    isLoadingEditAddons.value = false
  }
}

async function loadPackageMenu(packageId) {
  selectedMenuItems.value = {}
  packageMenu.value = { limits: [], itemsByCategory: {} }
  allMenuItemsFlat.value = []
  if (!packageId) return

  isLoadingPackageMenu.value = true
  try {
    packageMenu.value = await getPackageMenu(packageId)
    // getPackageMenu only returns item_ids; fetch names via tbl_menu_items
    // through the packages the client can already see is overkill here, so
    // pull names from the same RLS-safe table directly.
    const { supabase } = await import('../supabaseClient')
    const ids = Object.values(packageMenu.value.itemsByCategory).flat()
    if (ids.length) {
      const { data } = await supabase.from('tbl_menu_items').select('item_id, item_name').in('item_id', ids)
      allMenuItemsFlat.value = data || []
    }
  } catch (error) {
    console.error('Failed to load package menu:', error)
  } finally {
    isLoadingPackageMenu.value = false
  }
}

function toggleMenuItem(category, itemId, max) {
  const current = selectedMenuItems.value[category] || []
  const idx = current.indexOf(itemId)
  if (idx >= 0) {
    current.splice(idx, 1)
  } else {
    if (current.length >= max) return
    current.push(itemId)
  }
  selectedMenuItems.value = { ...selectedMenuItems.value, [category]: current }
}

// Same shape as packageMenuCategories/loadPackageMenu/toggleMenuItem above,
// but for the Edit Booking modal so changing the package there also lets
// the client re-pick their menu instead of leaving stale selections behind.
const editPackageMenuCategories = computed(() =>
  MENU_CATEGORIES
    .map((cat) => ({
      category: cat,
      max: editPackageMenu.value.limits.find((l) => l.category === cat)?.max_selections || 0,
      items: (editPackageMenu.value.itemsByCategory[cat] || [])
        .map((id) => editAllMenuItemsFlat.value.find((i) => i.item_id === id))
        .filter(Boolean)
    }))
    .filter((c) => c.max > 0 && c.items.length > 0)
)

async function loadEditPackageMenu(packageId, { preserveSelections = false } = {}) {
  if (!preserveSelections) editSelectedMenuItems.value = {}
  editPackageMenu.value = { limits: [], itemsByCategory: {} }
  editAllMenuItemsFlat.value = []
  if (!packageId) return

  isLoadingEditPackageMenu.value = true
  try {
    editPackageMenu.value = await getPackageMenu(packageId)
    const { supabase } = await import('../supabaseClient')
    const ids = Object.values(editPackageMenu.value.itemsByCategory).flat()
    if (ids.length) {
      const { data } = await supabase.from('tbl_menu_items').select('item_id, item_name').in('item_id', ids)
      editAllMenuItemsFlat.value = data || []
    }
  } catch (error) {
    console.error('Failed to load package menu:', error)
  } finally {
    isLoadingEditPackageMenu.value = false
  }
}

function toggleEditMenuItem(category, itemId, max) {
  const current = editSelectedMenuItems.value[category] || []
  const idx = current.indexOf(itemId)
  if (idx >= 0) {
    current.splice(idx, 1)
  } else {
    if (current.length >= max) return
    current.push(itemId)
  }
  editSelectedMenuItems.value = { ...editSelectedMenuItems.value, [category]: current }
}

// editForm.package_id has no @change of its own in the template (only
// editBusinessId does), so this is called directly from the select.
function handleEditPackageChange() {
  loadEditPackageMenu(editForm.value.package_id)
}

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
        logo_url: p.tbl_business?.logo_url || '',
        package_count: 1,
        min_price: price
      })
    }
  }
  return [...map.values()].sort((a, b) => a.business_name.localeCompare(b.business_name))
})
// Search/filter for Step 1's business grid -- matches on name or address.
const businessSearch = ref('')
const filteredBusinessesForBooking = computed(() => {
  const q = businessSearch.value.trim().toLowerCase()
  if (!q) return businesses.value
  return businesses.value.filter((b) =>
    b.business_name.toLowerCase().includes(q) || (b.address || '').toLowerCase().includes(q)
  )
})

const selectedBusiness = computed(() => businesses.value.find((b) => b.business_id === selectedBusinessId.value))
const editBusiness = computed(() => businesses.value.find((b) => b.business_id === editBusinessId.value))
const businessPackages = computed(() => packages.value.filter((p) => p.business_id === selectedBusinessId.value))
const editBusinessPackages = computed(() => packages.value.filter((p) => p.business_id === editBusinessId.value))

function selectBusiness(id) {
  selectedBusinessId.value = id
  form.value.package_id = ''
  conflictWarning.value = ''
  selectedMenuItems.value = {}
  packageMenu.value = { limits: [], itemsByCategory: {} }
  loadBusinessAddons(id)
  calendarViewDate.value = startOfMonth(new Date())
  showCalendar.value = false
  loadCalendarMonth()
  // A date may already be filled in from before; re-check it for this business.
  if (form.value.event_date) handleDateCheck()
}

function clearBusiness() {
  selectedBusinessId.value = ''
  form.value.package_id = ''
  conflictWarning.value = ''
  selectedMenuItems.value = {}
  packageMenu.value = { limits: [], itemsByCategory: {} }
  addonQuantities.value = {}
  businessAddons.value = []
  takenDates.value = new Set()
  showCalendar.value = false
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
  currentUserId = user.user_id || user.id || user.email || ''

  loadPackages()
  loadMyBookings()
})

// Compares freshly-fetched bookings against what was last seen (localStorage,
// per user) and surfaces anything whose status changed since then -- e.g. a
// Pending booking that just got Confirmed or Rejected.
function checkStatusChanges(freshBookings) {
  if (!currentUserId) return
  const storageKey = `caterlytics_seen_statuses_${currentUserId}`
  let previous = {}
  try {
    previous = JSON.parse(localStorage.getItem(storageKey) || '{}')
  } catch {
    previous = {}
  }

  const hadPreviousData = Object.keys(previous).length > 0
  const changes = []
  const nextSnapshot = {}

  for (const b of freshBookings) {
    nextSnapshot[b.booking_id] = b.booking_status
    const oldStatus = previous[b.booking_id]
    if (hadPreviousData && oldStatus && oldStatus !== b.booking_status) {
      changes.push({ booking: b, from: oldStatus, to: b.booking_status })
    }
  }

  try {
    localStorage.setItem(storageKey, JSON.stringify(nextSnapshot))
  } catch {
    // localStorage unavailable -- alerts just won't persist across visits.
  }

  statusChangeAlerts.value = changes
}

function dismissStatusAlert(bookingId) {
  statusChangeAlerts.value = statusChangeAlerts.value.filter((c) => c.booking.booking_id !== bookingId)
}

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
    checkStatusChanges(myBookings.value)
    // Attach each booking's saved add-ons for display (My Bookings + receipt).
    await Promise.all(myBookings.value.map(async (b) => {
      try {
        b.addons = await getBookingAddons(b.booking_id)
      } catch (error) {
        console.error('Failed to load add-ons for booking', b.booking_id, error)
        b.addons = []
      }
    }))
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

async function openEditModal(booking) {
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

  // Load this package's menu setup, then prefill with whatever the client
  // already picked for this booking (so opening Edit doesn't wipe their picks).
  editSelectedMenuItems.value = {}
  if (editForm.value.package_id) {
    await loadEditPackageMenu(editForm.value.package_id, { preserveSelections: true })
    try {
      const existing = await getBookingSelections(booking.booking_id)
      const byCategory = {}
      for (const row of existing) {
        if (!byCategory[row.category]) byCategory[row.category] = []
        byCategory[row.category].push(row.item_id)
      }
      editSelectedMenuItems.value = byCategory
    } catch (error) {
      console.error('Failed to load existing menu selections:', error)
    }
  } else {
    editPackageMenu.value = { limits: [], itemsByCategory: {} }
    editAllMenuItemsFlat.value = []
  }

  // Same idea for add-ons: load this business's catalog, then prefill
  // whichever ones (and quantities) are already saved on this booking.
  editAddonQuantities.value = {}
  if (editBusinessId.value) {
    await loadEditBusinessAddons(editBusinessId.value, { preserveSelections: true })
    try {
      const existingAddons = booking.addons || (await getBookingAddons(booking.booking_id))
      const quantities = {}
      for (const row of existingAddons) quantities[row.addon_id] = row.quantity
      editAddonQuantities.value = quantities
    } catch (error) {
      console.error('Failed to load existing add-on selections:', error)
    }
  } else {
    editBusinessAddons.value = []
  }
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

    // Always sync menu picks against whatever package is now saved on the
    // booking -- even an empty selection -- so switching packages (or to a
    // package with no menu configured) can never leave stale selections
    // from the old package sitting against this booking_id.
    const flatEditSelections = Object.values(editSelectedMenuItems.value)
      .flat()
      .map((item_id) => ({ item_id }))
    try {
      await setBookingSelections(updated.booking_id, flatEditSelections)
    } catch (selError) {
      console.error('Failed to save menu selections:', selError)
      pageError.value = 'Booking was updated, but we couldn\'t save your menu picks. Please edit again to try.'
    }

    // Same "always sync, even to empty" treatment for add-ons.
    const flatEditAddons = editBusinessAddons.value
      .map((a) => ({ addon_id: a.addon_id, quantity: editAddonQuantities.value[a.addon_id] || 0 }))
      .filter((a) => a.quantity > 0)
    try {
      updated.addons = await setBookingAddons(updated.booking_id, flatEditAddons)
    } catch (addonError) {
      console.error('Failed to save add-ons:', addonError)
      pageError.value = 'Booking was updated, but we couldn\'t save your add-ons. Please edit again to try.'
    }

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

  // The package picker is now a card selector, not a native <select
  // required>, so the browser's built-in validation no longer catches an
  // empty pick -- enforce it here instead.
  if (!form.value.package_id) {
    pageError.value = 'Please select a catering package.'
    return
  }

  isSubmitting.value = true

  try {
    const newBooking = await createBooking({
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

    // Save the client's per-category menu picks against the new booking
    // (only relevant when this package actually has a menu configured).
    const flatSelections = Object.values(selectedMenuItems.value)
      .flat()
      .map((item_id) => ({ item_id }))
    if (flatSelections.length) {
      try {
        await setBookingSelections(newBooking.booking_id, flatSelections)
      } catch (selError) {
        console.error('Failed to save menu selections:', selError)
        pageError.value = 'Booking was submitted, but we couldn\'t save your menu picks. Please edit the booking to try again.'
      }
    }

    // Save the client's selected add-ons (quantity > 0 only) against the new booking.
    const flatAddons = businessAddons.value
      .map((a) => ({ addon_id: a.addon_id, quantity: addonQuantities.value[a.addon_id] || 0 }))
      .filter((a) => a.quantity > 0)
    if (flatAddons.length) {
      try {
        await setBookingAddons(newBooking.booking_id, flatAddons)
      } catch (addonError) {
        console.error('Failed to save add-ons:', addonError)
        pageError.value = 'Booking was submitted, but we couldn\'t save your add-ons. Please edit the booking to try again.'
      }
    }

    successMessage.value = 'Booking request submitted! We will confirm it shortly.'
    form.value = { ...form.value, event_date: '', event_time: '', event_location: '', guest_count: null, package_id: '' }
    selectedBusinessId.value = ''
    selectedMenuItems.value = {}
    packageMenu.value = { limits: [], itemsByCategory: {} }
    addonQuantities.value = {}
    businessAddons.value = []
    takenDates.value = new Set()
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

  // Add-ons are itemized here for transparency (booked at the snapshot price
  // saved on the booking). The business enters payment.total_amount itself
  // when creating the payment record and is expected to already include
  // these — this table just shows the client what made up that figure.
  const addonRows = (booking.addons || []).map((a) => [
    `Add-on: ${a.addon_name} × ${a.quantity}`,
    `PHP ${Number(a.subtotal).toLocaleString()}`,
  ])

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 6,
    head: [['Description', 'Amount']],
    body: [
      ...addonRows,
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