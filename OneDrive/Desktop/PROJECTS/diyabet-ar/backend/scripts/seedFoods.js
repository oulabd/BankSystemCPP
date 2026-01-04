require('dotenv').config();
const mongoose = require('mongoose');
const Food = require('../models/Food');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/diyabetliyim';

// دالة مساعدة لتطبيع الأحرف التركية
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

const foods = [
  // الأطباق التركية المطبوخة والأطباق الرئيسية
  { name: 'iskender kebab', aliases: ['İskender kebabı'], carbsPer100g: 0 },
  { name: 'adana kebab', aliases: ['Adana kebabı'], carbsPer100g: 0 },
  { name: 'urfa kebab', aliases: ['Urfa kebabı'], carbsPer100g: 0 },
  { name: 'chicken shish', aliases: ['Tavuk şiş'], carbsPer100g: 0 },
  { name: 'lamb shish', aliases: ['Kuzu şiş'], carbsPer100g: 0 },
  { name: 'doner wrap', aliases: ['Döner dürüm'], carbsPer100g: 0 },
  { name: 'tantuni', aliases: ['Tantuni'], carbsPer100g: 0 },
  { name: 'lahmacun', aliases: ['Lahmacun'], carbsPer100g: 0 },
  { name: 'minced meat pide', aliases: ['Pide kıymalı'], carbsPer100g: 0 },
  { name: 'cheese pide', aliases: ['Kaşarlı pide'], carbsPer100g: 0 },
  { name: 'turkish dumplings', aliases: ['Mantı'], carbsPer100g: 0 },
  { name: 'sauteed beef', aliases: ['Et sote'], carbsPer100g: 0 },
  { name: 'sauteed chicken', aliases: ['Tavuk sote'], carbsPer100g: 0 },
  { name: 'fried meat', aliases: ['Kavurma'], carbsPer100g: 0 },
  { name: 'moussaka', aliases: ['Musakka'], carbsPer100g: 0 },
  { name: 'stuffed eggplant', aliases: ['Karnıyarık'], carbsPer100g: 0 },
  { name: 'stuffed vegetables', aliases: ['Dolma'], carbsPer100g: 0 },
  { name: 'stuffed vine leaves', aliases: ['Sarma'], carbsPer100g: 0 },
  { name: 'turkish casserole', aliases: ['Güveç'], carbsPer100g: 0 },
  { name: 'sultans delight', aliases: ['Hünkar beğendi'], carbsPer100g: 0 },
  { name: 'pottery kebab', aliases: ['Testi kebabı'], carbsPer100g: 0 },
  // الشوربات التركية
  { name: 'lentil soup', aliases: ['Mercimek çorbası'], carbsPer100g: 0 },
  { name: 'tarhana soup', aliases: ['Tarhana çorbası'], carbsPer100g: 0 },
  { name: 'chicken soup', aliases: ['Tavuk çorbası'], carbsPer100g: 0 },
  { name: 'tripe soup', aliases: ['İşkembe çorbası'], carbsPer100g: 0 },
  { name: 'yogurt soup', aliases: ['Yayla çorbası'], carbsPer100g: 0 },
  { name: 'ezogelin soup', aliases: ['Ezogelin çorbası'], carbsPer100g: 0 },
  { name: 'tomato soup', aliases: ['Domates çorbası'], carbsPer100g: 0 },
  { name: 'vegetable soup', aliases: ['Sebze çorbası'], carbsPer100g: 0 },
  // الوجبات السريعة التركية
  { name: 'turkish flatbread', aliases: ['Gözleme'], carbsPer100g: 0 },
  { name: 'water borek', aliases: ['Börek su böreği'], carbsPer100g: 0 },
  { name: 'raw meatballs', aliases: ['Çiğ köfte'], carbsPer100g: 0 },
  { name: 'stuffed mussels', aliases: ['Midye dolma'], carbsPer100g: 0 },
  { name: 'kokorec', aliases: ['Kokoreç'], carbsPer100g: 0 },
  { name: 'stuffed potato', aliases: ['Kumpir'], carbsPer100g: 0 },
  { name: 'grilled sandwich', aliases: ['Tost'], carbsPer100g: 0 },
  { name: 'simit sandwich', aliases: ['Simit tost'], carbsPer100g: 0 },
  // المقبلات التركية
  { name: 'french fries', aliases: ['Patates kızartması'], carbsPer100g: 0 },
  { name: 'yogurt dip', aliases: ['Haydari'], carbsPer100g: 0 },
  { name: 'yogurt cucumber', aliases: ['Cacık'], carbsPer100g: 0 },
  { name: 'turkish spicy salad', aliases: ['Ezme'], carbsPer100g: 0 },
  { name: 'hummus', aliases: ['Humus'], carbsPer100g: 0 },
  { name: 'chili sauce', aliases: ['Acılı sos'], carbsPer100g: 0 },
  // الحلويات التركية
  { name: 'chicken pudding', aliases: ['Tavuk göğsü'], carbsPer100g: 0 },
  { name: 'gullac', aliases: ['Güllaç'], carbsPer100g: 0 },
  { name: 'baked rice pudding', aliases: ['Fırın sütlaç'], carbsPer100g: 0 },
  { name: 'katmer dessert', aliases: ['Katmer'], carbsPer100g: 0 },
  { name: 'carrot confection', aliases: ['Cezerye'], carbsPer100g: 0 },
  { name: 'semolina cookies', aliases: ['Şekerpare'], carbsPer100g: 0 },
  // المشروبات التركية
  { name: 'salep', aliases: ['Salep'], carbsPer100g: 0 },
  { name: 'boza', aliases: ['Boza'], carbsPer100g: 0 },
  { name: 'turnip juice', aliases: ['Şalgam suyu'], carbsPer100g: 0 },
  { name: 'lemonade', aliases: ['Limonata'], carbsPer100g: 0 },
  { name: 'yogurt drink', aliases: ['Ayran'], carbsPer100g: 0 },
  // الأطباق الرئيسية العربية
  { name: 'mansaf', aliases: [], carbsPer100g: 0 },
  { name: 'kabsa', aliases: ['Kapksa pilavı'], carbsPer100g: 0 },
  { name: 'maqluba', aliases: ['Maklube'], carbsPer100g: 0 },
  { name: 'mujadara', aliases: ['Müceddere'], carbsPer100g: 0 },
  { name: 'sayadiyah', aliases: ['Sayadiye'], carbsPer100g: 0 },
  { name: 'biryani', aliases: ['Biryani pilavı'], carbsPer100g: 0 },
  { name: 'stuffed zucchini', aliases: ['Kabak dolması'], carbsPer100g: 0 },
  { name: 'stuffed vine leaves', aliases: ['Yaprak sarma'], carbsPer100g: 0 },
  { name: 'stuffed cabbage', aliases: ['Lahana dolması'], carbsPer100g: 0 },
  { name: 'fatteh', aliases: ['Fette'], carbsPer100g: 0 },
  { name: 'molokhia', aliases: ['Mulukhîye'], carbsPer100g: 0 },
  { name: 'mandi', aliases: ['Mendi'], carbsPer100g: 0 },
  { name: 'mixed grill', aliases: ['Karışık ızgara'], carbsPer100g: 0 },
  { name: 'aleppo kebab', aliases: ['Halep kebabı'], carbsPer100g: 0 },
  { name: 'musakhan', aliases: ['Musehhan'], carbsPer100g: 0 },
  { name: 'rice and beans', aliases: ['Fasulye pilavı'], carbsPer100g: 0 },
  { name: 'rice with chicken', aliases: ['Tavuklu pilav'], carbsPer100g: 0 },
  { name: 'rice with beef', aliases: ['Etli pilav'], carbsPer100g: 0 },
  { name: 'grilled fish', aliases: ['Izgara balık'], carbsPer100g: 0 },
  { name: 'fried kibbeh', aliases: ['İçli köfte'], carbsPer100g: 0 },
  { name: 'tray kibbeh', aliases: ['Tepsi kibbe'], carbsPer100g: 0 },
  // السندويشات والفطائر العربية
  { name: 'shawarma', aliases: ['Döner'], carbsPer100g: 0 },
  { name: 'falafel', aliases: [], carbsPer100g: 0 },
  { name: 'meat flatbread', aliases: ['Lahmacun'], carbsPer100g: 0 },
  { name: 'zaatar flatbread', aliases: ['Zaatarlı pide'], carbsPer100g: 0 },
  { name: 'cheese manakish', aliases: ['Peynİrli pide'], carbsPer100g: 0 },
  { name: 'spinach pie', aliases: ['Ispanaklı börek'], carbsPer100g: 0 },
  { name: 'sambousek', aliases: ['Börek'], carbsPer100g: 0 },
  { name: 'meat wrap', aliases: ['Et dürümü'], carbsPer100g: 0 },
  { name: 'arabic bread', aliases: ['Arap ekmeği'], carbsPer100g: 0 },
  // الشوربات والأطباق الخفيفة العربية
  { name: 'lentil soup', aliases: ['Mercimek çorbası'], carbsPer100g: 0 },
  { name: 'vegetable soup', aliases: ['Sebze çorbası'], carbsPer100g: 0 },
  { name: 'chickpea soup', aliases: ['Humus çorbası'], carbsPer100g: 0 },
  { name: 'fattoush', aliases: ['Fattuş'], carbsPer100g: 0 },
  { name: 'tabbouleh', aliases: ['Tabbule'], carbsPer100g: 0 },
  { name: 'hummus', aliases: ['Humus'], carbsPer100g: 0 },
  { name: 'baba ghanoush', aliases: ['Patlıcan ezmesi'], carbsPer100g: 0 },
  { name: 'moutabal', aliases: ['Patlıcan salatası'], carbsPer100g: 0 },
  { name: 'labneh', aliases: ['Labne'], carbsPer100g: 0 },
  { name: 'ful medames', aliases: ['Bakla salatası'], carbsPer100g: 0 },
  // الحلويات العربية
  { name: 'kunafa', aliases: ['Künefe'], carbsPer100g: 0 },
  { name: 'baklava', aliases: ['Baklava'], carbsPer100g: 0 },
  { name: 'qatayef', aliases: ['Katayif'], carbsPer100g: 0 },
  { name: 'maamoul', aliases: ['Maamoul'], carbsPer100g: 0 },
  { name: 'basbousa', aliases: ['Revani'], carbsPer100g: 0 },
  { name: 'harissa', aliases: ['İrmik tatlısı'], carbsPer100g: 0 },
  { name: 'rice pudding', aliases: ['Sütlaç'], carbsPer100g: 0 },
  { name: 'om ali', aliases: ['Ekmek tatlısı'], carbsPer100g: 0 },
  { name: 'ghraybeh', aliases: ['Kurabiye'], carbsPer100g: 0 },
  { name: 'luqaimat', aliases: ['Lokma'], carbsPer100g: 0 },
  { name: 'sesame candy', aliases: ['Bal helvası'], carbsPer100g: 0 },
  // المشروبات العربية
  { name: 'tea', aliases: ['Çay'], carbsPer100g: 0 },
  { name: 'arabic coffee', aliases: ['Arap kahvesi'], carbsPer100g: 0 },
  { name: 'turkish coffee', aliases: ['Türk kahvesi'], carbsPer100g: 0 },
  { name: 'date juice', aliases: ['Hurma suyu'], carbsPer100g: 0 },
  { name: 'yogurt drink', aliases: ['Ayran'], carbsPer100g: 0 },
  { name: 'salep', aliases: ['Salep'], carbsPer100g: 0 },
  { name: 'herbal tea', aliases: ['Bitki çayı'], carbsPer100g: 0 },
  { name: 'jallab', aliases: ['Şurup'], carbsPer100g: 0 },
  { name: 'licorice drink', aliases: ['Meyan kökü'], carbsPer100g: 0 },
  // أخرى
  { name: 'rice', aliases: ['pirinç'], carbsPer100g: 28 },
  { name: 'bulgur', aliases: ['bulgur'], carbsPer100g: 18 },
  { name: 'wheat', aliases: ['buğday'], carbsPer100g: 72 },
  { name: 'pasta', aliases: ['makarna'], carbsPer100g: 25 },
  { name: 'noodles', aliases: ['erişte'], carbsPer100g: 27 },
  { name: 'couscous', aliases: ['kuskus'], carbsPer100g: 23 },
  { name: 'white bread', aliases: ['beyaz ekmek'], carbsPer100g: 50 },
  { name: 'whole wheat bread', aliases: ['tam buğday ekmeği'], carbsPer100g: 43 },
  { name: 'lavash bread', aliases: ['lavaş'], carbsPer100g: 55 },
  { name: 'phyllo dough', aliases: ['yufka'], carbsPer100g: 56 },
  { name: 'turkish bagel', aliases: ['simit'], carbsPer100g: 60 },
  { name: 'turkish flatbread', aliases: ['pide'], carbsPer100g: 49 },
  { name: 'village bread', aliases: ['bazlama'], carbsPer100g: 45 },
  { name: 'wrap', aliases: ['lavaş dürüm'], carbsPer100g: 55 },
  { name: 'pastry', aliases: ['poğaça'], carbsPer100g: 40 },
  { name: 'soft roll', aliases: ['açma'], carbsPer100g: 45 },
  { name: 'savory pastry', aliases: ['börek'], carbsPer100g: 35 },
  { name: 'flat stuffed bread', aliases: ['gözleme'], carbsPer100g: 38 },
  { name: 'tomato', aliases: ['domates'], carbsPer100g: 3 },
  { name: 'cucumber', aliases: ['salatalık'], carbsPer100g: 2 },
  { name: 'pepper', aliases: ['biber'], carbsPer100g: 5 },
  { name: 'eggplant', aliases: ['patlıcan'], carbsPer100g: 6 },
  { name: 'potato', aliases: ['patates'], carbsPer100g: 17 },
  { name: 'zucchini', aliases: ['kabak'], carbsPer100g: 3 },
  { name: 'carrot', aliases: ['havuç'], carbsPer100g: 10 },
  { name: 'onion', aliases: ['soğan'], carbsPer100g: 9 },
  { name: 'garlic', aliases: ['sarımsak'], carbsPer100g: 33 },
  { name: 'mushroom', aliases: ['mantar'], carbsPer100g: 4 },
  { name: 'peas', aliases: ['bezelye'], carbsPer100g: 14 },
  { name: 'corn', aliases: ['mısır'], carbsPer100g: 19 },
  { name: 'cabbage', aliases: ['lahana'], carbsPer100g: 6 },
  { name: 'cauliflower', aliases: ['karnabahar'], carbsPer100g: 5 },
  { name: 'broccoli', aliases: ['brokoli'], carbsPer100g: 7 },
  { name: 'leek', aliases: ['pırasa'], carbsPer100g: 14 },
  { name: 'spinach', aliases: ['ıspanak'], carbsPer100g: 1 },
  { name: 'lettuce', aliases: ['marul'], carbsPer100g: 2 },
  { name: 'arugula', aliases: ['roka'], carbsPer100g: 2 },
  { name: 'parsley', aliases: ['maydanoz'], carbsPer100g: 7 },
  { name: 'dill', aliases: ['dereotu'], carbsPer100g: 7 },
  { name: 'mint', aliases: ['nane'], carbsPer100g: 8 },
  { name: 'apple', aliases: ['elma'], carbsPer100g: 12 },
  { name: 'banana', aliases: ['muz'], carbsPer100g: 22 },
  { name: 'orange', aliases: ['portakal'], carbsPer100g: 12 },
  { name: 'mandarin', aliases: ['mandalina'], carbsPer100g: 13 },
  { name: 'grapes', aliases: ['üzüm'], carbsPer100g: 17 },
  { name: 'strawberry', aliases: ['çilek'], carbsPer100g: 8 },
  { name: 'peach', aliases: ['şeftali'], carbsPer100g: 10 },
  { name: 'apricot', aliases: ['kayısı'], carbsPer100g: 9 },
  { name: 'pear', aliases: ['armut'], carbsPer100g: 15 },
  { name: 'cherry', aliases: ['kiraz'], carbsPer100g: 12 },
  { name: 'quince', aliases: ['ayva'], carbsPer100g: 15 },
  { name: 'pomegranate', aliases: ['nar'], carbsPer100g: 17 },
  { name: 'fig', aliases: ['incir'], carbsPer100g: 19 },
  { name: 'watermelon', aliases: ['karpuz'], carbsPer100g: 8 },
  { name: 'melon', aliases: ['kavun'], carbsPer100g: 8 },
  { name: 'dates', aliases: ['hurma'], carbsPer100g: 75 },
  { name: 'lemon', aliases: ['limon'], carbsPer100g: 9 },
  { name: 'chicken', aliases: ['tavuk'], carbsPer100g: 0 },
  { name: 'beef', aliases: ['dana eti'], carbsPer100g: 0 },
  { name: 'lamb', aliases: ['kuzu'], carbsPer100g: 0 },
  { name: 'meatballs', aliases: ['köfte'], carbsPer100g: 5 },
  { name: 'doner', aliases: ['döner'], carbsPer100g: 5 },
  { name: 'turkish sausage', aliases: ['sucuk'], carbsPer100g: 2 },
  { name: 'salami', aliases: ['salam'], carbsPer100g: 2 },
  { name: 'sausage', aliases: ['sosis'], carbsPer100g: 2 },
  { name: 'turkish pastrami', aliases: ['pastirma'], carbsPer100g: 0 },
  { name: 'fish', aliases: ['balık'], carbsPer100g: 0 },
  { name: 'tuna', aliases: ['ton balığı'], carbsPer100g: 0 },
  { name: 'shrimp', aliases: ['karides'], carbsPer100g: 0 },
  { name: 'egg', aliases: ['yumurta'], carbsPer100g: 1 },
  { name: 'milk', aliases: ['süt', 'sut'], carbsPer100g: 5 },
  { name: 'yogurt', aliases: ['yoğurt'], carbsPer100g: 4 },
  { name: 'ayran', aliases: ['ayran'], carbsPer100g: 2 },
  { name: 'white cheese', aliases: ['beyaz peynir'], carbsPer100g: 1 },
  { name: 'kashkaval', aliases: ['kaşar peyniri'], carbsPer100g: 1 },
  { name: 'cottage cheese', aliases: ['lor peyniri'], carbsPer100g: 1 },
  { name: 'butter', aliases: ['tereyağı'], carbsPer100g: 0 },
  { name: 'cream', aliases: ['krema'], carbsPer100g: 3 },
  { name: 'chickpeas', aliases: ['nohut'], carbsPer100g: 27 },
  { name: 'lentils', aliases: ['mercimek'], carbsPer100g: 20 },
  { name: 'beans', aliases: ['fasulye'], carbsPer100g: 16 },
  { name: 'pinto beans', aliases: ['barbunya'], carbsPer100g: 20 },
  { name: 'hazelnut', aliases: ['fındık'], carbsPer100g: 16 },
  { name: 'walnut', aliases: ['ceviz'], carbsPer100g: 14 },
  { name: 'almond', aliases: ['badem'], carbsPer100g: 10 },
  { name: 'pistachio', aliases: ['fıstık'], carbsPer100g: 28 },
  { name: 'peanuts', aliases: ['yer fıstığı'], carbsPer100g: 16 },
  { name: 'sesame', aliases: ['susam'], carbsPer100g: 23 },
  { name: 'baklava', aliases: ['baklava'], carbsPer100g: 60 },
  { name: 'turkish delight', aliases: ['lokum'], carbsPer100g: 80 },
  { name: 'kunefe', aliases: ['künefe'], carbsPer100g: 50 },
  { name: 'rice pudding', aliases: ['sütlaç'], carbsPer100g: 20 },
  { name: 'burnt milk pudding', aliases: ['kazandibi'], carbsPer100g: 25 },
  { name: 'halva', aliases: ['helva'], carbsPer100g: 70 },
  { name: 'semolina cake', aliases: ['revani'], carbsPer100g: 55 },
  { name: 'ashura dessert', aliases: ['aşure'], carbsPer100g: 35 },
  { name: 'ice cream', aliases: ['dondurma'], carbsPer100g: 24 },
  { name: 'cake', aliases: ['kek'], carbsPer100g: 50 },
  { name: 'cookies', aliases: ['kurabiye'], carbsPer100g: 65 },
  { name: 'tea', aliases: ['çay'], carbsPer100g: 0 },
  { name: 'turkish coffee', aliases: ['türk kahvesi'], carbsPer100g: 0 },
  { name: 'coffee', aliases: ['filtre kahve'], carbsPer100g: 0 },
  { name: 'soda', aliases: ['gazoz'], carbsPer100g: 11 },
  { name: 'cola', aliases: ['kola'], carbsPer100g: 11 },
  { name: 'juice', aliases: ['meyve suyu'], carbsPer100g: 10 },
  { name: 'water', aliases: ['su'], carbsPer100g: 0 }
];

