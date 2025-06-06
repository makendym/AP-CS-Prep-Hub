import { useEffect, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface SessionTimeoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  countdownDuration: number;
}

export default function SessionTimeoutModal({
  isOpen,
  onClose,
  onContinue,
  countdownDuration,
}: SessionTimeoutModalProps) {
  const [timeLeft, setTimeLeft] = useState(countdownDuration);

  // Reset timer when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeLeft(countdownDuration);
    }
  }, [isOpen, countdownDuration]);

  // Handle countdown
  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose(); // This will trigger the logout
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [isOpen, onClose]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  const handleContinue = useCallback(() => {
    onContinue();
  }, [onContinue]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Session Timeout Warning</DialogTitle>
          <DialogDescription>
            Your session is about to expire due to inactivity.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 text-center">
          <p className="text-2xl font-bold text-primary">{formatTime(timeLeft)}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Time remaining before automatic logout
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Logout Now
          </Button>
          <Button onClick={handleContinue}>Continue Session</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 