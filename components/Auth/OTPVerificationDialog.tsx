'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';

interface OTPVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  code: string;
  onCodeChange: (code: string) => void;
  onVerify: () => void;
  onResend: () => void;
  isResending?: boolean;
}

export function OTPVerificationDialog({
  open,
  onOpenChange,
  code,
  onCodeChange,
  onVerify,
  onResend,
  isResending = false,
}: OTPVerificationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Enter verification code
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            We sent a 6-digit code to your email.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-6 py-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="otp" className="text-sm font-medium">
              Verification code
            </label>
            <InputOTP
              maxLength={6}
              value={code}
              onChange={onCodeChange}
            >
              <InputOTPGroup className="justify-center gap-4">
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Enter the 6-digit code sent to your email.
            </p>
          </div>

          <Button
            onClick={onVerify}
            disabled={code.length !== 6}
            className="w-full"
          >
            Verify
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={onResend}
              disabled={isResending}
              className="text-sm text-muted-foreground hover:text-foreground underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResending ? 'Sending...' : "Didn't receive the code? Resend"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

