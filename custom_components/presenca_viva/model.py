"""Presence rules, independent of Home Assistant for deterministic tests."""

from collections.abc import Mapping
import unicodedata

from .const import LABELS, MODES

UNKNOWN = {"unknown", "unavailable", "", "none"}
ACTIVE = {"on", "true", "1", "enabled", "active", "priority_only", "alarms_only", "total_silence", "nao perturbe"}
MOVING = ACTIVE | {"in_vehicle", "in vehicle", "on_bicycle", "on bicycle", "walking", "running", "automotive", "cycling", "em transito", "in_transit"}


def normalized(value: str | None) -> str:
    """Normalize only input state values, never entity identifiers."""
    return "".join(
        c for c in unicodedata.normalize("NFKD", str(value or "").strip().lower())
        if not unicodedata.combining(c)
    )


def resolve_status(mode: str, states: Mapping[str, str | None]) -> tuple[str, str]:
    """Manual override; then source health, DND, transit, away, music, home.

    A missing optional source does not make a healthy person unavailable.
    The person key being absent means a deliberately manual-only profile.
    """
    manual = MODES.get(mode, "auto")
    if manual in LABELS:
        return manual, "Estado escolhido manualmente"
    person = normalized(states.get("person_entity"))
    if "person_entity" in states and person in UNKNOWN:
        return "unavailable", "A entidade da pessoa está sem dados"
    if normalized(states.get("dnd_entity")) in ACTIVE:
        return "do_not_disturb", "Não perturbe ativado no sensor vinculado"
    if normalized(states.get("transit_entity")) in MOVING:
        return "in_transit", "Movimento detectado pelo sensor vinculado"
    if "person_entity" in states and person != "home":
        return "away", "Pessoa fora da zona Casa"
    if normalized(states.get("media_player_entity")) == "playing":
        return "listening", "Reprodutor vinculado está tocando"
    if "person_entity" not in states:
        return "available", "Sem pessoa vinculada; perfil manual"
    return "available", "Pessoa na zona Casa"
