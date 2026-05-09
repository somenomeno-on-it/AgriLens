require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const AuthUser = require("./models/AuthUser");

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  try {
    const email = "dhrubo@gmail.com";
    const passwordHash = await bcrypt.hash("password123", 10);
    
    const result = await AuthUser.updateOne(
      { email },
      { $set: { passwordHash } }
    );
    
    console.log(`Updated password for ${email} to 'password123'. Modified: ${result.modifiedCount}`);
    process.exit(0);
  } catch (err) {
    console.error("ERROR:", err);
    process.exit(1);
  }
});
