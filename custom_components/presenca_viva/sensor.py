"""Status sensor exposed for cards and automations."""

from homeassistant.components.sensor import SensorDeviceClass, SensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import ICONS, LABELS
from .entity import PresenceEntity


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback) -> None:
    async_add_entities([PresenceStatus(entry.runtime_data)])


class PresenceStatus(PresenceEntity, SensorEntity):
    _attr_name = "Estado"
    _attr_translation_key = "status"
    _attr_device_class = SensorDeviceClass.ENUM
    _attr_options = list(LABELS)

    def __init__(self, coordinator):
        super().__init__(coordinator, "status")

    @property
    def native_value(self) -> str:
        return self.coordinator.data["status"]

    @property
    def icon(self) -> str:
        return ICONS[self.native_value]

    @property
    def extra_state_attributes(self) -> dict:
        return {key: value for key, value in self.coordinator.data.items() if key != "status"}
