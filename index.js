const TOKEN_REFRESH_BEFORE_EXPIRY = 3 * 60;
let tokenInfo = {
    endpoint: null,
    token: null,
    expiredAt: null
};

// HTML 页面模板
const HTML_PAGE = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>SUN MAY · 配音节点</title>
  <style>
    :root { color-scheme: light; font-family: system-ui, "Myanmar Text", sans-serif; color: #172c28; background: #f3f6f2; }
    * { box-sizing: border-box; }
    body { margin: 0; }
    main { max-width: 880px; margin: auto; padding: 40px 20px; }
    header { margin-bottom: 28px; }
    h1 { font-size: 30px; margin: 6px 0 12px; }
    h2 { font-size: 20px; margin: 0 0 16px; }
    p { line-height: 1.7; }
    .eyebrow { color: #436d50; font-weight: 700; font-size: 13px; letter-spacing: .1em; }
    .hint, small { color: #52675f; font-size: 14px; }
    .card { background: white; border: 1px solid #dbe5dc; border-radius: 16px; padding: 24px; margin-bottom: 20px; }
    label { display: block; font-weight: 600; margin: 0 0 8px; }
    textarea, select, input { width: 100%; border: 1px solid #b8ccbe; border-radius: 8px; background: white; padding: 12px; font: inherit; color: inherit; }
    textarea { min-height: 180px; resize: vertical; line-height: 1.7; }
    :focus-visible { outline: 3px solid #80ba98; outline-offset: 3px; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 20px 0; }
    button, .download { border: 1px solid #bdcfc1; background: #f6f9f5; color: #193e2a; border-radius: 8px; padding: 10px 16px; font: inherit; cursor: pointer; text-decoration: none; display: inline-block; }
    button:hover, .download:hover { background: #e7f0e6; }
    button:disabled { opacity: .6; cursor: wait; }
    .primary { background: #245a3c; color: white; width: 100%; border: 0; padding: 14px; font-weight: 700; margin-top: 20px; }
    .primary:hover { background: #19492f; }
    audio { width: 100%; margin: 12px 0; }
    #status { min-height: 24px; margin-bottom: 0; }
    #status[data-error="true"], #history-status[data-error="true"] { color: #ad302b; }
    [hidden] { display: none !important; }
    .history-item { border-top: 1px solid #e0e8e0; padding: 18px 0; }
    .history-item:last-child { padding-bottom: 0; }
    .preview { white-space: pre-wrap; overflow-wrap: anywhere; margin: 10px 0; }
    .actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
    @media (max-width: 600px) { main { padding: 24px 14px; } .card { padding: 18px; } .grid { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
<main>
  <header>
    <div class="eyebrow">SUN MAY / AUDIO</div>
    <h1>品牌展示片配音节点</h1>
    <p class="hint">为产品与生活方式画面配音。默认 Thiha 男声、1.0× 语速，留出呼吸感；也可选择 Nilar 女声。生成 MP3 后导入剪映、PR 或视频合成脚本。</p>
  </header>
  <section class="card" aria-label="生成配音">
    <form id="speech-form">
      <label for="input-type">输入模式</label>
      <select id="input-type"><option value="text">纯文本</option><option value="ssml">SSML · 分段停顿与语调</option></select>
      <p id="ssml-hint" class="hint" hidden>使用完整 speak / voice 文档，音色须与下方选择一致。语速以 prosody 标签为准。缅甸语不支持微软的词级 emphasis 重音，节点会保留正文并移除该标签。</p>
      <label for="input">配音文案</label>
      <textarea id="input" required maxlength="1500" placeholder="粘贴缅甸语、中文或英语短视频文案…"></textarea>
      <small id="input-limit">单次最多 1500 个字符，适合一段短视频配音。</small>
      <details><summary>查看缅甸语品牌片 SSML 示例</summary><pre style="white-space:pre-wrap;overflow-wrap:anywhere">&lt;speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="my-MM"&gt;
  &lt;voice name="my-MM-ThihaNeural"&gt;
    &lt;prosody rate="+0%" pitch="+0Hz"&gt;
      သဘာဝပင်မှည့်သီးရဲ့ &lt;break time="350ms"/&gt; စစ်မှန်တဲ့ ရနံ့နဲ့ အရသာ။
      &lt;break time="600ms"/&gt;
      တစ်ငုံချင်းစီမှာ ခံစားရမယ့် ပင်မှည့်သီးစေ့လေးတွေရဲ့ လန်းဆန်းမှု။
      &lt;break time="600ms"/&gt;
      မိသားစုနဲ့အတူ &lt;break time="350ms"/&gt; အေးမြချိုမြိန်တဲ့ အခိုက်အတန့်တိုင်းအတွက်၊ SUN MAY Passion Fruit Drink ၁ လီတာ။
      &lt;break time="700ms"/&gt;
      SUN MAY &lt;break time="400ms"/&gt; သဘာဝရဲ့ စစ်မှန်သော ရွေးချယ်မှု။
    &lt;/prosody&gt;
  &lt;/voice&gt;
&lt;/speak&gt;</pre></details>
      <div class="grid">
        <div><label for="language">配音语言</label><select id="language"><option value="my-MM">缅甸语</option><option value="zh-CN">中文</option><option value="en-US">英语</option></select></div>
        <div><label for="voice">声音</label><select id="voice"></select></div>
        <div><label for="speed">语速</label><select id="speed"><option value="0.8">0.8 · 稍慢</option><option value="1" selected>1.0 · 正常</option><option value="1.2">1.2 · 稍快</option></select></div>
      </div>
      <label for="filename">导出文件名</label>
      <input id="filename" value="sunmay_ad_myanmar_v1.mp3" required maxlength="120">
      <button class="primary" id="generate" type="submit">生成配音</button>
    </form>
    <p id="status" role="status" aria-live="polite"></p>
    <div id="result" hidden>
      <audio id="audio" controls preload="metadata"></audio>
      <a id="download" class="download">下载 MP3</a>
    </div>
  </section>
  <section class="card" aria-labelledby="history-title">
    <h2 id="history-title">本地历史 · 最近 20 条</h2>
    <p class="hint">音频与完整文案保存在此浏览器中，刷新后可继续使用。清理网站数据或更换浏览器后无法找回，请及时下载。</p>
    <button id="clear-history" type="button" disabled>清空记录</button>
    <p id="history-status" role="status">正在读取历史…</p>
    <div id="history"></div>
  </section>
</main>
<script>
  const presets = {
    'my-MM': [['my-MM-ThihaNeural', 'Thiha · 男声'], ['my-MM-NilarNeural', 'Nilar · 女声']],
    'zh-CN': [['zh-CN-XiaoxiaoNeural', '晓晓 · 女声'], ['zh-CN-YunxiNeural', '云希 · 男声']],
    'en-US': [['en-US-JennyNeural', 'Jenny · 女声'], ['en-US-GuyNeural', 'Guy · 男声']]
  };
  const languageNames = { 'my-MM': 'myanmar', 'zh-CN': 'chinese', 'en-US': 'english' };
  const element = id => document.getElementById(id);
  const urls = new Set();
  let currentUrl;
  let historyItems = [];
  let busy = false;
  // IndexedDB 保存实际 Blob；Object URL 仅在本次页面会话中使用。
  const database = new Promise((resolve, reject) => {
    const request = indexedDB.open('sunmay-tts-history', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('clips', { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('本地数据库被其他页面占用'));
  });
  async function storage(mode, action) {
    const db = await database;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('clips', mode);
      const request = action(transaction.objectStore('clips'));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error || new Error('保存中断'));
    });
  }
  async function saveHistory(item) {
    const db = await database;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('clips', 'readwrite');
      const store = transaction.objectStore('clips');
      store.put(item);
      const request = store.getAll();
      request.onsuccess = () => {
        const records = request.result.sort((a, b) => b.createdAt - a.createdAt);
        records.slice(20).forEach(record => store.delete(record.id));
      };
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error || new Error('保存中断'));
    });
  }
  function makeUrl(blob) {
    const url = URL.createObjectURL(blob);
    urls.add(url);
    return url;
  }
  function releaseUrl(url) {
    if (url) { URL.revokeObjectURL(url); urls.delete(url); }
  }
  function updateVoices() {
    element('voice').replaceChildren();
    presets[element('language').value].forEach(pair => element('voice').add(new Option(pair[1], pair[0])));
  }
  function updateInputMode() {
    const ssml = element('input-type').value === 'ssml';
    element('input').maxLength = ssml ? 6000 : 1500;
    element('ssml-hint').hidden = !ssml;
    element('speed').disabled = busy || ssml;
    element('input-limit').textContent = ssml ? 'SSML 最多 6000 个字符，正文最多 1500 个字符；支持 break 和 prosody。' : '单次最多 1500 个字符，适合一段短视频配音。';
  }
  function safeFilename(value) {
    let name = value.trim().replace(/[\\\\/:*?"<>|\\u0000-\\u001f]/g, '_').replace(/[. ]+$/, '');
    if (!name) name = 'sunmay_ad_' + languageNames[element('language').value] + '_v1';
    return name.toLowerCase().endsWith('.mp3') ? name : name + '.mp3';
  }
  function createClipId() {
    // 手机通过局域网 HTTP 访问时，randomUUID 可能不可用。
    if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    return Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, '0')).join('');
  }
  function showResult(item) {
    element('audio').pause();
    releaseUrl(currentUrl);
    currentUrl = makeUrl(item.blob);
    element('audio').src = currentUrl;
    element('download').href = currentUrl;
    element('download').download = item.filename;
    element('result').hidden = false;
  }
  function setStatus(message, isError = false) {
    element('status').textContent = message;
    element('status').dataset.error = String(isError);
  }
  function renderHistory() {
    const container = element('history');
    // 重绘时释放旧链接，避免反复生成后积累音频内存。
    container.querySelectorAll('a').forEach(link => releaseUrl(link.href));
    container.replaceChildren();
    element('history-status').textContent = historyItems.length ? '共 ' + historyItems.length + ' 条记录' : '尚无记录，生成后会自动保存。';
    element('history-status').dataset.error = 'false';
    element('clear-history').disabled = busy || !historyItems.length;
    historyItems.forEach(item => {
      const row = document.createElement('article');
      row.className = 'history-item';
      const title = document.createElement('strong');
      title.textContent = item.filename;
      const meta = document.createElement('p');
      meta.className = 'hint';
      meta.textContent = new Date(item.createdAt).toLocaleString('zh-CN') + ' · ' + item.voice + ' · ' + (item.inputType === 'ssml' ? 'SSML 分段控制' : item.speed + '×');
      const preview = document.createElement('p');
      preview.className = 'preview';
      preview.textContent = item.input.slice(0, 120) + (item.input.length > 120 ? '…' : '');
      const actions = document.createElement('div');
      actions.className = 'actions';
      const reload = document.createElement('button');
      reload.type = 'button';
      reload.textContent = '重新载入文案';
      reload.addEventListener('click', () => {
        if (busy) { setStatus('请等待当前配音生成完成。'); return; }
        element('input').value = item.input;
        element('language').value = item.language;
        updateVoices();
        element('voice').value = item.voice;
        element('speed').value = String(item.speed);
        element('input-type').value = item.inputType || 'text';
        updateInputMode();
        element('filename').value = item.filename;
        element('input').focus();
        setStatus('已载入文案和声音设置，可修改后再次生成。');
      });
      const play = document.createElement('button');
      play.type = 'button';
      play.textContent = '▶ 试听';
      play.addEventListener('click', async () => {
        showResult(item);
        try { await element('audio').play(); } catch (error) { setStatus('播放失败，请使用播放器重试或下载 MP3。', true); }
      });
      const download = document.createElement('a');
      download.className = 'download';
      download.textContent = '下载 MP3';
      download.download = item.filename;
      download.href = makeUrl(item.blob);
      actions.append(reload, play, download);
      row.append(title, meta, preview, actions);
      container.append(row);
    });
  }
  async function loadHistory() {
    try {
      historyItems = (await storage('readonly', store => store.getAll())).sort((a, b) => b.createdAt - a.createdAt);
      renderHistory();
    } catch (error) {
      element('history-status').textContent = '本地历史不可用，仍可生成并下载音频。请检查浏览器存储权限。';
      element('history-status').dataset.error = 'true';
    }
  }
  updateVoices();
  updateInputMode();
  element('input-type').addEventListener('change', updateInputMode);
  const historyReady = loadHistory();
  element('clear-history').addEventListener('click', async () => {
    if (busy || !historyItems.length || !window.confirm('确认清空所有本地历史录音？此操作无法撤销，请先下载需要保留的音频。')) return;
    element('clear-history').disabled = true;
    try {
      await storage('readwrite', store => store.clear());
      historyItems = [];
      renderHistory();
      setStatus('本地历史已清空。');
    } catch (error) {
      element('clear-history').disabled = false;
      setStatus('清空失败，请检查浏览器存储权限。', true);
    }
  });
  element('language').addEventListener('change', () => {
    updateVoices();
    element('filename').value = 'sunmay_ad_' + languageNames[element('language').value] + '_v1.mp3';
  });
  element('speech-form').addEventListener('submit', async event => {
    event.preventDefault();
    if (busy) return;
    const input = element('input').value.trim();
    const inputType = element('input-type').value;
    const limit = inputType === 'ssml' ? 6000 : 1500;
    if (!input || input.length > limit) { setStatus('请输入 1–' + limit + ' 个字符的文案。', true); return; }
    if (inputType === 'text' && input.startsWith('<speak')) { setStatus('检测到 SSML，请先切换输入模式。', true); return; }
    const item = {
      id: createClipId(), createdAt: Date.now(), input, inputType,
      language: element('language').value, voice: element('voice').value,
      speed: Number(element('speed').value), filename: safeFilename(element('filename').value)
    };
    busy = true;
    element('clear-history').disabled = true;
    Array.from(element('speech-form').elements).forEach(control => { control.disabled = true; });
    element('generate').textContent = '正在生成…';
    setStatus('正在生成配音，请稍候。');
    try {
      const response = await fetch('/v1/audio/speech', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, voice: item.voice, speed: item.speed, input_type: inputType })
      });
      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error && error.error && error.error.message || '语音服务返回错误（' + response.status + '）');
      }
      if (!(response.headers.get('content-type') || '').includes('audio/')) throw new Error('语音服务未返回音频，请重试。');
      const warning = response.headers.get('X-TTS-Warning');
      item.blob = await response.blob();
      if (!item.blob.size) throw new Error('语音服务返回了空音频，请重试。');
      showResult(item);
      try {
        await historyReady;
        await saveHistory(item);
        historyItems.unshift(item);
        historyItems = historyItems.slice(0, 20);
        renderHistory();
        setStatus('配音已生成并保存到本地历史。' + (warning ? ' 当前音色不支持 emphasis，已保留正文并移除重音标签。' : ''));
      } catch (error) {
        setStatus('配音已生成，但本地保存失败（可能空间不足或存储被禁用）。请立即下载 MP3。', true);
      }
    } catch (error) {
      setStatus('生成失败：' + error.message, true);
    } finally {
      busy = false;
      element('clear-history').disabled = !historyItems.length;
      Array.from(element('speech-form').elements).forEach(control => { control.disabled = false; });
      updateInputMode();
      element('generate').textContent = '生成配音';
    }
  });
  window.addEventListener('pagehide', event => {
    // 往返缓存保留页面状态；其他离开行为释放全部临时 URL。
    if (event.persisted) return;
    urls.forEach(url => URL.revokeObjectURL(url));
    urls.clear();
  });
</script>
</body>
</html>

`;

export default {
    async fetch(request, env, ctx) {
        return handleRequest(request);
    }
};

async function handleRequest(request) {
    if (request.method === "OPTIONS") {
        return handleOptions(request);
    }




    const requestUrl = new URL(request.url);
    const path = requestUrl.pathname;

    // 返回前端页面
    if (path === "/" || path === "/index.html") {
        return new Response(HTML_PAGE, {
            headers: {
                "Content-Type": "text/html; charset=utf-8",
                ...makeCORSHeaders()
            }
        });
    }

    if (path === "/v1/audio/transcriptions") {
        try {
            return await handleAudioTranscription(request);
        } catch (error) {
            console.error("Audio transcription error:", error);
            return new Response(JSON.stringify({
                error: {
                    message: error.message,
                    type: "api_error",
                    param: null,
                    code: "transcription_error"
                }
            }), {
                status: 500,
                headers: {
                    "Content-Type": "application/json",
                    ...makeCORSHeaders()
                }
            });
        }
    }

    if (path === "/v1/audio/speech") {
        if (request.method !== "POST") {
            return new Response(JSON.stringify({ error: { message: "只支持 POST 方法" } }), {
                status: 405,
                headers: { "Content-Type": "application/json", "Allow": "POST", ...makeCORSHeaders() }
            });
        }
        try {
            const contentType = request.headers.get("content-type") || "";
            
            // 处理文件上传
            if (contentType.includes("multipart/form-data")) {
                return await handleFileUpload(request);
            }
            
            // 处理JSON请求（原有功能）
            let requestBody;
            try {
                requestBody = await request.json();
            } catch (error) {
                return speechValidationError("请求必须包含有效的 JSON 对象");
            }
            if (!requestBody || typeof requestBody !== "object" || Array.isArray(requestBody)) {
                return speechValidationError("请求必须包含有效的 JSON 对象");
            }
            const {
                input,
                voice = "zh-CN-XiaoxiaoNeural",
                speed = '1.0',
                volume = '0',
                pitch = '0',
                style = "general",
                input_type = "text"
            } = requestBody;

            if (typeof input !== "string" || !input.trim()) {
                return speechValidationError("请输入非空文案");
            }
            if (input_type !== "text" && input_type !== "ssml") {
                return speechValidationError("input_type 必须为 text 或 ssml");
            }
            if (typeof voice !== "string" || !/^[a-z]{2,3}-[A-Z]{2}-[A-Za-z0-9]+Neural$/.test(voice)) {
                return speechValidationError("音色 ID 格式无效");
            }
            if (![speed, volume, pitch].every(value =>
                (typeof value === "number" || (typeof value === "string" && value.trim())) && Number.isFinite(Number(value))) ||
                Number(speed) < 0.5 || Number(speed) > 2 || Number(pitch) < -50 || Number(pitch) > 50 ||
                typeof style !== "string" || !/^[a-z]+$/.test(style)) {
                return speechValidationError("语速、音量、音调或风格参数无效");
            }
            if (input_type === "ssml") {
                let document;
                try { document = normalizeSsml(input, voice); }
                catch (error) { return speechValidationError(error.message); }
                const audio = await getAudioChunk(document.ssml, voice, '+0%', '+0Hz', '+0%', 'general',
                    'audio-24khz-48kbitrate-mono-mp3', 3, true);
                return new Response(audio, {
                    headers: {
                        'Content-Type': 'audio/mpeg', ...makeCORSHeaders(),
                        'Access-Control-Expose-Headers': 'X-TTS-Warning',
                        ...(document.emphasisRemoved ? { 'X-TTS-Warning': 'unsupported-emphasis-removed' } : {})
                    }
                });
            }
            let rate = Math.round((Number(speed) - 1.0) * 100);
            let numVolume = parseInt(String(parseFloat(volume) * 100));
            let numPitch = parseInt(pitch);
            const response = await getVoice(
                input,
                voice,
                rate >= 0 ? `+${rate}%` : `${rate}%`,
                numPitch >= 0 ? `+${numPitch}Hz` : `${numPitch}Hz`,
                numVolume >= 0 ? `+${numVolume}%` : `${numVolume}%`,
                style,
                "audio-24khz-48kbitrate-mono-mp3"
            );

            return response;

        } catch (error) {
            console.error("Error:", error);
            return new Response(JSON.stringify({
                error: {
                    message: error.message,
                    type: "api_error",
                    param: null,
                    code: "edge_tts_error"
                }
            }), {
                status: 500,
                headers: {
                    "Content-Type": "application/json",
                    ...makeCORSHeaders()
                }
            });
        }
    }

    // 默认返回 404
    return new Response("Not Found", { status: 404 });
}

// 在访问上游前返回输入错误，避免将无效请求作为服务故障处理。
function speechValidationError(message) {
    return new Response(JSON.stringify({ error: { message, type: "invalid_request_error" } }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...makeCORSHeaders() }
    });
}

// 仅解析短视频节点支持的 SSML 子集，并重新序列化；不接受外部实体、音频或任意 XML 扩展。
function normalizeSsml(input, selectedVoice) {
    if (input.length > 6000) throw new Error('SSML 文档不能超过 6000 个字符');
    const source = input.replace(/<!--[\s\S]*?-->/g, '').trim();
    const tokens = source.match(/<[^>]*>|[^<]+/g) || [];
    if (tokens.join('') !== source) throw new Error('SSML 标签未闭合');
    const stack = [];
    const output = [];
    let roots = 0, voices = 0, spokenText = '', emphasisRemoved = false;
    const emphasisSupported = ['en-US-GuyNeural', 'en-US-DavisNeural', 'en-US-JaneNeural'].includes(selectedVoice);
    const fail = message => { throw new Error('SSML：' + message); };
    const isXmlCharacter = code => code === 9 || code === 10 || code === 13 ||
        (code >= 32 && code <= 0xd7ff) || (code >= 0xe000 && code <= 0xfffd) || (code >= 0x10000 && code <= 0x10ffff);
    function decode(value) {
        if (/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[\da-fA-F]+);)/.test(value)) fail('请将正文中的 & 写成 &amp;');
        const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
        const decoded = value.replace(/&([^;]+);/g, (_, entity) => {
            if (Object.hasOwn(entities, entity)) return entities[entity];
            const code = entity.startsWith('#x') ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
            if (!isXmlCharacter(code)) fail('包含无效字符实体');
            return String.fromCodePoint(code);
        });
        if ([...decoded].some(character => !isXmlCharacter(character.codePointAt(0)))) fail('包含无效 XML 字符');
        return decoded;
    }
    function attributes(raw) {
        const result = Object.create(null);
        const pattern = /\s+([A-Za-z_:][\w:.-]*)\s*=\s*("([^"]*)"|'([^']*)')/y;
        let position = 0;
        while (raw.slice(position).trim()) {
            pattern.lastIndex = position;
            const match = pattern.exec(raw);
            if (!match || Object.hasOwn(result, match[1])) fail('属性格式无效或重复');
            if (/[<>]/.test(match[3] ?? match[4])) fail('属性中不能包含标签');
            result[match[1]] = decode(match[3] ?? match[4]);
            position = pattern.lastIndex;
        }
        return result;
    }
    for (const token of tokens) {
        if (!token.startsWith('<')) {
            const text = decode(token);
            if (!stack.includes('voice') && text.trim()) fail('正文必须放在 voice 内');
            if (stack.includes('voice')) spokenText += text;
            output.push(escapeXmlText(text));
            continue;
        }
        const closing = token.match(/^<\/([a-z]+)\s*>$/);
        if (closing) {
            if (stack.pop() !== closing[1]) fail('标签嵌套或闭合不正确');
            if (closing[1] !== 'emphasis' || emphasisSupported) output.push('</' + closing[1] + '>');
            continue;
        }
        const opening = token.match(/^<([a-z]+)([\s\S]*?)(\/?)>$/);
        if (!opening) fail('不支持声明、DOCTYPE、CDATA 或未知标签');
        const [, tag, raw, slash] = opening;
        const allowed = { speak: ['version', 'xmlns', 'xml:lang'], voice: ['name'], prosody: ['rate', 'pitch', 'volume'], break: ['time'], emphasis: ['level'] };
        if (!Object.hasOwn(allowed, tag)) fail('不支持 ' + tag + ' 标签');
        const attrs = attributes(raw);
        if (Object.keys(attrs).some(name => !allowed[tag].includes(name))) fail(tag + ' 含有不支持的属性');
        const parent = stack.at(-1);
        if (tag === 'speak') {
            if (parent || ++roots !== 1 || slash) fail('需要一个完整的 speak 根标签');
            if (attrs.version !== '1.0' || attrs.xmlns !== 'http://www.w3.org/2001/10/synthesis' ||
                attrs['xml:lang'] !== selectedVoice.split('-').slice(0, 2).join('-')) fail('speak 的版本、命名空间或语言与所选音色不符');
        } else if (tag === 'voice') {
            if (parent !== 'speak' || ++voices !== 1 || slash || attrs.name !== selectedVoice) fail('需要一个与下拉框音色一致的 voice');
        } else if (!['voice', 'prosody', 'emphasis'].includes(parent)) fail(tag + ' 必须放在 voice 或 prosody 内');
        if (tag === 'break') {
            const time = (attrs.time || '').match(/^(\d+(?:\.\d+)?)(ms|s)$/);
            if (!time || Number(time[1]) * (time[2] === 's' ? 1000 : 1) > 3000 || !slash) fail('break 请使用 0–3000ms 的自闭合标签');
        } else if (slash) fail(tag + ' 不能自闭合');
        if (tag === 'prosody') {
            for (const [name, value] of Object.entries(attrs)) {
                const parameter = value.match(/^([+-]?\d+(?:\.\d+)?)(%|Hz)$/);
                const number = parameter && Number(parameter[1]);
                if (!parameter || (name !== 'pitch' && parameter[2] !== '%') ||
                    (name === 'rate' && (number < -50 || number > 100)) ||
                    (name === 'pitch' && Math.abs(number) > (parameter[2] === '%' ? 20 : 50)) ||
                    (name === 'volume' && Math.abs(number) > 100)) fail('prosody 的语速、音调或音量超出支持范围');
            }
        }
        if (tag === 'emphasis' && attrs.level && !['strong', 'moderate', 'none', 'reduced'].includes(attrs.level)) fail('emphasis level 无效');
        if (tag === 'emphasis' && !emphasisSupported) emphasisRemoved = true;
        else output.push('<' + tag + Object.entries(attrs).map(([name, value]) => ' ' + name + '="' + escapeXmlText(value) + '"').join('') + (slash ? '/>' : '>'));
        if (!slash) stack.push(tag);
        if (stack.length > 12) fail('标签嵌套过深');
    }
    if (stack.length || roots !== 1 || voices !== 1 || !spokenText.trim()) fail('文档结构不完整或没有正文');
    if (spokenText.trim().length > 1500) fail('正文不能超过 1500 个字符');
    return { ssml: output.join(''), emphasisRemoved };
}

async function handleOptions(request) {
    return new Response(null, {
        status: 204,
        headers: {
            ...makeCORSHeaders(),
            "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
            "Access-Control-Allow-Headers": request.headers.get("Access-Control-Request-Headers") || "Authorization"
        }
    });
}

// 添加延迟函数
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 优化文本分块函数
function optimizedTextSplit(text, maxChunkSize = 1500) {
    const chunks = [];
    const sentences = text.split(/[。！？\n]/);
    let currentChunk = '';
    
    for (const sentence of sentences) {
        const trimmedSentence = sentence.trim();
        if (!trimmedSentence) continue;
        
        // 如果单个句子就超过最大长度，按字符分割
        if (trimmedSentence.length > maxChunkSize) {
            if (currentChunk) {
                chunks.push(currentChunk.trim());
                currentChunk = '';
            }
            
            // 按字符分割长句子
            for (let i = 0; i < trimmedSentence.length; i += maxChunkSize) {
                chunks.push(trimmedSentence.slice(i, i + maxChunkSize));
            }
        } else if ((currentChunk + trimmedSentence).length > maxChunkSize) {
            // 当前块加上新句子会超过限制，先保存当前块
            if (currentChunk) {
                chunks.push(currentChunk.trim());
            }
            currentChunk = trimmedSentence;
        } else {
            // 添加到当前块
            currentChunk += (currentChunk ? '。' : '') + trimmedSentence;
        }
    }
    
    // 添加最后一个块
    if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
    }
    
    return chunks.filter(chunk => chunk.length > 0);
}

// 批量处理音频块
async function processBatchedAudioChunks(chunks, voiceName, rate, pitch, volume, style, outputFormat, batchSize = 3, delayMs = 1000) {
    const audioChunks = [];
    
    for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);
        const batchPromises = batch.map(async (chunk, index) => {
            try {
                // 为每个请求添加小延迟，避免同时发送
                if (index > 0) {
                    await delay(index * 200);
                }
                return await getAudioChunk(chunk, voiceName, rate, pitch, volume, style, outputFormat);
            } catch (error) {
                console.error(`处理音频块失败 (批次 ${Math.floor(i/batchSize) + 1}, 块 ${index + 1}):`, error);
                throw error;
            }
        });
        
        try {
            const batchResults = await Promise.all(batchPromises);
            audioChunks.push(...batchResults);
            
            // 批次间延迟
            if (i + batchSize < chunks.length) {
                await delay(delayMs);
            }
        } catch (error) {
            console.error(`批次处理失败:`, error);
            throw error;
        }
    }
    
    return audioChunks;
}

async function getVoice(text, voiceName = "zh-CN-XiaoxiaoNeural", rate = '+0%', pitch = '+0Hz', volume = '+0%', style = "general", outputFormat = "audio-24khz-48kbitrate-mono-mp3") {
    try {
        // 文本预处理
        const cleanText = text.trim();
        if (!cleanText) {
            throw new Error("文本内容为空");
        }
        
        // 如果文本很短，直接处理
        if (cleanText.length <= 1500) {
            const audioBlob = await getAudioChunk(cleanText, voiceName, rate, pitch, volume, style, outputFormat);
            return new Response(audioBlob, {
                headers: {
                    "Content-Type": "audio/mpeg",
                    ...makeCORSHeaders()
                }
            });
        }

        // 优化的文本分块
        const chunks = optimizedTextSplit(cleanText, 1500);
        
        // 检查分块数量，防止超过CloudFlare限制
        if (chunks.length > 40) {
            throw new Error(`文本过长，分块数量(${chunks.length})超过限制。请缩短文本或分批处理。`);
        }
        
        console.log(`文本已分为 ${chunks.length} 个块进行处理`);

        // 批量处理音频块，控制并发数量和频率
        const audioChunks = await processBatchedAudioChunks(
            chunks, 
            voiceName, 
            rate, 
            pitch, 
            volume, 
            style, 
            outputFormat,
            3,  // 每批处理3个
            800 // 批次间延迟800ms
        );

        // 将音频片段拼接起来
        const concatenatedAudio = new Blob(audioChunks, { type: 'audio/mpeg' });
        return new Response(concatenatedAudio, {
            headers: {
                "Content-Type": "audio/mpeg",
                ...makeCORSHeaders()
            }
        });

    } catch (error) {
        console.error("语音合成失败:", error);
        return new Response(JSON.stringify({
            error: {
                message: error.message || String(error),
                type: "api_error",
                param: `${voiceName}, ${rate}, ${pitch}, ${volume}, ${style}, ${outputFormat}`,
                code: "edge_tts_error"
            }
        }), {
            status: 500,
            headers: {
                "Content-Type": "application/json",
                ...makeCORSHeaders()
            }
        });
    }
}



//获取单个音频数据（增强错误处理和重试机制）
async function getAudioChunk(text, voiceName, rate, pitch, volume, style, outputFormat = 'audio-24khz-48kbitrate-mono-mp3', maxRetries = 3, isSsml = false) {
    const retryDelay = 500; // 重试延迟500ms
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const endpoint = await getEndpoint();
            const url = `https://${endpoint.r}.tts.speech.microsoft.com/cognitiveservices/v1`;
            
            // 处理文本中的延迟标记
            let m = text.match(/\[(\d+)\]\s*?$/);
            let slien = 0;
            if (!isSsml && m && m.length == 2) {
                slien = parseInt(m[1]);
                text = text.replace(m[0], '');
            }
            
            // 验证文本长度
            if (!text.trim()) {
                throw new Error("文本块为空");
            }
            
            if (text.length > (isSsml ? 6000 : 2000)) {
                throw new Error(`文本块过长: ${text.length} 字符，最大支持2000字符`);
            }
            
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Authorization": endpoint.t,
                    "Content-Type": "application/ssml+xml",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36 Edg/127.0.0.0",
                    "X-Microsoft-OutputFormat": outputFormat
                },
                body: isSsml ? text : getSsml(text, voiceName, rate, pitch, volume, style, slien)
            });

            if (!response.ok) {
                const errorText = await response.text();
                
                // 根据错误类型决定是否重试
                if (response.status === 429) {
                    // 频率限制，需要重试
                    if (attempt < maxRetries) {
                        console.log(`频率限制，第${attempt + 1}次重试，等待${retryDelay * (attempt + 1)}ms`);
                        await delay(retryDelay * (attempt + 1));
                        continue;
                    }
                    throw new Error(`请求频率过高，已重试${maxRetries}次仍失败`);
                } else if (response.status >= 500) {
                    // 服务器错误，可以重试
                    if (attempt < maxRetries) {
                        console.log(`服务器错误，第${attempt + 1}次重试，等待${retryDelay * (attempt + 1)}ms`);
                        await delay(retryDelay * (attempt + 1));
                        continue;
                    }
                    throw new Error(`Edge TTS服务器错误: ${response.status} ${errorText}`);
                } else {
                    // 客户端错误，不重试
                    throw new Error(`Edge TTS API错误: ${response.status} ${errorText}`);
                }
            }

            return await response.blob();
            
        } catch (error) {
            if (attempt === maxRetries) {
                // 最后一次重试失败
                throw new Error(`音频生成失败（已重试${maxRetries}次）: ${error.message}`);
            }
            
            // 如果是网络错误或其他可重试错误
            if (error.message.includes('fetch') || error.message.includes('network')) {
                console.log(`网络错误，第${attempt + 1}次重试，等待${retryDelay * (attempt + 1)}ms`);
                await delay(retryDelay * (attempt + 1));
                continue;
            }
            
            // 其他错误直接抛出
            throw error;
        }
    }
}

