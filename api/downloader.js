const axios = require('axios');
const yts = require('yt-search');
const { createDecipheriv } = require('crypto');
const cheerio = require('cheerio');
const formData = require('form-data');
const { lookup } = require('mime-types');
const qs = require('qs');

async function Tiktok(url) {
  try {
    const postData = qs.stringify({
      url: url,
      count: 12,
      cursor: 0,
      web: 1,
      hd: 1
    });

    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Accept': 'application/json, text/javascript, */*; q=0.01',
      'X-Requested-With': 'XMLHttpRequest'
    };

    const res = await axios.post('https://www.tikwm.com/api/', postData, { headers });
    const data = res.data.data;

    const videoId = data.id;

    const isSlide = Array.isArray(data.images) && data.images.length > 0;

    const result = {
      status: true,
      creator: '@kelvdra/scraper',
      result: {    
        title: data.title,
        taken_at: formatDate(data.create_time),
        region: data.region,
        id: videoId,
        durations: data.duration || 0,
        duration: (data.duration ? `${data.duration} Seconds` : 'Photo Slide'),
        cover: `https://www.tikwm.com/video/cover/${videoId}.webp`,
        size_nowm: data.size || 0,
        size_nowm_hd: data.hd_size || 0,
        data: isSlide
          ? data.images.map((url, i) => ({
              type: `slide_${i + 1}`,
              url: url
            }))
          : [
              {
                type: "nowatermark",
                url: `https://www.tikwm.com/video/media/play/${videoId}.mp4`
              },
              {
                type: "nowatermark_hd",
                url: `https://www.tikwm.com/video/media/hdplay/${videoId}.mp4`
              }
            ],
        music_info: {
          id: data.music_info?.id || "",
          title: data.music_info?.title || "-",
          author: data.music_info?.author || "-",
          album: data.music_info?.album || "Unknown",
          url: `https://www.tikwm.com/video/music/${videoId}.mp3`
        },
        stats: {
          views: formatNumber(data.play_count),
          likes: formatNumber(data.digg_count),
          comment: formatNumber(data.comment_count),
          share: formatNumber(data.share_count),
          download: formatNumber(data.download_count)
        },
        author: {
          id: data.author?.id || "",
          fullname: data.author?.nickname || "",
          nickname: data.author?.unique_id || "",
          avatar: `https://www.tikwm.com/video/avatar/${videoId}.jpeg`
        }
      }
    };

    return result
  } catch (err) {
    return { status: false, message: err.message };
  }
}

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(2) + ' jt';
  if (num >= 1000) return (num / 1000).toFixed(2) + ' rb';
  return num.toString();
}

function formatDate(timestamp) {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

/**
 * @param {string} url - URL YouTube
 * @param {string} quality - Bisa resolusi (360, 480, 720, 1080) atau bitrate (mp3, opus, m4a, webm)
 */
// --- OceanSaver
const SUPPORTED_AUDIO_FORMATS = ['mp3', 'm4a', 'opus', 'webm'];
const SUPPORTED_VIDEO_QUALITIES = ['144', '240', '360', '480', '720', '1080'];

const ytdl = {
  request: async (url, formatOrQuality) => {
    try {
      const encodedUrl = encodeURIComponent(url);
      const isAudio = SUPPORTED_AUDIO_FORMATS.includes(formatOrQuality.toLowerCase());
      const isVideo = SUPPORTED_VIDEO_QUALITIES.includes(formatOrQuality);

      if (!isAudio && !isVideo) {
        return {
          status: false,
          message: `Format/quality tidak valid. Format audio yang didukung: ${SUPPORTED_AUDIO_FORMATS.join(", ")}, resolusi video: ${SUPPORTED_VIDEO_QUALITIES.join(", ")}`
        };
      }

      const type = isAudio ? 'audio' : 'video';
      const formatParam = formatOrQuality;

      const { data } = await axios.get(
        `https://p.oceansaver.in/ajax/download.php?format=${formatParam}&url=${encodedUrl}`
      );

      if (!data.success || !data.id) {
        return { status: false, message: 'Gagal mendapatkan task ID dari oceansaver.' };
      }

      return {
        status: true,
        taskId: data.id,
        type,
        quality: isAudio ? formatParam : `${formatParam}p`
      };

    } catch (error) {
      return { status: false, message: `Request error: ${error.message}` };
    }
  },

  convert: async (taskId) => {
    try {
      const { data } = await axios.get(
        `https://p.oceansaver.in/api/progress?id=${taskId}`
      );
      return data;
    } catch (error) {
      return { success: false, message: `Convert error: ${error.message}` };
    }
  },

  repeatRequest: async (taskId, type, quality) => {
    for (let i = 0; i < 20; i++) {
      const response = await ytdl.convert(taskId);
      if (response && response.download_url) {
        return {
          status: true,
          type,
          quality,
          url: response.download_url
        };
      }
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    return { status: false, message: 'Timeout menunggu link download.' };
  },

  // Fungsi utama untuk dipanggil
  download: async (url, formatOrQuality) => {
    const init = await ytdl.request(url, formatOrQuality);
    if (!init.status) return init;

    return await ytdl.repeatRequest(init.taskId, init.type, init.quality);
  }
};

// Y2mate
const y2mate = {
    headers: {
        "Referer": "https://y2mate.nu/",
        "Origin": "https://y2mate.nu/",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0"
    },

    hit: async (url, description, returnType = "text") => {
        try {
            const listReturnType = ["text", "json"]
            if (!listReturnType.includes(returnType)) throw Error(`return type ${returnType} is invalid. `)
            let result
            const response = await fetch(url, {
                headers: y2mate.headers,
            })
            const data = await response.text()
            result = data
            if(!response.ok) throw Error(`${response.status} ${response.statusText}\n${data.split("\n").slice(0,4).join("\n") + "\n...." || null}`)

            try {
                if (returnType == listReturnType[1]) {
                    result = JSON.parse(data)
                }
            } catch (error) {
                throw Error(`gagal mengubah return type menjadi ${returnType}. ${error.message}`)
            }
            return {result, response}
        } catch (error) {
            throw Error("hit gagal pada " + description
                + "\n" + error.message
            )
        }
    },

    getAuthCode: async () => {
        console.log("[y2mate] downloading homepage")
        
        const {result: html, response} = await y2mate.hit("https://y2mate.nu","hit homepage y2mate")
        const valueOnHtml = html.match(/<script>(.*?)<\/script>/)?.[1]
        if (!valueOnHtml) throw Error(`gagal mendapatkan match regex untuk code value di html`)

        try {
            eval(valueOnHtml)
        } catch (error) {
            throw Error(`eval lu gagal bos di yang eval valueOnHtml\n${error.message}`)
        }

        const srcPath = html.match(/src="(.*?)"/)?.[1]
        if (!srcPath) throw Error(`gagal mendapatkan srcPath untuk download file javascript`)

        const url = new URL(response.url).origin + srcPath

        console.log("[y2mate] downloading js file")
        const {result : jsCode} = await y2mate.hit(url, "download js file y2mate")
        const authCode = jsCode.match(/authorization\(\){(.*?)}function/)?.[1]
        if (!authCode) throw Error(`gagal mendapatkan match regex untuk auth function code`)

        const newAuthCode = authCode.replace("id(\"y2mate\").src", `"${url}"`)

        let authString
        try {
            authString = eval(`(()=>{${newAuthCode}})()`)
        } catch (error) {
            throw Error(`eval lu gagal bos pas nyoba buat dapetin authString\n${error.message}`)
        }

        return authString
    },

    getYoutubeId: async (youtubeUrl) => {
        // capek gw regek jir wkwk bomat lah fetch head saja >:v
        console.log("[youtube.com] get video id from your youtube url")
        const headers = {
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0"
        }
        const resp = await fetch(youtubeUrl, {
            "method": "HEAD",
            headers
        })
        if (!resp.ok) throw Error(`gagal mendapatkan id video ${resp.status} ${resp.statusText}`)
        let videoId
        videoId = new URL(resp.url)?.searchParams?.get("v")
        // maybe short youtube
        if (!videoId) {
            videoId = resp.url.match(/https:\/\/www.youtube.com\/shorts\/(.*?)(?:\?|$)/)?.[1]
            if (!videoId) throw Error(`bruh lu kirim link apa tuh bro`)
        }
        return { videoId, url : resp.url }
    },

    download: async (youtubeUrl, format="mp3") => {
    
        const validFormats = ["mp3","mp4"]
        if(!validFormats.includes(format)) throw Error (`${format} is invalid format. available format ${validFormats.join(", ")}`)
        
        const delay = async (ms) => new Promise(r => setTimeout(r,ms))
   
        const { videoId, url } = await y2mate.getYoutubeId(youtubeUrl)
        
        const authCode = await y2mate.getAuthCode()

        console.log("[y2mate] hit init api")
        const url1 = `https://d.ecoe.cc/api/v1/init?a=${authCode}&_=${Math.random()}`
        const {result: resultInit} = await y2mate.hit(url1, "init api", "json")
        if (resultInit.error != "0") throw Error (`ada error di init api. proses di hentikan\n${resultInit}`)

        console.log("[y2mate] hit convert url")
        const url2 = new URL (resultInit.convertURL)
        url2.searchParams.append("v",videoId)
        url2.searchParams.append("f", format)
        url2.searchParams.append("_", Math.random())
        const {result : resultConvert} = await y2mate.hit(url2, "hit convert", "json")
        let { downloadURL, progressURL, redirectURL, error: errorFromConvertUrl } = resultConvert
        if (errorFromConvertUrl) throw Error(`there was error found after fetch convertURL probably bad youtube video id`)

        if (redirectURL) {
            ({ downloadURL, progressURL } = (await y2mate.hit(redirectURL, "fetch redirectURL","json")).result)
            console.log(`[y2mate] got directed`)
        }

        let { error, progress, title } = {}
        while (progress != 3) {
        
            const api3 = new URL(progressURL)
            api3.searchParams.append("_", Math.random());

            ({ error, progress, title } = (await y2mate.hit(api3, "cek progressURL", "json")).result)

            let status = progress == 3 ? "UwU sukses 🎉" :
                progress == 2 ? "(👉ﾟヮﾟ)👉 poke server" :
                    progress == 1 ? "(👉ﾟヮﾟ)👉 poke server" :
                        progress == 0 ? "(👉ﾟヮﾟ)👉 poke server" : "❌ tetot"

            console.log(status)

            if (error) throw Error(`there was an error value while doing loop check. the error code is ${error}. probably the video is too looong. or not compatible or > 45 mins`)
            if (progress != 3) await delay(5000)
        }

        const result = { title, downloadURL, url }
        return result
    },

    
}

const ytmp3v2 = async (link, format = "mp3") => {
  try {
    const info = await yts(link);
    const result = await y2mate.download(link, format);
    return {
      status: true,
      creator: '@kelvdra/scraper',
      metadata: info.all[0],
      download: result
    };
  } catch (e) {
    return { status: false, message: e.message };
  }
};

const ytmp3 = async (link, quality = "mp3") => {
  try {
    const info = await yts(link);
    const result = await ytdl.download(link, quality);
    return {
      status: true,
      creator: '@kelvdra/scraper',
      metadata: info.all[0],
      download: result
    };
  } catch (e) {
    return { status: false, message: e.message };
  }
};

const ytmp4v2 = async (link, quality = "mp4") => {
  if (!link.includes('youtube.com') && !link.includes('youtu.be')) {
    return { status: false, message: 'URL YouTube tidak valid' };
  }

  try {
    const info = await yts(link);
    const data = await y2mate.download(link, quality);

    return {
      status: true,
      creator: '@kelvdra/scraper',
      metadata: info.all[0],
      download: data
    };
  } catch (e) {
    return { status: false, message: e.message };
  }
};

const ytmp4 = async (link, quality = "360") => {
  if (!link.includes('youtube.com') && !link.includes('youtu.be')) {
    return { status: false, message: 'URL YouTube tidak valid' };
  }

  try {
    const info = await yts(link);
    const data = await ytdl.download(link, quality);

    return {
      status: true,
      creator: '@kelvdra/scraper',
      metadata: info.all[0],
      download: data
    };
  } catch (e) {
    return { status: false, message: e.message };
  }
};

const transcript = async (url) => {
  try {
    let res = await axios.get('https://yts.kooska.xyz/', {
      params: { url: url },
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36',
        'Referer': 'https://kooska.xyz/'
      }
    }).then(i=>i.data)
    return {
      status: true,
      creator: "@kelvdra/scraper",
      video_id: res.video_id,
      summarize: res.ai_response,
      transcript: res.transcript
    }
  } catch(e) {
    return {
      status: false,
      msg: `Gagal mendapatkan respon, dengan pesan: ${e.message}`
    }
  }
}

const playmp3 = async (query, quality = "mp3") => {
  try {
    const searchResult = await search(query);
    if (!searchResult.status || !searchResult.results.length)
      return { status: false, message: 'Video tidak ditemukan' };

    const results = [];
    for (let video of searchResult.results.slice(0, 5)) {
      const downloadInfo = await ytdl.download(video.url, quality)
      results.push({
        title: video.title,
        author: video.author.name,
        duration: video.timestamp,
        url: video.url,
        thumbnail: video.thumbnail,
        download: downloadInfo
      });
    }

    return {
      status: true,
      creator: '@kelvdra/scraper',
      type: 'audio',
      results
    };
  } catch (err) {
    return { status: false, message: err.message };
  }
};

const playmp4 = async (query, quality = "360") => {
  try {
    const searchResult = await search(query);
    if (!searchResult.status || !searchResult.results.length)
      return { status: false, message: 'Video tidak ditemukan' };

    const results = [];
    for (let video of searchResult.results.slice(0, 5)) {
      const downloadInfo = await ytdl.download(video.url, quality);
      results.push({
        title: video.title,
        author: video.author.name,
        duration: video.timestamp,
        url: video.url,
        thumbnail: video.thumbnail,
        download: downloadInfo
      });
    }

    return {
      status: true,
      creator: '@kelvdra/scraper',
      type: 'video',
      results
    };
  } catch (err) {
    return { status: false, message: err.message };
  }
};

const pindl = async (url) => {
    try {
        let a = await axios.get(url, {
            headers: {
                'User-Agent': "Mozilla/5.0 (Linux; Android 12; SAMSUNG SM-S908B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/17.0 Chrome/96.0.4664.104 Mobile Safari/537.36",
                'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
            }
        });

        let $ = cheerio.load(a.data);
        let x = $('script[data-test-id="leaf-snippet"]').text();
        let y = $('script[data-test-id="video-snippet"]').text();

        let g = {
            status: true,
            creator: "@kelvdra/scraper",
            isVideo: !!y,
            info: JSON.parse(x),
            image: JSON.parse(x).image,
            video: y ? JSON.parse(y).contentUrl : ''
        };

        return g;
    } catch (e) {
        return {
            status: false,
            mess: "failed download"
        };
    }
};

const igdl = async (url) => {
    try {
        let result = {
            status: true,
            creator: "@kelvdra/scraper",
            media: []
        }
        const {
            data
        } = await axios(`https://www.y2mate.com/mates/analyzeV2/ajax`, {
            method: "post",
            data: {
                k_query: url,
                k_page: "Instagram",
                hl: "id",
                q_auto: 0
            },
            headers: {
                "content-type": "application/x-www-form-urlencoded",
                "user-agent": "PostmanRuntime/7.32.2"
            }
        })
        await data.links.video.map((video) => result.media.push(video.url))
        return result
    } catch (err) {
        const result = {
            status: false,
            message: `Media not found`
        }
        return result
    }
}

const mfdl = async (url) => {
  try {
    const res = await fetch(`https://rianofc-bypass.hf.space/scrape?url=${encodeURIComponent(url)}`);
    const html = await res.json();
    const $ = cheerio.load(html.html);

    const result = {
      filename: $('.dl-info').find('.intro .filename').text().trim(),
      type: $('.dl-btn-label').find('.filetype > span').text().trim(),
      size: $('.details li:contains("File size:") span').text().trim(),
      uploaded: $('.details li:contains("Uploaded:") span').text().trim(),
      ext: /\.(.*?)/.exec($('.dl-info').find('.filetype > span').eq(1).text())?.[1]?.trim() || 'bin',
      download: $('.input').attr('href')
    };
    result.mimetype = lookup(result.ext.toLowerCase()) || 'application/octet-stream';

    return {
      status: true,
      creator: '@kelvdra/scraper',
      result
    };
  } catch (err) {
    return {
      status: false,
      message: err.message
    };
  }
}

const fbPhoto = async (url) => {
   try {
    async function getNonce() {
      const { data: nonce } = await axios.get(
        'https://thefdownloader.com/facebook-photo-downloader/',
      )
      const _ = cheerio.load(nonce)
      const skripKontent = _('#hmd-facebook-downloader-js-extra').html()
      const match = /"nonce":"([a-zA-Z0-9]+)"/.exec(skripKontent)
      return match?.[1]
    }
    const nonce = await getNonce()
    const base = {
      url: {
        admin: 'https://thefdownloader.com/wp-admin/admin-ajax.php',
      },
    }
    let data = new FormData()
    data.append('action', 'facebook_photo_action')
    data.append('facebook', `facebook_photo_url=${url}`)
    data.append('nonce', nonce)

    let response = await axios.post(base.url.admin, data, {
      headers: {
        ...data.getHeaders(),
      },
    })

    let $ = cheerio.load(response.data)
    let imageUrl = $('.facebook__media img').attr('src')

    return {
      status: true,
      creator: "@kelvdra/scraper",
      imageUrl
    }
    } catch (err) {
    return {
      status: false,
      message: err.message
    };
  }
 }

const fbVideo = async (u) => {
  try {
    if (!/^https?:\/\/(www\.)?facebook\.com/.test(u)) {
      throw new Error('Invalid Facebook URL');
    }

    function generatePayload(y) {
      return { id: y, locale: 'id' };
    }

    const pylox = generatePayload(u);
    const { data } = await axios.post('https://getmyfb.com/process', pylox);
    const $ = cheerio.load(data);

    const downloadLinks = [];

    const items = $('.results-list-item');
    if (!items.length) {
      throw new Error('No download links found. The video might be private or unavailable.');
    }

    items.each((_, el) => {
      const quality = $(el).text().trim();
      const link = $(el).find('a').attr('href');
      const filename = $(el).find('a').attr('download');

      if (link) {
        downloadLinks.push({ quality, link, ...(filename && { filename }) });
      }
    });

    return {
    status: true,
    creator: "@kelvdra/scraper",
    downloadLinks
   }
  } catch (err) {
    return {
      status: false,
      message: err.message
    };
  }
};

const ttdl = async (tiktokUrl) => {
  try {
  const hydra = await Tiktok(tiktokUrl)
  const payload = new URLSearchParams();
  payload.append('q', tiktokUrl);
  payload.append('lang', 'en');
  payload.append('cftoken', '');

  const res = await axios.post(
    'https://savetik.co/api/ajaxSearch',
    payload.toString(),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
      },
    }
  );

  const data = res.data.data;
  const $ = cheerio.load(data);

  const title = $('.content h3').text().trim();
  const thumbnail = $('.thumbnail img').attr('src') || null;

  const videoDownloads = [];
  $('.dl-action a').each((i, el) => {
    const type = $(el).text().trim().toLowerCase();
    const url = $(el).attr('href');
    if (url && url.startsWith('http')) {
      videoDownloads.push({ type, url });
    }
  });

  const photos = [];
  $('.photo-list .download-box li').each((i, el) => {
    const img = $(el).find('img').attr('src');
    const url = $(el).find('a').attr('href');
    if (img && url) {
      photos.push({ preview: img, url });
    }
  });

  return {
    status: true,
    creator: "@kelvdra/scraper",
    title,
    taken_at: hydra.result.taken_at,
    region: hydra.result.region,
    id: hydra.result.id,
    durations: hydra.result.durations || 0,
    duration: hydra.result.duration,
    cover: hydra.result.cover,
    thumbnail,
    video: videoDownloads,
    photos,
    music_info: hydra.result.music_info,
    stats: hydra.result.stats,
    author: hydra.result.author
     };
    } catch (err) {
    return {
      status: false,
      message: err.message
    };
  }
}

module.exports = {
  ttdl,
  playmp3,
  playmp4,
  ytmp3v2,
  ytmp4v2,
  ytmp3,
  ytmp4,
  transcript,
  pindl,
  igdl,
  mfdl,
  fbPhoto,
  fbVideo
};
