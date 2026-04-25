/**
 * Seed script – Bangladesh agro-climatic seasonal crop rules.
 *
 * Run:  node seed-seasonal-rules.js
 *
 * Covers the principal crop calendars used by DAE (Dept of Agricultural
 * Extension), Bangladesh.  Months are 1-based (1 = January).
 *
 * Seasons:
 *  Rabi   (dry / cool)   : Nov – Feb
 *  Kharif-1 (pre-monsoon): Mar – Jun
 *  Kharif-2 (main monsoon): Jul – Oct
 */

require("dotenv").config();
const mongoose = require("mongoose");
const SeasonalRule = require("./models/SeasonalRule");

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/agrilens";

// ---------------------------------------------------------------------------
// Helper: generate a rule record
// ---------------------------------------------------------------------------
function rule(cropName, suitableMonths, supportedUpazilas, rationale) {
  return { cropName, suitableMonths, supportedUpazilas, rationale };
}

// ---------------------------------------------------------------------------
// Upazila lists by agro-ecological zone / division
// ---------------------------------------------------------------------------
const DHAKA_UPAZILAS = [
  "Savar", "Dhamrai", "Keraniganj", "Dohar", "Nawabganj",
  "Manikganj Sadar", "Singair", "Saturia", "Harirampur", "Shibalaya",
];

const CHITTAGONG_UPAZILAS = [
  "Hathazari", "Raozan", "Sitakunda", "Mirsharai", "Sandwip",
  "Banshkhali", "Patiya", "Anwara", "Boalkhali", "Chandanaish",
];

const SYLHET_UPAZILAS = [
  "Sylhet Sadar", "Companiganj", "Golapganj", "Beanibazar", "Fenchuganj",
  "Jaintapur", "Kanaighat", "Zakiganj", "Osmaninagar", "Balaganj",
];

const RAJSHAHI_UPAZILAS = [
  "Rajshahi Sadar", "Paba", "Godagari", "Tanore", "Mohanpur",
  "Bagha", "Bagmara", "Charghat", "Durgapur", "Puthia",
];

const RANGPUR_UPAZILAS = [
  "Rangpur Sadar", "Badarganj", "Gangachara", "Kaunia", "Mithapukur",
  "Pirgacha", "Pirganj", "Taraganj", "Lalmonirhat Sadar", "Aditmari",
];

const BARISAL_UPAZILAS = [
  "Barisal Sadar", "Babuganj", "Bakerganj", "Banaripara", "Gaurnadi",
  "Hizla", "Mehendiganj", "Muladi", "Wazirpur", "Agailjhara",
];

const KHULNA_UPAZILAS = [
  "Khulna Sadar", "Batiaghata", "Dacope", "Dumuria", "Dighalia",
  "Koyra", "Paikgacha", "Phultala", "Rupsa", "Terokhada",
];

const MYMENSINGH_UPAZILAS = [
  "Mymensingh Sadar", "Bhaluka", "Fulbaria", "Gaffargaon", "Gauripur",
  "Haluaghat", "Ishwarganj", "Muktagachha", "Nandail", "Phulpur",
];

// all upazilas combined (used for truly national crops)
const ALL_UPAZILAS = [
  ...DHAKA_UPAZILAS,
  ...CHITTAGONG_UPAZILAS,
  ...SYLHET_UPAZILAS,
  ...RAJSHAHI_UPAZILAS,
  ...RANGPUR_UPAZILAS,
  ...BARISAL_UPAZILAS,
  ...KHULNA_UPAZILAS,
  ...MYMENSINGH_UPAZILAS,
];