// XML文本转义函数
function escapeXmlText(text) {
    return text
        .replace(/&/g, '&amp;')   // 必须首先处理 &
        .replace(/</g, '&lt;')    // 处理 <
        .replace(/>/g, '&gt;')    // 处理 >
        .replace(/"/g, '&quot;')  // 处理 "
        .replace(/'/g, '&apos;'); // 处理 '
}

function getSsml(text, voiceName, rate, pitch, volume, style, slien = 0) {
    // 对文本进行XML转义
    const escapedText = escapeXmlText(text);
    const locale = voiceName.split('-').slice(0, 2).join('-');
    const prosody = `<prosody rate="${escapeXmlText(rate)}" pitch="${escapeXmlText(pitch)}" volume="${escapeXmlText(volume)}">${escapedText}</prosody>`;
    // 通用配音无需扩展风格标签，兼容缅甸语与英语音色。
    const speech = style === "general" ? prosody :
        `<mstts:express-as style="${escapeXmlText(style)}" styledegree="2.0">${prosody}</mstts:express-as>`;
    
    let slien_str = '';
    if (slien > 0) {
        slien_str = `<break time="${slien}ms" />`
    }
    return `<speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" version="1.0" xml:lang="${escapeXmlText(locale)}">
                <voice name="${escapeXmlText(voiceName)}">
                    ${speech}
                    ${slien_str}
                </voice> 
            </speak>`;

}

async function getEndpoint() {
    const now = Date.now() / 1000;

    if (tokenInfo.token && tokenInfo.expiredAt && now < tokenInfo.expiredAt - TOKEN_REFRESH_BEFORE_EXPIRY) {
        return tokenInfo.endpoint;
    }

    // 获取新token
    const endpointUrl = "https://dev.microsofttranslator.com/apps/endpoint?api-version=1.0";
    const clientId = crypto.randomUUID().replace(/-/g, "");

    try {
        const response = await fetch(endpointUrl, {
            method: "POST",
            headers: {
                "Accept-Language": "zh-Hans",
                "X-ClientVersion": "4.0.530a 5fe1dc6c",
                "X-UserId": "0f04d16a175c411e",
                "X-HomeGeographicRegion": "zh-Hans-CN",
                "X-ClientTraceId": clientId,
                "X-MT-Signature": await sign(endpointUrl),
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36 Edg/127.0.0.0",
                "Content-Type": "application/json; charset=utf-8",
                "Content-Length": "0",
                "Accept-Encoding": "gzip"
            }
        });

        if (!response.ok) {
            throw new Error(`获取endpoint失败: ${response.status}`);
        }

        const data = await response.json();
        const jwt = data.t.split(".")[1];
        const decodedJwt = JSON.parse(atob(jwt));

        tokenInfo = {
            endpoint: data,
            token: data.t,
            expiredAt: decodedJwt.exp
        };

        return data;

    } catch (error) {
        console.error("获取endpoint失败:", error);
        // 如果有缓存的token，即使过期也尝试使用
        if (tokenInfo.token) {
            console.log("使用过期的缓存token");
            return tokenInfo.endpoint;
        }
        throw error;
    }
}



function makeCORSHeaders() {
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, x-api-key",
        "Access-Control-Max-Age": "86400"
    };
}

async function hmacSha256(key, data) {
    const cryptoKey = await crypto.subtle.importKey(
        "raw",
        key,
        { name: "HMAC", hash: { name: "SHA-256" } },
        false,
        ["sign"]
    );
    const signature = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(data));
    return new Uint8Array(signature);
}

