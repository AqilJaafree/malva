# 📌 Project To‑Do List & PRD

A complete checklist and PRD for your crypto AI analytics + DCA platform.

---

# ✅ To‑Do List (MVP)

## **1. Foundation Setup**

* [x] Set up Next.js project
* [x] Integrate Privy (Auth + Embedded Wallet)
* [x] Configure Privy wallet creation flow
* [x] Create login form UI (email + OTP verification)
* [x] Implement theme system (light/dark mode with persistence)
* [ ] Implement backend server (Node.js / Next.js API routes)
<!-- * [ ] Set up database (Supabase / PostgreSQL) -->
* [ ] Prepare user schema (wallet address, portfolio style, settings)

---

## **2. Onboarding Flow**

* [x] Build wallet creation modal (Privy)
* [x] Build asset selection popup (BTC/GOLD choice)
* [x] Build 3-step onboarding flow (Asset → Investment → Goal)
* [x] Add monthly investment amount question
* [x] Add investment goal question
* [x] Save onboarding data to localStorage (temporary cache)
* [ ] Migrate onboarding data to database
* [ ] Create optional onboarding slides (educational content)

---

## **3. Chatbot Main Page**

* [x] Create chat UI component
* [x] Create analytics card response template
* [x] Auto-show analytics after user query
* [x] Add starter prompt cards with animations
* [x] Implement gradient background effects
* [ ] Connect AI provider (OpenAI / x402 LLM)
* [ ] Integrate x402 analytics data endpoints

---

## **4. Analytics Engine**

* [ ] Integrate x402 real-time BTC/GOLD data
* [ ] Build risk scoring algorithm (simple version)
* [ ] Build trend analysis module
* [ ] Daily volatility score
* [ ] Funding rate + volume tracking

---

## **5. DCA Module (Jupiter)**

* [ ] Connect Jupiter API / SDK
* [ ] Build DCA setup modal

  * [ ] Select asset
  * [ ] Select amount
  * [ ] Select frequency
* [ ] Implement transaction signer using Privy
* [ ] Create backend scheduler to handle DCA jobs
* [ ] Track DCA execution state in DB

---

## **6. Dashboard**

* [x] Create portfolio dashboard page (main layout with chat + analytics)
* [x] Create Navbar component with theme toggle
* [x] Implement light/dark mode theme system
* [x] Mobile-responsive analytics panel with drawer
* [ ] Show current holdings (fetch via wallet + Jupiter)
* [ ] Display next DCA execution date
* [ ] Display P/L & performance
* [ ] Allow cancel/edit DCA job

---

## **7. Template Marketplace (Optional MVP)**

* [ ] Create template schema (name, tags, rules, allocation)
* [ ] UI for browsing templates
* [ ] Apply template to user portfolio
* [ ] Add “AI Smart Portfolio” option

---

## **8. Notifications (Optional)**

* [ ] Market risk updates
* [ ] DCA executed alerts
* [ ] Cycle signal alerts

---

## **9. Deployment**

* [ ] CI/CD setup
* [ ] Production environment (Vercel / Fly.io)
* [ ] Error logging (Sentry)
* [ ] Analytics tracking (Plausible)

---

# 📝 Product Requirements Document (PRD)

## **1. Product Overview**

A platform that combines:

* Embedded crypto wallet (Privy)
* AI analytics & insights (x402)
* Automated DCA execution (Jupiter)
* Focus on Bitcoin (BTC) and Gold assets

Targeted at users who want high-quality market insights + automated investing in Bitcoin and Gold without complexity.

---

## **2. Objectives**

* Provide real-time Wall Street–grade market analytics for BTC and Gold
* Allow users to automatically DCA into Bitcoin or Gold
* Remove friction from onboarding with an embedded wallet
* Deliver a chatbot-centric interface for analysis & execution

---

## **3. Key Features**

### **3.1 Privy Wallet Integration**

* Users create crypto wallets instantly
* No seed phrase friction
* Authentication via email/social login

### **3.2 Asset Selection**

* Bitcoin (BTC) - Digital gold, decentralized cryptocurrency
* Gold - Traditional store of value

Users choose their primary asset focus (BTC or GOLD) for DCA and analytics.

### **3.3 AI Chat Interface**

* Users ask anything about market, prices, trends
* AI generates insights using x402 real-time data
* Displays analytics cards (trend score, risk, cycle position)

### **3.4 DCA Automation (Jupiter)**

* Choose asset, amount, frequency
* Sign transaction using Privy wallet
* Re-executes automatically based on schedule

### **3.5 Portfolio Dashboard**

* Track holdings
* Track performance and P/L
* View and manage DCA schedules

### **3.6 Strategy Templates (Optional)**

* Users choose preset investing templates
* Templates specify allocations + DCA rules

---

## **4. Non-Functional Requirements**

* **Performance**: Chatbot must respond within 1–2 seconds
* **Scalability**: Handle 1,000 concurrent users
* **Security**: Privy self-custody, no private keys in backend
* **Uptime**: > 99% availability

---

## **5. User Personas**

### **1. Beginner Crypto User**

* Wants to buy BTC safely
* Doesn’t understand charts
* Needs simple instructions

### **2. Intermediate Trader**

* Follows market cycles
* Wants analytics but not expensive subscriptions

### **3. Long-Term Investor**

* Wants automated DCA
* Wants portfolio performance overview

---

## **6. Success Metrics (KPIs)**

* **Activation rate**: % users who complete wallet + asset selection
* **DCA conversion rate**: % users who start a DCA job
* **Daily active users** (DAU)
* **Chat engagement rate**
* **Retention after 30 days**

---

## **7. Risks**

* Market volatility → user hesitation
* Trust issues → solved by transparent data
* API rate limits → must cache results

---

## **8. Future Add-ons**

* Copy-trading functionality
* Advanced portfolio optimization
* Multi-chain expansion
* Social feed for analysts
