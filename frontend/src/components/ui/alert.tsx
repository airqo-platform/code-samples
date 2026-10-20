import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const alertVariants = cva(
  "flex gap-3 rounded-md border p-3 text-sm",
  {
    variants: {
      variant: {
        info: "border-primary/15 bg-primary/5 text-foreground",
        warning: "border-warning/25 bg-warning/10 text-foreground",
        destructive: "border-destructive/25 bg-destructive/10 text-foreground",
        success: "border-success/25 bg-success/10 text-foreground",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  },
)

const defaultIcons: Record<string, React.ElementType> = {
  info: Info,
  warning: AlertTriangle,
  destructive: XCircle,
  success: CheckCircle2,
}

export interface AlertProps extends VariantProps<typeof alertVariants> {
  title?: React.ReactNode
  icon?: React.ReactNode
  className?: string
  children?: React.ReactNode
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, title, icon, children, ...props }, ref) => {
    const v = variant ?? "info"
    const IconComponent = defaultIcons[v]
    const role = v === "destructive" ? "alert" : "status"
    return (
      <div
        ref={ref}
        role={role}
        className={cn(alertVariants({ variant: v }), className)}
        {...props}
      >
        {icon !== undefined ? (
          icon
        ) : IconComponent ? (
          <IconComponent className="h-5 w-5 shrink-0" aria-hidden="true" />
        ) : null}
        <div className="flex-1 space-y-1">
          {title ? <p className="font-medium">{title}</p> : null}
          {children ? <div>{children}</div> : null}
        </div>
      </div>
    )
  },
)
Alert.displayName = "Alert"

export { Alert, alertVariants }
