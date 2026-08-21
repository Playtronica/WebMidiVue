package launcher

import (
	"encoding/json"
	"errors"
	"io/fs"
	"mime"
	"net/http"
	"path"
	"strings"
)

const ApplicationID = "playtronica-biotron-settings"
const AllowedHost = "127.0.0.1:17673"

type Runtime struct {
	Application string `json:"application"`
	Portable    bool   `json:"portable"`
	Version     string `json:"version"`
}

type Server struct {
	content fs.FS
	runtime Runtime
}

func NewServer(content fs.FS, version string) http.Handler {
	return &Server{
		content: content,
		runtime: Runtime{Application: ApplicationID, Portable: true, Version: version},
	}
}

func (server *Server) ServeHTTP(response http.ResponseWriter, request *http.Request) {
	if request.Host != AllowedHost {
		http.Error(response, "Invalid local host.", http.StatusForbidden)
		return
	}
	response.Header().Set("Cache-Control", "no-store")
	response.Header().Set("Referrer-Policy", "no-referrer")
	response.Header().Set("X-Content-Type-Options", "nosniff")
	response.Header().Set("X-Frame-Options", "DENY")
	response.Header().Set("Cross-Origin-Resource-Policy", "same-origin")
	response.Header().Set("Content-Security-Policy", "default-src 'self'; connect-src 'self' https://api.github.com; font-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; style-src 'self' 'unsafe-inline'")

	switch request.URL.Path {
	case "/__biotron/health":
		response.Header().Set("Content-Type", "text/plain; charset=utf-8")
		response.WriteHeader(http.StatusOK)
		_, _ = response.Write([]byte(ApplicationID))
		return
	case "/__biotron/runtime.json":
		response.Header().Set("Content-Type", "application/json; charset=utf-8")
		_ = json.NewEncoder(response).Encode(server.runtime)
		return
	}

	requested := strings.TrimPrefix(path.Clean("/"+request.URL.Path), "/")
	if requested == "." || requested == "" {
		requested = "index.html"
	}

	data, err := fs.ReadFile(server.content, requested)
	if err != nil {
		if !errors.Is(err, fs.ErrNotExist) {
			http.Error(response, "Could not read embedded Settings.", http.StatusInternalServerError)
			return
		}
		requested = "index.html"
		data, err = fs.ReadFile(server.content, requested)
		if err != nil {
			http.Error(response, "Embedded Settings are incomplete.", http.StatusInternalServerError)
			return
		}
	}

	contentType := mime.TypeByExtension(path.Ext(requested))
	if contentType == "" {
		contentType = "application/octet-stream"
	}
	response.Header().Set("Content-Type", contentType)
	response.WriteHeader(http.StatusOK)
	_, _ = response.Write(data)
}
