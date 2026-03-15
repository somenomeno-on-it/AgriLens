const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const farmerRoutes = require("./routes/farmer");
const produceRouter = require("./routes/produceRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API is running");
});

app.use("/api/farmer", farmerRoutes);
app.use("/api/produce", produceRouter);

const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/agrilens";

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
  });