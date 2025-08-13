<h1 align="center">🚀 Simpel Scrape By Kelvdra</h1>

<p align="center">
  <strong>🔗 Powerful, Sleek, and Simple Media Downloader API by Kelvdra</strong><br>
  ✨ Auto-updating system on error fixes — stay tuned for the latest features!
</p>

<p align="center">
  <img src="https://files.catbox.moe/gxgtrz.jpg" alt="Banner" width="70%">
</p>

---

## ⚙️ Installation

Install via npm:

```bash
npm install @kelvdra/scraper
```

Import in your project:

```javascript
const { ytmp3, ytmp4, search, ttdl, playmp3, playmp4, pindl } = require('@kelvdra/scraper');
or 
const { list } = require("@kelvdra/scraper")
to show all features
```

---

## 📦 Available Qualities

```javascript
const audio = [mp3, opus, m4a, webm];
const video = [360, 480 720, 1080];
```

---

## 📁 Features & Usage

### 🎧 YouTube Audio Downloader

```javascript
ytmp3('https://youtu.be/VIDEO_ID', 'mp3').then(console.log);
```

> Default quality: `mp3`

---

### 📹 YouTube Video Downloader

```javascript
ytmp4('https://youtu.be/VIDEO_ID', '360').then(console.log);
```

> Available quality: `360p` - `1080p`

---

### 🔍 YouTube Search

```javascript
search('lofi chill mix').then(console.log);
```

> Returns rich metadata and video suggestions.

---

### 🎵 PlayMP3 & PlayMP4

```javascript
playmp3('lagu galau').then(console.log);
playmp4('video lucu').then(console.log);
```

---

### 📲 TikTok Downloader

```javascript
ttdl('https://www.tiktok.com/@username/video/1234567890').then(console.log);
```

> Outputs video, audio, and thumbnail URLs.

---

### 📌 Pinterest Media Downloader

```javascript
pindl('https://pin.it/63p8EvKYl').then(console.log);
```

> Supports both images and videos.

---

## 🧠 Documentation

📚 Full docs: [kelvdra scraper docs](https://skyzoo92.github.io/Scraper/)

---

## 🤝 Stay Connected

- 📡 Channel: [Join Kelvdra System](https://whatsapp.com/channel/0029VadrgqYKbYMHyMERXt0e)  
- 📞 Contact: [WhatsApp Admin](https://wa.me/6285173328399)

---

## 🧑‍💻 Author & License

**Kelvdra**  
📜 License: [MIT](./LICENSE)

---

<p align="center">
  <em>Powered by <strong>Kelvdra System</strong> • Fast ⚡ Simple ⚙️ Efficient 🧠</em>
</p>
