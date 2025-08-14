const fetch = require('node-fetch');

async function askAI(question, model = 'llama-3.3', systemPrompt = null) {
  const url = 'https://ai-interface.anisaofc.my.id/api/chat';

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        question,
        model,
        system_prompt: systemPrompt
      })
    });

    if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
    const data = await res.json();

    return {
     status: true,
     creator: "@kelvdra/scraper",
     results: data.response
     }
  } catch (err) {
    return {
    status: false,
    creator: "@kelvdra/scraper",
    result: err
    }
  }
}

module.exports = { 
    askAI
 }
