"use client"

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";

interface GuestNameDialogProps {
  open: boolean;
  onSubmit: (displayName: string) => void;
  onCancel: () => void;
}

export const GuestNameDialog = ({ open, onSubmit, onCancel }: GuestNameDialogProps) => {
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    const trimmed = displayName.trim();
    if (!trimmed) {
      setError("Введите никнейм");
      return;
    }
    if (trimmed.length < 2) {
      setError("Никнейм должен содержать минимум 2 символа");
      return;
    }
    if (trimmed.length > 50) {
      setError("Никнейм должен содержать максимум 50 символов");
      return;
    }
    onSubmit(trimmed);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="glass-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Добро пожаловать!
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Введите никнейм, который будет отображаться вместе с вашими комментариями и лайками.
            Изменить его смогут только модераторы, администраторы и CEO.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          <div>
            <Input
              placeholder="Ваш никнейм"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSubmit();
                }
              }}
              className="glass-card border-border"
              maxLength={50}
              autoFocus
            />
            {error && (
              <p className="text-sm text-destructive mt-1">{error}</p>
            )}
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={onCancel}
              className="glass-card border-border"
            >
              Отмена
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-primary hover:bg-primary/90"
            >
              Продолжить
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
