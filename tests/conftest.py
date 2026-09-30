import pytest


@pytest.fixture(autouse=True)
def custom_integrations(enable_custom_integrations):
    """Allow only test integrations from this project's custom_components."""
    yield
