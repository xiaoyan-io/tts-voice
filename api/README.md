# 受保护的中文配音接口 / Home Assistant

该服务提供 `POST /v1/audio/speech` 与 `GET /health`，所有路由均要求 `Authorization: Bearer <访问密码>`。未配置密码返回 503，错误或缺失密码返回 401。密码仅保存在部署目录的 `.env` 与 HA 的配置条目中，不写入 Git 或音频 URL。

## 当前部署（2026-10-09）

已安装在 Pi 5，容器 `tts-voice-api`，HA 实体 `tts.tts_voice_api`。已创建并设为首选的管线为“中文助手 · 晓晓”，使用 HA 内置对话代理和中文配音。

验证通过：未认证与错误密码均 401；正确密码健康检查 200；接口返回中文 MP3；HA 的 Try voice 调用成功并生成 21,036 字节音频缓存。实际音箱播放尚未验证。

当前 `stt_engine` 为空，尚不能完成麦克风语音识别或免按键唤醒。旧英文助手保留。备份位于 `/home/pi5/home-assistant/config/tts-voice-backup-20261009`（目录 700），密码文件为 `api/.env`（600）。

默认中文晓晓，支持云希；正文最多 1500 字符，速度 0.5–2.0，返回 MP3。仅实现语音合成；完整 Assist 还需要语音识别和对话代理。

## Pi 5 安装方案

- 节点：`pi5` / `192.168.88.16`。
- 服务代码：`/home/pi5/tts-voice-api`。
- 启动：在该目录的 `api` 子目录执行 `docker compose up -d`。
- 新容器：`tts-voice-api`，使用官方 Node 22 镜像，代码只读挂载。
- 端口：仅绑定 `127.0.0.1:8789`；已确认现有 HA 为 host 网络模式，因此可从 HA 调用。
- HA 集成：复制 `homeassistant/custom_components/tts_voice_api` 至 `/home/pi5/home-assistant/config/custom_components/tts_voice_api`，重启一次 HA 后添加集成。
- 添加集成时使用 `http://127.0.0.1:8789` 和配置的访问密码。
- 在“设置 → 语音助手”中为管线选择新建的 TTS 实体与中文声音。

本地原版网页与公网 Worker 不改变。新增接口没有网页，不开放公网端口，不修改 Tunnel、Zigbee2MQTT 或现有识别引擎。客户端无需把密码提供给音箱；音箱播放 HA 返回的媒体。

## 验收与回退

验收：无密码/错误密码均 401，正确密码健康检查 200、中文合成有效 MP3；HA 注册 TTS 实体，并通过实体获取音频。实际音箱播放需另做端到端验证。

安装前备份 Assist 管线文件与相关配置。回退时移除新增 HA 集成条目，恢复管线备份，停止新建的 `tts-voice-api` 容器；保留原有配置与备份，不删除其他容器或持久化卷。HA 重启会短暂中断 HA 的控制和自动化。

## 开发验证

`node --test tests/api.test.mjs tests/speech.test.mjs`

可在隔离环境中设置 `AUTH_PASSWORD`、`PORT` 后启动 `node api/server.mjs`。生产密码不要放到命令参数或终端输出中。
