import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        // Status variants
        success: "border-transparent bg-green-500 text-white shadow hover:bg-green-500/80",
        warning: "border-transparent bg-yellow-500 text-white shadow hover:bg-yellow-500/80",
        error: "border-transparent bg-red-500 text-white shadow hover:bg-red-500/80",
        // Network variants
        solana: "border-transparent bg-solana text-white shadow hover:bg-solana/80",
        ethereum: "border-transparent bg-ethereum text-white shadow hover:bg-ethereum/80",
        polygon: "border-transparent bg-polygon text-white shadow hover:bg-polygon/80",
        bsc: "border-transparent bg-bsc text-white shadow hover:bg-bsc/80",
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