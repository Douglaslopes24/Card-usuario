"""Constants shared by the local presence integration."""

DOMAIN = "presenca_viva"
VERSION = "1.0.1"
ASSET_URL = "/presenca_viva"
CONF_NAME = "name"
SOURCE_KEYS = (
    "person_entity",
    "dnd_entity",
    "transit_entity",
    "media_player_entity",
    "battery_entity",
    "steps_entity",
)
LABELS = {
    "available": "Disponível",
    "away": "Ausente",
    "do_not_disturb": "Não perturbe",
    "unavailable": "Indisponível",
    "in_transit": "Em trânsito",
    "listening": "Ouvindo música",
}
MODES = {"Automático": "auto", **{label: key for key, label in LABELS.items()}}
ICONS = {
    "available": "mdi:home-account",
    "away": "mdi:home-export-outline",
    "do_not_disturb": "mdi:minus-circle",
    "unavailable": "mdi:account-off",
    "in_transit": "mdi:walk",
    "listening": "mdi:headphones",
}
