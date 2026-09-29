
import { ref, computed } from 'vue'

const isSidebarOpen = ref(false)
const isMobileSidebarOpen = ref(false)

export function useSidebarState() {
  const sidebarExpanded = computed(() => isSidebarOpen.value || isMobileSidebarOpen.value)

  return {
    isSidebarOpen,
    isMobileSidebarOpen,
    sidebarExpanded,
  }
}