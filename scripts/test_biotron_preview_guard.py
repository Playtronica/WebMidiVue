from __future__ import annotations

import hashlib
import json
import tarfile
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

from scripts.biotron_preview_guard import CandidateError, cloudflare_project_preflight, verify_candidate


class BiotronPreviewGuardTests(unittest.TestCase):
    build_id = "0123456789ab"
    commit = build_id + "cdef0123456789abcdef01234567"

    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        self.candidate = self.root / "candidate"
        self.dist = self.root / "source" / "dist"
        self.candidate.mkdir()
        self.dist.mkdir(parents=True)

    def tearDown(self) -> None:
        self.temporary.cleanup()

    @staticmethod
    def sha(path: Path) -> str:
        return hashlib.sha256(path.read_bytes()).hexdigest()

    def prepare(self, *, firmware_enabled: bool = False) -> tuple[Path, str]:
        files = {
            "index.html": f"<body>{self.build_id}</body>",
            "manifest.json": '{"name":"Biotron Settings Offline Beta"}',
            "service-worker.js": "self.addEventListener('fetch', () => {})",
            "_headers": "/*\n  X-Frame-Options: DENY\n  Content-Security-Policy: frame-ancestors 'none'\n  Permissions-Policy: midi=(self), camera=(), microphone=(), geolocation=()\n  Referrer-Policy: no-referrer\n  X-Robots-Tag: noindex\n",
        }
        for name, content in files.items():
            path = self.dist / name
            path.write_text(content, encoding="utf-8")
        manifest = [
            {"path": name, "bytes": (self.dist / name).stat().st_size, "sha256": self.sha(self.dist / name)}
            for name in sorted(files)
        ]
        release = {
            "schema": "playtronica.biotron-beta-release-evidence.v1",
            "product": "biotron",
            "commit": self.commit,
            "build_id": self.build_id,
            "source_clean": True,
            "firmware_update_enabled": firmware_enabled,
            "file_count": len(manifest),
            "files": manifest,
        }
        release_text = json.dumps(release, sort_keys=True)
        (self.dist / "release-evidence.json").write_text(release_text, encoding="utf-8")
        (self.candidate / "release-evidence.json").write_text(release_text, encoding="utf-8")
        (self.candidate / "test-evidence.json").write_text(json.dumps({
            "schema": "playtronica.biotron-beta-test-evidence.v1",
            "product": "biotron",
            "commit": self.commit,
            "build_id": self.build_id,
            "command": "npm run test:biotron",
            "status": "pass",
            "verified": ["secondary_service_midi_port_hidden_from_device_picker"],
        }), encoding="utf-8")
        archive = self.candidate / f"biotron-beta-{self.build_id}.tar.gz"
        with tarfile.open(archive, "w:gz") as bundle:
            bundle.add(self.dist, arcname="dist")
        return archive, self.sha(archive)

    def verify(self, archive_sha256: str) -> dict:
        extract = self.root / "extract"
        extract.mkdir(exist_ok=True)
        return verify_candidate(
            self.candidate,
            self.build_id,
            archive_sha256,
            f"candidate-{self.build_id}",
            extract,
        )

    def test_accepts_exact_general_customer_candidate(self) -> None:
        _, digest = self.prepare()
        result = self.verify(digest)
        self.assertEqual(result["status"], "verified")
        self.assertFalse(result["firmware_update_enabled"])
        self.assertIn(self.build_id, result["confirmation_token"])

    def test_rejects_wrong_archive_hash(self) -> None:
        self.prepare()
        with self.assertRaisesRegex(CandidateError, "archive SHA-256 mismatch"):
            self.verify("0" * 64)

    def test_rejects_firmware_enabled_candidate(self) -> None:
        _, digest = self.prepare(firmware_enabled=True)
        with self.assertRaisesRegex(CandidateError, "firmware_disabled"):
            self.verify(digest)

    def test_rejects_production_branch(self) -> None:
        _, digest = self.prepare()
        extract = self.root / "extract-production"
        extract.mkdir()
        with self.assertRaisesRegex(CandidateError, "production-like branch"):
            verify_candidate(self.candidate, self.build_id, digest, "production", extract)

    @patch("scripts.biotron_preview_guard.subprocess.run")
    def test_cloudflare_preflight_requires_exact_beta_project(self, run) -> None:
        wrangler = self.root / "wrangler"
        run.return_value = SimpleNamespace(
            returncode=0,
            stdout=json.dumps([{"name": "biotron-settings-beta"}, {"name": "other"}]),
            stderr="",
        )
        result = cloudflare_project_preflight(wrangler)
        self.assertEqual(result, {
            "status": "verified", "project": "biotron-settings-beta", "projects_seen": 2,
        })
        run.assert_called_once_with(
            [str(wrangler), "pages", "project", "list", "--json"],
            stdout=-1, stderr=-1, text=True,
        )

    @patch("scripts.biotron_preview_guard.subprocess.run")
    def test_cloudflare_preflight_rejects_expired_auth_before_upload(self, run) -> None:
        run.return_value = SimpleNamespace(returncode=1, stdout="", stderr="expired")
        with self.assertRaisesRegex(CandidateError, "authentication preflight failed before upload"):
            cloudflare_project_preflight(self.root / "wrangler")

    @patch("scripts.biotron_preview_guard.subprocess.run")
    def test_cloudflare_preflight_rejects_wrong_account(self, run) -> None:
        run.return_value = SimpleNamespace(
            returncode=0, stdout=json.dumps([{"name": "production-site"}]), stderr="",
        )
        with self.assertRaisesRegex(CandidateError, "cannot see the required beta project"):
            cloudflare_project_preflight(self.root / "wrangler")


if __name__ == "__main__":
    unittest.main()
