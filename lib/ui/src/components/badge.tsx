import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../utils"

const badgeVariants = cva(
  // Keep badges on one line and use the shared hover elevation styling.
  // Whitespace-nowrap: Badges should never wrap.
  "whitespace-nowrap inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" +
  " hover-elevate ",
  {
    variants: {
      variant: {
        default:
          // Use the shared elevation utility instead of per-variant hover shadows.
          "border-transparent bg-primary text-primary-foreground shadow-xs",
        secondary:
          // Hover treatment comes from the shared hover-elevate utility.
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          // Use the shared elevation utility instead of per-variant hover shadows.
          "border-transparent bg-destructive text-destructive-foreground shadow-xs",
          // Use the dedicated outline token so border color matches the current theme.
        outline: "text-foreground border [border-color:var(--badge-outline)]",
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
