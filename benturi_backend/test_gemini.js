require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function run() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Hola");
    console.log(result.response.text());
  } catch (e) {
    console.error("1.5-flash failed:", e.message);
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent("Hola");
      console.log("2.0-flash worked!", result.response.text());
    } catch (e2) {
      console.error("2.0-flash failed:", e2.message);
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
        const result = await model.generateContent("Hola");
        console.log("1.0-pro worked!", result.response.text());
      } catch (e3) {
        console.error("1.0-pro failed:", e3.message);
      }
    }
  }
}
run();
