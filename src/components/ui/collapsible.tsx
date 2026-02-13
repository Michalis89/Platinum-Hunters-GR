"use client"

import * as React from "react"
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

const Collapsible = CollapsiblePrimitive.Root

const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger

const CollapsibleContent = CollapsiblePrimitive.CollapsibleContent

interface CollapsibleCardProps {
  children: React.ReactNode
  className?: string
  id?: string
  defaultCollapsed?: boolean
}

interface CollapsibleCardSectionProps {
  children: React.ReactNode
  className?: string
}

function CollapsibleCard({
  children,
  className,
  id,
  defaultCollapsed = false,
}: CollapsibleCardProps) {
  return (
    <div
      id={id}
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card text-foreground shadow-sm",
        className,
      )}
    >
      <Collapsible defaultOpen={!defaultCollapsed}>{children}</Collapsible>
    </div>
  )
}

function CollapsibleCardHeader({
  children,
  className,
}: CollapsibleCardSectionProps) {
  return (
    <CollapsibleTrigger
      asChild
      className="block"
    >
      <button
        type="button"
        className={cn(
          "group flex w-full items-center justify-between border-b border-border bg-card/70 px-4 py-3 text-left text-foreground transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className,
        )}
      >
        <div className="flex-1">{children}</div>
        <ChevronDown className="ml-2 h-5 w-5 text-muted-foreground transition-transform duration-200 data-[state=open]:rotate-180" />
      </button>
    </CollapsibleTrigger>
  )
}

function CollapsibleCardContent({ children, className }: CollapsibleCardSectionProps) {
  return (
    <CollapsibleContent className="overflow-hidden" forceMount>
      <div className={cn("p-4", className)}>{children}</div>
    </CollapsibleContent>
  )
}

function CollapsibleCardFooter({ children, className }: CollapsibleCardSectionProps) {
  return (
    <CollapsibleContent className="overflow-hidden" forceMount>
      <div className={cn("border-t p-4 text-foreground", className)}>{children}</div>
    </CollapsibleContent>
  )
}

export {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
  CollapsibleCard,
  CollapsibleCardHeader,
  CollapsibleCardContent,
  CollapsibleCardFooter,
}

export type { CollapsibleCardProps, CollapsibleCardSectionProps }
