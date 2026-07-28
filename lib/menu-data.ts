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
  | "dessertsCrepeRoll"
  | "dessertsWaffle"
  | "shisha";

export type ShishaBase = "wood" | "bubble" | "natural";

// السعر المشترك لقاعدتي الخشب والبابلي لأغلب نكهات الأركيلة — النكهات الطبيعية
// الآن أصناف مستقلة بسعر واحد ثابت لكل منها (لا تستخدم هذا الثابت)
export const SHISHA_BASE_PRICES: Record<"wood" | "bubble", number> = {
  wood: 5000,
  bubble: 6000,
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
  "dessertsCrepeRoll",
  "dessertsWaffle",
  "shisha",
];

// أسماء الأقسام بالعربية فقط — تُستخدم بلوحة التحكم (لا توجد ترجمة next-intl هناك)
export const MENU_CATEGORY_LABELS_AR: Record<MenuCategory, string> = {
  coffeeClassic: "قهوة سادة",
  coffeeHot: "قهوة ساخنة",
  coffeeCold: "قهوة باردة",
  frappuccino: "فرابتشينو",
  hotChocolate: "هوت شوكليت",
  icedChocolate: "آيس شوكليت",
  milkshake: "ميلك شيك",
  tea: "شاي",
  mojito: "موهيتو",
  mexican: "مكسيكي",
  smoothie: "سموذي",
  juice: "عصائر طبيعية",
  soda: "مشروبات غازية",
  dessertsCrepe: "كريب",
  dessertsCold: "حلى بارد",
  dessertsCrepeRoll: "كريب رول",
  dessertsWaffle: "وافل",
  shisha: "أراجيل",
};

export type MenuGroupKey = "hot" | "cold" | "desserts" | "shisha";

// مجموعات صفحة الطلب (order/page.tsx) — مستخرجة هنا لأن رابط زر "اطلب الآن"
// بقسمي الرائج/العروض بالصفحة الرئيسية يحتاج معرفة أي مجموعة تحتوي القسم المستهدف
export const MENU_GROUPS: { key: MenuGroupKey; categories: MenuCategory[] }[] = [
  {
    key: "hot",
    categories: ["coffeeClassic", "coffeeHot", "tea", "hotChocolate"],
  },
  {
    key: "cold",
    categories: [
      "coffeeCold",
      "icedChocolate",
      "frappuccino",
      "milkshake",
      "mojito",
      "mexican",
      "smoothie",
      "juice",
      "soda",
    ],
  },
  {
    key: "desserts",
    categories: ["dessertsCrepe", "dessertsCold", "dessertsCrepeRoll", "dessertsWaffle"],
  },
  { key: "shisha", categories: ["shisha"] },
];

export function getGroupKeyForCategory(category: MenuCategory): MenuGroupKey {
  return MENU_GROUPS.find((g) => g.categories.includes(category))!.key;
}

export type MenuItem =
  | {
      id: string;
      category: Exclude<MenuCategory, "shisha">;
      name: { ar: string; en: string };
      price: number;
      // وصف قصير جداً يظهر بصفحة المنيو التفاعلي فقط (اختياري)
      description?: { ar: string; en: string };
      // مسار صورة حقيقية مستقبلية تحلّ محل رسمة القسم الفنية تلقائياً إن وُجدت
      image?: string;
    }
  | {
      id: string;
      category: "shisha";
      name: { ar: string; en: string };
      // ليست كل الأركيلة تتوفر بكل القواعد الثلاث (مثلاً تفاحة بالخشب فقط،
      // والنكهات الطبيعية بقاعدة طبيعي فقط) — لذا القواعد جزئية هنا
      basePrices: Partial<Record<ShishaBase, number>>;
      description?: { ar: string; en: string };
      image?: string;
    };

