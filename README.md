# Malva 🌿

AI-powered crypto analytics and DCA (Dollar Cost Averaging) platform built with Next.js, Privy, and Solana.

## Features

- 🔐 **Email Authentication** - Easy login with email OTP via Privy
- 💼 **Embedded Wallet** - Automatic Solana wallet creation (no seed phrases!)
- 📊 **AI Analytics** - Real-time market insights powered by x402
- 💰 **Automated DCA** - Set-and-forget crypto investing via Jupiter
- 🎯 **Portfolio Styles** - Conservative, Moderate, Aggressive, or AI-driven

## Prerequisites

- Node.js 18+ or Bun
- pnpm (recommended)
- A Privy account and App ID

## Getting Started

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Privy Configuration
NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id-here
```

**To get your Privy App ID:**
1. Go to [Privy Dashboard](https://dashboard.privy.io/)
2. Sign up or log in
3. Create a new app
4. Copy your App ID from the dashboard
5. Paste it in `.env.local`

### 3. Run the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see your app.

## Project Structure

```
malva/
├── app/
│   ├── components/
│   │   ├── LoginButton.tsx    # Email authentication UI
│   │   └── WalletInfo.tsx     # Wallet display component
│   ├── providers.tsx          # Privy provider configuration
│   ├── layout.tsx             # Root layout with providers
│   └── page.tsx               # Main page
├── public/                    # Static assets
└── todo.md                    # Product roadmap and PRD
```

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Authentication**: Privy (Email + Embedded Wallets)
- **Blockchain**: Solana
- **Styling**: TailwindCSS 4
- **Language**: TypeScript
- **Package Manager**: pnpm

## Current Implementation Status

✅ Privy integration with email authentication  
✅ Embedded Solana wallet creation  
✅ User authentication flow  
⏳ x402 analytics integration  
⏳ Jupiter DCA automation  
⏳ Portfolio dashboard  

See `todo.md` for the complete roadmap.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Privy Documentation](https://docs.privy.io/)
- [Solana Documentation](https://docs.solana.com/)

## Deploy on Vercel

The easiest way to deploy is using the [Vercel Platform](https://vercel.com/new):

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add your `NEXT_PUBLIC_PRIVY_APP_ID` environment variable
4. Deploy!

## License

MIT
