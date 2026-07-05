"use client";

import { useEffect, useState } from "react";
import { useMediaQuery } from "~/hooks/use-media-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "~/components/ui/drawer";

interface ResponsiveModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
}

const EXIT_ANIMATION_MS = 260;

export function ResponsiveModal({
  isOpen,
  setIsOpen,
  title,
  description,
  children,
}: ResponsiveModalProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [shouldRender, setShouldRender] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      return;
    }

    const timeout = window.setTimeout(() => {
      setShouldRender(false);
    }, EXIT_ANIMATION_MS);

    return () => window.clearTimeout(timeout);
  }, [isOpen]);

  if (!shouldRender) return null;

  const accessibleTitle = title ?? "Dodaj wydatek";
  const accessibleDescription = description ?? "Formularz dodawania nowego wydatku.";

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          showCloseButton={false}
          className="bg-theme-bg text-theme-text border-white/10 p-5 sm:max-w-lg"
        >
          <DialogHeader className="sr-only">
            <DialogTitle>{accessibleTitle}</DialogTitle>
            <DialogDescription>{accessibleDescription}</DialogDescription>
          </DialogHeader>

          {children}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen} showSwipeHandle swipeDirection="down">
      <DrawerContent className="bg-theme-bg text-theme-text max-h-[calc(100dvh-1rem)]! rounded-t-3xl! border-white/10 duration-250!">
        <DrawerTitle className="sr-only">{accessibleTitle}</DrawerTitle>
        <DrawerDescription className="sr-only">{accessibleDescription}</DrawerDescription>

        <div className="max-h-[calc(100dvh-4.5rem)] overflow-y-auto overscroll-contain px-4 pt-1 pb-8">
          {children}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
