'use client';

import { usePrivy, useLoginWithEmail } from '@privy-io/react-auth';
import { useState } from 'react';

export default function LoginButton() {
  const { ready, authenticated, user, logout } = usePrivy();
  const { sendCode, loginWithCode } = useLoginWithEmail();
  
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);

  const handleSendCode = async () => {
    if (!email) return;
    try {
      await sendCode({ email });
      setCodeSent(true);
    } catch (error) {
      console.error('Error sending code:', error);
    }
  };

  const handleLoginWithCode = async () => {
    if (!code) return;
    try {
      await loginWithCode({ code });
    } catch (error) {
      console.error('Error logging in:', error);
    }
  };

  // Wait for Privy to be ready
  if (!ready) {
    return (
      <div className="flex items-center justify-center">
        <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
      </div>
    );
  }

  // If authenticated, show user info and logout
  if (authenticated && user) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Logged in as:
          </p>
          <p className="font-medium text-zinc-950 dark:text-zinc-50">
            {user.email?.address || user.wallet?.address}
          </p>
        </div>
        <button
          onClick={logout}
          className="flex h-12 w-full items-center justify-center rounded-full bg-red-600 px-5 text-white transition-colors hover:bg-red-700"
        >
          Logout
        </button>
      </div>
    );
  }

  // Login form
  return (
    <div className="flex flex-col gap-4 w-full max-w-md">
      <h2 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
        Login with Email
      </h2>
      
      {!codeSent ? (
        <>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            className="h-12 rounded-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-5 text-zinc-950 dark:text-zinc-50"
            aria-label="Email address"
          />
          <button
            onClick={handleSendCode}
            disabled={!email}
            className="flex h-12 w-full items-center justify-center rounded-full bg-zinc-950 dark:bg-zinc-50 px-5 text-white dark:text-zinc-950 transition-colors hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send Code
          </button>
        </>
      ) : (
        <>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            We sent a code to {email}
          </p>
          <input
            type="text"
            placeholder="Enter verification code"
            value={code}
            onChange={(e) => setCode(e.currentTarget.value)}
            className="h-12 rounded-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-5 text-zinc-950 dark:text-zinc-50"
            aria-label="Verification code"
          />
          <button
            onClick={handleLoginWithCode}
            disabled={!code}
            className="flex h-12 w-full items-center justify-center rounded-full bg-zinc-950 dark:bg-zinc-50 px-5 text-white dark:text-zinc-950 transition-colors hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Verify & Login
          </button>
          <button
            onClick={() => {
              setCodeSent(false);
              setCode('');
            }}
            className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50"
          >
            Use different email
          </button>
        </>
      )}
    </div>
  );
}

