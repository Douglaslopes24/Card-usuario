from unittest.mock import patch

import pytest
from homeassistant.components.frontend import DATA_EXTRA_MODULE_URL
from homeassistant.data_entry_flow import FlowResultType
from homeassistant.setup import async_setup_component
from pytest_homeassistant_custom_component.common import MockConfigEntry, mock_restore_cache
from homeassistant.core import State

from custom_components.presenca_viva.const import DOMAIN


def states_for(hass, entry):
    coordinator = entry.runtime_data
    sensor = next(s for s in hass.states.async_all("sensor") if s.attributes.get("presenca_viva") and s.attributes.get("name") == coordinator.settings["name"])
    return sensor, hass.states.get(coordinator.select_entity_id)


@pytest.fixture
async def profile(hass):
    assert await async_setup_component(hass, "frontend", {})
    hass.states.async_set("person.maicon", "home")
    hass.states.async_set("input_boolean.dnd", "off")
    hass.states.async_set("sensor.activity", "still")
    entry = MockConfigEntry(domain=DOMAIN, title="Maicon", data={"name": "Maicon", "person_entity": "person.maicon", "dnd_entity": "input_boolean.dnd", "transit_entity": "sensor.activity", "headphones": True})
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry


async def test_ui_flow(hass):
    form = await hass.config_entries.flow.async_init(DOMAIN, context={"source": "user"})
    assert form["type"] is FlowResultType.FORM
    with patch("custom_components.presenca_viva.async_setup_entry", return_value=True):
        result = await hass.config_entries.flow.async_configure(form["flow_id"], {"name": " Maicon ", "headphones": True})
        await hass.async_block_till_done()
    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["title"] == "Maicon"
    assert result["data"]["name"] == "Maicon"


async def test_empty_name(hass):
    form = await hass.config_entries.flow.async_init(DOMAIN, context={"source": "user"})
    result = await hass.config_entries.flow.async_configure(form["flow_id"], {"name": "   ", "headphones": True})
    assert result["type"] is FlowResultType.FORM
    assert result["errors"] == {"name": "name_required"}


async def test_entities_and_automatic_states(hass, profile):
    sensor, select = states_for(hass, profile)
    assert sensor.state == "available"
    assert select.state == "Automático"
    assert sensor.attributes["mode_entity"] == select.entity_id
    assert "/presenca_viva/presenca-viva-card.js?v=1.0.0" in hass.data[DATA_EXTRA_MODULE_URL].urls
    for entity, value, expected in [("person.maicon", "not_home", "away"), ("sensor.activity", "in_vehicle", "in_transit"), ("input_boolean.dnd", "on", "do_not_disturb"), ("person.maicon", "unavailable", "unavailable")]:
        hass.states.async_set(entity, value)
        await hass.async_block_till_done()
        assert hass.states.get(sensor.entity_id).state == expected


async def test_manual_then_auto(hass, profile):
    sensor, select = states_for(hass, profile)
    await hass.services.async_call("select", "select_option", {"entity_id": select.entity_id, "option": "Não perturbe"}, blocking=True)
    await hass.async_block_till_done()
    hass.states.async_set("person.maicon", "not_home")
    await hass.async_block_till_done()
    assert hass.states.get(sensor.entity_id).state == "do_not_disturb"
    await hass.services.async_call("select", "select_option", {"entity_id": select.entity_id, "option": "Automático"}, blocking=True)
    await hass.async_block_till_done()
    assert hass.states.get(sensor.entity_id).state == "away"


async def test_manual_survives_reload(hass, profile):
    sensor, select = states_for(hass, profile)
    await hass.services.async_call("select", "select_option", {"entity_id": select.entity_id, "option": "Indisponível"}, blocking=True)
    await hass.async_block_till_done()
    assert await hass.config_entries.async_reload(profile.entry_id)
    await hass.async_block_till_done()
    sensor2, select2 = states_for(hass, profile)
    assert select2.entity_id == select.entity_id
    assert select2.state == "Indisponível"
    assert sensor2.state == "unavailable"


async def test_options_clear_sources(hass, profile):
    form = await hass.config_entries.options.async_init(profile.entry_id)
    result = await hass.config_entries.options.async_configure(form["flow_id"], {"name": "Maicon", "headphones": False})
    await hass.async_block_till_done()
    assert result["type"] is FlowResultType.CREATE_ENTRY
    sensor, select = states_for(hass, profile)
    assert sensor.attributes["person_entity"] is None
    assert sensor.attributes["headphones"] is False
    hass.states.async_set("person.maicon", "unavailable")
    await hass.async_block_till_done()
    assert hass.states.get(sensor.entity_id).state == "available"


async def test_restores_mode_from_previous_start(hass):
    assert await async_setup_component(hass, "frontend", {})
    mock_restore_cache(hass, [State("select.maicon_modo", "Em trânsito")])
    entry = MockConfigEntry(domain=DOMAIN, title="Maicon", data={"name": "Maicon", "headphones": True})
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    sensor, select = states_for(hass, entry)
    assert select.state == "Em trânsito"
    assert sensor.state == "in_transit"


async def test_shared_assets_once(hass, profile):
    entry = MockConfigEntry(domain=DOMAIN, title="Outro", data={"name": "Outro", "headphones": True})
    entry.add_to_hass(hass)
    with patch.object(hass.http, "async_register_static_paths", wraps=hass.http.async_register_static_paths) as register:
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()
        register.assert_not_called()
    assert await hass.config_entries.async_unload(profile.entry_id)
    await hass.async_block_till_done()
    assert states_for(hass, entry)[0].state == "available"


async def test_assets_served(hass, profile, hass_client):
    client = await hass_client()
    for path in ("/presenca_viva/presenca-viva-card.js", "/presenca_viva/assets/available.webp", "/presenca_viva/assets/in_transit.webp"):
        response = await client.get(path)
        assert response.status == 200
        assert len(await response.read()) > 1000
