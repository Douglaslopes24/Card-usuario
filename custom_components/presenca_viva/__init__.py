"""Presença Viva: local presence profiles and bundled dashboard card."""

import asyncio
from pathlib import Path

from homeassistant.components.frontend import add_extra_js_url
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant

from .const import ASSET_URL, DOMAIN, VERSION
from .coordinator import PresenceCoordinator

PLATFORMS = [Platform.SENSOR, Platform.SELECT]


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Register shared assets once, then load the profile's entities."""
    shared = hass.data.setdefault(DOMAIN, {"lock": asyncio.Lock(), "assets_registered": False})
    async with shared["lock"]:
        if not shared["assets_registered"]:
            await hass.http.async_register_static_paths([
                StaticPathConfig(ASSET_URL, str(Path(__file__).parent / "frontend"), False)
            ])
            add_extra_js_url(hass, f"{ASSET_URL}/presenca-viva-card.js?v={VERSION}")
            shared["assets_registered"] = True
    coordinator = PresenceCoordinator(hass, entry)
    entry.runtime_data = coordinator
    coordinator.start()
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload the profile. Assets remain shared by other profiles."""
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
