package main

import (
	"context"
	"embed"
	"fmt"
	"io"
	"io/fs"
	"log"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/Playtronica/WebMidiVue/portable/internal/launcher"
)

const (
	listenAddress = "127.0.0.1:17673"
	settingsURL   = "http://127.0.0.1:17673/#/biotron"
)

var buildVersion = "development"

// The build script replaces this placeholder directory with the complete
// production dist before compiling the Windows binary.
//
//go:embed web
var embedded embed.FS

func main() {
	logger, closeLog := newLogger()
	defer closeLog()

	content, err := fs.Sub(embedded, "web")
	if err != nil {
		fail(logger, "Biotron Settings", fmt.Errorf("embedded files: %w", err))
		return
	}

	listener, err := net.Listen("tcp4", listenAddress)
	if err != nil {
		if portableServerIsRunning() {
			if openChromiumApp(settingsURL) != nil {
				fail(logger, "Biotron Settings is already running", err)
			}
			return
		}
		fail(logger, "Biotron Settings could not start", fmt.Errorf("local port %s is unavailable: %w", listenAddress, err))
		return
	}

	server := &http.Server{
		Handler:           launcher.NewServer(content, buildVersion),
		ReadHeaderTimeout: 5 * time.Second,
		IdleTimeout:       30 * time.Second,
	}
	serveDone := make(chan error, 1)
	go func() { serveDone <- server.Serve(listener) }()

	if err := runChromiumApp(settingsURL); err != nil {
		_ = server.Close()
		fail(logger, "Chrome or Edge could not open Biotron Settings", err)
		return
	}

	shutdownContext, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	_ = server.Shutdown(shutdownContext)
	select {
	case err := <-serveDone:
		if err != nil && err != http.ErrServerClosed {
			logger.Printf("server stopped: %v", err)
		}
	case <-shutdownContext.Done():
		logger.Printf("server shutdown timed out")
	}
}

func portableServerIsRunning() bool {
	client := http.Client{Timeout: time.Second}
	response, err := client.Get("http://" + listenAddress + "/__biotron/health")
	if err != nil {
		return false
	}
	defer response.Body.Close()
	body, err := io.ReadAll(io.LimitReader(response.Body, 128))
	return err == nil && response.StatusCode == http.StatusOK &&
		response.Header.Get("Content-Type") == "text/plain; charset=utf-8" &&
		string(body) == launcher.ApplicationID
}

func newLogger() (*log.Logger, func()) {
	root := filepath.Join(os.Getenv("LOCALAPPDATA"), "Playtronica", "Biotron Settings")
	_ = os.MkdirAll(root, 0o700)
	file, err := os.OpenFile(filepath.Join(root, "launcher.log"), os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0o600)
	if err != nil {
		return log.New(os.Stderr, "biotron-settings: ", log.LstdFlags), func() {}
	}
	return log.New(file, "biotron-settings: ", log.LstdFlags), func() { _ = file.Close() }
}

func fail(logger *log.Logger, title string, err error) {
	logger.Printf("%s: %v", title, err)
	showError(title, err.Error()+"\n\nNo administrator access is required. Send this message to support@playtronica.com.")
}
