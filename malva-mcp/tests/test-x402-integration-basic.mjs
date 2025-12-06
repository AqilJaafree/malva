#!/usr/bin/env node
/**
 * Basic x402 Integration Test - No Wallet Required
 * Tests that the server properly returns 402 responses with payment requirements
 */

import fetch from 'node-fetch';

const SERVER_URL = 'http://localhost:3001';

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

async function testServerInfo() {
  logSection('1️⃣  Server Information Test');

  try {
    const response = await fetch(`${SERVER_URL}/`);
    const info = await response.json();

    logSuccess('Server is online');
    logInfo(`Server: ${info.name} v${info.version}`);
    logInfo(`Protocol: ${info.protocol}`);
    logInfo(`Payment Enabled: ${info.payment?.enabled ? 'Yes' : 'No'}`);
    logInfo(`Payment Protocol: ${info.payment?.protocol}`);
    logInfo(`Network: ${info.payment?.network}`);

    if (!info.payment?.enabled) {
      throw new Error('Payment is not enabled on the server');
    }

    if (info.payment.protocol !== 'x402') {
      throw new Error(`Expected x402 protocol, got ${info.payment.protocol}`);
    }

    return true;
  } catch (error) {
    logError(`Server info test failed: ${error.message}`);
    throw error;
  }
}

async function testPricingEndpoint() {
  logSection('2️⃣  Pricing Endpoint Test');

  try {
    const response = await fetch(`${SERVER_URL}/pricing`);
    const pricing = await response.json();

    logSuccess('Pricing endpoint available');
    logInfo(`Treasury: ${pricing.payment.treasuryAddress}`);
    logInfo(`Token: ${pricing.payment.token.symbol} (${pricing.payment.token.mint})`);
    logInfo(`Facilitator: ${pricing.payment.facilitator}`);
    logInfo(`Total Tools: ${pricing.tools.length}`);

    // Verify all required fields are present
    if (!pricing.payment.treasuryAddress) {
      throw new Error('Missing treasury address');
    }

    if (!pricing.payment.token.mint) {
      throw new Error('Missing token mint address');
    }

    if (pricing.tools.length === 0) {
      throw new Error('No tools with pricing found');
    }

    console.log('\n📋 Tool Pricing:');
    pricing.tools.forEach(tool => {
      console.log(`   - ${tool.name}: ${tool.price.formatted}`);
    });

    return pricing;
  } catch (error) {
    logError(`Pricing endpoint test failed: ${error.message}`);
    throw error;
  }
}

async function testInitializeSession() {
  logSection('3️⃣  MCP Session Initialization Test');

  try {
    const response = await fetch(`${SERVER_URL}/mcp`, {
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
            name: 'x402-integration-test',
            version: '1.0.0'
          }
        },
        id: 1
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      logError(`Response body: ${errorText}`);
      throw new Error(`Init failed with status ${response.status}: ${errorText}`);
    }

    const sessionId = response.headers.get('mcp-session-id');
    const contentType = response.headers.get('content-type');

    if (!sessionId) {
      throw new Error('No session ID in response');
    }

    logSuccess(`Session initialized: ${sessionId}`);
    logInfo(`Content-Type: ${contentType}`);

    // The server uses SSE for responses, so we need to parse SSE format
    if (contentType?.includes('text/event-stream')) {
      const text = await response.text();
      // Parse SSE format: "event: message\ndata: {json}\n\n"
      const dataMatch = text.match(/data: (.+)/);
      if (dataMatch) {
        const result = JSON.parse(dataMatch[1]);
        logInfo(`Protocol Version: ${result.result?.protocolVersion || 'N/A'}`);
        logInfo(`Server Name: ${result.result?.serverInfo?.name || 'N/A'}`);
      }
    } else {
      const result = await response.json();
      logInfo(`Protocol Version: ${result.result?.protocolVersion || 'N/A'}`);
      logInfo(`Server Name: ${result.result?.serverInfo?.name || 'N/A'}`);
    }

    return sessionId;
  } catch (error) {
    logError(`Session initialization failed: ${error.message}`);
    throw error;
  }
}

