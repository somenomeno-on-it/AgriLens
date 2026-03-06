const express = require("express");
const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("API is running");
});

const PORT = 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});