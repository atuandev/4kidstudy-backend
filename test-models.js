const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  // Try different model names
  const modelsToTest = [
    'gemini-pro',
    'gemini-1.5-pro',
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-1.5-pro-latest',
    'gemini-1.0-pro',
    'gemini-1.0-flash',
    'gemini-1.0',
    'gemini-1.5',
  ];

  console.log('Testing models with your API key:\n');
  
  for (const modelName of modelsToTest) {
    try {
      console.log(`Testing: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Hello');
      const response = await result.response;
      console.log(`✅ ${modelName} - WORKS`);
      console.log(`   Response: ${response.text().substring(0, 50)}...\n`);
    } catch (error) {
      console.log(`❌ ${modelName} - FAILED`);
      console.log(`   Error: ${error.message}\n`);
    }
  }
}

listModels();
