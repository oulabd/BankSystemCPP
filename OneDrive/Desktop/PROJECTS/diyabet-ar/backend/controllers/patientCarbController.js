const Food = require('../models/Food');
const FOOD_DB = {
  rice: 28, 'pirinç': 28, 'رز': 28,
  bread: 50, 'ekmek': 50, 'خبز': 50,
  pasta: 25, 'makarna': 25, 'معكرونة': 25,
  potato: 17, 'patates': 17, 'بطاطا': 17,
  apple: 12, 'elma': 12, 'تفاح': 12,
  banana: 22, 'muz': 22, 'موز': 22
};
const CarbEntry = require('../models/CarbEntry');
const { searchFoodAndGetCarbsPer100g } = require('../utils/fatsecretClient');

function isValidMealType(type) {
  return ['breakfast', 'lunch', 'dinner', 'snack', 'other'].includes(type);
}

exports.calculateAndSaveCarbs = async (req, res) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'patient') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const { foodName, grams, mealType, notes, date } = req.body;
    if (!foodName || typeof foodName !== 'string' || !foodName.trim()) {
      return res.status(400).json({ success: false, message: 'foodName is required' });
    }
    if (!grams || typeof grams !== 'number' || grams <= 0) {
      return res.status(400).json({ success: false, message: 'grams must be a positive number' });
    }
    const meal = mealType && isValidMealType(mealType) ? mealType : 'other';

    const carbsPer100g = await searchFoodAndGetCarbsPer100g(foodName);
    if (carbsPer100g === null) {
      return res.status(404).json({ success: false, message: 'Food not found in FatSecret' });
    }
    const totalCarbs = (grams * carbsPer100g) / 100;

    const entry = new CarbEntry({
      patientId: user.id,
      date: date ? new Date(date) : new Date(),
      foodName,
      source: 'fatsecret',
      grams,
      carbsPer100g,
      totalCarbs,
      notes,
      mealType: meal,
    });
    await entry.save();
    return res.json({ success: true, entry });
  } catch (err) {
    console.error('[CarbController] calculateAndSaveCarbs error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.getDailyCarbSummary = async (req, res) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'patient') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    let { date } = req.query;
    let dayStart, dayEnd;
    if (date) {
      const d = new Date(date);
      dayStart = new Date(d.setHours(0, 0, 0, 0));
      dayEnd = new Date(d.setHours(23, 59, 59, 999));
    } else {
      const now = new Date();
      dayStart = new Date(now.setHours(0, 0, 0, 0));
      dayEnd = new Date(now.setHours(23, 59, 59, 999));
    }
    const entries = await CarbEntry.find({
      patientId: user.id,
      date: { $gte: dayStart, $lte: dayEnd },
    }).sort({ date: 1 });

    let totalCarbs = 0;
    const byMeal = {};
    entries.forEach((e) => {
      totalCarbs += e.totalCarbs;
      byMeal[e.mealType] = (byMeal[e.mealType] || 0) + e.totalCarbs;
    });

    return res.json({
      success: true,
      date: dayStart.toISOString().slice(0, 10),
      totalCarbs: Math.round(totalCarbs * 100) / 100,
      byMeal,
      entries,
    });
  } catch (err) {
    console.error('[CarbController] getDailyCarbSummary error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.deleteCarbEntry = async (req, res) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'patient') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const { id } = req.params;
    const entry = await CarbEntry.findById(id);
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Entry not found' });
    }
    if (entry.patientId.toString() !== user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this entry' });
    }
    await CarbEntry.deleteOne({ _id: id });
    return res.json({ success: true });
  } catch (err) {
    console.error('[CarbController] deleteCarbEntry error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Search for a food by name and return carbs/calories info.
 * Accepts query parameter ?q=foodname
 * Returns { name, carbs_100g, calories_100g } or falls back to null if not found.
 */
exports.searchFoodByName = async (req, res) => {
  try {
    console.log('[CarbController] searchFoodByName called with query:', req.query);
    let { q } = req.query;
    if (!q || typeof q !== 'string' || !q.trim()) {
      console.warn('[CarbController] Invalid query parameter');
      return res.status(400).json({ success: false, message: 'Query parameter q is required' });
    }

    // Normalize Turkish characters for robust search
    function normalizeTurkish(str) {
      return str
        .replace(/İ/g, 'i')
        .replace(/I/g, 'i')
        .replace(/Ş/g, 's')
        .replace(/ş/g, 's')
        .replace(/Ğ/g, 'g')
        .replace(/ğ/g, 'g')
        .replace(/Ü/g, 'u')
        .replace(/ü/g, 'u')
        .replace(/Ö/g, 'o')
        .replace(/ö/g, 'o')
        .replace(/Ç/g, 'c')
        .replace(/ç/g, 'c')
        .toLowerCase();
    }
    const normQ = normalizeTurkish(q.trim());
    console.log('Searching for:', normQ);
    const foodDoc = await Food.findOne({
      $or: [
        { name_normalized: normQ },
        { aliases_normalized: { $in: [normQ] } }
      ]
    });
    console.log('Found foodDoc:', foodDoc);

    // Extra debug: print all foods with aliases_normalized including normQ
    const debugFoods = await Food.find({ aliases_normalized: { $in: [normQ] } });
    console.log('All foods with aliases_normalized including', normQ, ':', debugFoods);

    if (foodDoc) {
      return res.status(200).json({
        success: true,
        food: {
          name: foodDoc.name,
          aliases: foodDoc.aliases,
          carbs_100g: foodDoc.carbsPer100g
        }
      });
    }

    // Fallback: translation layer (if not found, try English mapping)
    const foodTranslations = {
      'pirinç': 'rice', 'رز': 'rice',
      'ekmek': 'bread', 'خبز': 'bread',
      'makarna': 'pasta', 'معكرونة': 'pasta',
      'patates': 'potato', 'بطاطا': 'potato',
      'elma': 'apple', 'تفاح': 'apple',
      'muz': 'banana', 'موز': 'banana'
    };
    let fallbackKey = foodTranslations[q] || q;

    // Fallback: FOOD_DB
    if (FOOD_DB[fallbackKey]) {
      return res.status(200).json({
        success: true,
        food: {
          name: fallbackKey,
          aliases: [],
          carbs_100g: FOOD_DB[fallbackKey]
        }
      });
    }

    return res.status(404).json({ success: false, message: 'Food not found' });
  } catch (err) {
    console.error('[CarbController] searchFoodByName error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};