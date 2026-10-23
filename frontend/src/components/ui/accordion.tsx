"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const AccordionContext = React.createContext<{
  name?: string
}>({})

export interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  name?: string
}

const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  ({ className, name, children, ...props }, ref) => (
    <AccordionContext.Provider value={{ name }}>
      <div
        ref={ref}
        className={cn(
          "divide-y divide-border overflow-hidden rounded-md border border-border bg-card",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </AccordionContext.Provider>
  ),
)
Accordion.displayName = "Accordion"

export interface AccordionItemProps
  extends Omit<React.HTMLAttributes<HTMLDetailsElement>, "title"> {
  title: React.ReactNode
  description?: React.ReactNode
  defaultOpen?: boolean
  name?: string
}

const AccordionItem = React.forwardRef<HTMLDetailsElement, AccordionItemProps>(
  ({ className, title, description, defaultOpen, children, ...props }, ref) => {
    const [open, setOpen] = React.useState(defaultOpen ?? false)
    return (
      <details
        ref={ref}
        open={open}
        onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
        className={cn("group", className)}
        {...props}
      >
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 font-medium [&::-webkit-details-marker]:hidden">
          <span>
            <span>{title}</span>
            {description ? (
              <span className="mt-1 block text-sm font-normal text-muted-foreground">
                {description}
              </span>
            ) : null}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none" />
        </summary>
        <div className="px-4 pb-4">{children}</div>
      </details>
    )
  },
)
AccordionItem.displayName = "AccordionItem"

export { Accordion, AccordionItem }
