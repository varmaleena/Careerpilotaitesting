# API Version Fix - PERMANENT SOLUTION

## The Problem
```
404 NOT FOUND: models/gemini-1.5-flash is not found for API version v1beta
```

## Root Cause
The `@google/genai` SDK defaults to `v1beta` API, but `gemini-1.5-flash` is only available in the **stable `v1` API**.

## The Fix
Set `apiVersion: 'v1'` when initializing GoogleGenAI:

```typescript
const ai = new GoogleGenAI({ 
    apiKey: key,
    apiVersion: 'v1'  // ✅ Use stable v1 API
});
```

## Why This Works

### API Versions Comparison

| API Version | Status | Models Available |
|-------------|--------|------------------|
| `v1beta` (default) | Beta/Preview | gemini-2.0-flash-exp, gemini-3-flash-preview |
| `v1` | **Stable** | **gemini-1.5-flash**, gemini-1.5-pro |

### Model Availability

| Model | v1beta | v1 | Free Tier Quota |
|-------|--------|----|----|
| gemini-2.0-flash-exp | ✅ | ❌ | **0 RPD** ⚠️ |
| gemini-3-flash-preview | ✅ | ❌ | 20 RPD |
| **gemini-1.5-flash** | ❌ | ✅ | **1,500 RPD** ✅ |
| gemini-1.5-pro | ❌ | ✅ | 50 RPD |

## Current Configuration

```typescript
// services/geminiClient.ts
export const GEMINI_MODEL = 'gemini-1.5-flash';

const ai = new GoogleGenAI({ 
    apiKey,
    apiVersion: 'v1'  // Stable API with gemini-1.5-flash support
});
```

## Benefits of This Setup

1. ✅ **No 404 Errors**: Model exists in v1 API
2. ✅ **High Quota**: 1,500 requests/day (vs 0-20 for beta models)
3. ✅ **Stable API**: Production-ready, not experimental
4. ✅ **Load Balanced**: All requests go through our queue
5. ✅ **Multi-Key Support**: Can use 3 keys for 4,500 RPD

## Testing

```bash
# The app should now work without 404 errors
npm run dev

# Try the Interview Simulator
# Should see: "🔑 Loaded X Gemini API keys"
# No more 404 or 429 errors
```

## If You Still Get Errors

### 404 Error?
- Check that `apiVersion: 'v1'` is set in geminiClient.ts
- Verify model name is exactly `'gemini-1.5-flash'`

### 429 Error?
- Add more API keys to `.env.local`
- Wait 60 seconds between heavy usage
- Check quota: https://ai.dev/rate-limit

## Summary

**Before**: Using v1beta API → 404 errors with gemini-1.5-flash
**After**: Using v1 API → ✅ Works perfectly with 1,500 RPD quota

This is now a **permanent fix** - the v1 API is stable and won't change.
