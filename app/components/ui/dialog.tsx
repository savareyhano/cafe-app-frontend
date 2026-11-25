'use client';

import * as React from 'react';
import { cn } from '~/lib/utils';
import { Dialog as DialogPrimitive } from 'radix-ui';

import { Button } from '~/components/ui/button';
import { Icon } from '~/components/icon';

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        'fixed inset-0 isolate z-50 bg-scrim data-open:duration-[280ms] max-sm:data-closed:duration-200 sm:data-open:duration-200 sm:data-closed:duration-150 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 data-[swiped=true]:animate-none',
        className,
      )}
      {...props}
    />
  );
}

const INTERACTIVE_SELECTOR =
  "button, a, input, textarea, select, [role='button'], [role='switch'], [data-no-swipe]";

function findScrollable(
  target: HTMLElement | null,
  boundary: HTMLElement,
): HTMLElement | null {
  let el: HTMLElement | null = target;
  while (el && el !== boundary.parentElement) {
    const style = getComputedStyle(el);
    if (
      (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
      el.scrollHeight > el.clientHeight + 1
    ) {
      return el;
    }
    if (el === boundary) break;
    el = el.parentElement;
  }
  return null;
}

// Mounted inside DialogPortal > DialogPrimitive.Content so refs are always live when open
function DialogSwipeController({
  contentRef,
  overlayRef,
  closeRef,
}: {
  contentRef: React.RefObject<HTMLDivElement | null>;
  overlayRef: React.RefObject<HTMLDivElement | null>;
  closeRef: React.RefObject<HTMLButtonElement | null>;
}) {
  React.useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    let closing = false;
    let timer = 0;
    // Radix keeps pointer-events:auto inline on the content (the body gets none while the dialog is
    // modal). Clearing it would make every later touch fall through to the overlay, so only a value
    // this controller overrode is put back.
    let savedPointerEvents: string | null = null;

    const resetStyles = () => {
      content.style.transition = '';
      content.style.transform = '';
      if (savedPointerEvents !== null) {
        content.style.pointerEvents = savedPointerEvents;
        savedPointerEvents = null;
      }
      delete content.dataset.swiped;
      if (overlayRef.current) {
        overlayRef.current.style.transition = '';
        overlayRef.current.style.opacity = '';
        delete overlayRef.current.dataset.swiped;
      }
      closing = false;
    };

    const applyDrag = (dy: number) => {
      content.style.transition = 'none';
      content.style.transform = `translateY(${dy}px)`;
      if (overlayRef.current) {
        const ratio = Math.min(1, dy / Math.max(content.offsetHeight, 300));
        overlayRef.current.style.transition = 'none';
        overlayRef.current.style.opacity = String(Math.max(0, 1 - ratio));
      }
    };

    const finishDrag = (dy: number, velocity: number) => {
      const threshold = Math.min(120, content.offsetHeight * 0.28);
      const reducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches;
      if (dy > threshold || velocity > 0.35) {
        closing = true;
        savedPointerEvents ??= content.style.pointerEvents;
        content.style.pointerEvents = 'none';
        content.style.transition = 'transform 180ms cubic-bezier(0.4, 0, 1, 1)';
        content.style.transform = 'translateY(100%)';
        if (overlayRef.current) {
          overlayRef.current.style.transition = 'opacity 180ms ease-out';
          overlayRef.current.style.opacity = '0';
        }
        window.clearTimeout(timer);
        timer = window.setTimeout(
          () => {
            content.dataset.swiped = 'true';
            if (overlayRef.current) overlayRef.current.dataset.swiped = 'true';
            closeRef.current?.click();
            // Fallback in case a controlled parent blocks closing
            timer = window.setTimeout(() => {
              if (content.isConnected) resetStyles();
            }, 80);
          },
          reducedMotion ? 16 : 180,
        );
      } else {
        content.style.transition = 'transform 200ms cubic-bezier(0, 0, 0.2, 1)';
        content.style.transform = 'translateY(0px)';
        if (overlayRef.current) {
          overlayRef.current.style.transition = 'opacity 200ms ease-out';
          overlayRef.current.style.opacity = '';
        }
        window.clearTimeout(timer);
        timer = window.setTimeout(resetStyles, reducedMotion ? 16 : 200);
      }
    };

    let touchState: {
      startX: number;
      startY: number;
      lastT: number;
      v: number;
      dy: number;
      scrollEl: HTMLElement | null;
      startScrollTop: number;
      mode: 'pending' | 'drag' | 'scroll';
    } | null = null;

    const onTouchStart = (e: TouchEvent) => {
      if (closing || e.touches.length !== 1) return;
      if (!window.matchMedia('(max-width: 639px)').matches) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest(INTERACTIVE_SELECTOR)) return;
      const scrollEl = findScrollable(target, content);
      const t = e.touches[0];
      touchState = {
        startX: t.clientX,
        startY: t.clientY,
        lastT: e.timeStamp,
        v: 0,
        dy: 0,
        scrollEl,
        startScrollTop: scrollEl ? scrollEl.scrollTop : 0,
        mode: 'pending',
      };
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!touchState || e.touches.length !== 1) return;
      const t = e.touches[0];
      const dx = t.clientX - touchState.startX;
      const dy = t.clientY - touchState.startY;

      if (touchState.mode === 'pending') {
        if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
        if (Math.abs(dx) > Math.abs(dy)) {
          touchState.mode = 'scroll';
          return;
        }
        const atTop =
          !touchState.scrollEl ||
          (touchState.scrollEl.scrollTop <= 0 &&
            touchState.startScrollTop <= 0);
        touchState.mode = dy > 0 && atTop ? 'drag' : 'scroll';
      }

      if (touchState.mode !== 'drag') return;
      e.preventDefault();
      const clamped = Math.max(0, dy);
      const dt = Math.max(1, e.timeStamp - touchState.lastT);
      touchState.v = (clamped - touchState.dy) / dt;
      touchState.lastT = e.timeStamp;
      touchState.dy = clamped;
      applyDrag(clamped);
    };

    const onTouchEnd = () => {
      if (!touchState) return;
      const s = touchState;
      touchState = null;
      if (s.mode === 'drag') finishDrag(s.dy, s.v);
    };

    let mouseState: {
      startY: number;
      lastT: number;
      v: number;
      dy: number;
      mode: 'pending' | 'drag';
    } | null = null;

    const onMouseMove = (e: PointerEvent) => {
      if (!mouseState) return;
      const dy = e.clientY - mouseState.startY;
      if (mouseState.mode === 'pending') {
        if (dy < 5) return;
        mouseState.mode = 'drag';
      }
      const clamped = Math.max(0, dy);
      const dt = Math.max(1, e.timeStamp - mouseState.lastT);
      mouseState.v = (clamped - mouseState.dy) / dt;
      mouseState.lastT = e.timeStamp;
      mouseState.dy = clamped;
      applyDrag(clamped);
    };

    const onMouseUp = () => {
      window.removeEventListener('pointermove', onMouseMove);
      window.removeEventListener('pointerup', onMouseUp);
      window.removeEventListener('pointercancel', onMouseUp);
      if (!mouseState) return;
      const s = mouseState;
      mouseState = null;
      if (s.mode === 'drag') finishDrag(s.dy, s.v);
    };

    const onPointerDown = (e: PointerEvent) => {
      if (closing || e.pointerType !== 'mouse' || e.button !== 0) return;
      if (!window.matchMedia('(max-width: 639px)').matches) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest(INTERACTIVE_SELECTOR)) return;
      const scrollEl = findScrollable(target, content);
      if (scrollEl && scrollEl.scrollTop > 0) return;
      e.preventDefault();
      mouseState = {
        startY: e.clientY,
        lastT: e.timeStamp,
        v: 0,
        dy: 0,
        mode: 'pending',
      };
      window.addEventListener('pointermove', onMouseMove);
      window.addEventListener('pointerup', onMouseUp);
      window.addEventListener('pointercancel', onMouseUp);
    };

    content.addEventListener('touchstart', onTouchStart, { passive: true });
    content.addEventListener('touchmove', onTouchMove, { passive: false });
    content.addEventListener('touchend', onTouchEnd);
    content.addEventListener('touchcancel', onTouchEnd);
    content.addEventListener('pointerdown', onPointerDown);

    return () => {
      window.clearTimeout(timer);
      content.removeEventListener('touchstart', onTouchStart);
      content.removeEventListener('touchmove', onTouchMove);
      content.removeEventListener('touchend', onTouchEnd);
      content.removeEventListener('touchcancel', onTouchEnd);
      content.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onMouseMove);
      window.removeEventListener('pointerup', onMouseUp);
      window.removeEventListener('pointercancel', onMouseUp);
    };
  }, [contentRef, overlayRef, closeRef]);

  return null;
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean;
}) {
  const contentRef = React.useRef<HTMLDivElement>(null);
  const overlayRef = React.useRef<HTMLDivElement>(null);
  const closeRef = React.useRef<HTMLButtonElement>(null);

  return (
    <DialogPortal>
      <DialogOverlay ref={overlayRef} />
      <DialogPrimitive.Content
        ref={contentRef}
        data-slot="dialog-content"
        className={cn(
          'fixed z-50 grid max-h-[92dvh] w-full gap-5 overflow-y-auto bg-popover p-6 text-popover-foreground shadow-ds-3 outline-none data-open:duration-[280ms] data-open:ease-out data-closed:duration-150 data-closed:ease-in max-sm:data-open:duration-[280ms] max-sm:data-closed:duration-200 sm:data-open:duration-200 sm:data-closed:duration-150 max-sm:inset-x-0 max-sm:bottom-0 max-sm:rounded-t-2xl max-sm:pt-8 max-sm:pb-[calc(1.5rem+env(safe-area-inset-bottom))] max-sm:data-open:slide-in-from-bottom max-sm:data-closed:slide-out-to-bottom sm:top-1/2 sm:left-1/2 sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:data-open:zoom-in-96 sm:data-open:fade-in-0 sm:data-closed:zoom-out-96 sm:data-closed:fade-out-0 data-open:animate-in data-closed:animate-out data-[swiped=true]:animate-none dark:ring-1 dark:ring-border before:absolute before:top-3 before:left-1/2 before:h-1 before:w-10 before:-translate-x-1/2 before:rounded-full before:bg-line-strong sm:before:hidden',
          className,
        )}
        {...props}
      >
        <DialogSwipeController
          contentRef={contentRef}
          overlayRef={overlayRef}
          closeRef={closeRef}
        />
        {children}
        <DialogPrimitive.Close
          ref={closeRef}
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
        />
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
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn('flex flex-col gap-2', className)}
      {...props}
    />
  );
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<'div'> & {
  showCloseButton?: boolean;
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        'flex flex-col-reverse gap-3 sm:flex-row sm:justify-end',
        className,
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
  );
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn('type-label-l pr-8', className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        'type-body-s text-ink-soft *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground',
        className,
      )}
      {...props}
    />
  );
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
};
