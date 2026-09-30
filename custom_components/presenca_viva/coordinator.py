"""Event driven updates; no polling and no remote API."""

import logging
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import Event, HomeAssistant, callback
from homeassistant.helpers.event import async_track_state_change_event
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator

from .const import ASSET_URL, DOMAIN, LABELS, SOURCE_KEYS
from .model import resolve_status

_LOGGER = logging.getLogger(__name__)


class PresenceCoordinator(DataUpdateCoordinator[dict[str, Any]]):
    """Observe only explicitly selected entities."""

    def __init__(self, hass: HomeAssistant, entry: ConfigEntry) -> None:
        super().__init__(hass, _LOGGER, name=DOMAIN, config_entry=entry)
        self.entry = entry
        # Options are a complete form so clearing an optional source is respected.
        self.settings = dict(entry.options or entry.data)
        self.mode = "Automático"
        self.select_entity_id: str | None = None

    @callback
    def start(self) -> None:
        """Start listening and calculate the initial snapshot."""
        ids = [self.settings[key] for key in SOURCE_KEYS if self.settings.get(key)]
        if ids:
            self.entry.async_on_unload(
                async_track_state_change_event(self.hass, ids, self._state_changed)
            )
        self.refresh()

    @callback
    def _state_changed(self, event: Event) -> None:
        self.refresh()

    @callback
    def set_mode(self, mode: str) -> None:
        self.mode = mode
        self.refresh()

    @callback
    def refresh(self) -> None:
        states = {}
        missing = []
        for key in SOURCE_KEYS:
            entity_id = self.settings.get(key)
            if entity_id:
                state = self.hass.states.get(entity_id)
                states[key] = state.state if state else None
                if state is None or state.state in ("unknown", "unavailable"):
                    missing.append(entity_id)
        status, reason = resolve_status(self.mode, states)
        self.async_set_updated_data({
            "status": status,
            "label": LABELS[status],
            "name": self.settings.get("name", self.entry.title),
            "mode": self.mode,
            "reason": reason,
            "person_state": states.get("person_entity"),
            "headphones": self.settings.get("headphones", True),
            "mode_entity": self.select_entity_id,
            "asset_base": ASSET_URL,
            "presenca_viva": True,
            "missing_sources": missing,
            **{key: self.settings.get(key) for key in SOURCE_KEYS},
        })
