package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

func main() {
	if os.Getenv("GM_OIDC_ISSUER") == "" && os.Getenv("GM_PLATFORM_MODE") != "development" {
		slog.Error("OIDC issuer is required")
		os.Exit(1)
	}
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", health)
	mux.HandleFunc("GET /ready", health)
	mux.HandleFunc("GET /api/v1/session", unauthenticated)
	mux.HandleFunc("GET /api/v1/contacts", unauthenticated)
	mux.HandleFunc("GET /api/v1/alerts", unauthenticated)
	server := &http.Server{Addr: address(), Handler: mux, ReadHeaderTimeout: 5 * time.Second}
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()
	go func() {
		<-ctx.Done()
		shutdown, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		if err := server.Shutdown(shutdown); err != nil {
			slog.Error("platform shutdown failed", "error", err)
		}
	}()
	if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		slog.Error("platform failed", "error", err)
		os.Exit(1)
	}
}

func health(writer http.ResponseWriter, request *http.Request) {
	writer.WriteHeader(http.StatusNoContent)
}

func unauthenticated(writer http.ResponseWriter, request *http.Request) {
	writer.Header().Set("Content-Type", "application/problem+json")
	writer.WriteHeader(http.StatusUnauthorized)
	_, _ = writer.Write([]byte(`{"type":"about:blank","title":"Authentication required","status":401}`))
}

func address() string {
	if value := os.Getenv("GM_HTTP_ADDR"); value != "" {
		return value
	}
	return ":8082"
}
