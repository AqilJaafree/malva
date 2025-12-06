'use client';

import { usePrivy } from '@privy-io/react-auth';
import { LoginForm } from "@/components/Auth";
import { Dashboard } from "@/components/Dashboard";
// import DebugInfo from "../components/DebugInfo";

export default function Home() {
  const { authenticated, ready } = usePrivy();

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className='flex items-center justify-center gap-2'>
          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
          <span className='text-sm text-muted-foreground'>Loading...</span>
        </div>
      </div>
    );
  }

  if (authenticated) {
    return <Dashboard />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <LoginForm />
      {/* <DebugInfo /> */}
    </div>
  );
}
