# GM System monorepo

The GM System is a screening, monitoring and triage aid. It does not diagnose; laboratory confirmation remains with national laboratories. ADaM owns the official outbreak case and status.

## Repository map

- `src` is the Vite frontend (also identified as the `apps/web` package boundary).
- `services/platform-go` is the platform API and Supabase authentication boundary.
- `services/gateway-go` is the device ingestion boundary.
- `services/registry-go` is the isolated identity registry boundary.
- `services/adam-adapter-go` is the ADaM export and notification boundary.
- `services/insight-py` contains de-identified aggregate logic.
- `contracts` contains REST, event and gRPC interfaces; `infra` contains local Compose, migrations and Kubernetes starting manifests.
- `compliance` contains control evidence, approval gates and risk artefacts.

## Run the frontend and backend locally

### Prerequisites

Install Node.js 22+, Go 1.23+ and Git. The local dashboard sign-in uses the configured Supabase project; the API data endpoints are still service skeletons.

1. From the repository root, create a local environment file and fill in the service-role key from your secure local secret store:

   ```powershell
   Copy-Item .env.example .env.local
   notepad .env.local
   ```

   `SUPABASE_URL` and `SUPABASE_ANON_KEY` are prefilled with the project URL and public anon key. Put the service-role key you supplied in `SUPABASE_SERVICE_ROLE_KEY` only in this untracked local file. The service-role key is server-only and must never be added to `VITE_*` variables, frontend source, screenshots, logs or commits. Password sign-in uses the anon key; it does not require the service-role key.

2. Start the Go API in a PowerShell terminal:

   ```powershell
   Get-Content .env.local | Where-Object { $_ -match '^\s*[^#][^=]*=' } | ForEach-Object { $name, $value = $_.Split('=', 2); [Environment]::SetEnvironmentVariable($name.Trim(), $value.Trim(), 'Process') }
   Set-Location services/platform-go
   $env:GM_HTTP_ADDR = ':8082'
   go run ./cmd/platform
   ```

   The API listens on `http://127.0.0.1:8082`. Check it with `Invoke-WebRequest http://127.0.0.1:8082/health`.

3. In a second PowerShell terminal at the repository root, install dependencies and start Vite:

   ```powershell
   npm install
   $env:GM_PLATFORM_URL = 'http://127.0.0.1:8082'
   npm run dev
   ```

   Open the local URL printed by Vite. The `/api` development proxy forwards dashboard requests to the Go API. Sign in with a Supabase Auth user whose `app_metadata.role` is one of `screening_operator`, `surveillance_officer`, `clinician`, `administrator` or `auditor`; optional site scope is read from `app_metadata.sites`. Assign privileged claims through trusted Supabase administration, never from user-editable profile metadata.

4. In the Supabase dashboard, allow `http://localhost:5173/reset-password` and `http://localhost:5173/console` as redirect URLs for Auth email links. Set `GM_PUBLIC_URL` to the site origin used in production before deploying the backend.

### Evergreen account invitations

`/evergreen` is intentionally omitted from navigation. Sign in with an account whose trusted `app_metadata.role` is `administrator`; the Go API independently checks that role before accepting an invitation. The page invites users by email, then assigns their selected role and optional `sites` array in Supabase `app_metadata`. Administrator accounts must be provisioned separately by a trusted operator. The Supabase service-role key is used only by the Go backend for this admin operation.

Invitees and users requesting password recovery receive a one-time link to `/reset-password`, where they set a password. After setting an invitation password, the user signs in at `/console`. Forgot-password links are available from the console sign-in screen and Evergreen. Responses avoid confirming whether an email belongs to an account.

The backend keeps Supabase tokens in process memory and gives the browser only an opaque HttpOnly, SameSite cookie. Restarting the Go process ends local sessions. The current backend authenticates sessions and supports invitation and password recovery, but contacts, alerts, ADaM and other operational data routes are not implemented yet.

## Optional local infrastructure

PostgreSQL and the message broker can be started for work on the other service boundaries. Create local database passwords in `.env.local`, then run:

```powershell
docker compose --env-file .env.local -f infra/compose.yaml up --build
```

The Compose stack is infrastructure for development, not a production deployment. The Supabase dashboard handles identity; no local Keycloak instance is used for console authentication.

## Contracts and development checks

Edit OpenAPI, JSON Schema or protobuf sources under `contracts`. Run `python tools/check_contracts.py`; use `buf lint contracts` when Buf is installed. Web scripts include `npm run lint`, `npm run test` and `npm run build`.

## Current implementation limits

The repository still contains service skeletons. Real persistence, authorization enforcement across operational endpoints, token refresh, mTLS ingestion, key management, FHIR profile alignment, live ADaM exchange, generated clients and deployment security review require implementation and verification. No deployment, validation or regulatory approval is claimed.
