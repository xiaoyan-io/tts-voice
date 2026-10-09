# VoiceCraft 中文原版

已恢复原仓库 `96ad850` 的完整界面与后端，首次访问默认中文，默认中文晓晓女声、正常语速。

支持文字转语音、TXT 上传、语速/音调/风格设置和 MP3 下载。原有语音转文字界面保留，依赖其上游接口与凭证。

公网：https://tts-voice-magic.xiaoyan-a95.workers.dev/

局域网预览：`node scripts/preview.mjs`，手机与电脑同一局域网后访问终端输出的 IP 和端口。

检查：`node --test tests/speech.test.mjs`。

缅甸语改版保存在 `feat-burmese-history` 分支。此次恢复不删除浏览器中已有的改版历史数据；原版界面不展示这些记录。
