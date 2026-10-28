# Platform service

Go HTTP API and backend-for-frontend for the GM console. Supabase Auth handles password sign-in and recovery. The service keeps access and refresh tokens in memory and gives the browser an opaque HttpOnly, SameSite cookie. The `/evergreen` provisioning UI is intentionally unlisted; `POST /api/v1/admin/users/invite` independently requires a live Supabase session with the trusted `administrator` role.

Set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` and `GM_PUBLIC_URL`, then run `go run ./cmd/platform` (default listen address `:8082`; override with `GM_HTTP_ADDR`). The service-role key is used only server-side for admin invitations and app-metadata claims. Never place it in browser code or logs.

The invitation action assigns a supported non-administrator role and optional site scopes in `app_metadata`. A trusted operator must provision the first administrator separately. Supabase Auth redirect allow-list entries and email templates must support the configured public URLs. The current session store is process memory, so restarts end sessions; token refresh and operational data endpoints remain unimplemented.
