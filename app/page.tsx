import { LoginForm } from "@/components/Auth";
import WalletInfo from "@/components/WalletInfo";
// import DebugInfo from "../components/DebugInfo";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-8 py-32 px-16 bg-white dark:bg-black">
        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
            Malva
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            AI Crypto Analytics + DCA Platform
          </p>
        </div>

        <LoginForm />
        <WalletInfo />
      </main>
      
      {/* <DebugInfo /> */}
    </div>
  );
}
