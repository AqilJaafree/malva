# RSI Analysis Time Interval Fix

## Problem
RSI analysis was failing with error:
```
"No RSI analysis available. Ensure sufficient OHLC data has been collected."
```

**Root Cause**: The RSI service required too much historical data that hadn't been accumulated yet:
- Requesting 100 candles per analysis
- Using 1-hour intervals for BTC and Gold
- **Required**: 100 hours (4+ days) of continuous data collection
- **Reality**: Server hasn't been running long enough

## Solution Implemented

### 1. Reduced Candle Requirements

**File**: `src/services/rsi-service.ts`

- **Main Analysis** (line 376): 100 → **30 candles**
  - For 14-period RSI, only needs 15 candles minimum
  - 30 candles provides enough buffer for accurate analysis

- **Multi-timeframe** (line 333): 50 → **20 candles**
  - Faster availability across different timeframes

### 2. Changed Default Timeframes

**File**: `src/services/rsi-service.ts` (lines 36-61)

Changed all assets to use **5-minute intervals** instead of hourly:

| Asset Type | Old Timeframe | New Timeframe | Data Collection Time |
|------------|---------------|---------------|---------------------|
| **Wrapped BTC** | 1h | **5m** | 30 candles × 5min = **2.5 hours** |
| **RWA Stocks** | 5m | 5m | 2.5 hours (unchanged) |
| **Gold** | 1h | **5m** | 2.5 hours (was 30 hours) |

**Also updated Gold RSI period**: 21 → **14** for consistency

### 3. Added Logging

**File**: `src/minimal/tool.ts` (line 346)

Added OHLC stats logging to diagnose data availability:
```typescript
const stats = priceService.getOHLCStats();
console.log('[RSI Analysis] Available OHLC data:', stats);
```

## Expected Results

### Before Fix
- **Required data**: 100+ hours of continuous polling
- **Failure**: "No RSI analysis available" for newly deployed servers
- **User experience**: Cannot use RSI features for days

### After Fix
- **Required data**: **~2.5 hours** of polling
- **Success**: RSI analysis available much sooner
- **User experience**: Can test RSI features within hours of deployment

### Data Accumulation Timeline

With server polling Jupiter API every 5 seconds:

| Interval | Candles/Hour | Time to 30 Candles |
|----------|-------------|-------------------|
| **1s** | 3,600 | < 1 minute |
| **1m** | 60 | 30 minutes |
| **5m** | 12 | **2.5 hours** ✅ |
| **1h** | 1 | 30 hours |

## Technical Details

### RSI Calculation Requirements

For **14-period RSI** (Wilder's method):
- Minimum: 15 candles (period + 1)
- Recommended: 20-30 candles for accuracy
- Optimal: 50+ candles for divergence detection

### Timeframe Trade-offs

**5-minute intervals**:
- ✅ Fast data accumulation
- ✅ More responsive to short-term movements
- ✅ Good for day trading signals
- ⚠️ More noise than hourly data

**1-hour intervals** (old):
- ✅ Smoother signals
- ✅ Better for swing trading
- ❌ Very slow data accumulation
- ❌ Not practical for new deployments

## Testing

After deploying these changes:

1. **Wait ~3 hours** for data collection
2. **Query RSI**: "Give me BTC signal" or "Show me RSI for WBTC"
3. **Expected response**:
   ```json
   {
     "status": "success",
     "analyses": [{
       "asset": "Wrapped Bitcoin (Portal)",
       "symbol": "WBTC",
       "rsi": {
         "value": 54.23,
         "period": 14,
         "timeframe": "5m",
         "status": "neutral"
       },
       "signal": {
         "action": "HOLD",
         "confidence": 0.6,
         "reason": "RSI in neutral zone (54.23)"
       }
     }]
   }
   ```

## Deployment

**Build command**:
```bash
cd malva-mcp
pnpm build
```

**Deploy to Railway**:
1. Push changes to git
2. Railway auto-deploys from main branch
3. Verify Jupiter API v3 endpoint is configured
4. Monitor logs for OHLC data accumulation

## Related Issues

- **Jupiter API v2 → v3**: Update `JUPITER_PRICE_API_URL` env var to use v3
- **Price Polling**: Ensure `priceService.startPricePolling()` is running
- **OHLC Stats**: Use `/pricing` endpoint or `get-ohlc-stats` tool to monitor

## Files Modified

1. `src/services/rsi-service.ts` - RSI calculation and thresholds
2. `src/minimal/tool.ts` - MCP tool registration with logging

---

**Status**: ✅ Built and ready for deployment
**Testing**: ⏳ Awaiting 2.5 hours of data collection after deployment