// ---------------------------------------------------------------------------
// Rules dataset
// ---------------------------------------------------------------------------
const RULES = [
  // ── RICE VARIETIES ───────────────────────────────────────────────────────
  rule(
    "Boro Rice",
    [12, 1, 2, 3, 4, 5],
    ALL_UPAZILAS,
    "Boro is the irrigated dry-season rice grown Dec–May. It is the highest-yielding rice season in Bangladesh and suits nearly all regions with canal or groundwater irrigation."
  ),
  rule(
    "Aus Rice",
    [3, 4, 5, 6, 7],
    ALL_UPAZILAS,
    "Aus is the pre-monsoon broadcast rice, sown Mar–Apr and harvested Jun–Jul. Short-duration varieties perform best in well-drained upland areas."
  ),
  rule(
    "Aman Rice",
    [6, 7, 8, 9, 10, 11],
    ALL_UPAZILAS,
    "T-Aman is the main rain-fed transplanted rice of the monsoon season. Transplanting Jun–Aug, harvest Nov. Preferred in low-lying and haor areas."
  ),

  // ── VEGETABLES – RABI (WINTER) ────────────────────────────────────────────
  rule(
    "Potato",
    [10, 11, 12, 1, 2],
    [
      ...RAJSHAHI_UPAZILAS,
      ...RANGPUR_UPAZILAS,
      ...MYMENSINGH_UPAZILAS,
      ...DHAKA_UPAZILAS,
    ],
    "Potato is the premier Rabi cash crop. Planting Oct–Nov, harvest Jan–Feb. The cool dry climate of Rajshahi, Rangpur and Mymensingh gives the highest yields."
  ),
  rule(
    "Mustard",
    [10, 11, 12, 1],
    [
      ...RAJSHAHI_UPAZILAS,
      ...RANGPUR_UPAZILAS,
      ...DHAKA_UPAZILAS,
      ...MYMENSINGH_UPAZILAS,
      ...BARISAL_UPAZILAS,
    ],
    "Mustard is the main oilseed crop (Rabi). Sown Oct–Nov on receding floodwater soils, harvested Jan–Feb. Rajshahi and Rangpur are the top-producing divisions."
  ),
  rule(
    "Lentil (Masur)",
    [10, 11, 12, 1, 2],
    [...RAJSHAHI_UPAZILAS, ...MYMENSINGH_UPAZILAS, ...DHAKA_UPAZILAS],
    "Lentil is a cool-season pulse crop, planted Oct–Nov and harvested Feb–Mar. It thrives in the medium-high lands of Rajshahi and Mymensingh."
  ),
  rule(
    "Onion",
    [10, 11, 12, 1, 2, 3],
    [
      ...RAJSHAHI_UPAZILAS,
      ...DHAKA_UPAZILAS,
      ...MYMENSINGH_UPAZILAS,
      ...RANGPUR_UPAZILAS,
    ],
    "Onion is a major Rabi cash crop in Bangladesh. Seedbed Oct, transplant Nov–Dec, harvest Feb–Mar. Rajshahi (especially Faridpur belt) leads production."
  ),
  rule(
    "Garlic",
    [10, 11, 12, 1, 2],
    [...RAJSHAHI_UPAZILAS, ...MYMENSINGH_UPAZILAS],
    "Garlic prefers loamy soils with cool dry winters. Planting Oct–Nov, harvest Jan–Feb. Rajshahi and Mymensingh are the main producing zones."
  ),
  rule(
    "Wheat",
    [11, 12, 1, 2, 3],
    [
      ...RAJSHAHI_UPAZILAS,
      ...RANGPUR_UPAZILAS,
      ...DHAKA_UPAZILAS,
      ...MYMENSINGH_UPAZILAS,
    ],
    "Wheat is sown Nov–Dec and harvested Mar–Apr. It requires cool temperatures during grain-filling; northern and north-western regions are most suitable."
  ),
  rule(
    "Chickpea (Boot)",
    [10, 11, 12, 1, 2],
    [...RAJSHAHI_UPAZILAS, ...DHAKA_UPAZILAS],
    "Chickpea is grown on residual soil moisture after flood recession. Planted Oct–Nov, harvested Jan–Feb. Medium-high lands in Rajshahi and Dhaka divisions suit it best."
  ),
  rule(
    "Tomato",
    [9, 10, 11, 12, 1, 2],
    [
      ...DHAKA_UPAZILAS,
      ...MYMENSINGH_UPAZILAS,
      ...CHITTAGONG_UPAZILAS,
      ...RAJSHAHI_UPAZILAS,
    ],
    "Tomato requires cool nights (18–22 °C). Transplant Sep–Nov, harvest Dec–Feb. It is one of the most profitable winter vegetables in Bangladesh."
  ),
  rule(
    "Cauliflower",
    [9, 10, 11, 12, 1],
    [
      ...DHAKA_UPAZILAS,
      ...MYMENSINGH_UPAZILAS,
      ...CHITTAGONG_UPAZILAS,
      ...RAJSHAHI_UPAZILAS,
      ...RANGPUR_UPAZILAS,
    ],
    "Cauliflower is a popular Rabi vegetable. Seedbed Aug–Sep, transplant Oct–Nov, harvest Dec–Jan. Moderate-cool climates across the country are suitable."
  ),
  rule(
    "Cabbage",
    [9, 10, 11, 12, 1],
    ALL_UPAZILAS,
    "Cabbage is produced nationwide in the Rabi season. Seedbed Aug–Sep, transplant Oct–Nov, harvest Dec–Feb. Highly marketable in urban periphery upazilas."
  ),
  rule(
    "Carrot",
    [9, 10, 11, 12, 1],
    [...DHAKA_UPAZILAS, ...MYMENSINGH_UPAZILAS, ...RANGPUR_UPAZILAS],
    "Carrot requires cool weather and well-drained sandy loam. Sown Sep–Oct, harvested Dec–Jan. Common in char-land areas of Rangpur and Mymensingh."
  ),
  rule(
    "Eggplant (Brinjal)",
    [9, 10, 11, 12, 1, 2, 3],
    ALL_UPAZILAS,
    "Brinjal is a year-round crop but yields best in Rabi. Transplant Oct, continual harvest through Feb–Mar. One of Bangladesh's most consumed vegetables."
  ),

  // ── VEGETABLES – KHARIF-1 (PRE-MONSOON) ──────────────────────────────────
  rule(
    "Bitter Gourd (Karela)",
    [2, 3, 4, 5, 6],
    [...DHAKA_UPAZILAS, ...MYMENSINGH_UPAZILAS, ...KHULNA_UPAZILAS],
    "Bitter gourd is a warm-season cucurbit. Sown Feb–Mar, harvested May–Jun. It thrives in the hot humid climate before the main monsoon."
  ),
  rule(
    "Ridge Gourd",
    [3, 4, 5, 6],
    [...DHAKA_UPAZILAS, ...BARISAL_UPAZILAS, ...KHULNA_UPAZILAS],
    "Ridge gourd grows well in pre-monsoon warmth. Sown Mar–Apr, harvested May–Jun. Trellis cultivation is common in homestead gardens."
  ),
  rule(
    "Summer Tomato",
    [2, 3, 4, 5],
    [
      ...MYMENSINGH_UPAZILAS,
      ...DHAKA_UPAZILAS,
      ...CHITTAGONG_UPAZILAS,
    ],
    "Heat-tolerant summer tomato varieties are now commercially grown. Transplant Feb–Mar, harvest Apr–May. High market demand in off-season."
  ),

  // ── VEGETABLES – KHARIF-2 (MONSOON) ─────────────────────────────────────
  rule(
    "Pointed Gourd (Potol)",
    [4, 5, 6, 7, 8, 9],
    [
      ...RAJSHAHI_UPAZILAS,
      ...DHAKA_UPAZILAS,
      ...KHULNA_UPAZILAS,
      ...BARISAL_UPAZILAS,
    ],
    "Pointed gourd is a monsoon-season cucurbit. Vine planting Mar–Apr, harvest Jun–Sep. Rajshahi and Pabna are prime production areas."
  ),
  rule(
    "Bottle Gourd (Lau)",
    [4, 5, 6, 7, 8],
    ALL_UPAZILAS,
    "Bottle gourd thrives in warm humid conditions. Sown Apr–May, harvested Jul–Aug. One of the most widely grown homestead vegetables."
  ),
  rule(
    "Snake Gourd",
    [4, 5, 6, 7, 8, 9],
    [...DHAKA_UPAZILAS, ...CHITTAGONG_UPAZILAS, ...SYLHET_UPAZILAS],
    "Snake gourd requires high heat and humidity. Sown Apr–May, harvested Aug–Sep. Popular in Chittagong Hill Tracts and Sylhet regions."
  ),
  rule(
    "Okra (Dharosh)",
    [3, 4, 5, 6, 7, 8],
    ALL_UPAZILAS,
    "Okra is a warm-season vegetable with a long harvest window. Sown Mar–May, harvested Jun–Aug. Widely grown across all divisions."
  ),

  // ── FRUITS ───────────────────────────────────────────────────────────────
  rule(
    "Mango",
    [3, 4, 5],
    [...RAJSHAHI_UPAZILAS, ...RANGPUR_UPAZILAS, ...KHULNA_UPAZILAS],
    "Mango flowers Dec–Jan and fruits ripen Apr–Jun. Rajshahi (Chapai Nawabganj) is the mango capital of Bangladesh. Requires dry winter for good fruit set."
  ),
  rule(
    "Jackfruit",
    [4, 5, 6, 7],
    [
      ...MYMENSINGH_UPAZILAS,
      ...DHAKA_UPAZILAS,
      ...SYLHET_UPAZILAS,
      ...CHITTAGONG_UPAZILAS,
    ],
    "Jackfruit is Bangladesh's national fruit. Harvest mainly May–Jul. Mymensingh and Dhaka divisions have historically high production."
  ),
  rule(
    "Banana",
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    [...MYMENSINGH_UPAZILAS, ...DHAKA_UPAZILAS, ...SYLHET_UPAZILAS],
    "Banana is a year-round crop with peak planting Feb–Apr and harvest 10–12 months later. Mymensingh is the primary banana belt."
  ),
  rule(
    "Pineapple",
    [4, 5, 6, 7, 8],
    [...SYLHET_UPAZILAS, ...CHITTAGONG_UPAZILAS, ...MYMENSINGH_UPAZILAS],
    "Pineapple is harvested Apr–Aug. It requires acidic well-drained soil and high rainfall. Sylhet's Madhabkunda area is famous for pineapple cultivation."
  ),
  rule(
    "Litchi",
    [4, 5, 6],
    [...RAJSHAHI_UPAZILAS, ...DHAKA_UPAZILAS, ...MYMENSINGH_UPAZILAS],
    "Litchi matures May–Jun. It needs a short dry cool period to flower properly then high humidity for fruit development. Rajshahi is the prime area."
  ),
  rule(
    "Guava",
    [7, 8, 9, 10, 11],
    [
      ...DHAKA_UPAZILAS,
      ...BARISAL_UPAZILAS,
      ...KHULNA_UPAZILAS,
      ...RAJSHAHI_UPAZILAS,
    ],
    "Guava has two fruiting seasons; the main harvest is Aug–Nov. Barisal (Pirojpur) and Dhaka are the largest-producing regions."
  ),

  // ── CASH / INDUSTRIAL CROPS ───────────────────────────────────────────────
  rule(
    "Jute (Kenaph / Tossa)",
    [4, 5, 6, 7, 8, 9],
    [
      ...DHAKA_UPAZILAS,
      ...MYMENSINGH_UPAZILAS,
      ...RANGPUR_UPAZILAS,
      ...RAJSHAHI_UPAZILAS,
      ...KHULNA_UPAZILAS,
    ],
    "Jute is Bangladesh's 'golden fibre'. Sown Apr–May (Kharif-1), retted and harvested Aug–Sep. Requires high rainfall and warm temperatures."
  ),
  rule(
    "Sugarcane",
    [2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    [
      ...RAJSHAHI_UPAZILAS,
      ...RANGPUR_UPAZILAS,
      ...MYMENSINGH_UPAZILAS,
      ...DHAKA_UPAZILAS,
    ],
    "Sugarcane is planted Feb–Mar and harvested Nov–Jan of the following year. Rajshahi and Rangpur divisions lead production."
  ),
  rule(
    "Maize",
    [10, 11, 12, 1, 2, 3],
    [
      ...RANGPUR_UPAZILAS,
      ...RAJSHAHI_UPAZILAS,
      ...MYMENSINGH_UPAZILAS,
      ...CHITTAGONG_UPAZILAS,
    ],
    "Maize (Rabi) is planted Nov–Dec and harvested Mar–Apr. Rangpur division has seen rapid maize expansion over the past decade, largely for poultry feed."
  ),

  // ── SPICES ───────────────────────────────────────────────────────────────
  rule(
    "Chilli (Red Pepper)",
    [10, 11, 12, 1, 2, 3],
    [
      ...RAJSHAHI_UPAZILAS,
      ...BARISAL_UPAZILAS,
      ...MYMENSINGH_UPAZILAS,
      ...DHAKA_UPAZILAS,
    ],
    "Red chilli transplanting Oct–Nov, harvest Feb–Mar. Bogura and Faridpur are large chilli-growing areas. Dried chilli is a key export."
  ),
  rule(
    "Coriander",
    [10, 11, 12, 1],
    [...RAJSHAHI_UPAZILAS, ...DHAKA_UPAZILAS],
    "Coriander (dhania) is a cool-season spice herb. Sown Oct–Nov, harvested Dec–Jan. Rajshahi and Dhaka peri-urban areas have commercial production."
  ),
  rule(
    "Turmeric",
    [3, 4, 5, 6, 7, 8, 9],
    [
      ...MYMENSINGH_UPAZILAS,
      ...SYLHET_UPAZILAS,
      ...CHITTAGONG_UPAZILAS,
    ],
    "Turmeric is planted Mar–Apr and harvested Jan–Feb. It needs humid conditions and partial shade. Sylhet and Mymensingh are the primary zones."
  ),
  rule(
    "Ginger",
    [3, 4, 5, 6, 7, 8],
    [
      ...SYLHET_UPAZILAS,
      ...CHITTAGONG_UPAZILAS,
      ...MYMENSINGH_UPAZILAS,
    ],
    "Ginger rhizomes are planted Mar–Apr and harvested Oct–Nov. It thrives in humid, shaded hilly areas — Sylhet and the CHT are primary zones."
  ),
];

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------
async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB:", MONGODB_URI);

  // ── Index hygiene ─────────────────────────────────────────────────────────
  // Drop any stale compound parallel-array index (from a previous schema version)
  // before inserting; MongoDB rejects inserts if it can't sync those indexes.
  try {
    const col = mongoose.connection.db.collection("seasonalrules");
    const existing = await col.indexes();
    for (const idx of existing) {
      const keys = Object.keys(idx.key || {});
      if (
        idx.name !== "_id_" &&
        keys.includes("suitableMonths") &&
        keys.includes("supportedUpazilas")
      ) {
        await col.dropIndex(idx.name);
        console.log(`Dropped bad compound index: ${idx.name}`);
      }
    }
    // Create the two correct single-field indexes
    await col.createIndex({ suitableMonths: 1 }, { background: true });
    await col.createIndex({ supportedUpazilas: 1 }, { background: true });
    console.log("Indexes are correct.");
  } catch (idxErr) {
    console.warn("Index setup warning (non-fatal):", idxErr.message);
  }

  // Drop existing rules to avoid duplicates on re-run
  const deleted = await SeasonalRule.deleteMany({});
  console.log(`Cleared ${deleted.deletedCount} existing SeasonalRule documents.`);

  const inserted = await SeasonalRule.insertMany(RULES, { lean: true });
  console.log(`Inserted ${inserted.length} seasonal crop rules.`);

  await mongoose.disconnect();
  console.log("Done. Disconnected from MongoDB.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
