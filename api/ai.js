const fetch = require('node-fetch');

 async function askAI(question, model = 'llama-3.3', systemPrompt = null) {
  try {
    const res = await fetch("https://ai-interface.anisaofc.my.id/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        question,
        model,
        system_prompt: systemPrompt
      })
    });

    const data = await res.json();
    return {
      status: true,
      creator: "@kelvdra/scraper",
      results: data?.response || null
    };
  } catch (err) {
    return {
      status: false,
      creator: "@kelvdra/scraper",
      results: err.message
    };
  }
}

module.exports = { 
    askAI
 }
