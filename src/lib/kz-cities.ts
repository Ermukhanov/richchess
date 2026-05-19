// Major cities of all 17 regions of Kazakhstan + 3 cities of republican significance
export const KZ_CITIES: string[] = [
  // Cities of republican significance
  "Астана", "Алматы", "Шымкент",
  // Akmola region
  "Кокшетау", "Степногорск", "Атбасар",
  // Aktobe region
  "Актобе", "Кандыагаш", "Хромтау",
  // Almaty region
  "Конаев (Капшагай)", "Талдыкорган", "Текели", "Есик", "Каскелен",
  // Atyrau region
  "Атырау", "Кульсары",
  // East Kazakhstan
  "Усть-Каменогорск", "Риддер", "Зыряновск", "Аягоз",
  // Zhambyl region
  "Тараз", "Каратау", "Жанатас", "Шу",
  // Zhetisu region
  "Талдыкорган", "Сарканд", "Уштобе",
  // West Kazakhstan
  "Уральск", "Аксай",
  // Karaganda region
  "Караганда", "Темиртау", "Балхаш", "Жезказган", "Сатпаев", "Сарань", "Шахтинск",
  // Kostanay region
  "Костанай", "Рудный", "Лисаковск", "Аркалык",
  // Kyzylorda region
  "Кызылорда", "Байконыр", "Аральск", "Казалинск",
  // Mangystau region
  "Актау", "Жанаозен",
  // Pavlodar region
  "Павлодар", "Экибастуз", "Аксу",
  // North Kazakhstan
  "Петропавловск", "Булаево", "Тайынша",
  // Turkestan region
  "Туркестан", "Кентау", "Арыс", "Ленгер",
  // Ulytau region
  "Жезказган", "Сатпаев",
  // Abai region
  "Семей", "Курчатов",
];

// Dedup and sort
export const KZ_CITIES_UNIQUE = Array.from(new Set(KZ_CITIES)).sort((a, b) =>
  a.localeCompare(b, "ru")
);
