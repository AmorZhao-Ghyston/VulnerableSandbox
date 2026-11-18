# Vulnerable-sandbox

## Description

~~PD day homeowrk on OWASP top 10 study~~

A .NET 10 + React demo used to illustrate common web vulnerabilities (SQL injection, XSS, CSRF, SSRF) against deliberately insecure endpoints alongside properly protected ones.

## Pre-requisites

- [.NET 10](https://dotnet.microsoft.com/en-us/download/dotnet/10.0)
- [Node.js 20+](https://nodejs.org/en)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

## First Time Setup

- Clone the repository to your local machine.
- Open a terminal and navigate to the root of the project.
- Run `docker compose up -d` to start a SQL Server container on port `1407`.
- Create the databases, schema and seed data. (This script is re-runnable. Run it again any time to reset to a clean slate.)
  ```bash
  sqlcmd -S localhost,1407 -U sa -P 'SuperSecure0!' -C -i Database/setup.sql
  
  # or in docker
  Get-Content Database\setup.sql -Raw | docker exec -i VulnerableSandbox_Database /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P 'SuperSecure0!' -C
  
  # (for cmd)
  cmd /c "docker exec -i VulnerableSandbox_Database /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P SuperSecure0! -C < Database/setup.sql"
  ```
- Run `dotnet restore` to install backend NuGet packages.
- Run `npm install` in `Web/client-app`.
  ```bash
  cd Web/client-app && npm install
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

## Tests

- `dotnet test` to run the backend integration tests (requires the database container).
- `cd Web/client-app && npm run test:ci` to run the frontend unit tests.

---

## Quick reference

| Demo | Vulnerability | OWASP 2025 | Vulnerable endpoint | Fixed by |
|------|---------------|------------|---------------------|----------|
| Account | CSRF | A01 Broken Access Control | `ChangeEmail` | `ChangeEmailProtected` (double-submit token) |
| Import from URL | SSRF | A01 Broken Access Control | `FetchUrlPreview?Safe=false` | `Safe=true` (allow-list + IP checks) |
| User Search | SQL Injection | A05 Injection | `SearchUsers` | `GetProtectedUsers` (parameterised) |
| Comments | Stored XSS | A05 Injection | `AddComment` + innerHTML render | "Protected (text)" toggle |

## Links

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Top 10:2025](https://top10.owasp.org/2025/)
- [OWASP Cheat Sheets](https://cheatsheetseries.owasp.org/)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
