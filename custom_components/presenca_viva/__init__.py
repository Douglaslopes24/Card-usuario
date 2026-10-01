"""Presença Viva: local presence profiles and bundled dashboard card."""

import asyncio
import logging
from pathlib import Path

from homeassistant.components.frontend import add_extra_js_url
from homeassistant.components.http import StaticPathConfig
from homeassistant.components.lovelace.const import DOMAIN as LOVELACE_DOMAIN
from homeassistant.components.lovelace.resources import ResourceStorageCollection
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.typing import ConfigType

from .const import ASSET_URL, DOMAIN, VERSION
from .coordinator import PresenceCoordinator

PLATFORMS = [Platform.SENSOR, Platform.SELECT]
_LOGGER = logging.getLogger(__name__)
CARD_PATH = f"{ASSET_URL}/presenca-viva-card.js"
CARD_URL = f"{CARD_PATH}?v={VERSION}"


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Make the card available as soon as the integration is loaded."""
    await _async_setup_frontend(hass)
    return True


async def _async_setup_frontend(hass: HomeAssistant) -> None:
    """Serve shared assets and register the dashboard module without duplicates."""
    shared = hass.data.setdefault(DOMAIN, {"lock": asyncio.Lock(), "assets_registered": False})
    async with shared["lock"]:
        if not shared["assets_registered"]:
            await hass.http.async_register_static_paths([
                StaticPathConfig(ASSET_URL, str(Path(__file__).parent / "frontend"), False)
            ])
            add_extra_js_url(hass, CARD_URL)
            shared["assets_registered"] = True

        # Frontend depends on Lovelace. Register in its resource collection as
        # well, so dashboard clients can discover the card through that path.
        lovelace = hass.data.get(LOVELACE_DOMAIN)
        resources = (
            lovelace.get("resources")
            if isinstance(lovelace, dict)
            else getattr(lovelace, "resources", None)
        )
        if not isinstance(resources, ResourceStorageCollection):
            # YAML resources remain user-managed; the extra module above still
            # loads the card in the regular Home Assistant frontend.
            return
        try:
            await resources.async_get_info()
            matches = [
                item for item in resources.async_items()
                if item["url"].split("?", 1)[0] == CARD_PATH
            ]
            for item in matches:
                if item["url"] != CARD_URL or item["type"] != "module":
                    await resources.async_update_item(
                        item["id"], {"url": CARD_URL, "res_type": "module"}
                    )
            if not matches:
                await resources.async_create_item(
                    {"url": CARD_URL, "res_type": "module"}
                )
        except HomeAssistantError:
            _LOGGER.exception(
                "Could not register the dashboard resource. Add %s as a JavaScript module in Settings > Dashboards > Resources",
                CARD_URL,
            )


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Ensure the card is registered, then load the profile's entities."""
    await _async_setup_frontend(hass)
    coordinator = PresenceCoordinator(hass, entry)
    entry.runtime_data = coordinator
    coordinator.start()
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload the profile. Assets remain shared by other profiles."""
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
