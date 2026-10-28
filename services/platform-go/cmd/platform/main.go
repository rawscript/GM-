package main

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"net/url"
	"os"
	"os/signal"
	"strings"
	"sync"
	"syscall"
	"time"
)

const sessionCookie = "gm_session"

type supabaseAuth struct {
	baseURL, anonKey, serviceKey, publicURL string
	client                                  *http.Client
	mu                                      sync.Mutex
	sessions                                map[string]authSession
}

type authSession struct {
	accessToken, refreshToken string
	expiresAt                 time.Time
	subject, role             string
	sites                     []string
}

type tokenResponse struct {
	AccessToken  string       `json:"access_token"`
	RefreshToken string       `json:"refresh_token"`
	ExpiresIn    int          `json:"expires_in"`
	User         supabaseUser `json:"user"`
}

type supabaseUser struct {
	ID          string         `json:"id"`
	AppMetadata map[string]any `json:"app_metadata"`
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}
type inviteRequest struct {
	Email string   `json:"email"`
	Role  string   `json:"role"`
	Sites []string `json:"sites"`
}

func main() {
	auth := newSupabaseAuth()
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", health)
	mux.HandleFunc("GET /ready", health)
	mux.HandleFunc("POST /api/v1/auth/login", auth.login)
	mux.HandleFunc("POST /api/v1/auth/logout", auth.logout)
	mux.HandleFunc("POST /api/v1/auth/recover", auth.recover)
	mux.HandleFunc("POST /api/v1/auth/password", auth.updatePassword)
	mux.HandleFunc("POST /api/v1/admin/users/invite", auth.inviteUser)
	mux.HandleFunc("GET /api/v1/session", auth.session)
	mux.HandleFunc("GET /api/v1/contacts", unauthenticated)
	mux.HandleFunc("GET /api/v1/alerts", unauthenticated)
	server := &http.Server{Addr: address(), Handler: securityHeaders(mux), ReadHeaderTimeout: 5 * time.Second}
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
	slog.Info("platform listening", "address", address(), "supabase_configured", auth.baseURL != "")
	if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		slog.Error("platform failed", "error", err)
		os.Exit(1)
	}
}

func newSupabaseAuth() *supabaseAuth {
	base := strings.TrimRight(os.Getenv("SUPABASE_URL"), "/")
	if parsed, err := url.Parse(base); err == nil && parsed.Scheme == "https" && parsed.Host != "" {
		base = parsed.String()
	} else {
		base = ""
	}
	publicURL := strings.TrimRight(os.Getenv("GM_PUBLIC_URL"), "/")
	if publicURL == "" {
		publicURL = "http://localhost:5173"
	}
	return &supabaseAuth{baseURL: base, anonKey: os.Getenv("SUPABASE_ANON_KEY"), serviceKey: os.Getenv("SUPABASE_SERVICE_ROLE_KEY"), publicURL: publicURL, client: &http.Client{Timeout: 8 * time.Second}, sessions: make(map[string]authSession)}
}

func (a *supabaseAuth) recover(w http.ResponseWriter, r *http.Request) {
	if a.baseURL == "" || a.anonKey == "" {
		problem(w, 503, "Password reset is not configured")
		return
	}
	r.Body = http.MaxBytesReader(w, r.Body, 16*1024)
	var input struct {
		Email string `json:"email"`
	}
	if json.NewDecoder(r.Body).Decode(&input) != nil || strings.TrimSpace(input.Email) == "" {
		problem(w, 400, "A valid email is required")
		return
	}
	body, _ := json.Marshal(map[string]string{"email": strings.TrimSpace(input.Email)})
	endpoint := a.baseURL + "/auth/v1/recover?redirect_to=" + url.QueryEscape(a.publicURL+"/reset-password")
	request, _ := http.NewRequestWithContext(r.Context(), http.MethodPost, endpoint, bytes.NewReader(body))
	request.Header.Set("apikey", a.anonKey)
	request.Header.Set("Content-Type", "application/json")
	response, err := a.client.Do(request)
	if err != nil {
		problem(w, 502, "Password reset service is unavailable")
		return
	}
	defer response.Body.Close()
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		problem(w, 400, "Could not send a password reset email")
		return
	}
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(http.StatusAccepted)
}

func (a *supabaseAuth) updatePassword(w http.ResponseWriter, r *http.Request) {
	if a.baseURL == "" || a.anonKey == "" {
		problem(w, 503, "Password reset is not configured")
		return
	}
	r.Body = http.MaxBytesReader(w, r.Body, 16*1024)
	var input struct {
		AccessToken string `json:"accessToken"`
		Password    string `json:"password"`
	}
	if json.NewDecoder(r.Body).Decode(&input) != nil || input.AccessToken == "" || len(input.Password) < 8 {
		problem(w, 400, "A valid recovery link and a password of at least 8 characters are required")
		return
	}
	request, _ := http.NewRequestWithContext(r.Context(), http.MethodPut, a.baseURL+"/auth/v1/user", bytes.NewReader(mustJSON(map[string]string{"password": input.Password})))
	request.Header.Set("apikey", a.anonKey)
	request.Header.Set("Authorization", "Bearer "+input.AccessToken)
	request.Header.Set("Content-Type", "application/json")
	response, err := a.client.Do(request)
	if err != nil {
		problem(w, 502, "Password reset service is unavailable")
		return
	}
	defer response.Body.Close()
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		problem(w, 400, "The recovery link is invalid or expired")
		return
	}
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(http.StatusNoContent)
}

