# Vulnerable-sandbox

## Description

~~PD day homeowrk on OWASP top 10 study~~

A .NET 10 + React demo used to illustrate common web vulnerabilities (SQL injection, XSS, CSRF, SSRF) against deliberately insecure endpoints alongside properly protected ones.

## Pre-requisites

- [.NET 10](https://dotnet.microsoft.com/en-us/download/dotnet/10.0)
- [Node.js 20](https://nodejs.org/en)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

## First Time Setup

- Clone the repository to your local machine.
- Open a terminal and navigate to the root of the project.
- Run `docker compose up -d` to start a SQL Server container on port `1407`.
- Create the databases, schema and seed data. (This script is re-runnable. Run it again any time to reset to a clean slate.)
  ```bash
  sqlcmd -S localhost,1407 -U sa -P 'SuperSecure0!' -C -i Database/setup.sql
  
  # or in docker
  docker exec -i VulnerableSandbox_Database /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P 'SuperSecure0!' -C < Database/setup.sql
   ```
- Run `dotnet restore` to install backend NuGet packages.
- Run `npm install` in `Web/client-app`.
  ```bash
  # --legacy-peer-deps flag works around an npm 10.9.x arborist bug 
  cd Web/client-app && npm install --legacy-peer-deps
   ```
- For local database connection: 
  ```
  Server=localhost,1407;Database=VulnerableSandbox;User Id=sa;Password=SuperSecure0!;Encrypt=False;TrustServerCertificate=True;
  ```

## Running the Application

Once you have completed the above steps, you can either:

- Start the application by running the `Run Web App` run configuration in Rider.
- Run the backend and frontend independently by running the following commands in separate terminals:
  - `dotnet watch run --project Web` to start the backend.
  - `cd Web/client-app && npm run dev` to start the frontend.

This will start the ASP.NET backend running on port `5000`, and the React/Vite frontend running on port `3000`.
Requests to `/api` on the frontend will be automatically proxied to the backend, so the application should be accessed
from https://localhost:3000.

## Running the Tests

- `dotnet test` to run the backend integration tests (requires the database container).
- `cd Web/client-app && npm run test:ci` to run the frontend unit tests.

--- 

## Demo Guide

Each card on the home page is a live feature wired to a real endpoint; most have a Vulnerable vs Protected toggle so the exploit and the fix can be compared side by side while the site runs.

### 1. SQL Injection — "User Search"

- **OWASP 2025:** A05 Injection
- **Endpoint:** `GET /api/user/SearchUsers` — `Web/Features/Users/SearchUsers.cs`

**What it is.** The search query is concatenated straight into a SQL string, so
input is treated as *code*, not *data*. An attacker can rewrite the query's logic.

**How to demo.**
1. Type a normal name (e.g. `Alice`) → one match. This looks like an ordinary
   search box.
2. Now type the payload shown on the card: `' OR '1'='1`
3. Every user is returned — the `WHERE` clause was neutralised.

**Proof of concept.** The server builds
`... WHERE Name LIKE '%' OR '1'='1%'`, which is always true. The same technique
extends to `UNION SELECT` (steal other tables), stacked queries, or `; DROP`.

**The fix — "Protected Data Access" card.** `GetProtectedUsers` uses a
**parameterised query** (input is bound, never concatenated) and requires an API
key. Injection payloads are treated as a literal search string and do nothing.

**Real-world examples.** The 2008 Heartland breach (130M+ cards), countless
WordPress plugin CVEs, and the 2011 Sony Pictures dump all started with SQL
injection. It remains one of the most common classes of web vulnerability.

---

### 2. Stored (Persistent) XSS — "Comments"

- **OWASP 2025:** A05 Injection
- **Endpoints:** `POST /api/comment/AddComment`, `GET /api/comment/GetComments`
  — `Web/Features/Comments/`

**What it is.** A comment is stored **verbatim** and later rendered to *every*
visitor. If the page renders it as HTML, any script in the comment runs in each
victim's browser. Because it is persisted, it fires for everyone who loads the
page — that is what makes *stored* XSS worse than reflected.

**How to demo.**
1. Leave the toggle on **Vulnerable (innerHTML)**.
2. Post the comment: `<img src=x onerror=alert(document.cookie)>`
3. The alert fires immediately — and will fire again for anyone who reloads.
4. Flip to **Protected (text)** and reload: the same comment now shows as inert
   text.

**Proof of concept.** In vulnerable mode the frontend injects the stored content
with `dangerouslySetInnerHTML`; the broken `<img>` triggers `onerror`, which runs
attacker JavaScript with access to cookies, the DOM, and the user's session.

**The fix.** Render as text (React escapes by default — the Protected toggle).
Defence in depth: sanitise on input (e.g. `Ganss.Xss`), encode on output, and set
a Content-Security-Policy. Never rely on a single layer.

**Real-world examples.** The 2005 Samy MySpace worm infected 1M profiles in 20
hours; stored XSS has hit British Airways, TweetDeck, and many comment/forum
systems. Typical impact: session hijacking, keylogging, and self-propagating worms.

---

### 3. CSRF (Cross-Site Request Forgery) — "Account"

- **OWASP 2025:** A01 Broken Access Control
- **Endpoints:** `Login` / `Logout` / `Me` / `ChangeEmail` (vulnerable) /
  `ChangeEmailProtected` (fixed) — `Web/Features/Auth/`
- **Attacker page:** `Lunch-and-learn/csrf-attacker-page.html`

**What it is.** The browser automatically attaches the session cookie to *any*
request to the site, including ones triggered by a different website. If the
server trusts the cookie alone as proof of intent, a malicious page can perform
actions as the logged-in victim. Here the session cookie is deliberately
`SameSite=None`, so it is sent cross-site.

**How to demo.**
1. In the **Account** card, log in (no password — pick a seeded user such as
   `admin@acme.corp`). This sets the `SameSite=None` session cookie.
2. Open `Lunch-and-learn/csrf-attacker-page.html` in the **same browser**
   (double-click → it loads as `file://`, a *different* origin). It looks like a
   harmless "Cute Puppies" page.
3. Its hidden form auto-submits a POST to `/api/auth/ChangeEmail`.
4. Back in the app, click **Refresh** — the victim's email is now
   `attacker@evil.test`.

**Proof of concept.** The attacker's `<form>` posts url-encoded data (a "simple"
request, so no CORS preflight blocks it). The browser attaches the victim's
cookie; the vulnerable endpoint checks **no** anti-forgery token or Origin, so it
accepts the forged request.

**The fix — the card's own "Update" form.** `ChangeEmailProtected` uses a
**double-submit token**: a non-`HttpOnly` `vs_csrf` cookie echoed back in an
`X-CSRF-TOKEN` header. A cross-origin attacker cannot read that cookie, so it
cannot forge the header. Real fixes also use `SameSite=Lax/Strict` cookies and
Origin/Referer checks.

**Real-world examples.** Netflix (2006, change account email/shipping), ING Direct
(money transfers), YouTube, and many routers' admin pages ("drive-by" config
changes) were all CSRF-exploitable.

