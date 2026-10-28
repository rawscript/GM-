package main

import (
	"log/slog"
	"os"
)

func main() {
	if os.Getenv("GM_ADAM_PHASE") == "" {
		slog.Error("ADaM phase must be explicitly configured")
		os.Exit(1)
	}
	if os.Getenv("GM_ADAM_PHASE") != "standalone" && os.Getenv("GM_ADAM_PHASE") != "outbound" {
		slog.Error("monitoring link and profile control require confirmed interfaces and remain disabled")
		os.Exit(1)
	}
	slog.Error("ADaM encoder and delivery adapter require the agreed national interface")
	os.Exit(1)
}
