/**
 * Seasonal Crop Recommendation Engine
 *
 * Algorithm
 * ---------
 * 1. Find the farm specified by farmId and resolve its upazila.
 * 2. Get the current month (1-based, server time in BD: UTC+6).
 * 3. Query SeasonalRule for documents where
 *      suitableMonths contains currentMonth
 *      AND supportedUpazilas contains farm.location.upazila
 * 4. Rank by "month centrality" – crops whose season mid-point is
 *    closest to the current month are ranked higher (already in-season).
 * 5. Return top-N results with cropName + rationale.
 */

const Farm = require("../models/Farm");
const SeasonalRule = require("../models/SeasonalRule");

const TOP_N = 5;

/**
 * Distance (in months, wrapping around the year) from the current month to
 * the centre of a crop's season. Lower = more "in the heart of the season".
 */
function seasonCentralityScore(suitableMonths, currentMonth) {
  // midpoint of the season (wrap-safe)
  // Build a circular average of month angles
  const toRad = (m) => ((m - 1) / 12) * 2 * Math.PI;
  const sinSum = suitableMonths.reduce((s, m) => s + Math.sin(toRad(m)), 0);
  const cosSum = suitableMonths.reduce((s, m) => s + Math.cos(toRad(m)), 0);
  const midAngle = Math.atan2(sinSum, cosSum);

  const curAngle = toRad(currentMonth);
  const diff = Math.abs(
    ((midAngle - curAngle + 3 * Math.PI) % (2 * Math.PI)) - Math.PI
  );
  // diff is in [0, π]; smaller = closer to the centre of the season
  return diff; // lower is better
}

/**
 * getRecommendations
 * @param {string} farmId - MongoDB ObjectId string
 * @returns {Array<{cropName, rationale, rank}>}  top-N recommendations
 */
async function getRecommendations(farmId) {
  // 1. Resolve farm + upazila
  const farm = await Farm.findById(farmId).lean();
  if (!farm) {
    const err = new Error("Farm not found");
    err.status = 404;
    throw err;
  }

  const upazila = farm.location?.upazila;
  if (!upazila) {
    const err = new Error("Farm has no upazila set");
    err.status = 400;
    throw err;
  }

  // 2. Current month (Bangladesh time = UTC+6)
  const nowBD = new Date(Date.now() + 6 * 60 * 60 * 1000);
  const currentMonth = nowBD.getUTCMonth() + 1; // 1–12

  // 3. Query matching rules — use case-insensitive regex so "savar"
  //    matches seeded "Savar" regardless of how the farm was saved.
  const upazilaRegex = new RegExp(`^${upazila.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
  const matchingRules = await SeasonalRule.find({
    suitableMonths: currentMonth,
    supportedUpazilas: upazilaRegex,
  }).lean();

  // 4. Rank by centrality score (ascending = closer to peak season)
  const ranked = matchingRules
    .map((r) => ({
      cropName: r.cropName,
      rationale: r.rationale,
      _score: seasonCentralityScore(r.suitableMonths, currentMonth),
    }))
    .sort((a, b) => a._score - b._score)
    .slice(0, TOP_N)
    .map((r, idx) => ({
      rank: idx + 1,
      cropName: r.cropName,
      rationale: r.rationale,
    }));

  return {
    farmId,
    upazila,
    currentMonth,
    recommendations: ranked,
  };
}

module.exports = { getRecommendations };
