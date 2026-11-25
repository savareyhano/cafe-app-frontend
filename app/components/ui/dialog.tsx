"use client"

import * as React from "react"
import { cn } from "~/lib/utils"
import { Dialog as DialogPrimitive } from "radix-ui"

import { Button } from "~/components/ui/button"
import { Icon } from "~/components/icon"

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-scrim data-open:duration-[280ms] max-sm:data-closed:duration-200 sm:data-open:duration-200 sm:data-closed:duration-150 data-open:animate-in data-closed:animate-out",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "fixed z-50 grid max-h-[92dvh] w-full gap-5 overflow-y-auto bg-popover p-6 text-popover-foreground shadow-ds-3 outline-none data-open:ease-out data-closed:ease-in max-sm:data-open:duration-[280ms] max-sm:data-closed:duration-200 sm:data-open:duration-200 sm:data-closed:duration-150 max-sm:inset-x-0 max-sm:bottom-0 max-sm:rounded-t-2xl max-sm:pt-8 max-sm:pb-[calc(1.5rem+env(safe-area-inset-bottom))] max-sm:data-open:slide-in-from-bottom max-sm:data-closed:slide-out-to-bottom sm:top-1/2 sm:left-1/2 sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:data-open:zoom-in-96 sm:data-open:fade-in-0 sm:data-closed:zoom-out-96 sm:data-closed:fade-out-0 data-open:animate-in data-closed:animate-out dark:ring-1 dark:ring-border before:absolute before:top-3 before:left-1/2 before:h-1 before:w-10 before:-translate-x-1/2 before:rounded-full before:bg-line-strong sm:before:hidden",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close data-slot="dialog-close" asChild>
            <Button
              variant="ghost"
              className="absolute top-3 right-3 text-ink-soft"
              size="icon-sm"
            >
              <Icon name="cancel" className="size-5" />
              <span className="sr-only">Tutup</span>
            </Button>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-3 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <Button variant="outline">Tutup</Button>
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        "type-label-l pr-8",
        className
      )}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "type-body-s text-ink-soft *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
