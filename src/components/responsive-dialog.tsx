// src/components/responsive-dialog.tsx
"use client";

import * as React from "react";
import { ArrowLeft } from "lucide-react";
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
  onBack?: () => void;
  children: React.ReactNode;
}

export function ResponsiveDialog({
  isOpen,
  setIsOpen,
  title,
  description,
  onBack,
  children,
}: DrawerDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-theme-bg text-theme-text border-theme-border p-5 outline-hidden sm:max-w-lg">
          {(title ?? description ?? onBack) && (
            <div className="flex items-start gap-3">
              {onBack && <BackButton onClick={onBack} />}
              {(title ?? description) && (
                <DialogHeader className="min-w-0 flex-1">
                  {title && <DialogTitle>{title}</DialogTitle>}
                  {description && <DialogDescription>{description}</DialogDescription>}
                </DialogHeader>
              )}
            </div>
          )}
          {children}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer
      open={isOpen}
      onOpenChange={setIsOpen}
      shouldScaleBackground={false}
      repositionInputs={false}
      direction="bottom"
    >
      <DrawerContent className="bg-theme-bg pb-safe border-theme-border text-theme-text border-t outline-hidden">
        <div className="" />

        {(title ?? description ?? onBack) && (
          <DrawerHeader className="text-left">
            <div className="flex items-start gap-3">
              {onBack && <BackButton onClick={onBack} />}
              {(title ?? description) && (
                <div className="min-w-0 flex-1">
                  {title && <DrawerTitle>{title}</DrawerTitle>}
                  {description && <DrawerDescription>{description}</DrawerDescription>}
                </div>
              )}
            </div>
          </DrawerHeader>
        )}
        <div className="max-h-[75dvh] overflow-y-auto p-6">{children}</div>
      </DrawerContent>
    </Drawer>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="border-theme-border text-theme-muted hover:text-theme-text flex size-11 shrink-0 items-center justify-center rounded-full border transition"
      aria-label="Wróć"
    >
      <ArrowLeft size={19} />
    </button>
  );
}
