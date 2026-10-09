"""将接口返回的 MP3 提供给 HA Assist。"""
import aiohttp
from homeassistant.components.tts import TextToSpeechEntity, Voice
from homeassistant.core import callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.aiohttp_client import async_get_clientsession

VOICES = {"zh-CN-XiaoxiaoNeural": "晓晓 · 女声", "zh-CN-YunxiNeural": "云希 · 男声"}

async def async_setup_entry(hass, entry, async_add_entities):
    """注册中文配音实体。"""
    async_add_entities([VoiceApiTTS(entry)])

class VoiceApiTTS(TextToSpeechEntity):
    """受密码保护的中文语音合成。"""
    _attr_name = "TTS Voice API"
    _attr_default_language = "zh-CN"
    _attr_supported_languages = ["zh-CN"]
    _attr_supported_options = ["voice", "speed"]
    _attr_default_options = {"voice": "zh-CN-XiaoxiaoNeural", "speed": 1.0}

    def __init__(self, entry):
        self._attr_unique_id = entry.entry_id
        self._url = entry.data["url"]
        self._password = entry.data["password"]

    @callback
    def async_get_supported_voices(self, language):
        return [Voice(voice_id=key, name=name) for key, name in VOICES.items()] if language == "zh-CN" else None

    async def async_get_tts_audio(self, message, language, options):
        """获取音频；不记录密码、文案或上游错误正文。"""
        try:
            async with async_get_clientsession(self.hass).post(
                self._url + "/v1/audio/speech",
                headers={"Authorization": "Bearer " + self._password},
                json={"input": message, "voice": options.get("voice", "zh-CN-XiaoxiaoNeural"), "speed": options.get("speed", 1.0)},
                timeout=aiohttp.ClientTimeout(total=60), allow_redirects=False,
            ) as response:
                if response.status != 200 or not response.content_type.startswith("audio/"):
                    raise HomeAssistantError(f"中文配音接口请求失败（HTTP {response.status}）")
                audio = await response.read()
                if not audio:
                    raise HomeAssistantError("中文配音接口返回空音频")
                return "mp3", audio
        except (aiohttp.ClientError, TimeoutError) as error:
            raise HomeAssistantError("无法连接中文配音接口") from error
