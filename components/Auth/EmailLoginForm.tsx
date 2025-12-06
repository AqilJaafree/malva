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
    <div className="flex flex-col gap-4 w-full max-w-md">
      <h2 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
        Login with Email
      </h2>
      
      <div className="flex flex-col gap-3">
        <Input
          type="email"
          placeholder="Enter your email"
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
        <Button
          onClick={onSubmit}
          disabled={!email || disabled}
          className="w-full"
        >
          Send Code
        </Button>
      </div>
    </div>
  );
}

