const https = require('https');

async function checkAPI() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.log('❌ GEMINI_API_KEY not found in environment');
    return;
  }

  console.log('Testing Gemini API with key:', apiKey.substring(0, 10) + '...\n');

  // Test 1: List models using v1 API
  console.log('1️⃣ Testing v1 API (stable):');
  await testAPI(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);

  // Test 2: List models using v1beta API
  console.log('\n2️⃣ Testing v1beta API:');
  await testAPI(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);

  // Test 3: Try generate content with v1 API
  console.log('\n3️⃣ Testing generateContent with v1 API:');
  await testGenerate('v1', apiKey);

  // Test 4: Try generate content with v1beta API
  console.log('\n4️⃣ Testing generateContent with v1beta API:');
  await testGenerate('v1beta', apiKey);
}

function testAPI(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const models = JSON.parse(data);
          console.log(`✅ Success! Found ${models.models?.length || 0} models:`);
          if (models.models) {
            models.models.slice(0, 5).forEach(m => {
              console.log(`   - ${m.name}`);
            });
            if (models.models.length > 5) {
              console.log(`   ... and ${models.models.length - 5} more`);
            }
          }
        } else {
          console.log(`❌ Failed with status ${res.statusCode}`);
          console.log(`   Response: ${data.substring(0, 200)}`);
        }
        resolve();
      });
    }).on('error', (err) => {
      console.log(`❌ Error: ${err.message}`);
      resolve();
    });
  });
}

function testGenerate(apiVersion, apiKey) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      contents: [{
        parts: [{
          text: 'Hello'
        }]
      }]
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/${apiVersion}/models/gemini-pro:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`✅ Success! Model 'gemini-pro' works with ${apiVersion}`);
        } else {
          console.log(`❌ Failed with status ${res.statusCode}`);
          const response = JSON.parse(data);
          console.log(`   Error: ${response.error?.message || data.substring(0, 150)}`);
        }
        resolve();
      });
    });

    req.on('error', (err) => {
      console.log(`❌ Error: ${err.message}`);
      resolve();
    });

    req.write(postData);
    req.end();
  });
}

checkAPI();
