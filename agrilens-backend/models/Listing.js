const mongoose = require("mongoose");
const Produce = require("./Produce");

// Reuse existing produce schema/collection while exposing the Sprint-3 Listing model name.
module.exports =
  mongoose.models.Listing || mongoose.model("Listing", Produce.schema, "produces");
