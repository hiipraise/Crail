import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import { Home, Compass, BookOpen, PenLine, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/explore', icon: Compass, label: 'Explore' },
  { to: '/library', icon: BookOpen, label: 'Library', auth: true },
  { to: '/write', icon: PenLine, label: 'Write', auth: true },
  { to: '/profile', icon: User, label: 'Profile', auth: true }
]

export default function MobileNav() {
  const { isAuthenticated } = useAuthStore()
  const location = useLocation()

  // Hide on reader page
  if (location.pathname.startsWith('/read/')) return null

  const visibleItems = navItems.filter((item) => !item.auth || isAuthenticated)
  if (!isAuthenticated) {
    visibleItems.push({ to: '/login', icon: User, label: 'Sign in', auth: false })
  }

  return (
    <nav className="site-nav md:hidden fixed bottom-0 left-0 right-0 z-40">
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="bg-white/90 backdrop-blur-xl border-t border-cloudy-200 pb-safe"
      >
        <LayoutGroup>
          <div className="flex items-center justify-around h-16 px-2">
            {visibleItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors min-w-[52px]',
                    isActive ? 'text-crail' : 'text-cloudy-400'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <motion.div
                      animate={{ scale: isActive ? 1.15 : 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                      className="relative"
                    >
                      {isActive && (
                        <motion.div
                          layoutId="mobile-nav-indicator"
                          className="absolute inset-0 -m-1.5 bg-crail-50 rounded-xl"
                        />
                      )}
                      <Icon className="h-5 w-5 relative z-10" />
                    </motion.div>
                    <span className="text-[10px] font-medium">{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </LayoutGroup>
      </motion.div>
    </nav>
  )
}