const fetch = require('node-fetch')
const FormData = require('form-data')
const { fileTypeFromBuffer } = require('file-type')

async function catbox(buffer) {
    const { ext, mime } = (await fileTypeFromBuffer(buffer)) || { ext: 'bin', mime: 'application/octet-stream' };
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', buffer, { filename: `file.${ext}`, contentType: mime });

    const res = await fetch('https://catbox.moe/user/api.php', { method: 'POST', body: form });
    if (!res.ok) throw new Error();
    return await res.text();
}

const top4top = async (buff) => {
    try {
    const origin = 'https://top4top.io'
    const f = await fileTypeFromBuffer(buff)
    if (!f) throw Error (`gagal mendapatkan extensi file/buffer`)

    const data = new FormData();
    const file = new File([buff], Date.now() + '.' + f.ext,)
    data.append('file_1_', file);
    data.append('submitr', '[ رفع الملفات ]');

    const options = {
        method: 'POST',
        body: data
    };

    console.log('uploading file.. ' + file.name)
    const r = await fetch(origin + '/index.php', options)
    if(!r.ok) throw Error (`${r.status} ${r.statusText}\n${await r.text()}`)
    const html = await r.text()
    const matches = html.matchAll(/<input readonly="readonly" class="all_boxes" onclick="this.select\(\);" type="text" value="(.+?)" \/>/g)
    const arr = Array.from(matches)
    if (!arr.length) throw Error(`gagal mengupload file`)
    const downloadUrl = arr.map(v => v[1]).find(v => v.endsWith(f.ext))
    const deleteUrl = arr.map(v => v[1]).find(v => v.endsWith('html'))
    const qrcodeUrl = origin + '/' + html.match(/<div class="qr_img"><img src="(.+?)"/)?.[1]
    const result = {
        creator: "@kelvdra/scraper",
        status: true,
        downloadUrl,
        deleteUrl,
        qrcodeUrl
    }
    return result
    } catch (error) {
    return { 
    status: false,
    creator: "@kelvdra/scraper",
    message: error.message
     }
}

module.exports = { 
    catbox,
    top4top
   }
