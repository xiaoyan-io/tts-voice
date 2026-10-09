# SUN MAY 配音节点

生产链内部的轻量音频节点：粘贴短视频文案，生成配音，导出 MP3，交给剪映、PR 或现有视频合成脚本。

## 页面功能

- 缅甸语：`my-MM-NilarNeural`（女声）、`my-MM-ThihaNeural`（男声）。
- 中文：`zh-CN-XiaoxiaoNeural`（女声）、`zh-CN-YunxiNeural`（男声）。
- 英语：`en-US-JennyNeural`（女声）、`en-US-GuyNeural`（男声）。
- 三档语速：0.8、1.0、1.2；默认缅甸语女声、正常语速。
- 单次文案最多 1500 个字符；支持试听、自定义文件名和下载 MP3。
- 本地历史保留最近 20 条完整文案、语言、声音、语速、时间、文件名及音频 Blob；刷新后可重新载入、试听、下载，清空前需确认。
- 默认导出名为 `sunmay_ad_myanmar_v1.mp3`，切换语言会更新默认文件名；版本号可手动修改。

历史使用 IndexedDB，不需要额外数据库。Object URL 仅用于当前页面的播放和下载，不作为持久化数据。历史只属于当前浏览器和网站来源，清理网站数据、更换浏览器或域名后无法恢复。保存失败时仍可下载本次音频。

## 使用与生产链衔接

1. 打开 Worker 页面，粘贴已完成的配音文案。
2. 选择语言、声音与语速，填写导出文件名。
3. 点击“生成配音”，试听并下载 MP3。
4. 将音频导入剪映 / PR，或作为视频合成脚本的输入，与产品素材对齐。

此 MVP 通过下载文件衔接生产链，尚未自动写入素材目录或自动调用发布流程。

## API

### 分段 SSML 配音

页面选择“SSML 分段停顿与语调”，粘贴完整的 `speak` 文档，并选择与 `voice name` 一致的声音。页面内提供缅甸语短句示例；历史会保存完整标记和输入模式。

支持 `speak`、单个 `voice`、`prosody`、`break` 和 `emphasis`。文档最多 6000 字符，正文最多 1500 字符；单次停顿最多 3 秒。语速、音调和音量以文档中的 `prosody` 为准，页面语速选择在此模式下停用。不接受外部音频、实体声明或多声音文档。

缅甸语 Nilar/Thiha 不支持 `emphasis` 重音控制。本节点会保留正文、移除该标签并提示；支持情况参见[微软 SSML 文档](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-synthesis-markup-voice)。停顿与语调控制有助于调整节奏，实际自然度仍需试听。

API 在 JSON 中设置 `input_type: 'ssml'`，`input` 填完整 SSML，`voice` 与文档一致。默认 `input_type: 'text'` 保持纯文本兼容；发生重音降级时返回 `X-TTS-Warning: unsupported-emphasis-removed`。

现有 `POST /v1/audio/speech` 保持可用，返回 `audio/mpeg`。新增 JSON 输入校验，非法请求返回 400，非 POST 请求返回 405。

```javascript
const response = await fetch('https://your-worker.workers.dev/v1/audio/speech', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    input: 'မင်္ဂလာပါ',
    voice: 'my-MM-NilarNeural',
    speed: 1.0
  })
});
if (!response.ok) throw new Error('配音失败');
const audio = await response.blob();
```

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `input` | 必填 | 非空文案；页面限制 1500 字符，API 保留原有长文处理 |
| `voice` | `zh-CN-XiaoxiaoNeural` | 完整微软音色 ID；API 默认值保持兼容 |
| `speed` | `1.0` | API 支持 0.5–2.0，页面提供三档预设 |
| `pitch` | `0` | -50–50 Hz |
| `volume` | `0` | 相对音量调节 |
| `style` | `general` | 通用风格直接使用 prosody；其他风格取决于音色支持 |

原有 multipart 文本上传和 `/v1/audio/transcriptions` 路由保留，精简页面不再展示这些表单。

## 开发与部署

项目保持原有单文件 Cloudflare Workers 结构，页面内嵌于 `index.js`，无前端构建依赖。

### 手机局域网预览

安装 Node.js 22 或更新版本后，在项目目录运行：

```bash
node scripts/preview.mjs
```

终端会输出电脑和局域网网址。手机与电脑连接同一局域网，打开 `http://电脑局域网IP:8788/` 即可生成、试听与下载配音。此预览服务监听所有本机 IPv4 网卡；保持终端运行，按 Ctrl+C 停止。可通过 `PORT` 环境变量更改端口。

手机与电脑各自保存本地历史，已有电脑记录不会自动同步到手机。

```bash
# 安装官方 Wrangler CLI
npm install -g wrangler

# 本地开发
wrangler dev

# 部署
wrangler deploy

# 运行无外部依赖的接口测试
node --test tests/speech.test.mjs
```

后端沿用原项目的微软 Translator endpoint 与语音合成接口。音色 ID 可参照 [微软语言与音色支持文档](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support)。实际可用性以当前上游接口返回为准。

测试覆盖页面脚本解析、语言 SSML、XML 转义、非法输入和三种语言的语速传递；自动测试用模拟上游，不证明实时服务可用性。

## 项目结构

```text
index.js               # 页面与 Worker API
wrangler.toml          # Worker 配置
tests/speech.test.mjs   # 接口与 SSML 回归测试
scripts/preview.mjs    # 支持手机局域网访问的 Node 预览服务
README.md              # 使用文档
LICENSE                # MIT 许可证
```
