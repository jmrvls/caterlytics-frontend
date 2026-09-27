import { ref, onMounted, onUnmounted } from 'vue'
import { supabase } from '../supabaseClient'
import { getLowStockItems } from '../services/inventoryService'
import { getMyAssignedBookings } from '../services/staffassignmentservice'

// Shared, app-wide notification state: low-stock alerts + new booking alerts
// (Admin/Owner), and event-assignment alerts (Staff).
//
// Per the study's objective (1.2.2): "...performs automatic stock
// deductions, and generates low-stock notifications." This composable is
// the single source of truth for that alert so it stays consistent no
// matter which page (Admin/Owner) mounts it.
//
// New-booking alerts and the Staff assignment feed are both added
// enhancements on top of the manuscript's Use Case Diagram (Figure 3) scope
// (not explicitly required there): a client booking online shows up live on
// the Admin/Owner dashboard bell, and a Staff member sees it the moment
// they're assigned to an event.
//
// Usage in any View:
//   import { useNotifications } from '../composables/useNotifications'
//   const { lowStockItems, newBookings, myAssignments, unreadCount, loading, markAllRead } = useNotifications()

const lowStockItems = ref([])
const newBookings = ref([]) // most recent first, capped
const myAssignments = ref([]) // Staff-only: events they've just been assigned to
const loading = ref(true)
const stockUnreadCount = ref(0)
const bookingUnreadCount = ref(0)
const assignmentUnreadCount = ref(0)
const unreadCount = ref(0) // combined, for the bell badge
const seenIds = new Set() // low-stock item ids already "read"
const seenBookingIds = new Set() // booking ids already "read"
const seenAssignmentIds = new Set() // booking_ids already "read"
let stockChannel = null
let bookingChannel = null
let assignmentChannel = null
let subscriberCount = 0

function recomputeUnread() {
  unreadCount.value = stockUnreadCount.value + bookingUnreadCount.value + assignmentUnreadCount.value
}

// Staff-only feed: "you've been put on this event." Staff has no Bookings
// or Inventory page (see NotificationBell), so those two feeds above are
// dead-ends for them -- this is the one alert that's actually theirs.
function pushNewAssignment(booking) {
  if (!booking) return
  myAssignments.value = [booking, ...myAssignments.value].slice(0, 10)
  assignmentUnreadCount.value = myAssignments.value.filter((b) => !seenAssignmentIds.has(b.booking_id)).length
  recomputeUnread()
}

async function refreshStock() {
  try {
    const items = await getLowStockItems()
    lowStockItems.value = items
    stockUnreadCount.value = items.filter((i) => !seenIds.has(i.item_id)).length
    recomputeUnread()
  } catch (err) {
    console.error('Failed to load low-stock notifications:', err)
  } finally {
    loading.value = false
  }
}

// Adds a freshly-inserted booking row to the live feed (via the Realtime
// INSERT event below).
function pushNewBooking(booking) {
  newBookings.value = [booking, ...newBookings.value].slice(0, 10)
  bookingUnreadCount.value = newBookings.value.filter((b) => !seenBookingIds.has(b.booking_id)).length
  recomputeUnread()
}

// Initial load: bookings that are still Pending, regardless of whether
// they were created before or after the bell mounted. Without this, a
// booking made while nobody had the dashboard open (e.g. overnight, or
// before this browser session started) would never surface -- Realtime
// only reports inserts that happen *while* subscribed, not what already
// exists. RLS ("staff view own business bookings") already scopes this
// to the caller's own business, same as everywhere else.
async function refreshBookings() {
  try {
    const { data, error } = await supabase
      .from('tbl_bookings')
      .select('booking_id, client_name, event_date, guest_count, booking_status, created_at')
      .eq('booking_status', 'Pending')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) throw error
    newBookings.value = data || []
    bookingUnreadCount.value = newBookings.value.filter((b) => !seenBookingIds.has(b.booking_id)).length
    recomputeUnread()
  } catch (err) {
    console.error('Failed to load booking notifications:', err)
  }
}

