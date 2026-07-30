import os
import unittest
from unittest.mock import patch

from app.main import configured_cors_origins, rosbridge_sync_enabled


class DashboardConfigurationTests(unittest.TestCase):
    def test_cors_origins_are_trimmed_and_empty_values_are_ignored(self):
        with patch.dict(
            os.environ,
            {"CORS_ORIGINS": "http://localhost:5173, https://console.example.com, "},
        ):
            self.assertEqual(
                configured_cors_origins(),
                ["http://localhost:5173", "https://console.example.com"],
            )

    def test_cors_origin_defaults_to_vite(self):
        with patch.dict(os.environ, {}, clear=True):
            self.assertEqual(configured_cors_origins(), ["http://localhost:5173"])

    def test_rosbridge_sync_is_explicitly_enabled(self):
        with patch.dict(os.environ, {"ROSBRIDGE_SYNC_ENABLED": "yes"}):
            self.assertTrue(rosbridge_sync_enabled())
        with patch.dict(os.environ, {}, clear=True):
            self.assertFalse(rosbridge_sync_enabled())


if __name__ == "__main__":
    unittest.main()