func (a *supabaseAuth) inviteUser(w http.ResponseWriter, r *http.Request) {
	if a.serviceKey == "" {
		problem(w, 503, "Account invitations are not configured")
		return
	}
	current, ok := a.currentSession(r)
	if !ok || current.role != "administrator" {
		problem(w, 403, "Administrator access required")
		return
	}
	r.Body = http.MaxBytesReader(w, r.Body, 16*1024)
	var input inviteRequest
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if decoder.Decode(&input) != nil || strings.TrimSpace(input.Email) == "" || !validRole(input.Role) || input.Role == "administrator" {
		problem(w, 400, "Provide an email, a supported non-administrator role and optional site scopes")
		return
	}
	email := strings.TrimSpace(input.Email)
	inviteURL := a.baseURL + "/auth/v1/invite?redirect_to=" + url.QueryEscape(a.publicURL+"/reset-password")
	inviteBody, _ := json.Marshal(map[string]string{"email": email})
	request, _ := http.NewRequestWithContext(r.Context(), http.MethodPost, inviteURL, bytes.NewReader(inviteBody))
	request.Header.Set("apikey", a.serviceKey)
	request.Header.Set("Authorization", "Bearer "+a.serviceKey)
	request.Header.Set("Content-Type", "application/json")
	response, err := a.client.Do(request)
	if err != nil {
		problem(w, 502, "Invitation service is unavailable")
		return
	}
	defer response.Body.Close()
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		problem(w, 400, "Could not invite this account")
		return
	}
	var invited supabaseUser
	if json.NewDecoder(io.LimitReader(response.Body, 64*1024)).Decode(&invited) != nil || invited.ID == "" {
		problem(w, 502, "Invitation response was invalid")
		return
	}
	for i, site := range input.Sites {
		input.Sites[i] = strings.TrimSpace(site)
	}
	claimBody, _ := json.Marshal(map[string]any{"app_metadata": map[string]any{"role": input.Role, "sites": input.Sites}})
	adminURL := a.baseURL + "/auth/v1/admin/users/" + url.PathEscape(invited.ID)
	request, _ = http.NewRequestWithContext(r.Context(), http.MethodPut, adminURL, bytes.NewReader(claimBody))
	request.Header.Set("apikey", a.serviceKey)
	request.Header.Set("Authorization", "Bearer "+a.serviceKey)
	request.Header.Set("Content-Type", "application/json")
	response, err = a.client.Do(request)
	if err != nil {
		problem(w, 502, "Account role could not be assigned")
		return
	}
	defer response.Body.Close()
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		problem(w, 502, "Account role could not be assigned; disable the pending invite and retry")
		return
	}
	w.Header().Set("Cache-Control", "no-store")
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{"status": "invited", "email": email, "role": input.Role})
}

func (a *supabaseAuth) currentSession(r *http.Request) (authSession, bool) {
	cookie, err := r.Cookie(sessionCookie)
	if err != nil {
		return authSession{}, false
	}
	a.mu.Lock()
	current, ok := a.sessions[cookie.Value]
	a.mu.Unlock()
	if !ok || current.role == "" || !time.Now().Before(current.expiresAt) {
		return authSession{}, false
	}
	request, _ := http.NewRequestWithContext(r.Context(), http.MethodGet, a.baseURL+"/auth/v1/user", nil)
	request.Header.Set("apikey", a.anonKey)
	request.Header.Set("Authorization", "Bearer "+current.accessToken)
	response, err := a.client.Do(request)
	if err != nil {
		return authSession{}, false
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return authSession{}, false
	}
	var user supabaseUser
	if json.NewDecoder(io.LimitReader(response.Body, 64*1024)).Decode(&user) != nil || user.ID != current.subject {
		return authSession{}, false
	}
	role, _ := user.AppMetadata["role"].(string)
	if role != current.role {
		return authSession{}, false
	}
	return current, true
}

func mustJSON(value any) []byte {
	body, _ := json.Marshal(value)
	return body
}

