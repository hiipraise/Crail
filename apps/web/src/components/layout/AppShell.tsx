import { Outlet } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import SiteHeader from './SiteHeader'
import MobileNav from './MobileNav'
import DesktopNav from './DesktopNav'
import SearchModal from './SearchModal'
import { useUIStore } from '@/store/uiStore'

export default function AppShell() {
  const { isNavOpen } = useUIStore()

  return (
    <div className="min-h-screen bg-pampas flex flex-col">
      <SiteHeader />

      <div className="flex flex-1">
        {/* Desktop nav — right drawer */}
        <DesktopNav isOpen={isNavOpen} />

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav />

      {/* Global overlays */}
      <SearchModal />
      <Toaster />
    </div>
  )
}