async function base64ToBytes(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

async function bytesToBase64(bytes) {
    return btoa(String.fromCharCode.apply(null, bytes));
}

function uuid() {
    return crypto.randomUUID().replace(/-/g, "");
}

async function sign(urlStr) {
    const url = urlStr.split("://")[1];
    const encodedUrl = encodeURIComponent(url);
    const uuidStr = uuid();
    const formattedDate = dateFormat();
    const bytesToSign = `MSTranslatorAndroidApp${encodedUrl}${formattedDate}${uuidStr}`.toLowerCase();
    const decode = await base64ToBytes("oik6PdDdMnOXemTbwvMn9de/h9lFnfBaCWbGMMZqqoSaQaqUOqjVGm5NqsmjcBI1x+sS9ugjB55HEJWRiFXYFw==");
    const signData = await hmacSha256(decode, bytesToSign);
    const signBase64 = await bytesToBase64(signData);
    return `MSTranslatorAndroidApp::${signBase64}::${formattedDate}::${uuidStr}`;
}

function dateFormat() {
    const formattedDate = (new Date()).toUTCString().replace(/GMT/, "").trim() + " GMT";
    return formattedDate.toLowerCase();
}

// 处理文件上传的函数
async function handleFileUpload(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');
        const voice = formData.get('voice') || 'zh-CN-XiaoxiaoNeural';
        const speed = formData.get('speed') || '1.0';
        const volume = formData.get('volume') || '0';
        const pitch = formData.get('pitch') || '0';
        const style = formData.get('style') || 'general';

        // 验证文件
        if (!file) {
            return new Response(JSON.stringify({
                error: {
                    message: "未找到上传的文件",
                    type: "invalid_request_error",
                    param: "file",
                    code: "missing_file"
                }
            }), {
                status: 400,
                headers: {
                    "Content-Type": "application/json",
                    ...makeCORSHeaders()
                }
            });
        }

        // 验证文件类型
        if (!file.type.includes('text/') && !file.name.toLowerCase().endsWith('.txt')) {
            return new Response(JSON.stringify({
                error: {
                    message: "不支持的文件类型，请上传txt文件",
                    type: "invalid_request_error",
                    param: "file",
                    code: "invalid_file_type"
                }
            }), {
                status: 400,
                headers: {
                    "Content-Type": "application/json",
                    ...makeCORSHeaders()
                }
            });
        }

        // 验证文件大小（限制为500KB）
        if (file.size > 500 * 1024) {
            return new Response(JSON.stringify({
                error: {
                    message: "文件大小超过限制（最大500KB）",
                    type: "invalid_request_error",
                    param: "file",
                    code: "file_too_large"
                }
            }), {
                status: 400,
                headers: {
                    "Content-Type": "application/json",
                    ...makeCORSHeaders()
                }
            });
        }

        // 读取文件内容
        const text = await file.text();
        
        // 验证文本内容
        if (!text.trim()) {
            return new Response(JSON.stringify({
                error: {
                    message: "文件内容为空",
                    type: "invalid_request_error",
                    param: "file",
                    code: "empty_file"
                }
            }), {
                status: 400,
                headers: {
                    "Content-Type": "application/json",
                    ...makeCORSHeaders()
                }
            });
        }

        // 文本长度限制（10000字符）
        if (text.length > 10000) {
            return new Response(JSON.stringify({
                error: {
                    message: "文本内容过长（最大10000字符）",
                    type: "invalid_request_error",
                    param: "file",
                    code: "text_too_long"
                }
            }), {
                status: 400,
                headers: {
                    "Content-Type": "application/json",
                    ...makeCORSHeaders()
                }
            });
        }

        // 处理参数格式，与原有逻辑保持一致
        let rate = parseInt(String((parseFloat(speed) - 1.0) * 100));
        let numVolume = parseInt(String(parseFloat(volume) * 100));
        let numPitch = parseInt(pitch);

        // 调用TTS服务
        return await getVoice(
            text,
            voice,
            rate >= 0 ? `+${rate}%` : `${rate}%`,
            numPitch >= 0 ? `+${numPitch}Hz` : `${numPitch}Hz`,
            numVolume >= 0 ? `+${numVolume}%` : `${numVolume}%`,
            style,
            "audio-24khz-48kbitrate-mono-mp3"
        );

    } catch (error) {
        console.error("文件上传处理失败:", error);
        return new Response(JSON.stringify({
            error: {
                message: "文件处理失败",
                type: "api_error",
                param: null,
                code: "file_processing_error"
            }
        }), {
            status: 500,
            headers: {
                "Content-Type": "application/json",
                ...makeCORSHeaders()
            }
        });
    }
}

