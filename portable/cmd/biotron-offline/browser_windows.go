package main

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
)

func chromiumExecutable() (string, error) {
	candidates := []string{
		filepath.Join(os.Getenv("PROGRAMFILES"), "Google", "Chrome", "Application", "chrome.exe"),
		filepath.Join(os.Getenv("PROGRAMFILES(X86)"), "Google", "Chrome", "Application", "chrome.exe"),
		filepath.Join(os.Getenv("LOCALAPPDATA"), "Google", "Chrome", "Application", "chrome.exe"),
		filepath.Join(os.Getenv("PROGRAMFILES"), "Microsoft", "Edge", "Application", "msedge.exe"),
		filepath.Join(os.Getenv("PROGRAMFILES(X86)"), "Microsoft", "Edge", "Application", "msedge.exe"),
	}
	for _, candidate := range candidates {
		if info, err := os.Stat(candidate); err == nil && !info.IsDir() {
			return candidate, nil
		}
	}
	return "", fmt.Errorf("install desktop Google Chrome or Microsoft Edge, then try again")
}

func runChromiumApp(url string) error {
	command, err := chromiumAppCommand(url)
	if err != nil {
		return err
	}
	if err := command.Run(); err != nil {
		return fmt.Errorf("browser exited with an error: %w", err)
	}
	return nil
}

func openChromiumApp(url string) error {
	command, err := chromiumAppCommand(url)
	if err != nil {
		return err
	}
	if err := command.Start(); err != nil {
		return fmt.Errorf("browser could not start: %w", err)
	}
	return command.Process.Release()
}

func chromiumAppCommand(url string) (*exec.Cmd, error) {
	executable, err := chromiumExecutable()
	if err != nil {
		return nil, err
	}
	profile := filepath.Join(os.Getenv("LOCALAPPDATA"), "Playtronica", "Biotron Settings", "ChromeProfile")
	if err := os.MkdirAll(profile, 0o700); err != nil {
		return nil, fmt.Errorf("create local browser profile: %w", err)
	}
	return exec.Command(executable,
		"--user-data-dir="+profile,
		"--app="+url,
		"--no-first-run",
		"--disable-background-mode",
		"--disable-default-apps",
	), nil
}
