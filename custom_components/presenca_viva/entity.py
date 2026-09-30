"""Common entity metadata."""

from homeassistant.helpers.entity import DeviceInfo
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import DOMAIN, VERSION
from .coordinator import PresenceCoordinator


class PresenceEntity(CoordinatorEntity[PresenceCoordinator]):
    _attr_has_entity_name = True

    def __init__(self, coordinator: PresenceCoordinator, suffix: str) -> None:
        super().__init__(coordinator)
        self._attr_unique_id = f"{coordinator.entry.entry_id}_{suffix}"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, coordinator.entry.entry_id)},
            name=coordinator.settings.get("name", coordinator.entry.title),
            manufacturer="Presença Viva",
            model="Perfil de presença local",
            sw_version=VERSION,
        )
