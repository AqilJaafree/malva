#!/usr/bin/env node
/**
 * x402 Payment Integration Test Script
 * Tests the full payment flow with a real Solana wallet
 */

import { Connection, Keypair, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
  getAccount
} from '@solana/spl-token';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import bs58 from 'bs58';

dotenv.config();

// Configuration
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3001';
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const TREASURY_ADDRESS = process.env.X402_TREASURY_ADDRESS;
const USDC_MINT = process.env.USDC_MINT_MAINNET;
const TEST_WALLET_PRIVATE_KEY = process.env.TEST_WALLET_PRIVATE_KEY; // Base58 encoded private key

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60) + '\n');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Initialize connection and wallet
let connection;
let wallet;

async function initializeWallet() {
  logSection('🔐 Wallet Initialization');

  if (!TEST_WALLET_PRIVATE_KEY) {
    throw new Error('TEST_WALLET_PRIVATE_KEY not found in .env file');
  }

  try {
    // Decode base58 private key
    const privateKeyBytes = bs58.decode(TEST_WALLET_PRIVATE_KEY);
    wallet = Keypair.fromSecretKey(privateKeyBytes);

    logSuccess(`Wallet loaded successfully`);
    logInfo(`Public Key: ${wallet.publicKey.toBase58()}`);

    // Initialize connection
    connection = new Connection(SOLANA_RPC_URL, 'confirmed');
    logSuccess(`Connected to Solana ${SOLANA_RPC_URL}`);

    return wallet;
  } catch (error) {
    logError(`Failed to load wallet: ${error.message}`);
    throw error;
  }
}

async function checkWalletBalance() {
  logSection('💰 Wallet Balance Check');

  try {
    // Check SOL balance
    const solBalance = await connection.getBalance(wallet.publicKey);
    const solBalanceFormatted = (solBalance / LAMPORTS_PER_SOL).toFixed(4);

    logInfo(`SOL Balance: ${solBalanceFormatted} SOL`);

    if (solBalance < 0.001 * LAMPORTS_PER_SOL) {
      logWarning('Low SOL balance. You may not have enough for transaction fees.');
    } else {
      logSuccess('SOL balance sufficient for transaction fees');
    }

    // Check USDC balance
    try {
      const usdcMint = new PublicKey(USDC_MINT);

      // Get associated token account
      const associatedTokenAccount = await getAssociatedTokenAddress(
        usdcMint,
        wallet.publicKey
      );

      try {
        const tokenAccount = await getAccount(connection, associatedTokenAccount);
        const usdcBalance = Number(tokenAccount.amount) / 1_000_000; // USDC has 6 decimals
        logInfo(`USDC Balance: ${usdcBalance.toFixed(6)} USDC`);

        if (usdcBalance < 0.10) {
          logWarning('Low USDC balance. You may not have enough for payments.');
        } else {
          logSuccess('USDC balance sufficient for test payments');
        }
      } catch (error) {
        logWarning('No USDC token account found. You may need to create one.');
      }
    } catch (error) {
      logWarning(`Could not check USDC balance: ${error.message}`);
    }

    return { solBalance };
  } catch (error) {
    logError(`Failed to check balance: ${error.message}`);
    throw error;
  }
}

async function testServerConnection() {
  logSection('🌐 Server Connection Test');

  try {
    // Test server info endpoint
    const infoResponse = await fetch(`${SERVER_URL}/`);
    const info = await infoResponse.json();

    logSuccess('Server is online');
    logInfo(`Server: ${info.name} v${info.version}`);
    logInfo(`Payment: ${info.payment?.enabled ? 'Enabled' : 'Disabled'}`);

    // Test pricing endpoint
    const pricingResponse = await fetch(`${SERVER_URL}/pricing`);
    const pricing = await pricingResponse.json();

    logSuccess('Pricing endpoint available');
    logInfo(`Treasury: ${pricing.payment.treasuryAddress}`);
    logInfo(`Token: ${pricing.payment.token.symbol}`);
    logInfo(`Total Tools: ${pricing.tools.length}`);

    console.log('\n📋 Tool Pricing:');
    pricing.tools.forEach(tool => {
      console.log(`   - ${tool.name}: ${tool.price.formatted}`);
    });

    return pricing;
  } catch (error) {
    logError(`Server connection failed: ${error.message}`);
    throw error;
  }
}

