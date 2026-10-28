package main

import (
	"log/slog"
	"os"
)

func main() {
	if os.Getenv("GM_KMS_ENDPOINT") == "" {
		slog.Error("key management endpoint is required; registry will not start without encryption")
		os.Exit(1)
	}
	slog.Error("registry adapters are not configured")
	os.Exit(1)
}
