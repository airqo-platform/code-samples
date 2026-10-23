"use client"

import { AlertTriangle, CheckCircle2, Info, XCircle, type LucideIcon } from "lucide-react"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastProvider,
  ToastViewport,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from "@/components/ui/toast"
import { cn } from "@/lib/utils"

const toastVariantStyles: Record<
  string,
  { Icon: LucideIcon; iconClass: string; progressClass: string }
> = {
  default: {
    Icon: Info,
    iconClass: "bg-primary/10 text-primary ring-primary/15",
    progressClass: "bg-primary",
  },
  info: {
    Icon: Info,
    iconClass: "bg-primary/10 text-primary ring-primary/15",
    progressClass: "bg-primary",
  },
  destructive: {
    Icon: XCircle,
    iconClass: "bg-rose-500/10 text-rose-600 ring-rose-500/15",
    progressClass: "bg-rose-500",
  },
  error: {
    Icon: XCircle,
    iconClass: "bg-rose-500/10 text-rose-600 ring-rose-500/15",
    progressClass: "bg-rose-500",
  },
  success: {
    Icon: CheckCircle2,
    iconClass: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/15",
    progressClass: "bg-emerald-500",
  },
  warning: {
    Icon: AlertTriangle,
    iconClass: "bg-amber-500/10 text-amber-600 ring-amber-500/15",
    progressClass: "bg-amber-500",
  },
}

function getToastVariantStyles(variant: string | null | undefined) {
  return toastVariantStyles[variant ?? "default"] ?? toastVariantStyles.default
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, variant, ...props }) => {
        const { Icon, iconClass, progressClass } = getToastVariantStyles(variant)
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex items-start gap-3 p-4 pr-11">
              <span
                aria-hidden="true"
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-1",
                  iconClass
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <div className="grid flex-1 gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
                {action}
              </div>
            </div>
            <ToastClose />
            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-[3px] bg-muted"
            >
              <div
                className={cn(
                  "h-full w-full origin-left animate-[toast-progress-shrink_5s_linear_forwards] group-hover:[animation-play-state:paused] motion-reduce:animate-none",
                  progressClass
                )}
              />
            </div>
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
