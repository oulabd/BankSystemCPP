const axios = require('axios');

const FATSECRET_CLIENT_ID = process.env.FATSECRET_CLIENT_ID;
const FATSECRET_CLIENT_SECRET = process.env.FATSECRET_CLIENT_SECRET;

if (!FATSECRET_CLIENT_ID || !FATSECRET_CLIENT_SECRET) {
  console.warn('FatSecret API credentials not configured - carb calculation features will not work');
}

let tokenCache = {
  access_token: null,
  expires_at: 0,
};

/**
 * Get OAuth2 access token from FatSecret and cache it in memory.
 */
async function getAccessToken() {
  const now = Date.now();
  if (tokenCache.access_token && tokenCache.expires_at > now) {
    return tokenCache.access_token;
  }
  try {
    const resp = await axios.post(
      'https://oauth.fatsecret.com/connect/token',
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: FATSECRET_CLIENT_ID,
        client_secret: FATSECRET_CLIENT_SECRET,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    tokenCache.access_token = resp.data.access_token;
    tokenCache.expires_at = now + (resp.data.expires_in - 60) * 1000; // subtract 60s for safety
    return tokenCache.access_token;
  } catch (err) {
    console.error('[FatSecretClient] Failed to get access token:', err.message);
    throw new Error('FatSecret API authentication failed');
  }
}

/**
 * Search FatSecret for a food and return carbs per 100g.
 * @param {string} query
 * @returns {number|null}
 */
async function searchFoodAndGetCarbsPer100g(query) {
  if (!FATSECRET_CLIENT_ID || !FATSECRET_CLIENT_SECRET) {
    console.warn('FatSecret API not configured, returning null for carb calculation');
    return null;
  }
  
  try {
    const accessToken = await getAccessToken();

    // NOTE: FatSecret API endpoint and payload may differ.
    // This is a placeholder for their food search REST API.
    // You must adapt the endpoint and parsing to your real FatSecret API docs.

    const resp = await axios.get(
      'https://platform.fatsecret.com/rest/server.api',
      {
        params: {
          method: 'foods.search',
          search_expression: query,
          format: 'json',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    // Parse response: find best match, extract carbs per 100g
    // FatSecret may return per serving, per 100g, or other units.
    // Here we try to normalize to per 100g if possible.
    const foods = resp.data.foods?.food || [];
    if (!foods.length) return null;

    // Pick first/best match
    const food = Array.isArray(foods) ? foods[0] : foods;
    // Example: food.servings.serving[0].carbohydrate
    let carbsPer100g = null;
    if (food.servings && food.servings.serving) {
      const serving = Array.isArray(food.servings.serving)
        ? food.servings.serving[0]
        : food.servings.serving;
      // If serving_weight_grams is available, normalize
      if (serving.carbohydrate && serving.serving_weight_grams) {
        carbsPer100g =
          (parseFloat(serving.carbohydrate) / parseFloat(serving.serving_weight_grams)) * 100;
      } else if (serving.carbohydrate) {
        // Fallback: use as-is (may not be per 100g)
        carbsPer100g = parseFloat(serving.carbohydrate);
        // Document: This value may not be normalized to 100g
      }
    }
    return carbsPer100g || null;
  } catch (err) {
    console.error('[FatSecretClient] Food search failed:', err.message);
    return null;
  }
}

module.exports = { searchFoodAndGetCarbsPer100g };