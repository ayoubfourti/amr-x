import unittest

from app.controllers.user import hash_password, verify_password


class PasswordVerificationTests(unittest.TestCase):
    def test_bcrypt_password_round_trip(self):
        password_hash = hash_password("correct horse battery staple")

        self.assertTrue(verify_password("correct horse battery staple", password_hash))
        self.assertFalse(verify_password("incorrect", password_hash))

    def test_legacy_plaintext_comparison(self):
        self.assertTrue(verify_password("legacy-password", "legacy-password"))
        self.assertFalse(verify_password("different", "legacy-password"))

    def test_empty_or_malformed_hash_is_rejected(self):
        self.assertFalse(verify_password("password", ""))
        self.assertFalse(verify_password("password", "$2b$invalid"))


if __name__ == "__main__":
    unittest.main()
