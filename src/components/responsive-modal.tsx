"use client";

import * as React from "react";
import { useMediaQuery } from "~/hooks/use-media-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "~/components/ui/drawer";

interface ResponsiveModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
}

export function ResponsiveModal({
  isOpen,
  setIsOpen,
  title,
  description,
  children,
}: ResponsiveModalProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-theme-bg/50 text-white outline-0 outline-none sm:max-w-106.25">
          <DialogHeader>
            <DialogTitle className="text-xl">{title}</DialogTitle>
            <DialogDescription className={description ? "text-theme-muted" : "sr-only"}>
              {description ?? title}
            </DialogDescription>
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerContent className="bg-theme-bg/50 pb-safe border-t border-white/10 text-white">
        <div className="mx-auto mt-2 mb-4 h-1 w-12 rounded-full bg-white/20" />

        <DrawerHeader className="text-left">
          <DrawerTitle className="text-xl">{title}</DrawerTitle>
          <DrawerDescription className={description ? "text-theme-muted" : "sr-only"}>
            {description ?? title}
          </DrawerDescription>
        </DrawerHeader>

        <div className="max-h-[80vh] overflow-y-auto px-4 pt-2 pb-8">{children}</div>
      </DrawerContent>
    </Drawer>
  );
}
