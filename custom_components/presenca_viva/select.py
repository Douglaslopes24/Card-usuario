"""Manual mode selector that survives restarts."""

from homeassistant.components.select import SelectEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.restore_state import RestoreEntity

from .const import MODES
from .entity import PresenceEntity


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback) -> None:
    async_add_entities([PresenceMode(entry.runtime_data)])


class PresenceMode(PresenceEntity, SelectEntity, RestoreEntity):
    _attr_name = "Modo"
    _attr_icon = "mdi:account-switch"
    _attr_options = list(MODES)

    def __init__(self, coordinator):
        super().__init__(coordinator, "mode")

    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()
        self.coordinator.select_entity_id = self.entity_id
        last = await self.async_get_last_state()
        self.coordinator.set_mode(last.state if last and last.state in MODES else "Automático")

    @property
    def current_option(self) -> str:
        return self.coordinator.mode

    async def async_select_option(self, option: str) -> None:
        if option not in MODES:
            raise HomeAssistantError("Escolha um dos modos disponíveis")
        self.coordinator.set_mode(option)