async function test402Response(sessionId) {
  logSection('4️⃣  HTTP 402 Payment Required Test');

  try {
    log('Testing tool request without payment...', 'cyan');

    const response = await fetch(`${SERVER_URL}/mcp`, {
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

    // Should return 402
    if (response.status !== 402) {
      throw new Error(`Expected 402 status, got ${response.status}`);
    }

    logSuccess('Received HTTP 402 Payment Required (correct!)');

    const errorResponse = await response.json();

    // Verify JSON-RPC error format
    if (!errorResponse.error) {
      throw new Error('Response missing error field');
    }

    if (errorResponse.error.code !== -32001) {
      throw new Error(`Expected error code -32001, got ${errorResponse.error.code}`);
    }

    logSuccess('JSON-RPC error format is correct');

    // Verify payment requirements
    const paymentData = errorResponse.error?.data?.payment;
    const pricingInfo = errorResponse.error?.data?.pricing;

    if (!paymentData) {
      throw new Error('Missing payment requirements in error.data.payment');
    }

    logSuccess('Payment requirements included in response');

    // Verify payment structure (x402 protocol format)
    if (!paymentData.maxAmountRequired) {
      throw new Error('Missing maxAmountRequired in payment requirements');
    }

    if (!paymentData.asset) {
      throw new Error('Missing asset in payment requirements');
    }

    if (!paymentData.network) {
      throw new Error('Missing network in payment requirements');
    }

    if (!paymentData.payTo) {
      throw new Error('Missing payTo in payment requirements');
    }

    if (!paymentData.scheme) {
      throw new Error('Missing scheme in payment requirements');
    }

    logSuccess('Payment requirements structure is valid (x402 format)');

    console.log('\n💵 Payment Requirements:');
    logInfo(`Amount: ${pricingInfo?.formatted || `${paymentData.maxAmountRequired} micro-units`}`);
    logInfo(`Description: ${paymentData.description}`);
    logInfo(`Network: ${paymentData.network}`);
    logInfo(`Token: ${paymentData.asset}`);
    logInfo(`Pay To: ${paymentData.payTo}`);
    logInfo(`Scheme: ${paymentData.scheme}`);
    logInfo(`Resource: ${paymentData.resource}`);

    // Verify instructions are provided
    const instructions = errorResponse.error?.data?.instructions;
    if (!instructions) {
      throw new Error('Missing payment instructions');
    }

    logSuccess('Payment instructions provided');
    logInfo(`Instructions: ${instructions}`);

    return true;
  } catch (error) {
    logError(`402 response test failed: ${error.message}`);
    throw error;
  }
}

async function testMultipleToolPricing(sessionId) {
  logSection('5️⃣  Multiple Tool Pricing Test');

  const testTools = [
    { name: 'get-current-prices', expectedMin: 10000 },
    { name: 'get-ohlc-data', expectedMin: 20000 },
    { name: 'get-crypto-news', expectedMin: 5000 }
  ];

  try {
    for (const tool of testTools) {
      const response = await fetch(`${SERVER_URL}/mcp`, {
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
            name: tool.name,
            arguments: {}
          },
          id: 3
        })
      });

      if (response.status !== 402) {
        throw new Error(`Tool ${tool.name}: Expected 402, got ${response.status}`);
      }

      const errorResponse = await response.json();
      const amount = parseInt(errorResponse.error?.data?.payment?.maxAmountRequired || '0');

      if (amount !== tool.expectedMin) {
        logError(`Tool ${tool.name}: Expected ${tool.expectedMin}, got ${amount}`);
      } else {
        logSuccess(`Tool ${tool.name}: Correct pricing (${amount} micro-units)`);
      }
    }

    return true;
  } catch (error) {
    logError(`Multiple tool pricing test failed: ${error.message}`);
    throw error;
  }
}

async function testInvalidPaymentHeader(sessionId) {
  logSection('6️⃣  Invalid Payment Header Test');

  try {
    log('Testing with invalid payment header...', 'cyan');

    const response = await fetch(`${SERVER_URL}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'mcp-session-id': sessionId,
        'X-PAYMENT': 'invalid-payment-header'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'get-current-prices',
          arguments: {}
        },
        id: 4
      })
    });

    // Should still return 402 for invalid payment
    if (response.status !== 402) {
      throw new Error(`Expected 402 for invalid payment, got ${response.status}`);
    }

    logSuccess('Invalid payment properly rejected with 402');

    const errorResponse = await response.json();
    logInfo(`Error message: ${errorResponse.error?.message}`);

    return true;
  } catch (error) {
    logError(`Invalid payment test failed: ${error.message}`);
    throw error;
  }
}

// Main test execution
async function runTests() {
  try {
    logSection('🚀 x402 Integration Test Suite (Basic - No Wallet Required)');
    log('Testing MCP server x402 payment protocol integration\n', 'bright');

    await testServerInfo();
    await testPricingEndpoint();
    const sessionId = await testInitializeSession();
    await test402Response(sessionId);
    await testMultipleToolPricing(sessionId);
    await testInvalidPaymentHeader(sessionId);

    logSection('🎉 All Tests Passed Successfully');
    log('✨ x402 payment integration is working correctly!', 'green');
    log('\n📝 Next Steps:', 'cyan');
    log('   1. Add TEST_WALLET_PRIVATE_KEY to .env file');
    log('   2. Run full payment test: node test-x402-payment.mjs');
    log('   3. Test with real wallet and verify on-chain settlement\n');

    process.exit(0);

  } catch (error) {
    logSection('💥 Test Suite Failed');
    logError(error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run tests
runTests();