// Initial load for the Staff feed: their own currently-upcoming assigned
// events (Pending/Confirmed), so the bell isn't empty on first login and
// only genuinely-new inserts after that count as "unread".
async function refreshAssignments() {
  try {
    const rows = await getMyAssignedBookings()
    myAssignments.value = rows
    assignmentUnreadCount.value = rows.filter((b) => !seenAssignmentIds.has(b.booking_id)).length
    recomputeUnread()
  } catch (err) {
    console.error('Failed to load your assigned events:', err)
  } finally {
    loading.value = false
  }
}

function markAllRead() {
  lowStockItems.value.forEach((i) => seenIds.add(i.item_id))
  stockUnreadCount.value = 0
  newBookings.value.forEach((b) => seenBookingIds.add(b.booking_id))
  bookingUnreadCount.value = 0
  myAssignments.value.forEach((b) => seenAssignmentIds.add(b.booking_id))
  assignmentUnreadCount.value = 0
  recomputeUnread()
}

export function useNotifications() {
  onMounted(() => {
    subscriberCount++

    let storedUser = null
    try {
      storedUser = JSON.parse(sessionStorage.getItem('user'))
    } catch {
      storedUser = null
    }
    const businessId = storedUser?.business_id || null
    const isStaff = storedUser?.role === 'Staff'

    // Staff has no Bookings or Inventory page (see NotificationBell), so the
    // low-stock/new-booking feeds below are dead-ends for them. They get
    // their own feed instead: "you've been assigned to this event." Beyond
    // the manuscript's Use Case Diagram (Figure 3) scope for Staff, same as
    // the "My Assigned Events" dashboard card this mirrors.
    if (isStaff) {
      refreshAssignments()

      if (!assignmentChannel) {
        supabase.auth.getUser().then(({ data }) => {
          const staffId = data?.user?.id
          if (!staffId || assignmentChannel) return
          assignmentChannel = supabase
            .channel('my-event-assignments')
            .on(
              'postgres_changes',
              {
                event: 'INSERT',
                schema: 'public',
                table: 'tbl_booking_staff',
                filter: `staff_id=eq.${staffId}`,
              },
              async (payload) => {
                const { data: booking } = await supabase
                  .from('tbl_bookings')
                  .select('booking_id, client_name, event_date, event_time, event_location, booking_status')
                  .eq('booking_id', payload.new.booking_id)
                  .single()
                pushNewAssignment(booking)
              }
            )
            .subscribe()
        })
      }
      return
    }

    refreshStock()

    // Only one Realtime channel of each kind needs to exist app-wide;
    // every component using this composable shares them.
    if (!stockChannel) {
      stockChannel = supabase
        .channel('inventory-stock-alerts')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'tbl_inventory' },
          () => refreshStock()
        )
        .subscribe()
    }

    // Scope the feed to the logged-in user's own business -- without this,
    // every Admin/Owner across every tenant would get pinged for every
    // OTHER business's bookings too (and, worse, if RLS doesn't separately
    // allow it, the event may just silently never arrive at all).
    if (businessId) {
      refreshBookings()
    }

    if (!bookingChannel && businessId) {
      bookingChannel = supabase
        .channel('new-booking-alerts')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'tbl_bookings',
            filter: `business_id=eq.${businessId}`,
          },
          (payload) => pushNewBooking(payload.new)
        )
        .subscribe()
    }
  })

  onUnmounted(() => {
    subscriberCount--
    if (subscriberCount <= 0) {
      if (stockChannel) {
        supabase.removeChannel(stockChannel)
        stockChannel = null
      }
      if (bookingChannel) {
        supabase.removeChannel(bookingChannel)
        bookingChannel = null
      }
      if (assignmentChannel) {
        supabase.removeChannel(assignmentChannel)
        assignmentChannel = null
      }
    }
  })

  return {
    lowStockItems,
    newBookings,
    myAssignments,
    unreadCount,
    stockUnreadCount,
    bookingUnreadCount,
    assignmentUnreadCount,
    loading,
    markAllRead,
    refresh: refreshStock,
  }
}