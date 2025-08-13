const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function ssweb(url = "", full = false, type = "desktop") {
  type = type.toLowerCase();
  if (!["desktop", "tablet", "phone"].includes(type)) type = "desktop";
  let form = new URLSearchParams();
  form.append("url", url);
  form.append("device", type);
  if (!!full) form.append("full", "on");
  form.append("cacheLimit", 0);
  let res = await axios({
    url: "https://www.screenshotmachine.com/capture.php",
    method: "post",
    data: form,
  });
  let cookies = res.headers["set-cookie"];
  let buffer = await axios({
    url: "https://www.screenshotmachine.com/" + res.data.link,
    headers: {
      cookie: cookies.join(""),
    },
    responseType: "arraybuffer",
  });
  return Buffer.from(buffer.data);
}

async function randomCerpen() {
  try {
    const url = 'https://cerpenmu.com/'; 
    const { data: html } = await axios.get(url);

    const $ = cheerio.load(html);

    const cerpenList = [];

    $('article.post').each((i, elem) => {
      const article = $(elem);

      const titleTag = article.find('h2 a');
      const title = titleTag.text().trim();
      const link = titleTag.attr('href');

      if (!title) return;

      const penulisTag = article.find('a[rel="tag"]').first();
      const penulis = penulisTag.text().trim();

      const rawInfo = article.text();
      const tanggalMatch = rawInfo.match(/Lolos Moderasi Pada:\s*(.*)/);
      const tanggal = tanggalMatch ? tanggalMatch[1].trim().split('\n')[0] : '';

      const deskripsi = article.find('blockquote').text().trim();

      const kategori = [];
      article.find('a[rel="category tag"]').each((i, el) => {
        kategori.push($(el).text().trim());
      });

      cerpenList.push({
        judul: title,
        penulis: penulis,
        tanggal: tanggal,
        deskripsi: deskripsi,
        link: link,
        kategori: kategori
      });
    });

    return {
    status: true,
    creator: "@kelvdra/scraper",
    cerpenList
    }
  } catch (error) {
    return {
    status: true,
    creator: "@kelvdra/scraper",
    message:  error.message
    }
  }
}

module.exports = {
        ssweb,
        randomCerpen
}