(async () => {
  await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  // إضافة حقول محولة لكل طعام
  const foodsWithNormalized = foods.map(f => ({
    ...f,
    name_normalized: normalizeTurkish(f.name),
    aliases_normalized: Array.isArray(f.aliases) ? f.aliases.map(normalizeTurkish) : []
  }));

  await Food.deleteMany({});
  await Food.insertMany(foodsWithNormalized);
  console.log('اكتمل تحميل بيانات الطعام');

  // --- تصدير إلى JSON للواجهة الأمامية ---
  const fs = require('fs');
  const path = require('path');
  // التحويل إلى صيغة الواجهة الأمامية: { [name or alias]: { g: carbsPer100g } }
  const frontendFoods = {};
  foods.forEach(food => {
    // إضافة الاسم الرئيسي
    frontendFoods[food.name.toLowerCase()] = { g: food.carbsPer100g };
    // إضافة الأسماء المستعارة
    if (Array.isArray(food.aliases)) {
      food.aliases.forEach(alias => {
        frontendFoods[alias.toLowerCase()] = { g: food.carbsPer100g };
      });
    }
  });
  const outPath = path.join(__dirname, '../../frontend/assets/data/carb-foods.json');
  fs.writeFileSync(outPath, JSON.stringify(frontendFoods, null, 2), 'utf8');
  console.log('تم تصدير الأطعمة إلى', outPath);

  mongoose.disconnect();
})();
