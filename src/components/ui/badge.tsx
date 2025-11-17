import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 shadow-layered-sm",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary-600 text-primary-foreground hover:bg-primary-500 hover:shadow-layered-md",
        secondary:
          "border-transparent bg-secondary-400 text-secondary-foreground hover:bg-secondary-300 hover:shadow-layered-md",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80 hover:shadow-layered-md",
        outline: "text-primary-700 border-primary-300 bg-primary-50 hover:bg-primary-100 hover:border-primary-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }