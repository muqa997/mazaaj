export type MenuCategory =
  | "coffeeClassic"
  | "coffeeHot"
  | "coffeeCold"
  | "frappuccino"
  | "hotChocolate"
  | "icedChocolate"
  | "milkshake"
  | "tea"
  | "mojito"
  | "mexican"
  | "smoothie"
  | "juice"
  | "soda"
  | "dessertsCrepe"
  | "dessertsCold"
  | "dessertsFettuccine"
  | "dessertsCrepeRoll"
  | "dessertsMiniPancake"
  | "dessertsWaffle"
  | "shisha";

export type ShishaBase = "wood" | "bubble" | "natural";

export const SHISHA_BASE_PRICES: Record<ShishaBase, number> = {
  wood: 5000,
  bubble: 7000,
  natural: 10000,
};

export const MENU_CATEGORIES: MenuCategory[] = [
  "coffeeClassic",
  "coffeeHot",
  "coffeeCold",
  "frappuccino",
  "hotChocolate",
  "icedChocolate",
  "milkshake",
  "tea",
  "mojito",
  "mexican",
  "smoothie",
  "juice",
  "soda",
  "dessertsCrepe",
  "dessertsCold",
  "dessertsFettuccine",
  "dessertsCrepeRoll",
  "dessertsMiniPancake",
  "dessertsWaffle",
  "shisha",
];

export type MenuItem =
  | {
      id: string;
      category: Exclude<MenuCategory, "shisha">;
      name: { ar: string; en: string };
      price: number;
    }
  | {
      id: string;
      category: "shisha";
      name: { ar: string; en: string };
      basePrices: Record<ShishaBase, number>;
    };

