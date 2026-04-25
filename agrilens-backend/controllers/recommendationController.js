const { getRecommendations } = require("../services/recommendationService");

/**
 * GET /api/recommendations?farmId=<id>
 *
 * Returns top-5 seasonal crop recommendations for the given farm,
 * matched by current calendar month + farm upazila.
 */
async function getSeasonalRecommendations(req, res) {
  const { farmId } = req.query;

  if (!farmId) {
    return res
      .status(400)
      .json({ message: "farmId query parameter is required" });
  }

  try {
    const result = await getRecommendations(farmId);
    return res.json(result);
  } catch (err) {
    const status = err.status || 500;
    return res
      .status(status)
      .json({ message: err.message || "Failed to fetch recommendations" });
  }
}

module.exports = { getSeasonalRecommendations };