export const menuData: MenuItem[] = [
  // مشروبات القهوة السادة
  { id: "cc1", category: "coffeeClassic", name: { ar: "اسبريسو سنكل", en: "Espresso Single" }, price: 2500, description: { ar: "جرعة إسبريسو مركزة ونقية", en: "Bold, concentrated espresso shot" } },
  { id: "cc2", category: "coffeeClassic", name: { ar: "اسبريسو دبل", en: "Espresso Double" }, price: 4000, description: { ar: "جرعة مضاعفة لعشاق القهوة القوية", en: "Double shot for true coffee lovers" } },
  { id: "cc3", category: "coffeeClassic", name: { ar: "الفريدو اسبريسو", en: "Affogato Espresso" }, price: 3000, description: { ar: "إسبريسو ساخن يُسكب فوق آيس كريم", en: "Hot espresso poured over ice cream" } },
  { id: "cc4", category: "coffeeClassic", name: { ar: "افوكاتو", en: "Avocado Coffee" }, price: 3000, description: { ar: "مزيج غني بالأفوكادو والقهوة", en: "Creamy avocado blended with coffee" } },
  { id: "cc5", category: "coffeeClassic", name: { ar: "ماكياتو", en: "Macchiato" }, price: 3000, description: { ar: "إسبريسو بلمسة رغوة حليب خفيفة", en: "Espresso with a touch of milk foam" } },
  { id: "cc6", category: "coffeeClassic", name: { ar: "دوبيو رستريسو", en: "Doppio Ristretto" }, price: 3000, description: { ar: "جرعة مركزة وقصيرة بنكهة عميقة", en: "Short, intense shot, deep flavor" } },
  { id: "cc7", category: "coffeeClassic", name: { ar: "قهوة تركية سنكل", en: "Turkish Coffee Single" }, price: 2500, description: { ar: "قهوة تركية أصيلة تُقدَّم ساخنة", en: "Authentic Turkish coffee, served hot" } },
  { id: "cc8", category: "coffeeClassic", name: { ar: "قهوة تركية دبل", en: "Turkish Coffee Double" }, price: 4000, description: { ar: "جرعة مضاعفة من القهوة التركية الأصيلة", en: "Double serving of authentic Turkish coffee" } },
  { id: "cc9", category: "coffeeClassic", name: { ar: "قهوة شقراء (خليجية)", en: "Blonde Coffee (Khaleeji)" }, price: 2000, description: { ar: "قهوة خليجية فاتحة اللون بنكهة هيل", en: "Light Khaleeji-style coffee with cardamom" } },

  // مشروبات القهوة الساخنة
  { id: "ch1", category: "coffeeHot", name: { ar: "امريكانو هوت", en: "Americano Hot" }, price: 3000, description: { ar: "إسبريسو ممدد بالماء الساخن", en: "Espresso lengthened with hot water" } },
  { id: "ch2", category: "coffeeHot", name: { ar: "لاتيه كلاسيك", en: "Latte Classic" }, price: 3000, description: { ar: "إسبريسو مع حليب مبخّر ناعم", en: "Espresso with silky steamed milk" } },
  { id: "ch3", category: "coffeeHot", name: { ar: "فلات وايت", en: "Flat White" }, price: 3000, description: { ar: "إسبريسو مركّز بحليب كريمي رقيق", en: "Espresso with velvety micro-foam milk" } },
  { id: "ch4", category: "coffeeHot", name: { ar: "كورتادو", en: "Cortado" }, price: 3000, description: { ar: "توازن مثالي بين الإسبريسو والحليب", en: "Perfect balance of espresso and milk" } },
  { id: "ch5", category: "coffeeHot", name: { ar: "كابتشينو", en: "Cappuccino" }, price: 3000, description: { ar: "إسبريسو برغوة حليب كثيفة", en: "Espresso topped with rich milk foam" } },
  { id: "ch6", category: "coffeeHot", name: { ar: "لاتيه مزاج", en: "Mazaaj Latte" }, price: 3500, description: { ar: "لاتيه بنكهة مزاج الخاصة", en: "Latte with our signature Mazaaj twist" } },
  { id: "ch7", category: "coffeeHot", name: { ar: "سبانش لاتيه", en: "Spanish Latte" }, price: 3500, description: { ar: "لاتيه بلمسة حليب مكثف محلّى", en: "Latte with sweet condensed milk" } },
  { id: "ch8", category: "coffeeHot", name: { ar: "كراميل لاتيه", en: "Caramel Latte" }, price: 3500, description: { ar: "لاتيه غني بنكهة الكراميل", en: "Latte rich with caramel flavor" } },
  { id: "ch9", category: "coffeeHot", name: { ar: "وايت موكا", en: "White Mocha" }, price: 3500, description: { ar: "لاتيه بالشوكولاتة البيضاء الغنية", en: "Latte with rich white chocolate" } },
  { id: "ch10", category: "coffeeHot", name: { ar: "دارك موكا", en: "Dark Mocha" }, price: 3500, description: { ar: "لاتيه بالشوكولاتة الداكنة العميقة", en: "Latte with deep dark chocolate" } },
  { id: "ch11", category: "coffeeHot", name: { ar: "فانيلا لاتيه", en: "Vanilla Latte" }, price: 3500, description: { ar: "لاتيه بنكهة الفانيلا الدافئة", en: "Latte with warm vanilla flavor" } },
  { id: "ch12", category: "coffeeHot", name: { ar: "جوز الهند لاتيه", en: "Coconut Latte" }, price: 3500, description: { ar: "لاتيه بنكهة جوز الهند الاستوائية", en: "Latte with tropical coconut flavor" } },
  { id: "ch13", category: "coffeeHot", name: { ar: "لاتيه بندق", en: "Hazelnut Latte" }, price: 3500, description: { ar: "لاتيه بنكهة البندق المحمّص", en: "Latte with roasted hazelnut flavor" } },

  // مشروبات القهوة الباردة
  { id: "cd1", category: "coffeeCold", name: { ar: "امريكانو ايس", en: "Iced Americano" }, price: 3000, description: { ar: "إسبريسو منعش على الثلج", en: "Refreshing espresso served over ice" } },
  { id: "cd2", category: "coffeeCold", name: { ar: "لاتيه كلاسيك", en: "Iced Latte Classic" }, price: 3000, description: { ar: "لاتيه بارد كلاسيكي منعش", en: "Classic latte, chilled and smooth" } },
  { id: "cd3", category: "coffeeCold", name: { ar: "لاتيه مزاج", en: "Iced Mazaaj Latte" }, price: 3500, description: { ar: "نسخة باردة من لاتيه مزاج", en: "Cold version of our Mazaaj Latte" } },
  { id: "cd4", category: "coffeeCold", name: { ar: "سبانش لاتيه", en: "Iced Spanish Latte" }, price: 3500, description: { ar: "لاتيه بارد بحليب مكثف محلّى", en: "Iced latte with sweet condensed milk" } },
  { id: "cd5", category: "coffeeCold", name: { ar: "كراميل لاتيه", en: "Iced Caramel Latte" }, price: 3500, description: { ar: "لاتيه بارد بنكهة الكراميل", en: "Iced latte with caramel flavor" } },
  { id: "cd6", category: "coffeeCold", name: { ar: "وايت موكا", en: "Iced White Mocha" }, price: 3500, description: { ar: "لاتيه بارد بالشوكولاتة البيضاء", en: "Iced latte with white chocolate" } },
  { id: "cd7", category: "coffeeCold", name: { ar: "دارك موكا", en: "Iced Dark Mocha" }, price: 3500, description: { ar: "لاتيه بارد بالشوكولاتة الداكنة", en: "Iced latte with dark chocolate" } },
  { id: "cd8", category: "coffeeCold", name: { ar: "فانيلا لاتيه", en: "Iced Vanilla Latte" }, price: 3500, description: { ar: "لاتيه بارد بنكهة الفانيلا", en: "Iced latte with vanilla flavor" } },
  { id: "cd9", category: "coffeeCold", name: { ar: "جوز الهند لاتيه", en: "Iced Coconut Latte" }, price: 3500, description: { ar: "لاتيه بارد بنكهة جوز الهند", en: "Iced latte with coconut flavor" } },
  { id: "cd10", category: "coffeeCold", name: { ar: "لاتيه بندق", en: "Iced Hazelnut Latte" }, price: 3500, description: { ar: "لاتيه بارد بنكهة البندق", en: "Iced latte with hazelnut flavor" } },
  { id: "cd11", category: "coffeeCold", name: { ar: "ايس كابتشينو", en: "Iced Cappuccino" }, price: 3000, description: { ar: "كابتشينو بارد برغوة كثيفة", en: "Chilled cappuccino with rich foam" } },

  // الفرابتشينو
  { id: "fr1", category: "frappuccino", name: { ar: "مزاج فراب", en: "Mazaaj Frappe" }, price: 5000, description: { ar: "فرابتشينو بمذاق مزاج المميز", en: "Frappe with our signature Mazaaj taste" } },
  { id: "fr2", category: "frappuccino", name: { ar: "بستاشيو فراب", en: "Pistachio Frappe" }, price: 5000, description: { ar: "فرابتشينو غني بنكهة الفستق", en: "Frappe rich with pistachio flavor" } },
  { id: "fr3", category: "frappuccino", name: { ar: "فانيلا فراب", en: "Vanilla Frappe" }, price: 5000, description: { ar: "فرابتشينو منعش بنكهة الفانيلا", en: "Refreshing frappe with vanilla flavor" } },
  { id: "fr4", category: "frappuccino", name: { ar: "وايت فراب", en: "White Frappe" }, price: 5000, description: { ar: "فرابتشينو بالشوكولاتة البيضاء", en: "Frappe with white chocolate" } },
  { id: "fr5", category: "frappuccino", name: { ar: "دارك فراب", en: "Dark Frappe" }, price: 5000, description: { ar: "فرابتشينو بالشوكولاتة الداكنة", en: "Frappe with dark chocolate" } },

  // هوت شوكليت
  { id: "hc1", category: "hotChocolate", name: { ar: "هوت شوكليت كلاسيك", en: "Classic Hot Chocolate" }, price: 3000, description: { ar: "شوكولاتة ساخنة غنية وكلاسيكية", en: "Rich, classic hot chocolate" } },
  { id: "hc2", category: "hotChocolate", name: { ar: "هوت شوكليت بالكراميل", en: "Caramel Hot Chocolate" }, price: 3500, description: { ar: "شوكولاتة ساخنة بلمسة كراميل", en: "Hot chocolate with a caramel touch" } },
  { id: "hc3", category: "hotChocolate", name: { ar: "هوت شوكليت بالبندق", en: "Hazelnut Hot Chocolate" }, price: 3500, description: { ar: "شوكولاتة ساخنة بنكهة البندق", en: "Hot chocolate with hazelnut flavor" } },
  { id: "hc4", category: "hotChocolate", name: { ar: "هوت شوكليت بالفراولة", en: "Strawberry Hot Chocolate" }, price: 3500, description: { ar: "شوكولاتة ساخنة بنكهة الفراولة", en: "Hot chocolate with strawberry flavor" } },
  { id: "hc5", category: "hotChocolate", name: { ar: "هوت شوكليت بالجوز الهند", en: "Coconut Hot Chocolate" }, price: 3500, description: { ar: "شوكولاتة ساخنة بنكهة جوز الهند", en: "Hot chocolate with coconut flavor" } },
  { id: "hc6", category: "hotChocolate", name: { ar: "هوت شوكليت بالكوكيز", en: "Cookies Hot Chocolate" }, price: 3500, description: { ar: "شوكولاتة ساخنة بقطع الكوكيز", en: "Hot chocolate with cookie crumbles" } },

  // آيس شوكليت
  { id: "ic1", category: "icedChocolate", name: { ar: "ايس شوكليت كلاسيك", en: "Classic Iced Chocolate" }, price: 3000, description: { ar: "شوكولاتة باردة غنية وكلاسيكية", en: "Rich, classic iced chocolate" } },
  { id: "ic2", category: "icedChocolate", name: { ar: "ايس شوكليت بالكراميل", en: "Caramel Iced Chocolate" }, price: 3500, description: { ar: "شوكولاتة باردة بلمسة كراميل", en: "Iced chocolate with a caramel touch" } },
  { id: "ic3", category: "icedChocolate", name: { ar: "ايس شوكليت بالبندق", en: "Hazelnut Iced Chocolate" }, price: 3500, description: { ar: "شوكولاتة باردة بنكهة البندق", en: "Iced chocolate with hazelnut flavor" } },
  { id: "ic4", category: "icedChocolate", name: { ar: "ايس شوكليت بالفراولة", en: "Strawberry Iced Chocolate" }, price: 3500, description: { ar: "شوكولاتة باردة بنكهة الفراولة", en: "Iced chocolate with strawberry flavor" } },
  { id: "ic5", category: "icedChocolate", name: { ar: "ايس شوكليت بالجوز الهند", en: "Coconut Iced Chocolate" }, price: 3500, description: { ar: "شوكولاتة باردة بنكهة جوز الهند", en: "Iced chocolate with coconut flavor" } },
  { id: "ic6", category: "icedChocolate", name: { ar: "ايس شوكليت بالكوكيز", en: "Cookies Iced Chocolate" }, price: 3500, description: { ar: "شوكولاتة باردة بقطع الكوكيز", en: "Iced chocolate with cookie crumbles" } },

  // الميلك شيك
  { id: "ms1", category: "milkshake", name: { ar: "ميلك شيك مزاج", en: "Mazaaj Milkshake" }, price: 4500, description: { ar: "ميلك شيك بمذاق مزاج المميز", en: "Milkshake with our signature Mazaaj taste" } },
  { id: "ms2", category: "milkshake", name: { ar: "ميلك شيك نوتيلا بالشوكلاته", en: "Nutella Chocolate Milkshake" }, price: 4500, description: { ar: "ميلك شيك غني بالنوتيلا والشوكولاتة", en: "Milkshake rich with Nutella and chocolate" } },
  { id: "ms3", category: "milkshake", name: { ar: "ميلك شيك بيستاشيو", en: "Pistachio Milkshake" }, price: 4500, description: { ar: "ميلك شيك كريمي بنكهة الفستق", en: "Creamy milkshake with pistachio flavor" } },
  { id: "ms4", category: "milkshake", name: { ar: "ميلك شيك لوتس", en: "Lotus Milkshake" }, price: 4500, description: { ar: "ميلك شيك بنكهة بسكويت لوتس", en: "Milkshake with Lotus biscuit flavor" } },
  { id: "ms5", category: "milkshake", name: { ar: "ميلك شيك كندر", en: "Kinder Milkshake" }, price: 4500, description: { ar: "ميلك شيك بنكهة الكندر الشهية", en: "Milkshake with delicious Kinder flavor" } },
  { id: "ms6", category: "milkshake", name: { ar: "ميلك شيك اوريو", en: "Oreo Milkshake" }, price: 4500, description: { ar: "ميلك شيك كريمي بقطع الأوريو", en: "Creamy milkshake with Oreo pieces" } },
  { id: "ms7", category: "milkshake", name: { ar: "ميلك شيك كراميل", en: "Caramel Milkshake" }, price: 4500, description: { ar: "ميلك شيك غني بنكهة الكراميل", en: "Milkshake rich with caramel flavor" } },
  { id: "ms8", category: "milkshake", name: { ar: "ميلك شيك فراولة", en: "Strawberry Milkshake" }, price: 4500, description: { ar: "ميلك شيك منعش بالفراولة الطازجة", en: "Refreshing milkshake with fresh strawberry" } },
  { id: "ms9", category: "milkshake", name: { ar: "ميلك شيك مانجو", en: "Mango Milkshake" }, price: 4500, description: { ar: "ميلك شيك استوائي بنكهة المانجو", en: "Tropical milkshake with mango flavor" } },
  { id: "ms10", category: "milkshake", name: { ar: "ميلك شيك خوخ", en: "Peach Milkshake" }, price: 4500, description: { ar: "ميلك شيك منعش بنكهة الخوخ", en: "Refreshing milkshake with peach flavor" } },

  // الشاي
  { id: "tea1", category: "tea", name: { ar: "شاي", en: "Tea" }, price: 1000, description: { ar: "شاي أصيل يُقدَّم ساخناً", en: "Classic tea, served hot" } },
  { id: "tea2", category: "tea", name: { ar: "شاي ليمون", en: "Lemon Tea" }, price: 2000, description: { ar: "شاي منعش بنكهة الليمون", en: "Refreshing tea with lemon" } },
  { id: "tea3", category: "tea", name: { ar: "شاي اخضر", en: "Green Tea" }, price: 2000, description: { ar: "شاي أخضر خفيف ومنعش", en: "Light, refreshing green tea" } },
  { id: "tea4", category: "tea", name: { ar: "شاي ليمون بالنعناع", en: "Lemon Mint Tea" }, price: 2500, description: { ar: "شاي بالليمون والنعناع المنعش", en: "Tea with lemon and refreshing mint" } },
  { id: "tea5", category: "tea", name: { ar: "شاي بالقرفة (دارسين)", en: "Cinnamon Tea" }, price: 1000, description: { ar: "شاي دافئ بنكهة القرفة", en: "Warm tea with cinnamon flavor" } },
  { id: "tea6", category: "tea", name: { ar: "شاي كرك", en: "Karak Tea" }, price: 3000, description: { ar: "شاي كرك غني بالحليب والهيل", en: "Rich Karak tea with milk and cardamom" } },
  { id: "tea8", category: "tea", name: { ar: "سحلب", en: "Sahlab" }, price: 2500, description: { ar: "مشروب دافئ وكريمي تقليدي", en: "Warm, creamy traditional drink" } },

  // الموهيتو
  { id: "mj1", category: "mojito", name: { ar: "فراولة موهيتو", en: "Strawberry Mojito" }, price: 3000, description: { ar: "موهيتو منعش بنكهة الفراولة", en: "Refreshing mojito with strawberry flavor" } },
  { id: "mj2", category: "mojito", name: { ar: "مزاج موهيتو", en: "Mazaaj Mojito" }, price: 3000, description: { ar: "موهيتو بمذاق مزاج المميز", en: "Mojito with our signature Mazaaj taste" } },
  { id: "mj3", category: "mojito", name: { ar: "باشن فروت موهيتو", en: "Passion Fruit Mojito" }, price: 3000, description: { ar: "موهيتو استوائي بنكهة الباشن فروت", en: "Tropical mojito with passion fruit" } },
  { id: "mj4", category: "mojito", name: { ar: "بلو موهيتو", en: "Blue Mojito" }, price: 3000, description: { ar: "موهيتو منعش بنكهة زرقاء مميزة", en: "Refreshing mojito with a blue twist" } },
  { id: "mj5", category: "mojito", name: { ar: "مانجو موهيتو", en: "Mango Mojito" }, price: 3000, description: { ar: "موهيتو استوائي بنكهة المانجو", en: "Tropical mojito with mango flavor" } },
  { id: "mj6", category: "mojito", name: { ar: "كرز موهيتو", en: "Cherry Mojito" }, price: 3000, description: { ar: "موهيتو منعش بنكهة الكرز", en: "Refreshing mojito with cherry flavor" } },
  { id: "mj7", category: "mojito", name: { ar: "بلوبيري موهيتو", en: "Blueberry Mojito" }, price: 3000, description: { ar: "موهيتو منعش بنكهة التوت الأزرق", en: "Refreshing mojito with blueberry flavor" } },
  { id: "mj8", category: "mojito", name: { ar: "رمان موهيتو", en: "Pomegranate Mojito" }, price: 3000, description: { ar: "موهيتو منعش بنكهة الرمان", en: "Refreshing mojito with pomegranate flavor" } },
  { id: "mj9", category: "mojito", name: { ar: "ليمون موهيتو", en: "Lemon Mojito" }, price: 3000, description: { ar: "موهيتو كلاسيكي منعش بالليمون", en: "Classic refreshing lemon mojito" } },
  { id: "mj10", category: "mojito", name: { ar: "ليمون ونعناع موهيتو", en: "Lemon Mint Mojito" }, price: 3000, description: { ar: "موهيتو منعش بالليمون والنعناع", en: "Refreshing mojito with lemon and mint" } },
  { id: "mj11", category: "mojito", name: { ar: "اناناس موهيتو", en: "Pineapple Mojito" }, price: 3000, description: { ar: "موهيتو استوائي بنكهة الأناناس", en: "Tropical mojito with pineapple flavor" } },

  // المكسيكي
  { id: "mx1", category: "mexican", name: { ar: "مكسيكي بالتايجر", en: "Mexican Tiger" }, price: 3000, description: { ar: "مشروب طاقة منعش بنكهة تايجر", en: "Refreshing energy drink with Tiger" } },
  { id: "mx2", category: "mexican", name: { ar: "مكسيكي بالريدبول", en: "Mexican Red Bull" }, price: 5000, description: { ar: "مشروب طاقة منعش بالريدبول", en: "Refreshing energy drink with Red Bull" } },
  { id: "mx3", category: "mexican", name: { ar: "مكسيكي تايجر بالنكهات", en: "Mexican Tiger with Flavors" }, price: 4000, description: { ar: "مكسيكي بالتايجر مع نكهات فواكه", en: "Mexican Tiger with fruity flavors" } },
  { id: "mx4", category: "mexican", name: { ar: "مكسيكي ريدبول بالنكهات", en: "Mexican Red Bull with Flavors" }, price: 5500, description: { ar: "مكسيكي بالريدبول مع نكهات فواكه", en: "Mexican Red Bull with fruity flavors" } },

  // السموذي
  { id: "sm1", category: "smoothie", name: { ar: "سموذي فراولة", en: "Strawberry Smoothie" }, price: 4500, description: { ar: "سموذي كريمي بالفراولة الطازجة", en: "Creamy smoothie with fresh strawberry" } },
  { id: "sm2", category: "smoothie", name: { ar: "سموذي مانجو", en: "Mango Smoothie" }, price: 4500, description: { ar: "سموذي استوائي غني بالمانجو", en: "Tropical smoothie rich with mango" } },
  { id: "sm3", category: "smoothie", name: { ar: "سموذي كيوي", en: "Kiwi Smoothie" }, price: 4500, description: { ar: "سموذي منعش بنكهة الكيوي", en: "Refreshing smoothie with kiwi flavor" } },
  { id: "sm4", category: "smoothie", name: { ar: "سموذي خوخ", en: "Peach Smoothie" }, price: 4500, description: { ar: "سموذي كريمي بنكهة الخوخ", en: "Creamy smoothie with peach flavor" } },
  { id: "sm5", category: "smoothie", name: { ar: "سموذي باشن فروت", en: "Passion Fruit Smoothie" }, price: 4500, description: { ar: "سموذي استوائي بنكهة الباشن فروت", en: "Tropical smoothie with passion fruit" } },
  { id: "sm6", category: "smoothie", name: { ar: "سموذي بلو بيري", en: "Blueberry Smoothie" }, price: 4500, description: { ar: "سموذي منعش بالتوت الأزرق", en: "Refreshing smoothie with blueberry" } },
  { id: "sm7", category: "smoothie", name: { ar: "سموذي اناناس", en: "Pineapple Smoothie" }, price: 4500, description: { ar: "سموذي استوائي بنكهة الأناناس", en: "Tropical smoothie with pineapple flavor" } },
  { id: "sm8", category: "smoothie", name: { ar: "سموذي رمان", en: "Pomegranate Smoothie" }, price: 4500, description: { ar: "سموذي منعش بنكهة الرمان", en: "Refreshing smoothie with pomegranate flavor" } },

  // العصائر الطبيعية
  { id: "jc1", category: "juice", name: { ar: "برتقال مزاج", en: "Mazaaj Orange" }, price: 3000, description: { ar: "عصير برتقال طازج ومنعش", en: "Fresh, refreshing orange juice" } },
  { id: "jc2", category: "juice", name: { ar: "مانجو", en: "Mango" }, price: 3000, description: { ar: "عصير مانجو طبيعي غني", en: "Rich, natural mango juice" } },
  { id: "jc3", category: "juice", name: { ar: "اناناس", en: "Pineapple" }, price: 3000, description: { ar: "عصير أناناس طبيعي منعش", en: "Refreshing, natural pineapple juice" } },
  { id: "jc4", category: "juice", name: { ar: "رمان", en: "Pomegranate" }, price: 3000, description: { ar: "عصير رمان طبيعي منعش", en: "Refreshing, natural pomegranate juice" } },
  { id: "jc5", category: "juice", name: { ar: "ليمون", en: "Lemon" }, price: 3000, description: { ar: "عصير ليمون طازج ومنعش", en: "Fresh, tangy lemon juice" } },
  { id: "jc6", category: "juice", name: { ar: "فراولة", en: "Strawberry" }, price: 3000, description: { ar: "عصير فراولة طبيعي طازج", en: "Fresh, natural strawberry juice" } },
  { id: "jc7", category: "juice", name: { ar: "ليمون وبرتقال", en: "Lemon & Orange" }, price: 4000, description: { ar: "مزيج منعش من الليمون والبرتقال", en: "Refreshing blend of lemon and orange" } },
  { id: "jc8", category: "juice", name: { ar: "ليمون ونعناع", en: "Lemon & Mint" }, price: 4000, description: { ar: "عصير ليمون منعش بالنعناع", en: "Refreshing lemon juice with mint" } },
  { id: "jc9", category: "juice", name: { ar: "موز وفراولة", en: "Banana & Strawberry" }, price: 4000, description: { ar: "مزيج كريمي من الموز والفراولة", en: "Creamy blend of banana and strawberry" } },
  { id: "jc10", category: "juice", name: { ar: "موز بالحليب", en: "Banana with Milk" }, price: 4000, description: { ar: "عصير موز كريمي بالحليب", en: "Creamy banana juice with milk" } },
  { id: "jc11", category: "juice", name: { ar: "موز بالشوكلاته", en: "Banana with Chocolate" }, price: 4000, description: { ar: "عصير موز غني بالشوكولاتة", en: "Rich banana juice with chocolate" } },

  // المشروبات الغازية
  { id: "sd1", category: "soda", name: { ar: "بيبسي", en: "Pepsi" }, price: 500, description: { ar: "مشروب غازي كلاسيكي منعش", en: "Classic, refreshing soft drink" } },
  { id: "sd2", category: "soda", name: { ar: "بيبسي دايت", en: "Pepsi Diet" }, price: 500, description: { ar: "بيبسي دايت خفيف ومنعش", en: "Light, refreshing Diet Pepsi" } },
  { id: "sd3", category: "soda", name: { ar: "سفن اب", en: "7Up" }, price: 500, description: { ar: "مشروب غازي منعش بنكهة الليمون", en: "Refreshing lemon-lime soft drink" } },
  { id: "sd4", category: "soda", name: { ar: "سفن اب دايت", en: "7Up Diet" }, price: 500, description: { ar: "سفن أب دايت خفيف ومنعش", en: "Light, refreshing Diet 7Up" } },
  { id: "sd5", category: "soda", name: { ar: "ميرندا", en: "Mirinda" }, price: 500, description: { ar: "مشروب غازي منعش بنكهة البرتقال", en: "Refreshing orange-flavored soft drink" } },
  { id: "sd6", category: "soda", name: { ar: "صودا سادة", en: "Plain Soda" }, price: 1000, description: { ar: "صودا سادة منعشة وفوّارة", en: "Plain, fizzy refreshing soda" } },
  { id: "sd7", category: "soda", name: { ar: "صودا ليمون", en: "Lemon Soda" }, price: 1000, description: { ar: "صودا منعشة بنكهة الليمون", en: "Refreshing soda with lemon flavor" } },
  { id: "sd8", category: "soda", name: { ar: "تايكر", en: "Tiger" }, price: 2000, description: { ar: "مشروب طاقة منعش", en: "Refreshing energy drink" } },
  { id: "sd9", category: "soda", name: { ar: "ريدبول", en: "Red Bull" }, price: 4000, description: { ar: "مشروب طاقة كلاسيكي منعش", en: "Classic, refreshing energy drink" } },

  // الحلويات — كريب (تشمل الفيتوشيني كريب بعد إلغاء قسمها المستقل)
  { id: "ds1", category: "dessertsCrepe", name: { ar: "كريب شوكلاته", en: "Chocolate Crepe" }, price: 6000, description: { ar: "كريب طازج محشو بالشوكولاتة الغنية", en: "Fresh crepe filled with rich chocolate" } },
  { id: "ds2", category: "dessertsCrepe", name: { ar: "كريب بيستاشيو", en: "Pistachio Crepe" }, price: 6000, description: { ar: "كريب طازج بنكهة الفستق الغنية", en: "Fresh crepe with rich pistachio flavor" } },
  { id: "ds3", category: "dessertsCrepe", name: { ar: "كريب لوتس", en: "Lotus Crepe" }, price: 6000, description: { ar: "كريب طازج بنكهة بسكويت لوتس", en: "Fresh crepe with Lotus biscuit flavor" } },
  { id: "ds4", category: "dessertsCrepe", name: { ar: "كريب اوريو", en: "Oreo Crepe" }, price: 6000, description: { ar: "كريب طازج محشو بقطع الأوريو", en: "Fresh crepe filled with Oreo pieces" } },
  { id: "ds5", category: "dessertsCrepe", name: { ar: "كريب كندر", en: "Kinder Crepe" }, price: 6000, description: { ar: "كريب طازج بنكهة الكندر الشهية", en: "Fresh crepe with delicious Kinder flavor" } },
  { id: "ds6", category: "dessertsCrepe", name: { ar: "كريب مزاج", en: "Mazaaj Crepe" }, price: 6000, description: { ar: "كريب بمذاق مزاج المميز", en: "Crepe with our signature Mazaaj taste" } },
  { id: "ds7", category: "dessertsCrepe", name: { ar: "كريب فواكه", en: "Fruit Crepe" }, price: 7000, description: { ar: "كريب طازج بتشكيلة فواكه منعشة", en: "Fresh crepe with assorted fruit" } },
  { id: "ds8", category: "dessertsCrepe", name: { ar: "فوتيشيني كريب", en: "Fettuccine Crepe" }, price: 6000, description: { ar: "كريب مقطّع بأسلوب فوتيشيني المميز", en: "Crepe cut in the Fettuccine style" } },

  // الحلويات — حلى بارد
  { id: "ds9", category: "dessertsCold", name: { ar: "ليزي", en: "Lazy Cake" }, price: 3000, description: { ar: "حلى بارد غني بالشوكولاتة والبسكويت", en: "Cold dessert rich with chocolate and biscuit" } },
  { id: "ds10", category: "dessertsCold", name: { ar: "كرواسون سادة", en: "Plain Croissant" }, price: 3500, description: { ar: "كرواسون طازج هش وذهبي", en: "Fresh, flaky golden croissant" } },
  { id: "ds11", category: "dessertsCold", name: { ar: "كرواسون شوكولاته بلجيكي", en: "Belgian Chocolate Croissant" }, price: 4500, description: { ar: "كرواسون هش محشو بشوكولاتة بلجيكية", en: "Flaky croissant filled with Belgian chocolate" } },
  { id: "ds12", category: "dessertsCold", name: { ar: "تراليتشة", en: "Tres Leches" }, price: 4500, description: { ar: "كيك إسفنجي غني بثلاثة أنواع حليب", en: "Sponge cake soaked in three milks" } },
  { id: "ds13", category: "dessertsCold", name: { ar: "سان سباستيان", en: "San Sebastian" }, price: 6000, description: { ar: "تشيز كيك محروق كريمي من الداخل", en: "Burnt cheesecake, creamy at the center" } },
  { id: "ds14", category: "dessertsCold", name: { ar: "تشيز كيك", en: "Cheesecake" }, price: 6000, description: { ar: "تشيز كيك كريمي وغني", en: "Rich, creamy cheesecake" } },
  { id: "ds15", category: "dessertsCold", name: { ar: "قطعة كيك", en: "Cake Slice" }, price: 3000, description: { ar: "قطعة كيك طازجة يومياً", en: "Fresh daily cake slice" } },

  // الحلويات — كريب رول
  { id: "ds16", category: "dessertsCrepeRoll", name: { ar: "كريب رول بيستاشيو", en: "Pistachio Crepe Roll" }, price: 6000, description: { ar: "رول كريب ملفوف بنكهة الفستق", en: "Rolled crepe with pistachio flavor" } },
  { id: "ds17", category: "dessertsCrepeRoll", name: { ar: "كريب رول لوتس", en: "Lotus Crepe Roll" }, price: 6000, description: { ar: "رول كريب ملفوف بنكهة لوتس", en: "Rolled crepe with Lotus flavor" } },
  { id: "ds18", category: "dessertsCrepeRoll", name: { ar: "كريب رول شوكلاته", en: "Chocolate Crepe Roll" }, price: 5500, description: { ar: "رول كريب ملفوف بالشوكولاتة الغنية", en: "Rolled crepe with rich chocolate" } },

  // الحلويات — وافل (نفس أصناف وأسعار الكريب الجديدة)
  { id: "ds19", category: "dessertsWaffle", name: { ar: "وافل شوكلاته", en: "Chocolate Waffle" }, price: 6000, description: { ar: "وافل مقرمش محشو بالشوكولاتة", en: "Crispy waffle filled with chocolate" } },
  { id: "ds20", category: "dessertsWaffle", name: { ar: "وافل بيستاشيو", en: "Pistachio Waffle" }, price: 6000, description: { ar: "وافل مقرمش بنكهة الفستق", en: "Crispy waffle with pistachio flavor" } },
  { id: "ds21", category: "dessertsWaffle", name: { ar: "وافل لوتس", en: "Lotus Waffle" }, price: 6000, description: { ar: "وافل مقرمش بنكهة بسكويت لوتس", en: "Crispy waffle with Lotus biscuit flavor" } },
  { id: "ds22", category: "dessertsWaffle", name: { ar: "وافل اوريو", en: "Oreo Waffle" }, price: 6000, description: { ar: "وافل مقرمش محشو بقطع الأوريو", en: "Crispy waffle filled with Oreo pieces" } },
  { id: "ds23", category: "dessertsWaffle", name: { ar: "وافل كندر", en: "Kinder Waffle" }, price: 6000, description: { ar: "وافل مقرمش بنكهة الكندر الشهية", en: "Crispy waffle with delicious Kinder flavor" } },
  { id: "ds24", category: "dessertsWaffle", name: { ar: "وافل مزاج", en: "Mazaaj Waffle" }, price: 6000, description: { ar: "وافل بمذاق مزاج المميز", en: "Waffle with our signature Mazaaj taste" } },
  { id: "ds25", category: "dessertsWaffle", name: { ar: "وافل فواكه", en: "Fruit Waffle" }, price: 7000, description: { ar: "وافل مقرمش بتشكيلة فواكه منعشة", en: "Crispy waffle with assorted fruit" } },
  { id: "ds26", category: "dessertsWaffle", name: { ar: "فوتيشيني وافل", en: "Fettuccine Waffle" }, price: 6000, description: { ar: "وافل مقطّع بأسلوب فوتيشيني المميز", en: "Waffle cut in the Fettuccine style" } },

  // الأراجيل — أغلب النكهات بقاعدتي خشب/بابلي فقط (بدون طبيعي)
  { id: "sh1", category: "shisha", name: { ar: "اركيلة كوفي مزاج", en: "Mazaaj Coffee Shisha" }, basePrices: SHISHA_BASE_PRICES, description: { ar: "أركيلة بنكهة القهوة المميزة", en: "Shisha with a signature coffee flavor" } },
  { id: "sh2", category: "shisha", name: { ar: "انكليزي 2026", en: "English 2026" }, basePrices: SHISHA_BASE_PRICES, description: { ar: "مزيج نكهات إنكليزي مميز", en: "A distinctive English flavor blend" } },
  { id: "sh3", category: "shisha", name: { ar: "ليمون ونعناع", en: "Lemon & Mint" }, basePrices: SHISHA_BASE_PRICES, description: { ar: "أركيلة منعشة بالليمون والنعناع", en: "Refreshing shisha with lemon and mint" } },
  { id: "sh4", category: "shisha", name: { ar: "علك ونعناع", en: "Gum & Mint" }, basePrices: SHISHA_BASE_PRICES, description: { ar: "أركيلة منعشة بالعلكة والنعناع", en: "Refreshing shisha with gum and mint" } },
  { id: "sh5", category: "shisha", name: { ar: "تفاحتين", en: "Double Apple" }, basePrices: SHISHA_BASE_PRICES, description: { ar: "أركيلة كلاسيكية بنكهة التفاحتين", en: "Classic double apple shisha" } },
  // تفاحة: خشب فقط، غير متوفرة بابلي أو طبيعي
  { id: "sh6", category: "shisha", name: { ar: "تفاحة", en: "Apple" }, basePrices: { wood: 6000 }, description: { ar: "أركيلة بنكهة التفاح الكلاسيكية", en: "Classic apple-flavored shisha" } },
  { id: "sh7", category: "shisha", name: { ar: "نعناع", en: "Mint" }, basePrices: SHISHA_BASE_PRICES, description: { ar: "أركيلة منعشة بنكهة النعناع", en: "Refreshing mint-flavored shisha" } },
  { id: "sh8", category: "shisha", name: { ar: "علك", en: "Gum" }, basePrices: SHISHA_BASE_PRICES, description: { ar: "أركيلة بنكهة العلكة الحلوة", en: "Sweet gum-flavored shisha" } },
  { id: "sh9", category: "shisha", name: { ar: "حمضيات", en: "Citrus" }, basePrices: SHISHA_BASE_PRICES, description: { ar: "أركيلة منعشة بمزيج الحمضيات", en: "Refreshing citrus-blend shisha" } },
  { id: "sh10", category: "shisha", name: { ar: "باونتي", en: "Bounty" }, basePrices: SHISHA_BASE_PRICES, description: { ar: "أركيلة بنكهة جوز الهند والشوكولاتة", en: "Shisha with coconut and chocolate flavor" } },
  // النكهات الطبيعية: أصناف مستقلة بسعر واحد لكل منها
  { id: "sh11", category: "shisha", name: { ar: "اناناس طبيعي", en: "Natural Pineapple" }, basePrices: { natural: 15000 }, description: { ar: "أركيلة بمعسّل طبيعي بنكهة الأناناس", en: "Natural molasses shisha, pineapple flavor" } },
  { id: "sh12", category: "shisha", name: { ar: "جريب فروت طبيعي", en: "Natural Grapefruit" }, basePrices: { natural: 12000 }, description: { ar: "أركيلة بمعسّل طبيعي بنكهة الجريب فروت", en: "Natural molasses shisha, grapefruit flavor" } },
];
