const fetch = require('node-fetch');

async function testExecuteEndpoint() {
  try {
    const response = await fetch('http://localhost:5000/api/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        code: 'print("Hello World")', 
        language: 'python' 
      }),
    });

    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testExecuteEndpoint();
