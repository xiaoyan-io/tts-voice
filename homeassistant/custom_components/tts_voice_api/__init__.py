"""中文配音接口集成。"""
from homeassistant.const import Platform

PLATFORMS = [Platform.TTS]

async def async_setup_entry(hass, entry):
    """加载配音实体。"""
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    return True

async def async_unload_entry(hass, entry):
    """卸载配音实体。"""
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
