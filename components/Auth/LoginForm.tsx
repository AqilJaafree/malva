'use client';

import { usePrivy, useLoginWithEmail } from '@privy-io/react-auth';
import { useState } from 'react';
import { EmailLoginForm } from './EmailLoginForm';
import { OTPVerificationDialog } from './OTPVerificationDialog';
import { UserProfile } from './UserProfile';

export function LoginForm() {
  const { ready, authenticated, user, logout } = usePrivy();
  const { sendCode, loginWithCode } = useLoginWithEmail();
  
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleSendCode = async () => {
    if (!email) return;
    try {
      await sendCode({ email });
      setOtpDialogOpen(true);
    } catch (error) {
      console.error('Error sending code:', error);
    }
  };

  const handleResendCode = async () => {
    if (!email) return;
    setIsResending(true);
    try {
      await sendCode({ email });
    } catch (error) {
      console.error('Error resending code:', error);
    } finally {
      setIsResending(false);
    }
  };

  const handleVerify = async () => {
    if (!code || code.length !== 6) return;
    try {
      await loginWithCode({ code });
      setOtpDialogOpen(false);
      setCode('');
    } catch (error) {
      console.error('Error logging in:', error);
    }
  };

  if (!ready) {
    return (
      <div className="flex items-center justify-center">
        <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
      </div>
    );
  }

  if (authenticated && user) {
    return (
      <UserProfile
        email={user.email?.address}
        walletAddress={user.wallet?.address}
        onLogout={logout}
      />
    );
  }

  return (
    <>
      <EmailLoginForm
        email={email}
        onEmailChange={setEmail}
        onSubmit={handleSendCode}
      />
      
      <OTPVerificationDialog
        open={otpDialogOpen}
        onOpenChange={setOtpDialogOpen}
        code={code}
        onCodeChange={setCode}
        onVerify={handleVerify}
        onResend={handleResendCode}
        isResending={isResending}
      />
    </>
  );
}

