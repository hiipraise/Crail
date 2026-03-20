import { Link } from 'react-router-dom'
import { Search, PanelRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default function SiteHeader() {
  const { toggleNav, openSearch } = useUIStore()
  const { user, isAuthenticated } = useAuthStore()

  return (
    <header className="site-header sticky top-0 z-40 w-full border-b border-cloudy-200 bg-pampas/90 backdrop-blur-md">
      <div className="flex h-14 items-center px-4 md:px-6">
        {/* Left — search */}
        <button
          onClick={openSearch}
          className="flex items-center gap-2 text-cloudy-500 rounded-lg px-2 py-1.5 text-sm"
        >
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Search stories…</span>
        </button>

        {/* Center — Logo */}
        <div className="flex-1 flex justify-center">
          <Link to="/" className="flex items-center gap-1.5">
            <span className="font-serif text-xl font-semibold text-foreground tracking-tight">
              Crail
            </span>
          </Link>
        </div>

        {/* Right — profile + nav toggle */}
        <div className="flex items-center gap-2">
          {isAuthenticated && user ? (
            <Link to="/profile">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar} alt={user.displayName} />
                <AvatarFallback>
                  {user.displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <Link to="/login">
              <Button size="sm" variant="outline" className="hidden sm:flex">Sign in</Button>
            </Link>
          )}

          {/* Desktop nav toggle */}
          <Button
            size="icon"
            variant="ghost"
            className="hidden md:flex"
            onClick={toggleNav}
          >
            <PanelRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
