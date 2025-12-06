'use client';

import { PrivyProvider } from '@privy-io/react-auth';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'your-privy-app-id'}
      config={{
        // Appearance customization
        appearance: {
          theme: 'dark',
          accentColor: '#676FFF',
        },
        // Create embedded wallets for all users on login
        embeddedWallets: {
          solana: {
            createOnLogin: 'all-users',
          },
        },
        // Enable email login
        loginMethods: ['email', 'wallet'],
      }}
    >
      {children}
    </PrivyProvider>
  );
}

