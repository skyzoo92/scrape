const downloader = require('./api/downloader.js');
const searchApi = require('./api/search.js');
const stalk = require('./api/stalking.js');
const berita = require('./api/berita.js');
const converter = require('./lib/converter.js');
const webp2mp4 = require('./lib/webp2mp4.js')
const tools = require("./api/tools.js")
const ai = require("./api/ai.js")
const uploadImage = require("./lib/uploadImage.js")
const sticker = require("./lib/sticker.js")

const allFunctions = {
  ...downloader,
  ...searchApi,
  ...stalk,
  ...berita,
  ...converter,
  ...webp2mp4,
  ...tools,
  ...ai,
  ...uploadImage,
  ...sticker,
};

async function list() {
  const commandNames = Object.keys(allFunctions);
  let text = '📄 *Daftar Fitur Tersedia:*\n\n';
  commandNames.forEach((cmd, i) => {
    const formatted = cmd.charAt(0).toUpperCase() + cmd.slice(1);
    text += `${i + 1}. ${formatted}\n`;
  });
  return text;
}

module.exports = {
  ...allFunctions,
  list
}
