import { type SyntheticEvent, useState } from "react";
import {
  Badge,
  Bullets,
  Code,
  DemoPage,
  EndpointTag,
  SQLI_EXAMPLE,
  Section,
  Snippet,
  Steps,
  type UserResult,
  UserTable,
} from "@/features/shared";

const SqlSearchSection = () => {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<Array<UserResult> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: SyntheticEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setUsers(null);
    try {
      const res = await fetch(
        `/api/user/SearchUsers?Query=${encodeURIComponent(query)}`,
      );
      if (!res.ok) {
        setError(`Server error: ${res.status}`);
        return;
      }
      const data = (await res.json()) as { users: Array<UserResult> };
      setUsers(data.users);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-red-200 bg-white p-6 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-lg font-semibold text-gray-900">User Search</h2>
        <Badge tone="red">SQL INJECTION</Badge>
      </div>
      <EndpointTag method="GET" path="/api/user/SearchUsers" />
      <p className="mt-3 text-sm text-gray-500">
        Builds the query by string-concatenating your input, so the input is run
        as SQL.
      </p>
      <Snippet>{`var sql = "SELECT Id, Name, Email FROM Users "
        + "WHERE Name LIKE '%" + request.Query + "%'";
await db.Users.FromSqlRaw(sql).ToListAsync();`}</Snippet>
      <form onSubmit={handleSearch} className="mt-4 flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name…"
          className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:border-red-400 focus:ring-1 focus:ring-red-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </form>
      {error && (
        <p className="mt-3 rounded bg-red-50 p-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {users !== null && users.length === 0 && (
        <p className="mt-3 text-sm text-gray-500">No users found.</p>
      )}
      {users !== null && users.length > 0 && <UserTable users={users} />}
    </div>
  );
};

const ProtectedSection = () => {
  const [apiKey, setApiKey] = useState("");
  const [users, setUsers] = useState<Array<UserResult> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAccess = async (e: SyntheticEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setUsers(null);
    try {
      const res = await fetch(
        `/api/user/GetProtectedUsers?ApiKey=${encodeURIComponent(apiKey)}`,
      );
      if (res.status === 401) {
        setError("401 Unauthorised — invalid API key.");
        return;
      }
      if (!res.ok) {
        setError(`Server error: ${res.status}`);
        return;
      }
      const data = (await res.json()) as { users: Array<UserResult> };
      setUsers(data.users);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-green-200 bg-white p-6 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-lg font-semibold text-gray-900">
          Protected Data Access
        </h2>
        <Badge tone="green">PARAMETERISED</Badge>
      </div>
      <EndpointTag method="GET" path="/api/user/GetProtectedUsers" />
      <p className="mt-3 text-sm text-gray-500">
        No string-built SQL. EF Core LINQ parameterises the query, so input is
        bound as data and never runs as code.
      </p>
      <Snippet>{`if (apiKey != options.ProtectedApiKey)
    return Unauthorized();
await db.Users.OrderBy(u => u.Id).ToListAsync();`}</Snippet>
      <form onSubmit={handleAccess} className="mt-4 flex gap-2">
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter API key…"
          className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:border-green-400 focus:ring-1 focus:ring-green-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-50"
        >
          {loading ? "Accessing…" : "Access"}
        </button>
      </form>
      {error && (
        <p className="mt-3 rounded bg-red-50 p-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {users !== null && users.length > 0 && <UserTable users={users} />}
    </div>
  );
};

export const SqlInjectionPage = () => (
  <DemoPage
    title="SQL Injection"
    category="OWASP 2025 · A05 Injection"
    intro="User input is concatenated into a SQL query, so the input runs as code and can bypass filters or reach other tables."
    references={[
      {
        label: "OWASP Top 10 2025 — A05 Injection",
        href: "https://top10.owasp.org/2025/A05_2025-Injection/",
      },
      {
        label: "CWE-89: SQL Injection",
        href: "https://cwe.mitre.org/data/definitions/89.html",
      },
      {
        label:
          "Real case: MOVEit Transfer SQL injection, 2023 (CVE-2023-34362)",
        href: "https://nvd.nist.gov/vuln/detail/CVE-2023-34362",
      },
    ]}
  >
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <SqlSearchSection />
      <ProtectedSection />
    </div>

    <Section title="What it is">
      <p>
        SQL injection happens when user input is pasted into a query string, so
        the database runs it as code. An attacker can bypass the filter, read
        other tables, or destroy data.
      </p>
    </Section>

    <Section title="The fix">
      <Bullets
        items={[
          "Keep data separate from commands and queries: use parameterised queries or an ORM, never string concatenation.",
          "Grant least-privilege database accounts.",
          "Validate input as a backstop, not the primary control.",
        ]}
      />
    </Section>

    <Section title="Run the demo">
      <Steps
        items={[
          <>
            In User Search, search <Code>Alice</Code> for a normal result.
          </>,
          <>
            Search <Code>{SQLI_EXAMPLE}</Code>: every row returns, the filter is
            bypassed.
          </>,
          <>
            In Protected Data Access, paste the same payload as the key:
            rejected. Enter <Code>dev-secret-key</Code>: the full list loads,
            injection has no effect.
          </>,
        ]}
      />
    </Section>
  </DemoPage>
);
