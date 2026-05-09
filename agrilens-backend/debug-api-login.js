const fetch = require("node-fetch"); // or use global fetch if node >= 18

async function run() {
  try {
    const res = await fetch("http://localhost:3001/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "dhrubo@gmail.com", password: "password123" }),
    });

    const text = await res.text();
    console.log("STATUS:", res.status);
    console.log("BODY:", text);
    process.exit(0);
  } catch (err) {
    console.error("ERROR:", err);
    process.exit(1);
  }
}
run();
