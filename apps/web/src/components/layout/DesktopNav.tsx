import { Link, NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Home, Compass, BookOpen, PenLine, User, LogOut,
  Settings, TrendingUp, Star, Clock, Bookmark
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'

const mainNav = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/explore', icon: Compass, label: 'Explore' },
  { to: '/explore?sort=trending', icon: TrendingUp, label: 'Trending' },
  { to: '/explore?sort=featured', icon: Star, label: 'Featured' }
]

const userNav = [
  { to: '/library', icon: BookOpen, label: 'My Library' },
  { to: '/library?tab=reading', icon: Clock, label: 'Continue Reading' },
  { to: '/library?tab=bookmarks', icon: Bookmark, label: 'Bookmarks' },
  { to: '/write', icon: PenLine, label: 'Write a Story' },
  { to: '/profile', icon: User, label: 'Profile' }
]

interface Props {
  isOpen: boolean
}

export default function DesktopNav({ isOpen }: Props) {
  const location = useLocation()
  const { user, isAuthenticated, logout } = useAuthStore()

  const isNavItemActive = (to: string) => {
    const [pathname, search = ''] = to.split('?')
    if (location.pathname !== pathname) return false
    if (!search) return location.search === ''
    return location.search === `?${search}`
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          key="desktop-nav"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 260, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="site-nav hidden md:flex md:sticky md:top-14 md:h-[calc(100vh-3.5rem)] flex-col border-r border-cloudy-200 bg-white/80 backdrop-blur-sm overflow-hidden shrink-0"
        >
          <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {/* Main nav */}
            <p className="px-3 text-[11px] font-semibold text-cloudy-400 uppercase tracking-wider mb-2">
              Discover
            </p>
            {mainNav.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={() =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isNavItemActive(to)
                      ? 'bg-crail-50 text-crail'
                      : 'text-foreground'
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </NavLink>
            ))}

            {isAuthenticated && (
              <>
                <Separator className="my-3" />
                <p className="px-3 text-[11px] font-semibold text-cloudy-400 uppercase tracking-wider mb-2">
                  My Space
                </p>
                {userNav.map(({ to, icon: Icon, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === '/write'}
                    className={() =>
                      cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        isNavItemActive(to)
                          ? 'bg-crail-50 text-crail'
                          : 'text-foreground'
                      )
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                  </NavLink>
                ))}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-cloudy-200 p-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarImage src={user.avatar} alt={user.displayName} />
                  <AvatarFallback>{user.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.displayName}</p>
                  <p className="text-xs text-cloudy-400 truncate">@{user.username}</p>
                </div>
                <div className="flex gap-1">
                  <Link to="/settings">
                    <Button size="icon" variant="ghost" className="h-8 w-8">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={logout}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <Link to="/login">
                <Button className="w-full" size="sm">Sign in to Crail</Button>
              </Link>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