---

### 4. SSRF (Server-Side Request Forgery) — "Import from URL"

- **OWASP 2025:** A01 Broken Access Control
- **Endpoint:** `GET /api/demo/FetchUrlPreview` — `Web/Features/Demo/FetchUrlPreview.cs`

**What it is.** An "import from URL" feature where the **server** fetches a URL
the user supplies. Because the request originates *inside* the trust boundary,
the attacker can reach things they never could directly — internal services,
admin panels bound to localhost, or cloud metadata endpoints.

**How to demo.**
1. Leave the toggle on **Vulnerable**.
2. Fetch an internal-only address, e.g. `http://127.0.0.1:1407` (the DB port) or
   `http://localhost:5000/api/user/GetUsers`. The server reaches it and returns
   the response — proof it can touch the internal network.
3. Flip to **Protected** and fetch the same URL → blocked with a 403.

**Proof of concept.** In vulnerable mode the server does `GET <your-url>` with no
checks. On a cloud host the classic target is
`http://169.254.169.254/latest/meta-data/` — the metadata service that can hand
out temporary IAM credentials.

**The fix — Protected mode.** Scheme allow-list (`http`/`https` only) **plus**
resolving the hostname and rejecting private/loopback/link-local ranges
(`10/8`, `172.16/12`, `192.168/16`, `127/8`, `169.254/16`, and IPv6 equivalents).
A production version would also re-check after redirects and guard against DNS
rebinding.

**Real-world examples.** The 2019 Capital One breach (100M+ records) used SSRF
against the AWS metadata endpoint to steal credentials. SSRF is also a common
pivot into internal admin tools and Kubernetes/cloud metadata APIs.

---

## Quick reference

| Card | Vulnerability | OWASP 2025 | Vulnerable endpoint | Fixed by |
|------|---------------|------------|---------------------|----------|
| User Search | SQL Injection | A05 Injection | `SearchUsers` | `GetProtectedUsers` (parameterised) |
| Comments | Stored XSS | A05 Injection | `AddComment` + innerHTML render | "Protected (text)" toggle |
| Account | CSRF | A01 Broken Access Control | `ChangeEmail` | `ChangeEmailProtected` (double-submit token) |
| Import from URL | SSRF | A01 Broken Access Control | `FetchUrlPreview?Safe=false` | `Safe=true` (allow-list + IP checks) |
