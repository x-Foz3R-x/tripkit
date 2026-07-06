// src/components/quick-drawer.tsx
"use client";

import * as React from "react";
import { Drawer } from "vaul";
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

export function QuickDrawer({ trigger, title, description, children }: QuickDrawerProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // Wersja Desktopowa - klasyczny modal (Radix Dialog)
  if (isDesktop) {
    return (
      <Dialog>
        {/* Celowo bez asChild, żeby uniknąć błędu TS */}
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

  // Wersja Mobilna - Vaul Drawer (idealna płynność i swipe)
  return (
    <Drawer.Root shouldScaleBackground>
      {/* Vaul wspiera asChild perfekcyjnie, więc tu go zostawiamy */}
      <Drawer.Trigger asChild>{trigger}</Drawer.Trigger>

      <Drawer.Portal>
        {/* Tło przyciemniające pod szufladą */}
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />

        {/* Główny kontener szuflady */}
        <Drawer.Content className="bg-theme-bg fixed inset-x-0 bottom-0 z-50 mt-24 flex max-h-[85dvh] flex-col rounded-t-2xl border-t border-white/10 text-white outline-none">
          {/* Uchwyt (pigułka) do przeciągania */}
          <div className="mx-auto mt-3 mb-2 h-1.5 w-12 shrink-0 rounded-full bg-white/20" />

          {/* Kontent z własnym scrollowaniem (jeśli jest za długi) */}
          <div className="pb-safe overflow-y-auto px-6 pt-2">
            <Drawer.Title className="text-lg font-bold">{title}</Drawer.Title>
            {description && (
              <Drawer.Description className="text-theme-muted mt-1 text-sm">
                {description}
              </Drawer.Description>
            )}

            <div className="mt-4">{children}</div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
