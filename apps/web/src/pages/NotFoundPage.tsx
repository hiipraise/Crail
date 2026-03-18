import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-pampas flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-sm"
      >
        <div className="w-20 h-20 rounded-full bg-crail-50 flex items-center justify-center mx-auto mb-6">
          <BookOpen className="h-10 w-10 text-crail-300" />
        </div>
        <h1 className="font-serif text-5xl font-bold text-crail mb-2">404</h1>
        <h2 className="font-serif text-xl font-semibold mb-2">Page not found</h2>
        <p className="text-cloudy-500 text-sm mb-8">
          The story you're looking for doesn't exist or has been removed.
        </p>
        <div className="flex gap-3 justify-center">
          <Link to="/">
            <Button className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Go home
            </Button>
          </Link>
          <Link to="/explore">
            <Button variant="outline">Browse stories</Button>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
