# FatSecret API Integration for Carbohydrate Calculator

## Overview
This document describes the FatSecret Platform API integration added to the carbohydrate calculator. The integration extends both frontend and backend to support food searches via FatSecret while maintaining backward compatibility with the existing local food database.

## Architecture

### Backend Changes

#### 1. Environment Variables (.env)
Added FatSecret API credentials to `.backend/.env`:
```env
FATSECRET_CLIENT_ID=your-fatsecret-client-id
FATSECRET_CLIENT_SECRET=your-fatsecret-client-secret
```

#### 2. New Backend Endpoint
- **Route**: `GET /api/patient/food/search?q=<foodname>`
- **Auth**: Required (patient role)
- **Controller**: `patientCarbController.js` - `searchFoodByName()` function
- **Response Format**:
  ```json
  {
    "success": true,
    "food": {
      "name": "apple",
      "carbs_100g": 14,
      "calories_100g": null
    }
  }
  ```

#### 3. FatSecret Client Utility
Located at `backend/utils/fatsecretClient.js`:
- `getAccessToken()`: Manages OAuth2 token with in-memory caching
- `searchFoodAndGetCarbsPer100g(query)`: Queries FatSecret API and normalizes carbs to per 100g
- Returns `null` on failure (no network, invalid credentials, food not found)

### Frontend Changes

#### 1. Internal Labels Dictionary
Added `CARB_LABELS` object in `carb.js` with multilingual support (en, tr, ar):
- No i18n file changes required
- Language resolved via `localStorage.getItem('lang')`
- Functions: `getLang()`, `getLabel(key)`

#### 2. API Search Function
Added `searchFoodViaAPI(foodName)` function:
- Queries `/api/patient/food/search?q=<foodname>`
- Returns `{ name, carbs_100g, calories_100g }` on success
- Returns `null` on failure (triggers fallback)

#### 3. Carb Lookup with Fallback
Added `getCarbsPer100g(foodName)` function:
- **Priority 1**: FatSecret API (if available and food found)
- **Priority 2**: Local FOOD_DB (existing local database)
- **Priority 3**: Null (food not found anywhere)

#### 4. Updated Add-to-Meal Logic
Modified the `addBtn.addEventListener('click')` handler to be `async`:
- Attempts API search first for non-manual entries
- Falls back to local database if API fails
- Uses internal labels for error messages instead of i18n

## Usage

### For Users
1. When adding food to carb calculator:
   - Type food name (e.g., "apple", "rice", "chicken")
   - Click "Add" button
   - System tries FatSecret first, then falls back to local database
   - Carbs calculated automatically based on grams/portions

2. Manual Entry
   - Toggle "Manual Entry" checkbox
   - Enter custom carbs value for the unit
   - Works as before (no API needed)

### For Developers

#### Setup
1. Register FatSecret Platform API account at https://platform.fatsecret.com
2. Get Client ID and Client Secret
3. Add credentials to `backend/.env`:
   ```env
   FATSECRET_CLIENT_ID=xxx
   FATSECRET_CLIENT_SECRET=xxx
   ```
4. Restart backend server

#### Testing
```bash
# Test endpoint directly (must be authenticated)
curl -H "Authorization: Bearer <token>" \
  "http://localhost:5000/api/patient/food/search?q=apple"
```

#### Fallback Behavior
- If FatSecret credentials missing → System logs warning, falls back to local DB
- If FatSecret API unavailable → System uses local database
- If food not in FatSecret → System checks local database
- If food not in local DB → Shows error message

## Data Flow

```
User enters food name
         ↓
   Is manual entry? → YES → Use user-provided carbs
         ↓ NO
   searchFoodViaAPI(foodName)
         ↓
   API response?
         ├─ YES (carbs_100g) → Use FatSecret carbs
         ├─ NO (null) → Check local FOOD_DB
         │          ├─ Found → Use local carbs
         │          └─ Not found → Show "Unknown food" error
```

## Backward Compatibility

✅ All existing features preserved:
- Old food search in local DB still works
- Manual carb entry still available
- Local fallback if API unavailable
- All UI/UX unchanged
- No new HTML/CSS required
- No i18n file modifications
- Two implementations in carb.js coexist without conflict

## Error Handling

| Scenario | Behavior |
|----------|----------|
| FatSecret creds missing | Warning logged, fallback to local DB |
| FatSecret API down | System uses local DB |
| Food not in API | Checks local DB |
| Food not in API or DB | Shows error: "Unknown food" |
| Network error on API call | Caught, logged, falls back to local DB |
| Missing auth token | API call fails gracefully |

## Performance

- OAuth2 token cached in-memory (60s expiry buffer)
- Each food search is a separate API call (no caching)
- Typical API response time: 100-500ms
- Local DB lookup: <1ms
- Fallback is automatic and transparent

## Files Modified

1. **backend/.env** - Added FatSecret credentials
2. **backend/controllers/patientCarbController.js** - Added `searchFoodByName()` export
3. **backend/routes/patientRoutes.js** - Added `GET /food/search` route
4. **frontend/assets/js/carb.js** - Added:
   - `CARB_LABELS` dictionary
   - `getLang()` and `getLabel()` functions
   - `searchFoodViaAPI()` function
   - `getCarbsPer100g()` function (with fallback chain)
   - Updated button click handler to be `async` and use new functions

## Files NOT Modified

- No new files created
- No HTML/CSS changes
- No i18n files modified
- Both implementations in carb.js still coexist
- All previous functionality unchanged

## Testing Checklist

- [ ] Backend server starts without errors
- [ ] FatSecret client handles missing credentials gracefully
- [ ] `/api/patient/food/search?q=apple` returns 404 or food data
- [ ] Frontend can add food from FatSecret API
- [ ] Frontend fallback to local DB works
- [ ] Manual carb entry still works
- [ ] Error messages display in correct language
- [ ] Carb calculations are accurate (carbsPer100g * grams / 100)
- [ ] All existing UI features unchanged