async function testPaymentFlow() {
  logSection('💳 x402 Payment Flow Test');

  let sessionId = null;

  try {
    // Step 1: Initialize MCP session
    log('\n📍 Step 1: Initialize MCP Session', 'cyan');
    const initResponse = await fetch(`${SERVER_URL}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: {
            name: 'x402-test-client',
            version: '1.0.0'
          }
        },
        id: 1
      })
    });

    if (!initResponse.ok) {
      throw new Error(`Init failed: ${initResponse.status}`);
    }

    sessionId = initResponse.headers.get('mcp-session-id');
    const contentType = initResponse.headers.get('content-type');

    // Parse SSE response if needed
    let initResult;
    if (contentType?.includes('text/event-stream')) {
      const text = await initResponse.text();
      const dataMatch = text.match(/data: (.+)/);
      if (dataMatch) {
        initResult = JSON.parse(dataMatch[1]);
      }
    } else {
      initResult = await initResponse.json();
    }

    logSuccess(`Session initialized: ${sessionId}`);
    logInfo(`Server capabilities: ${JSON.stringify(initResult.result?.capabilities || {})}`);

    // Step 2: Request tool without payment (expect 402)
    log('\n📍 Step 2: Request Tool Without Payment (Expect 402)', 'cyan');
    const toolRequestNoPayment = await fetch(`${SERVER_URL}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'mcp-session-id': sessionId
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'get-current-prices',
          arguments: {}
        },
        id: 2
      })
    });

    if (toolRequestNoPayment.status !== 402) {
      logWarning(`Expected 402, got ${toolRequestNoPayment.status}`);
    } else {
      logSuccess('Received 402 Payment Required (as expected)');
    }

    const paymentRequirement = await toolRequestNoPayment.json();

    console.log('\n💵 Payment Requirements:');
    console.log(JSON.stringify(paymentRequirement, null, 2));

    const paymentData = paymentRequirement.error?.data?.payment;
    const pricingInfo = paymentRequirement.error?.data?.pricing;

    if (!paymentData) {
      throw new Error('No payment requirements in 402 response');
    }

    logInfo(`Required Amount: ${pricingInfo.formatted}`);
    logInfo(`Description: ${pricingInfo.description}`);

    // Step 3: Create and sign payment transaction
    log('\n📍 Step 3: Create Payment Transaction', 'cyan');

    const amount = parseInt(paymentData.maxAmountRequired);
    logInfo(`Creating transaction for ${amount} micro-units (${(amount / 1_000_000).toFixed(6)} USDC)...`);

    // Create USDC transfer transaction
    const usdcMint = new PublicKey(paymentData.asset);
    // Use the payTo address from payment requirements (not TREASURY_ADDRESS env var)
    const treasury = new PublicKey(paymentData.payTo);
    logInfo(`Payment recipient (from requirements): ${paymentData.payTo}`);

    // Get associated token addresses for both wallet and treasury
    const walletTokenAccount = await getAssociatedTokenAddress(
      usdcMint,
      wallet.publicKey
    );

    const treasuryTokenAccount = await getAssociatedTokenAddress(
      usdcMint,
      treasury
    );

    logInfo(`From: ${walletTokenAccount.toBase58()}`);
    logInfo(`To: ${treasuryTokenAccount.toBase58()}`);

    // Verify wallet has USDC token account
    try {
      await getAccount(connection, walletTokenAccount);
    } catch (error) {
      throw new Error('No USDC token account found in your wallet. Please create one by receiving USDC first.');
    }

    // Verify treasury has USDC token account
    try {
      await getAccount(connection, treasuryTokenAccount);
    } catch (error) {
      throw new Error('Treasury has no USDC token account. Contact server administrator.');
    }

    // Create transfer instruction
    const transferInstruction = createTransferInstruction(
      walletTokenAccount,
      treasuryTokenAccount,
      wallet.publicKey,
      amount,
      [],
      TOKEN_PROGRAM_ID
    );

    const transaction = new Transaction().add(transferInstruction);

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;

    // Sign transaction
    transaction.sign(wallet);

    logSuccess('Transaction created and signed');

    // Step 4: Create X-PAYMENT header (BEFORE submitting transaction)
    log('\n📍 Step 4: Create X-PAYMENT Header', 'cyan');

    // The X-PAYMENT header format for x402-solana is:
    // {
    //   x402Version: 1,
    //   scheme: "exact",
    //   network: "solana",
    //   payload: {
    //     transaction: "<base64-encoded-serialized-transaction>"
    //   }
    // }
    const serializedTransaction = Buffer.from(transaction.serialize()).toString('base64');
    const paymentPayload = {
      x402Version: 1,
      scheme: paymentData.scheme || 'exact',
      network: paymentData.network,
      payload: {
        transaction: serializedTransaction
      }
    };

    const paymentHeader = Buffer.from(JSON.stringify(paymentPayload)).toString('base64');
    logSuccess('X-PAYMENT header created with signed transaction');
    logInfo(`Transaction size: ${transaction.serialize().length} bytes`);

    // Step 5: Send request with X-PAYMENT header
    // NOTE: The server will verify and settle (submit) the transaction
    log('\n📍 Step 5: Send Request With X-PAYMENT Header', 'cyan');
    logInfo('Server will verify and settle the payment...');

    const toolRequestWithPayment = await fetch(`${SERVER_URL}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'mcp-session-id': sessionId,
        'X-PAYMENT': paymentHeader
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'get-current-prices',
          arguments: {}
        },
        id: 3
      })
    });

    if (toolRequestWithPayment.ok) {
      logSuccess('Tool call successful with payment!');
      const result = await toolRequestWithPayment.json();

      console.log('\n📊 Tool Response:');
      console.log(JSON.stringify(result, null, 2).substring(0, 500) + '...');
    } else {
      logError(`Tool call failed: ${toolRequestWithPayment.status}`);
      const error = await toolRequestWithPayment.json();
      console.log(JSON.stringify(error, null, 2));
    }

  } catch (error) {
    logError(`Payment flow test failed: ${error.message}`);
    console.error(error);
    throw error;
  }
}

// Main test execution
async function runTests() {
  try {
    logSection('🚀 x402 Payment Integration Test Suite');
    log('Testing MCP server with x402 payment protocol\n', 'bright');

    await initializeWallet();
    await checkWalletBalance();
    await testServerConnection();
    await testPaymentFlow();

    logSection('🎉 All Tests Completed Successfully');
    process.exit(0);

  } catch (error) {
    logSection('💥 Test Suite Failed');
    logError(error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run tests
runTests();