// 处理语音转录的函数
async function handleAudioTranscription(request) {
    try {
        // 验证请求方法
        if (request.method !== 'POST') {
            return new Response(JSON.stringify({
                error: {
                    message: "只支持POST方法",
                    type: "invalid_request_error",
                    param: "method",
                    code: "method_not_allowed"
                }
            }), {
                status: 405,
                headers: {
                    "Content-Type": "application/json",
                    ...makeCORSHeaders()
                }
            });
        }

        const contentType = request.headers.get("content-type") || "";
        
        // 验证Content-Type
        if (!contentType.includes("multipart/form-data")) {
            return new Response(JSON.stringify({
                error: {
                    message: "请求必须使用multipart/form-data格式",
                    type: "invalid_request_error",
                    param: "content-type",
                    code: "invalid_content_type"
                }
            }), {
                status: 400,
                headers: {
                    "Content-Type": "application/json",
                    ...makeCORSHeaders()
                }
            });
        }

        // 解析FormData
        const formData = await request.formData();
        const audioFile = formData.get('file');
        const customToken = formData.get('token');

        // 验证音频文件
        if (!audioFile) {
            return new Response(JSON.stringify({
                error: {
                    message: "未找到音频文件",
                    type: "invalid_request_error",
                    param: "file",
                    code: "missing_file"
                }
            }), {
                status: 400,
                headers: {
                    "Content-Type": "application/json",
                    ...makeCORSHeaders()
                }
            });
        }

        // 验证文件大小（限制为10MB）
        if (audioFile.size > 10 * 1024 * 1024) {
            return new Response(JSON.stringify({
                error: {
                    message: "音频文件大小不能超过10MB",
                    type: "invalid_request_error",
                    param: "file",
                    code: "file_too_large"
                }
            }), {
                status: 400,
                headers: {
                    "Content-Type": "application/json",
                    ...makeCORSHeaders()
                }
            });
        }

        // 验证音频文件格式
        const allowedTypes = [
            'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/flac', 'audio/aac',
            'audio/ogg', 'audio/webm', 'audio/amr', 'audio/3gpp'
        ];
        
        const isValidType = allowedTypes.some(type => 
            audioFile.type.includes(type) || 
            audioFile.name.toLowerCase().match(/\.(mp3|wav|m4a|flac|aac|ogg|webm|amr|3gp)$/i)
        );

        if (!isValidType) {
            return new Response(JSON.stringify({
                error: {
                    message: "不支持的音频文件格式，请上传mp3、wav、m4a、flac、aac、ogg、webm、amr或3gp格式的文件",
                    type: "invalid_request_error",
                    param: "file",
                    code: "invalid_file_type"
                }
            }), {
                status: 400,
                headers: {
                    "Content-Type": "application/json",
                    ...makeCORSHeaders()
                }
            });
        }

        // 使用默认token或用户提供的token
        const token = customToken || 'sk-wtldsvuprmwltxpbspbmawtolbacghzawnjhtlzlnujjkfhh';

        // 构建发送到硅基流动API的FormData
        const apiFormData = new FormData();
        apiFormData.append('file', audioFile);
        apiFormData.append('model', 'FunAudioLLM/SenseVoiceSmall');

        // 发送请求到硅基流动API
        const apiResponse = await fetch('https://api.siliconflow.cn/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: apiFormData
        });

        if (!apiResponse.ok) {
            const errorText = await apiResponse.text();
            console.error('硅基流动API错误:', apiResponse.status, errorText);
            
            let errorMessage = '语音转录服务暂时不可用';
            
            if (apiResponse.status === 401) {
                errorMessage = 'API Token无效，请检查您的配置';
            } else if (apiResponse.status === 429) {
                errorMessage = '请求过于频繁，请稍后再试';
            } else if (apiResponse.status === 413) {
                errorMessage = '音频文件太大，请选择较小的文件';
            }

            return new Response(JSON.stringify({
                error: {
                    message: errorMessage,
                    type: "api_error",
                    param: null,
                    code: "transcription_api_error"
                }
            }), {
                status: apiResponse.status,
                headers: {
                    "Content-Type": "application/json",
                    ...makeCORSHeaders()
                }
            });
        }

        // 获取转录结果
        const transcriptionResult = await apiResponse.json();

        // 返回转录结果
        return new Response(JSON.stringify(transcriptionResult), {
            headers: {
                "Content-Type": "application/json",
                ...makeCORSHeaders()
            }
        });

    } catch (error) {
        console.error("语音转录处理失败:", error);
        return new Response(JSON.stringify({
            error: {
                message: "语音转录处理失败",
                type: "api_error",
                param: null,
                code: "transcription_processing_error"
            }
        }), {
            status: 500,
            headers: {
                "Content-Type": "application/json",
                ...makeCORSHeaders()
            }
        });
    }
}
