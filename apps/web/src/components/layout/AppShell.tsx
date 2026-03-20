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

      <div className="flex flex-1 md:items-start">
        {/* Desktop nav — right drawer */}
        <DesktopNav isOpen={isNavOpen} />

        {/* Main content */}
        <main className="flex-1 min-w-0 md:min-h-[calc(100vh-3.5rem)]">
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
