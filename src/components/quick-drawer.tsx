// src/components/quick-drawer.tsx
"use client";

import * as React from "react";
import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer";
import { useMediaQuery } from "~/hooks/use-media-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";

interface QuickDrawerProps {
  trigger: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}

/**
 * Diagnostyczny bliźniak DrawerDialog - w pełni samodzielny (trigger wbudowany,
 * open state nie jest lifted do rodzica). Na mobile omija Twój drawer.tsx
 * całkowicie i używa surowego Base UI: zero swipe handle, zero snap-pointów,
 * zero backdrop-blur, zero stackingu. Cel: sprawdzić, czy "goła" wersja
 * biblioteki jest szybka w Twojej appce.
 */
export function QuickDrawer({ trigger, title, description, children }: QuickDrawerProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <Dialog>
        <DialogTrigger>{trigger}</DialogTrigger>
        <DialogContent className="sm:max-w-106.25">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <DrawerPrimitive.Root>
      <DrawerPrimitive.Trigger>{trigger}</DrawerPrimitive.Trigger>
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/50 transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <DrawerPrimitive.Viewport className="fixed inset-0 z-50">
          <DrawerPrimitive.Popup className="bg-theme-bg fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] rounded-t-2xl border-t border-white/10 text-white transition-transform duration-200 outline-none data-ending-style:translate-y-full data-starting-style:translate-y-full">
            <DrawerPrimitive.Content className="max-h-[85dvh] overflow-y-auto p-6">
              <DrawerPrimitive.Title className="text-lg font-bold">{title}</DrawerPrimitive.Title>
              {description && (
                <DrawerPrimitive.Description className="text-theme-muted mt-1 text-sm">
                  {description}
                </DrawerPrimitive.Description>
              )}
              <div className="mt-4">{children}</div>
            </DrawerPrimitive.Content>
          </DrawerPrimitive.Popup>
        </DrawerPrimitive.Viewport>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
}
