'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface EmailLoginFormProps {
  email: string;
  onEmailChange: (email: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export function EmailLoginForm({ 
  email, 
  onEmailChange, 
  onSubmit,
  disabled = false 
}: EmailLoginFormProps) {
  return (
    <div className="w-full max-w-md bg-card backdrop-blur-sm rounded-2xl border border-border p-8 shadow-lg">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground mb-2">
          Login to your account
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your email below to login to your account
        </p>
      </div>

      {/* Email Field */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Email
          </label>
          <Input
            id="email"
            type="email"
            placeholder="you@gmail.com"
            value={email}
            onChange={(e) => onEmailChange(e.currentTarget.value)}
            aria-label="Email address"
            disabled={disabled}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && email) {
                onSubmit();
              }
            }}
          />
        </div>

        {/* Send Code Button */}
        <Button
          onClick={onSubmit}
          disabled={!email || disabled}
          className="w-full"
        >
          {disabled ? 'Sending...' : 'Send Code'}
        </Button>
      </div>
    </div>
  );
}

