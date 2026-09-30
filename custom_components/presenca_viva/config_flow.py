"""UI setup and optional source selection."""

from typing import Any
from uuid import uuid4

import voluptuous as vol

from homeassistant.config_entries import ConfigEntry, ConfigFlow, ConfigFlowResult, OptionsFlowWithReload
from homeassistant.core import callback
from homeassistant.helpers import selector

from .const import DOMAIN


def schema() -> vol.Schema:
    return vol.Schema({
        vol.Required("name", default="Maicon"): selector.TextSelector(),
        vol.Optional("person_entity"): selector.EntitySelector(selector.EntitySelectorConfig(domain=["person", "device_tracker"])),
        vol.Optional("dnd_entity"): selector.EntitySelector(selector.EntitySelectorConfig(domain=["binary_sensor", "input_boolean", "sensor"])),
        vol.Optional("transit_entity"): selector.EntitySelector(selector.EntitySelectorConfig(domain=["binary_sensor", "input_boolean", "sensor"])),
        vol.Optional("media_player_entity"): selector.EntitySelector(selector.EntitySelectorConfig(domain="media_player")),
        vol.Optional("battery_entity"): selector.EntitySelector(selector.EntitySelectorConfig(domain="sensor", device_class="battery")),
        vol.Optional("steps_entity"): selector.EntitySelector(selector.EntitySelectorConfig(domain="sensor")),
        vol.Required("headphones", default=True): selector.BooleanSelector(),
    })


def clean_input(data: dict[str, Any]) -> dict[str, Any]:
    return {key: value.strip() if isinstance(value, str) else value for key, value in data.items() if value is not None and value != ""}


class PresenceFlow(ConfigFlow, domain=DOMAIN):
    VERSION = 1

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        errors = {}
        if user_input is not None:
            data = clean_input(user_input)
            if data.get("name"):
                await self.async_set_unique_id(uuid4().hex)
                return self.async_create_entry(title=data["name"], data=data)
            errors["name"] = "name_required"
        return self.async_show_form(step_id="user", data_schema=self.add_suggested_values_to_schema(schema(), user_input or {}), errors=errors)

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> "PresenceOptions":
        return PresenceOptions()


class PresenceOptions(OptionsFlowWithReload):
    async def async_step_init(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        errors = {}
        if user_input is not None:
            data = clean_input(user_input)
            if data.get("name"):
                self.hass.config_entries.async_update_entry(self.config_entry, title=data["name"])
                return self.async_create_entry(title="", data=data)
            errors["name"] = "name_required"
        values = user_input if user_input is not None else dict(self.config_entry.options or self.config_entry.data)
        return self.async_show_form(step_id="init", data_schema=self.add_suggested_values_to_schema(schema(), values), errors=errors)
