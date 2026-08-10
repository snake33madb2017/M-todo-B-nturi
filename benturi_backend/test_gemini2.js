require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function run() {
  const models = ["gemini-1.5-flash-latest", "gemini-pro"];
  for (const m of models) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: m });
      const result = await model.generateContent("Hola");
      console.log(m, "worked!", result.response.text());
    } catch (e) {
      console.error(m, "failed:", e.message);
    }
  }
}
run();
