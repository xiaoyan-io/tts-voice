"""在 HA 界面配置接口地址与密码。"""
from urllib.parse import urlsplit
import aiohttp
import voluptuous as vol
from homeassistant import config_entries
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers import selector

DOMAIN = "tts_voice_api"

def valid_url(value):
    parts = urlsplit(value)
    return (parts.scheme in ("https", "http") and parts.hostname and
            not parts.username and not parts.password and not parts.query and
            not parts.fragment and parts.path in ("", "/") and
            (parts.scheme == "https" or parts.hostname in ("127.0.0.1", "localhost")))

class VoiceConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """配置流程。"""
    VERSION = 1

    async def async_step_user(self, user_input=None):
        errors = {}
        if user_input is not None:
            endpoint = user_input["url"].strip().rstrip("/")
            if not valid_url(endpoint):
                errors["base"] = "invalid_url"
            else:
                try:
                    async with async_get_clientsession(self.hass).get(
                        endpoint + "/health",
                        headers={"Authorization": "Bearer " + user_input["password"]},
                        timeout=aiohttp.ClientTimeout(total=10), allow_redirects=False,
                    ) as response:
                        if response.status == 401:
                            errors["base"] = "invalid_auth"
                        elif response.status != 200 or (await response.json()).get("status") != "ok":
                            errors["base"] = "cannot_connect"
                        else:
                            await self.async_set_unique_id(endpoint)
                            self._abort_if_unique_id_configured()
                            return self.async_create_entry(title="中文配音接口", data={"url": endpoint, "password": user_input["password"]})
                except (aiohttp.ClientError, TimeoutError, ValueError):
                    errors["base"] = "cannot_connect"
        return self.async_show_form(step_id="user", data_schema=vol.Schema({
            vol.Required("url", default="http://127.0.0.1:8789"): str,
            vol.Required("password"): selector.TextSelector(selector.TextSelectorConfig(type=selector.TextSelectorType.PASSWORD)),
        }), errors=errors)
