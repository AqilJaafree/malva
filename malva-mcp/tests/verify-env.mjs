#!/usr/bin/env node
/**
 * Verify .env configuration for x402 testing
 */

import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

console.log('\n=== Environment Variable Verification ===\n');

// Check if .env file exists
if (!fs.existsSync('.env')) {
  console.log('❌ .env file not found!');
  console.log('   Please create .env file from .env.example');
  process.exit(1);
}

console.log('✅ .env file found');

// Read .env file to show what's there
const envContent = fs.readFileSync('.env', 'utf8');
console.log('\n📄 Current .env file content:');
console.log('━'.repeat(60));
envContent.split('\n').forEach((line, index) => {
  // Mask private key if present
  if (line.startsWith('TEST_WALLET_PRIVATE_KEY=') && line.length > 30) {
    const key = line.split('=')[1];
    console.log(`${index + 1}: TEST_WALLET_PRIVATE_KEY=${key.substring(0, 10)}...${key.substring(key.length - 10)} (masked)`);
  } else {
    console.log(`${index + 1}: ${line}`);
  }
});
console.log('━'.repeat(60));

// Check environment variables
console.log('\n🔍 Loaded Environment Variables:\n');

const requiredVars = [
  'X402_TREASURY_ADDRESS',
  'X402_FACILITATOR_URL',
  'SOLANA_RPC_URL',
  'USDC_MINT_MAINNET',
  'TEST_WALLET_PRIVATE_KEY'
];

let allPresent = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value && value.trim() !== '') {
    if (varName === 'TEST_WALLET_PRIVATE_KEY') {
      console.log(`✅ ${varName}: ${value.substring(0, 10)}...${value.substring(value.length - 10)} (${value.length} chars)`);
    } else {
      console.log(`✅ ${varName}: ${value}`);
    }
  } else {
    console.log(`❌ ${varName}: NOT SET or EMPTY`);
    allPresent = false;
  }
});

console.log('\n' + '='.repeat(60));

if (!allPresent) {
  console.log('\n⚠️  Missing required environment variables!');
  console.log('\n📝 To add your private key:');
  console.log('   1. Export your private key from Phantom/Solflare wallet');
  console.log('   2. Open .env file in your editor');
  console.log('   4. Add your key after the = sign:');
  console.log('   5. Save the file');
  console.log('\n⚠️  Example:');
  console.log('\n🔒 Security reminder: Never commit .env to git!\n');
  process.exit(1);
} else {
  console.log('\n✅ All required environment variables are set!');
  console.log('   You can now run: node test-x402-payment.mjs\n');
  process.exit(0);
}
