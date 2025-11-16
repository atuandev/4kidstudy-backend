const { GoogleGenerativeAI } = require('@google/generative-ai');

// Lấy key từ biến môi trường
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('Lỗi: Biến môi trường GEMINI_API_KEY chưa được đặt.');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function testKey() {
  const modelName = 'gemini-1.5-flash-latest'; // Tên model chuẩn
  console.log(`Đang kiểm tra với API Key của bạn...`);
  console.log(`Model: ${modelName}`);

  try {
    // KHÔNG dùng 'v1beta', thư viện sẽ tự động dùng 'v1'
    const model = genAI.getGenerativeModel({ model: modelName });

    const prompt = 'Xin chào';
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('---');
    console.log('✅ KẾT NỐI THÀNH CÔNG!');
    console.log(`Phản hồi của AI: ${text}`);
  } catch (error) {
    console.error('---');
    console.error(`❌ THẤT BẠI:`, error);
  }
}

testKey();