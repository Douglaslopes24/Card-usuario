import pytest

from custom_components.presenca_viva.model import resolve_status


@pytest.mark.parametrize(("mode", "sources", "expected"), [
    ("Automático", {"person_entity": "home"}, "available"),
    ("Automático", {"person_entity": "not_home"}, "away"),
    ("Automático", {"person_entity": "Trabalho"}, "away"),
    ("Automático", {"person_entity": "unavailable"}, "unavailable"),
    ("Automático", {"person_entity": None}, "unavailable"),
    ("Automático", {"person_entity": "unknown", "dnd_entity": "on"}, "unavailable"),
    ("Automático", {"person_entity": "home", "dnd_entity": "on", "transit_entity": "walking"}, "do_not_disturb"),
    ("Automático", {"person_entity": "home", "dnd_entity": "priority_only"}, "do_not_disturb"),
    ("Automático", {"person_entity": "home", "dnd_entity": "off"}, "available"),
    ("Automático", {"person_entity": "not_home", "transit_entity": "in_vehicle"}, "in_transit"),
    ("Automático", {"person_entity": "home", "transit_entity": "Em trânsito"}, "in_transit"),
    ("Automático", {"person_entity": "home", "media_player_entity": "playing"}, "listening"),
    ("Automático", {"person_entity": "not_home", "media_player_entity": "playing"}, "away"),
    ("Automático", {"person_entity": "home", "battery_entity": "unavailable"}, "available"),
    ("Automático", {}, "available"),
    ("Disponível", {"person_entity": "unavailable", "dnd_entity": "on"}, "available"),
    ("Ausente", {"person_entity": "home"}, "away"),
    ("Não perturbe", {"person_entity": "home"}, "do_not_disturb"),
    ("Indisponível", {"person_entity": "home"}, "unavailable"),
    ("Em trânsito", {"person_entity": "home"}, "in_transit"),
    ("Ouvindo música", {"person_entity": "home"}, "listening"),
])
def test_presence_rules(mode, sources, expected):
    assert resolve_status(mode, sources)[0] == expected