func (a *supabaseAuth) login(w http.ResponseWriter, r *http.Request) {
	if a.baseURL == "" || a.anonKey == "" {
		problem(w, 503, "Sign-in is not configured")
		return
	}
	r.Body = http.MaxBytesReader(w, r.Body, 16*1024)
	var input loginRequest
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if decoder.Decode(&input) != nil || strings.TrimSpace(input.Email) == "" || input.Password == "" {
		problem(w, 400, "Valid email and password are required")
		return
	}
	body, _ := json.Marshal(map[string]string{"email": input.Email, "password": input.Password})
	request, _ := http.NewRequestWithContext(r.Context(), http.MethodPost, a.baseURL+"/auth/v1/token?grant_type=password", bytes.NewReader(body))
	request.Header.Set("apikey", a.anonKey)
	request.Header.Set("Content-Type", "application/json")
	response, err := a.client.Do(request)
	if err != nil {
		problem(w, 502, "Sign-in service is unavailable")
		return
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		problem(w, 401, "Email or password was not accepted")
		return
	}
	var token tokenResponse
	if json.NewDecoder(io.LimitReader(response.Body, 64*1024)).Decode(&token) != nil || token.AccessToken == "" || token.RefreshToken == "" || token.User.ID == "" {
		problem(w, 502, "Sign-in response was invalid")
		return
	}
	role, _ := token.User.AppMetadata["role"].(string)
	if !validRole(role) {
		problem(w, 403, "This account does not have an approved operations role")
		return
	}
	sites := stringArray(token.User.AppMetadata["sites"])
	key, err := randomKey()
	if err != nil {
		problem(w, 500, "Could not create a session")
		return
	}
	expires := time.Now().Add(time.Duration(token.ExpiresIn) * time.Second)
	a.mu.Lock()
	a.sessions[key] = authSession{token.AccessToken, token.RefreshToken, expires, token.User.ID, role, sites}
	a.mu.Unlock()
	http.SetCookie(w, &http.Cookie{Name: sessionCookie, Value: key, Path: "/", HttpOnly: true, Secure: isSecureRequest(r), SameSite: http.SameSiteLaxMode, Expires: expires, MaxAge: token.ExpiresIn})
	w.Header().Set("Cache-Control", "no-store")
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{"subject": token.User.ID, "role": role, "sites": sites})
}

func (a *supabaseAuth) session(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie(sessionCookie)
	if err != nil {
		problem(w, 401, "Authentication required")
		return
	}
	a.mu.Lock()
	current, ok := a.sessions[cookie.Value]
	a.mu.Unlock()
	if !ok || time.Now().After(current.expiresAt) {
		problem(w, 401, "Authentication required")
		return
	}
	request, _ := http.NewRequestWithContext(r.Context(), http.MethodGet, a.baseURL+"/auth/v1/user", nil)
	request.Header.Set("apikey", a.anonKey)
	request.Header.Set("Authorization", "Bearer "+current.accessToken)
	response, err := a.client.Do(request)
	if err != nil {
		problem(w, 502, "Sign-in service is unavailable")
		return
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		a.removeSession(cookie.Value)
		clearCookie(w, r)
		problem(w, 401, "Authentication required")
		return
	}
	var user supabaseUser
	if json.NewDecoder(io.LimitReader(response.Body, 64*1024)).Decode(&user) != nil || user.ID != current.subject {
		a.removeSession(cookie.Value)
		clearCookie(w, r)
		problem(w, 401, "Authentication required")
		return
	}
	w.Header().Set("Cache-Control", "no-store")
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{"subject": current.subject, "role": current.role, "sites": current.sites})
}

func (a *supabaseAuth) logout(w http.ResponseWriter, r *http.Request) {
	if cookie, err := r.Cookie(sessionCookie); err == nil {
		a.removeSession(cookie.Value)
	}
	clearCookie(w, r)
	w.WriteHeader(http.StatusNoContent)
}

func (a *supabaseAuth) removeSession(key string) {
	a.mu.Lock()
	delete(a.sessions, key)
	a.mu.Unlock()
}
func validRole(role string) bool {
	switch role {
	case "screening_operator", "surveillance_officer", "clinician", "administrator", "auditor":
		return true
	}
	return false
}
func stringArray(value any) []string {
	values, ok := value.([]any)
	if !ok {
		return []string{}
	}
	result := make([]string, 0, len(values))
	for _, item := range values {
		if text, ok := item.(string); ok && text != "" {
			result = append(result, text)
		}
	}
	return result
}
func randomKey() (string, error) {
	raw := make([]byte, 32)
	if _, err := rand.Read(raw); err != nil {
		return "", err
	}
	return hex.EncodeToString(raw), nil
}
func isSecureRequest(r *http.Request) bool {
	return r.TLS != nil || strings.EqualFold(r.Header.Get("X-Forwarded-Proto"), "https")
}
func clearCookie(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{Name: sessionCookie, Value: "", Path: "/", HttpOnly: true, Secure: isSecureRequest(r), SameSite: http.SameSiteLaxMode, MaxAge: -1})
}
func securityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("Cache-Control", "no-store")
		next.ServeHTTP(w, r)
	})
}
func problem(w http.ResponseWriter, status int, title string) {
	w.Header().Set("Content-Type", "application/problem+json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]any{"type": "about:blank", "title": title, "status": status})
}
func health(w http.ResponseWriter, r *http.Request)  { w.WriteHeader(http.StatusNoContent) }
func unauthenticated(w http.ResponseWriter, r *http.Request) {
	problem(w, http.StatusUnauthorized, "Authentication required")
}
func address() string {
	if value := os.Getenv("GM_HTTP_ADDR"); value != "" {
		return value
	}
	return ":8082"
}