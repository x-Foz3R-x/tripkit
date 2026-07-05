// src/components/responsive-modal.tsx
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

interface DrawerDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
}

export function DrawerDialog({
  isOpen,
  setIsOpen,
  title,
  description,
  children,
}: DrawerDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-theme-bg text-theme-text border-white/10 p-5 outline-none sm:max-w-lg">
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
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerContent className="bg-theme-bg pb-safe border-t border-white/10 text-white">
        <DrawerHeader className="text-left">
          <DrawerTitle>{title}</DrawerTitle>
          {description && <DrawerDescription>{description}</DrawerDescription>}
        </DrawerHeader>
        <div className="max-h-[70dvh] overflow-y-auto p-6">{children}</div>
      </DrawerContent>
    </Drawer>
  );
}
