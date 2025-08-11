import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface ConfirmDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  itemName: string;
  itemType: string; // "agent", "memory", "note", etc.
  isDeleting?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  description?: string;
}

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  itemName,
  itemType,
  isDeleting = false,
  onConfirm,
  onCancel,
  description,
}: ConfirmDeleteDialogProps) {
  const defaultDescription = `Are you sure you want to delete this ${itemType}? This action cannot be undone.`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-muted-foreground">
            {description || defaultDescription}
          </p>
          {itemName && (
            <p className="mt-2 text-foreground">
              <strong>{itemName}</strong>
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={isDeleting}
            onClick={onConfirm}
          >
            {isDeleting ? (
              <>
                <Loader2 size={16} className="animate-spin mr-2" />
                Deleting...
              </>
            ) : (
              `Delete ${itemType}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
