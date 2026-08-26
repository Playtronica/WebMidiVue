package launcher

import (
	"encoding/json"
	"io/fs"
	"net/http"
	"net/http/httptest"
	"testing"
	"testing/fstest"
)

func testContent() fs.FS {
	return fstest.MapFS{
		"index.html":        {Data: []byte("<main>Biotron Settings</main>")},
		"js/app.123.js":     {Data: []byte("window.ready=true")},
		"manifest.json":     {Data: []byte(`{"name":"Settings"}`)},
		"service-worker.js": {Data: []byte("self.skipWaiting = undefined")},
	}
}

func request(t *testing.T, handler http.Handler, target string) *httptest.ResponseRecorder {
	t.Helper()
	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, target, nil)
	request.Host = AllowedHost
	handler.ServeHTTP(recorder, request)
	return recorder
}

func TestRuntimeIdentifiesPortableArtifact(t *testing.T) {
	response := request(t, NewServer(testContent(), "beta-abc123"), "/__biotron/runtime.json")
	if response.Code != http.StatusOK || response.Header().Get("Content-Type") != "application/json; charset=utf-8" {
		t.Fatalf("unexpected runtime response: %d %q", response.Code, response.Header().Get("Content-Type"))
	}
	var runtime Runtime
	if err := json.Unmarshal(response.Body.Bytes(), &runtime); err != nil {
		t.Fatal(err)
	}
	if runtime.Application != ApplicationID || !runtime.Portable || runtime.Version != "beta-abc123" {
		t.Fatalf("unexpected runtime payload: %#v", runtime)
	}
}

func TestServesAssetsAndSpaFallback(t *testing.T) {
	handler := NewServer(testContent(), "test")
	asset := request(t, handler, "/js/app.123.js")
	if asset.Code != http.StatusOK || asset.Body.String() != "window.ready=true" {
		t.Fatalf("asset failed: %d %q", asset.Code, asset.Body.String())
	}
	page := request(t, handler, "/biotron")
	if page.Code != http.StatusOK || page.Body.String() != "<main>Biotron Settings</main>" {
		t.Fatalf("SPA fallback failed: %d %q", page.Code, page.Body.String())
	}
}

func TestTraversalCannotEscapeEmbeddedContent(t *testing.T) {
	response := request(t, NewServer(testContent(), "test"), "/../../../../etc/passwd")
	if response.Code != http.StatusOK || response.Body.String() != "<main>Biotron Settings</main>" {
		t.Fatalf("path traversal did not fail closed: %d %q", response.Code, response.Body.String())
	}
}

func TestSecurityHeadersAndHealth(t *testing.T) {
	response := request(t, NewServer(testContent(), "test"), "/__biotron/health")
	if response.Body.String() != ApplicationID {
		t.Fatalf("unexpected health body: %q", response.Body.String())
	}
	if response.Header().Get("X-Content-Type-Options") != "nosniff" ||
		response.Header().Get("Referrer-Policy") != "no-referrer" ||
		response.Header().Get("X-Frame-Options") != "DENY" ||
		response.Header().Get("Cross-Origin-Resource-Policy") != "same-origin" ||
		response.Header().Get("Content-Security-Policy") == "" {
		t.Fatal("portable server security headers are missing")
	}
}

func TestRejectsUnexpectedHost(t *testing.T) {
	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, "/__biotron/health", nil)
	request.Host = "attacker.example"
	NewServer(testContent(), "test").ServeHTTP(recorder, request)
	if recorder.Code != http.StatusForbidden {
		t.Fatalf("unexpected host was accepted: %d", recorder.Code)
	}
}
