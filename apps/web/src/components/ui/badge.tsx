import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-crail-500 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-crail text-white',
        secondary: 'border-transparent bg-cloudy-100 text-cloudy-700',
        destructive: 'border-transparent bg-red-500 text-white',
        outline: 'text-foreground border-cloudy-300',
        genre: 'border-transparent bg-crail-50 text-crail-700'
      }
    },
    defaultVariants: { variant: 'default' }
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
