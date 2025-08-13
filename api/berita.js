const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeDetik() {
  try {
    const url = 'https://www.detik.com/terpopuler';
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });

    const html = response.data;
    const $ = cheerio.load(html);

    const links = [];

    $('.media__title a').each((i, elem) => {
      const href = $(elem).attr('href');
      const text = $(elem).text().trim();
      if (href && text) {
        links.push({
          text,
          href
        });
      }
    });

    return { 
    status: true,
    creator: "@kelvdra/scraper",
    links
    }

  } catch (error) {
    return { 
    status: false,
    creator: "@kelvdra/scraper",
    message: error.message
     }
  }
}

async function scrapeDetikDetail(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });

    const html = response.data;
    const $ = cheerio.load(html);

    const title = $('h1.detail__title').text().trim();
    const body = [];
    $('.detail__body-text p').each((i, el) => {
      body.push($(el).text().trim());
    });
    const date = $('.detail__date').text().trim();
    const author = $('.author').text().trim() || 'Unknown';

    return {
      status: true,
      creator: "@kelvdra/scraper",
      title,
      date,
      author,
      body: body.join('\n\n')
    };

  } catch (err) {
    return {
      status: false,
      creator: "@kelvdra/scraper",
      message: err.message
    };
  }
}

module.exports = {
     scrapeDetik,
     scrapeDetikDetail
}