export const menuData: MenuItem[] = [
  // مشروبات القهوة السادة
  { id: "cc1", category: "coffeeClassic", name: { ar: "اسبريسو سنكل", en: "Espresso Single" }, price: 2500 },
  { id: "cc2", category: "coffeeClassic", name: { ar: "اسبريسو دبل", en: "Espresso Double" }, price: 3000 },
  { id: "cc3", category: "coffeeClassic", name: { ar: "الفريدو اسبريسو", en: "Affogato Espresso" }, price: 3000 },
  { id: "cc4", category: "coffeeClassic", name: { ar: "افوكاتو", en: "Avocado Coffee" }, price: 3000 },
  { id: "cc5", category: "coffeeClassic", name: { ar: "ماكياتو", en: "Macchiato" }, price: 3000 },
  { id: "cc6", category: "coffeeClassic", name: { ar: "دوبيو رستريسو", en: "Doppio Ristretto" }, price: 3000 },
  { id: "cc7", category: "coffeeClassic", name: { ar: "قهوة تركية سنكل", en: "Turkish Coffee Single" }, price: 2500 },
  { id: "cc8", category: "coffeeClassic", name: { ar: "قهوة تركية دبل", en: "Turkish Coffee Double" }, price: 3000 },
  { id: "cc9", category: "coffeeClassic", name: { ar: "قهوة شقراء (خليجية)", en: "Blonde Coffee (Khaleeji)" }, price: 2000 },

  // مشروبات القهوة الساخنة
  { id: "ch1", category: "coffeeHot", name: { ar: "امريكانو هوت", en: "Americano Hot" }, price: 3000 },
  { id: "ch2", category: "coffeeHot", name: { ar: "لاتيه كلاسيك", en: "Latte Classic" }, price: 3000 },
  { id: "ch3", category: "coffeeHot", name: { ar: "فلات وايت", en: "Flat White" }, price: 3000 },
  { id: "ch4", category: "coffeeHot", name: { ar: "كورتادو", en: "Cortado" }, price: 3000 },
  { id: "ch5", category: "coffeeHot", name: { ar: "كابتشينو", en: "Cappuccino" }, price: 3000 },
  { id: "ch6", category: "coffeeHot", name: { ar: "لاتيه مزاج", en: "Mazaaj Latte" }, price: 3500 },
  { id: "ch7", category: "coffeeHot", name: { ar: "سبانش لاتيه", en: "Spanish Latte" }, price: 3500 },
  { id: "ch8", category: "coffeeHot", name: { ar: "كراميل لاتيه", en: "Caramel Latte" }, price: 3500 },
  { id: "ch9", category: "coffeeHot", name: { ar: "وايت موكا", en: "White Mocha" }, price: 3500 },
  { id: "ch10", category: "coffeeHot", name: { ar: "دارك موكا", en: "Dark Mocha" }, price: 3500 },
  { id: "ch11", category: "coffeeHot", name: { ar: "فانيلا لاتيه", en: "Vanilla Latte" }, price: 3500 },
  { id: "ch12", category: "coffeeHot", name: { ar: "جوز الهند لاتيه", en: "Coconut Latte" }, price: 3500 },
  { id: "ch13", category: "coffeeHot", name: { ar: "لاتيه بندق", en: "Hazelnut Latte" }, price: 3500 },

  // مشروبات القهوة الباردة
  { id: "cd1", category: "coffeeCold", name: { ar: "امريكانو ايس", en: "Iced Americano" }, price: 3000 },
  { id: "cd2", category: "coffeeCold", name: { ar: "لاتيه كلاسيك", en: "Iced Latte Classic" }, price: 3000 },
  { id: "cd3", category: "coffeeCold", name: { ar: "لاتيه مزاج", en: "Iced Mazaaj Latte" }, price: 3500 },
  { id: "cd4", category: "coffeeCold", name: { ar: "سبانش لاتيه", en: "Iced Spanish Latte" }, price: 3500 },
  { id: "cd5", category: "coffeeCold", name: { ar: "كراميل لاتيه", en: "Iced Caramel Latte" }, price: 3500 },
  { id: "cd6", category: "coffeeCold", name: { ar: "وايت موكا", en: "Iced White Mocha" }, price: 3500 },
  { id: "cd7", category: "coffeeCold", name: { ar: "دارك موكا", en: "Iced Dark Mocha" }, price: 3500 },
  { id: "cd8", category: "coffeeCold", name: { ar: "فانيلا لاتيه", en: "Iced Vanilla Latte" }, price: 3500 },
  { id: "cd9", category: "coffeeCold", name: { ar: "جوز الهند لاتيه", en: "Iced Coconut Latte" }, price: 3500 },
  { id: "cd10", category: "coffeeCold", name: { ar: "لاتيه بندق", en: "Iced Hazelnut Latte" }, price: 3500 },
  { id: "cd11", category: "coffeeCold", name: { ar: "ايس كابتشينو", en: "Iced Cappuccino" }, price: 3000 },

  // الفرابتشينو
  { id: "fr1", category: "frappuccino", name: { ar: "مزاج فراب", en: "Mazaaj Frappe" }, price: 5000 },
  { id: "fr2", category: "frappuccino", name: { ar: "بستاشيو فراب", en: "Pistachio Frappe" }, price: 5000 },
  { id: "fr3", category: "frappuccino", name: { ar: "فانيلا فراب", en: "Vanilla Frappe" }, price: 5000 },
  { id: "fr4", category: "frappuccino", name: { ar: "وايت فراب", en: "White Frappe" }, price: 5000 },
  { id: "fr5", category: "frappuccino", name: { ar: "دارك فراب", en: "Dark Frappe" }, price: 5000 },

  // هوت شوكليت
  { id: "hc1", category: "hotChocolate", name: { ar: "هوت شوكليت كلاسيك", en: "Classic Hot Chocolate" }, price: 3000 },
  { id: "hc2", category: "hotChocolate", name: { ar: "هوت شوكليت بالكراميل", en: "Caramel Hot Chocolate" }, price: 3500 },
  { id: "hc3", category: "hotChocolate", name: { ar: "هوت شوكليت بالبندق", en: "Hazelnut Hot Chocolate" }, price: 3500 },
  { id: "hc4", category: "hotChocolate", name: { ar: "هوت شوكليت بالفراولة", en: "Strawberry Hot Chocolate" }, price: 3500 },
  { id: "hc5", category: "hotChocolate", name: { ar: "هوت شوكليت بالجوز الهند", en: "Coconut Hot Chocolate" }, price: 3500 },
  { id: "hc6", category: "hotChocolate", name: { ar: "هوت شوكليت بالكوكيز", en: "Cookies Hot Chocolate" }, price: 3500 },

  // آيس شوكليت
  { id: "ic1", category: "icedChocolate", name: { ar: "ايس شوكليت كلاسيك", en: "Classic Iced Chocolate" }, price: 3000 },
  { id: "ic2", category: "icedChocolate", name: { ar: "ايس شوكليت بالكراميل", en: "Caramel Iced Chocolate" }, price: 3500 },
  { id: "ic3", category: "icedChocolate", name: { ar: "ايس شوكليت بالبندق", en: "Hazelnut Iced Chocolate" }, price: 3500 },
  { id: "ic4", category: "icedChocolate", name: { ar: "ايس شوكليت بالفراولة", en: "Strawberry Iced Chocolate" }, price: 3500 },
  { id: "ic5", category: "icedChocolate", name: { ar: "ايس شوكليت بالجوز الهند", en: "Coconut Iced Chocolate" }, price: 3500 },
  { id: "ic6", category: "icedChocolate", name: { ar: "ايس شوكليت بالكوكيز", en: "Cookies Iced Chocolate" }, price: 3500 },

  // الميلك شيك
  { id: "ms1", category: "milkshake", name: { ar: "ميلك شيك مزاج", en: "Mazaaj Milkshake" }, price: 4500 },
  { id: "ms2", category: "milkshake", name: { ar: "ميلك شيك نوتيلا بالشوكلاته", en: "Nutella Chocolate Milkshake" }, price: 4500 },
  { id: "ms3", category: "milkshake", name: { ar: "ميلك شيك بيستاشيو", en: "Pistachio Milkshake" }, price: 4500 },
  { id: "ms4", category: "milkshake", name: { ar: "ميلك شيك لوتس", en: "Lotus Milkshake" }, price: 4500 },
  { id: "ms5", category: "milkshake", name: { ar: "ميلك شيك كندر", en: "Kinder Milkshake" }, price: 4500 },
  { id: "ms6", category: "milkshake", name: { ar: "ميلك شيك اوريو", en: "Oreo Milkshake" }, price: 4500 },
  { id: "ms7", category: "milkshake", name: { ar: "ميلك شيك كراميل", en: "Caramel Milkshake" }, price: 4500 },
  { id: "ms8", category: "milkshake", name: { ar: "ميلك شيك فراولة", en: "Strawberry Milkshake" }, price: 4500 },
  { id: "ms9", category: "milkshake", name: { ar: "ميلك شيك مانجو", en: "Mango Milkshake" }, price: 4500 },
  { id: "ms10", category: "milkshake", name: { ar: "ميلك شيك خوخ", en: "Peach Milkshake" }, price: 4500 },

  // الشاي
  { id: "tea1", category: "tea", name: { ar: "شاي", en: "Tea" }, price: 1000 },
  { id: "tea2", category: "tea", name: { ar: "شاي ليمون", en: "Lemon Tea" }, price: 2500 },
  { id: "tea3", category: "tea", name: { ar: "شاي اخضر", en: "Green Tea" }, price: 2000 },
  { id: "tea4", category: "tea", name: { ar: "شاي ليمون بالنعناع", en: "Lemon Mint Tea" }, price: 2000 },
  { id: "tea5", category: "tea", name: { ar: "شاي بالقرفة (دارسين)", en: "Cinnamon Tea" }, price: 1000 },
  { id: "tea6", category: "tea", name: { ar: "شاي كرك", en: "Karak Tea" }, price: 3000 },
  { id: "tea7", category: "tea", name: { ar: "شاي بالورد", en: "Rose Tea" }, price: 1000 },
  { id: "tea8", category: "tea", name: { ar: "سحلب", en: "Sahlab" }, price: 2500 },

  // الموهيتو
  { id: "mj1", category: "mojito", name: { ar: "فراولة موهيتو", en: "Strawberry Mojito" }, price: 3000 },
  { id: "mj2", category: "mojito", name: { ar: "مزاج موهيتو", en: "Mazaaj Mojito" }, price: 3000 },
  { id: "mj3", category: "mojito", name: { ar: "باشن فروت موهيتو", en: "Passion Fruit Mojito" }, price: 3000 },
  { id: "mj4", category: "mojito", name: { ar: "بلو موهيتو", en: "Blue Mojito" }, price: 3000 },
  { id: "mj5", category: "mojito", name: { ar: "مانجو موهيتو", en: "Mango Mojito" }, price: 3000 },
  { id: "mj6", category: "mojito", name: { ar: "كرز موهيتو", en: "Cherry Mojito" }, price: 3000 },
  { id: "mj7", category: "mojito", name: { ar: "بلوبيري موهيتو", en: "Blueberry Mojito" }, price: 3000 },
  { id: "mj8", category: "mojito", name: { ar: "رمان موهيتو", en: "Pomegranate Mojito" }, price: 3000 },
  { id: "mj9", category: "mojito", name: { ar: "ليمون موهيتو", en: "Lemon Mojito" }, price: 3000 },
  { id: "mj10", category: "mojito", name: { ar: "ليمون ونعناع موهيتو", en: "Lemon Mint Mojito" }, price: 3000 },
  { id: "mj11", category: "mojito", name: { ar: "اناناس موهيتو", en: "Pineapple Mojito" }, price: 3000 },

  // المكسيكي
  { id: "mx1", category: "mexican", name: { ar: "مكسيكي بالتايجر", en: "Mexican Tiger" }, price: 3000 },
  { id: "mx2", category: "mexican", name: { ar: "مكسيكي بالريدبول", en: "Mexican Red Bull" }, price: 4000 },

  // السموذي
  { id: "sm1", category: "smoothie", name: { ar: "سموذي فراولة", en: "Strawberry Smoothie" }, price: 4500 },
  { id: "sm2", category: "smoothie", name: { ar: "سموذي مانجو", en: "Mango Smoothie" }, price: 4500 },
  { id: "sm3", category: "smoothie", name: { ar: "سموذي كيوي", en: "Kiwi Smoothie" }, price: 4500 },
  { id: "sm4", category: "smoothie", name: { ar: "سموذي خوخ", en: "Peach Smoothie" }, price: 4500 },
  { id: "sm5", category: "smoothie", name: { ar: "سموذي باشن فروت", en: "Passion Fruit Smoothie" }, price: 4500 },
  { id: "sm6", category: "smoothie", name: { ar: "سموذي بلو بيري", en: "Blueberry Smoothie" }, price: 4500 },
  { id: "sm7", category: "smoothie", name: { ar: "سموذي اناناس", en: "Pineapple Smoothie" }, price: 4500 },
  { id: "sm8", category: "smoothie", name: { ar: "سموذي رمان", en: "Pomegranate Smoothie" }, price: 4500 },

  // العصائر الطبيعية
  { id: "jc1", category: "juice", name: { ar: "برتقال مزاج", en: "Mazaaj Orange" }, price: 3000 },
  { id: "jc2", category: "juice", name: { ar: "مانجو", en: "Mango" }, price: 3000 },
  { id: "jc3", category: "juice", name: { ar: "اناناس", en: "Pineapple" }, price: 3000 },
  { id: "jc4", category: "juice", name: { ar: "رمان", en: "Pomegranate" }, price: 3000 },
  { id: "jc5", category: "juice", name: { ar: "ليمون", en: "Lemon" }, price: 3000 },
  { id: "jc6", category: "juice", name: { ar: "فراولة", en: "Strawberry" }, price: 3000 },
  { id: "jc7", category: "juice", name: { ar: "ليمون وبرتقال", en: "Lemon & Orange" }, price: 4000 },
  { id: "jc8", category: "juice", name: { ar: "ليمون ونعناع", en: "Lemon & Mint" }, price: 4000 },
  { id: "jc9", category: "juice", name: { ar: "موز وفراولة", en: "Banana & Strawberry" }, price: 4000 },
  { id: "jc10", category: "juice", name: { ar: "موز بالحليب", en: "Banana with Milk" }, price: 4000 },
  { id: "jc11", category: "juice", name: { ar: "موز بالشوكلاته", en: "Banana with Chocolate" }, price: 4000 },

  // المشروبات الغازية
  { id: "sd1", category: "soda", name: { ar: "بيبسي", en: "Pepsi" }, price: 1500 },
  { id: "sd2", category: "soda", name: { ar: "بيبسي دايت", en: "Pepsi Diet" }, price: 1500 },
  { id: "sd3", category: "soda", name: { ar: "سفن اب", en: "7Up" }, price: 1500 },
  { id: "sd4", category: "soda", name: { ar: "سفن اب دايت", en: "7Up Diet" }, price: 1500 },
  { id: "sd5", category: "soda", name: { ar: "ميرندا", en: "Mirinda" }, price: 1500 },
  { id: "sd6", category: "soda", name: { ar: "صودا سادة", en: "Plain Soda" }, price: 1500 },
  { id: "sd7", category: "soda", name: { ar: "صودا ليمون", en: "Lemon Soda" }, price: 1500 },
  { id: "sd8", category: "soda", name: { ar: "تايكر", en: "Tiger" }, price: 2000 },
  { id: "sd9", category: "soda", name: { ar: "ريدبول", en: "Red Bull" }, price: 4000 },

  // الحلويات — كريب
  { id: "ds1", category: "dessertsCrepe", name: { ar: "كريب فواكه", en: "Fruit Crepe" }, price: 6000 },
  { id: "ds2", category: "dessertsCrepe", name: { ar: "ميني كريب", en: "Mini Crepe" }, price: 4000 },
  { id: "ds3", category: "dessertsCrepe", name: { ar: "كريب مارشميلو", en: "Marshmallow Crepe" }, price: 5000 },
  { id: "ds4", category: "dessertsCrepe", name: { ar: "كريب كوكيز", en: "Cookies Crepe" }, price: 5000 },

  // الحلويات — حلى بارد
  { id: "ds5", category: "dessertsCold", name: { ar: "ليزي", en: "Lazy Cake" }, price: 3000 },
  { id: "ds6", category: "dessertsCold", name: { ar: "كرواسون", en: "Croissant" }, price: 4000 },

  // الحلويات — فيتوشيني
  { id: "ds7", category: "dessertsFettuccine", name: { ar: "فيتوشيني كريب", en: "Fettuccine Crepe" }, price: 5500 },
  { id: "ds8", category: "dessertsFettuccine", name: { ar: "مزاج فيتوشيني", en: "Mazaaj Fettuccine" }, price: 6000 },

  // الحلويات — كريب رول
  { id: "ds9", category: "dessertsCrepeRoll", name: { ar: "كريب رول بيستاشيو", en: "Pistachio Crepe Roll" }, price: 6000 },
  { id: "ds10", category: "dessertsCrepeRoll", name: { ar: "كريب رول لوتس", en: "Lotus Crepe Roll" }, price: 6000 },
  { id: "ds11", category: "dessertsCrepeRoll", name: { ar: "كريب رول شوكلاته", en: "Chocolate Crepe Roll" }, price: 5500 },

  // الحلويات — ميني بان كيك
  { id: "ds12", category: "dessertsMiniPancake", name: { ar: "ميني بان كيك بالفواكه", en: "Mini Pancake with Fruits" }, price: 5000 },
  { id: "ds13", category: "dessertsMiniPancake", name: { ar: "ميني بان كيك بالشوكولاتة", en: "Mini Pancake with Chocolate" }, price: 5000 },
  { id: "ds14", category: "dessertsMiniPancake", name: { ar: "ميني بان كيك بالبيستاشيو", en: "Mini Pancake with Pistachio" }, price: 5500 },

  // الحلويات — وافل
  { id: "ds15", category: "dessertsWaffle", name: { ar: "بانانا وافل", en: "Banana Waffle" }, price: 5000 },
  { id: "ds16", category: "dessertsWaffle", name: { ar: "فواكه وافل", en: "Fruit Waffle" }, price: 5500 },
  { id: "ds17", category: "dessertsWaffle", name: { ar: "وافل بالقرفة", en: "Cinnamon Waffle" }, price: 4500 },

  // الأراجيل — نفس تسعير القواعد الثلاث لكل نكهة (خشب/بابلي/طبيعي)
  { id: "sh1", category: "shisha", name: { ar: "اركيلة كوفي مزاج", en: "Mazaaj Coffee Shisha" }, basePrices: SHISHA_BASE_PRICES },
  { id: "sh2", category: "shisha", name: { ar: "انكليزي 2026", en: "English 2026" }, basePrices: SHISHA_BASE_PRICES },
  { id: "sh3", category: "shisha", name: { ar: "ليمون ونعناع", en: "Lemon & Mint" }, basePrices: SHISHA_BASE_PRICES },
  { id: "sh4", category: "shisha", name: { ar: "علك ونعناع", en: "Gum & Mint" }, basePrices: SHISHA_BASE_PRICES },
  { id: "sh5", category: "shisha", name: { ar: "تفاحتين", en: "Double Apple" }, basePrices: SHISHA_BASE_PRICES },
  { id: "sh6", category: "shisha", name: { ar: "تفاحة", en: "Apple" }, basePrices: SHISHA_BASE_PRICES },
  { id: "sh7", category: "shisha", name: { ar: "نعناع", en: "Mint" }, basePrices: SHISHA_BASE_PRICES },
  { id: "sh8", category: "shisha", name: { ar: "علك", en: "Gum" }, basePrices: SHISHA_BASE_PRICES },
  { id: "sh9", category: "shisha", name: { ar: "حمضيات", en: "Citrus" }, basePrices: SHISHA_BASE_PRICES },
  { id: "sh10", category: "shisha", name: { ar: "باونتي", en: "Bounty" }, basePrices: SHISHA_BASE_PRICES },
];
