import { type SyntheticEvent, useEffect, useState } from "react";

type UserResult = {
  id: number;
  name: string;
  email: string;
};

const SQLI_EXAMPLE = "' OR '1'='1";

const getCookie = (name: string): string =>
  document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${name}=`))
    ?.split("=")[1] ?? "";

const UserTable = ({ users }: { users: Array<UserResult> }) => (
  <div className="mt-4 overflow-x-auto rounded border border-gray-200">
    <table className="w-full text-sm">
      <thead className="bg-gray-50 text-left">
        <tr>
          <th className="px-3 py-2 font-medium text-gray-600">ID</th>
          <th className="px-3 py-2 font-medium text-gray-600">Name</th>
          <th className="px-3 py-2 font-medium text-gray-600">Email</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {users.map((u) => (
          <tr key={u.id} className="hover:bg-gray-50">
            <td className="px-3 py-2 text-gray-500">{u.id}</td>
            <td className="px-3 py-2">{u.name}</td>
            <td className="px-3 py-2 text-gray-600">{u.email}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const Badge = ({
  tone,
  children,
}: {
  tone: "red" | "green";
  children: string;
}) => (
  <span
    className={`rounded px-2 py-0.5 text-xs font-semibold ${
      tone === "red" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
    }`}
  >
    {children}
  </span>
);

// ── SQL Injection ───────────────────────────────────────────────────────────
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
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-lg font-semibold text-gray-900">User Search</h2>
        <Badge tone="red">SQL INJECTION</Badge>
      </div>
      <p className="mb-4 text-sm text-gray-500">
        Searches by name via raw string concatenation. Try{" "}
        <code className="rounded bg-gray-100 px-1 font-mono text-xs">
          {SQLI_EXAMPLE}
        </code>{" "}
        to dump every record.
      </p>
      <form onSubmit={handleSearch} className="flex gap-2">
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

// ── Protected access (parameterised) ─────────────────────────────────────────
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
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-lg font-semibold text-gray-900">
          Protected Data Access
        </h2>
        <Badge tone="green">API KEY REQUIRED</Badge>
      </div>
      <p className="mb-4 text-sm text-gray-500">
        Returns all users only with a valid API key, using parameterised
        queries. Injection payloads have no effect.
      </p>
      <form onSubmit={handleAccess} className="flex gap-2">
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

// ── Stored XSS (comments / guestbook) ────────────────────────────────────────
type CommentResult = {
  id: number;
  author: string;
  content: string;
};

const StoredXssSection = () => {
  const [author, setAuthor] = useState("");
  const [content, setContent] = useState("");
  const [comments, setComments] = useState<Array<CommentResult>>([]);
  const [renderHtml, setRenderHtml] = useState(true); // true = vulnerable
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await fetch("/api/comment/GetComments");
      const data = (await res.json()) as { comments: Array<CommentResult> };
      setComments(data.comments);
    } catch (err) {
      setError(String(err));
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const post = async (e: SyntheticEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch("/api/comment/AddComment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author, content }),
      });
      if (!res.ok) {
        setError(`Server error: ${res.status}`);
        return;
      }
      setContent("");
      await load();
    } catch (err) {
      setError(String(err));
    }
  };

  return (
    <div className="rounded-lg border border-red-200 bg-white p-6 shadow-sm lg:col-span-2">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold text-gray-900">Comments</h2>
        <Badge tone="red">STORED XSS</Badge>
        <div className="ml-auto flex items-center gap-2 text-xs">
          <span className="text-gray-500">Rendering:</span>
          <button
            onClick={() => setRenderHtml(true)}
            className={`rounded px-2 py-1 font-medium ${renderHtml ? "bg-red-600 text-white" : "bg-gray-100 text-gray-600"}`}
          >
            Vulnerable (innerHTML)
          </button>
          <button
            onClick={() => setRenderHtml(false)}
            className={`rounded px-2 py-1 font-medium ${renderHtml ? "bg-gray-100 text-gray-600" : "bg-green-700 text-white"}`}
          >
            Protected (text)
          </button>
        </div>
      </div>
      <p className="mb-4 text-sm text-gray-500">
        Comments are stored raw and rendered to every visitor. In vulnerable
        mode the content is injected with{" "}
        <code className="rounded bg-gray-100 px-1 font-mono text-xs">
          dangerouslySetInnerHTML
        </code>
        . Post{" "}
        <code className="rounded bg-gray-100 px-1 font-mono text-xs">
          &lt;img src=x onerror=alert(document.cookie)&gt;
        </code>{" "}
        then switch modes to compare.
      </p>
      <form onSubmit={post} className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="Your name"
          className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-red-400 focus:ring-1 focus:ring-red-400 focus:outline-none sm:w-40"
        />
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a comment…"
          className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:border-red-400 focus:ring-1 focus:ring-red-400 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Post
        </button>
      </form>
      {error && (
        <p className="mt-3 rounded bg-red-50 p-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <ul className="mt-4 space-y-2">
        {comments.map((c) => (
          <li
            key={c.id}
            className="rounded border border-gray-100 bg-gray-50 p-3 text-sm"
          >
            <span className="font-medium text-gray-700">{c.author}: </span>
            {renderHtml ? (
              <span dangerouslySetInnerHTML={{ __html: c.content }} />
            ) : (
              <span className="text-gray-600">{c.content}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

// ── CSRF (cookie session + forged request) ───────────────────────────────────
const CsrfSection = () => {
  const [email, setEmail] = useState("admin@acme.corp");
  const [me, setMe] = useState<UserResult | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [note, setNote] = useState<string | null>(null);

  const loadMe = async () => {
    const res = await fetch("/api/auth/Me");
    setMe(res.ok ? ((await res.json()) as UserResult) : null);
  };

  useEffect(() => {
    void loadMe();
  }, []);

  const login = async (e: SyntheticEvent) => {
    e.preventDefault();
    setNote(null);
    const res = await fetch("/api/auth/Login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      setNote(
        res.status === 401 ? "No user with that email." : `Error ${res.status}`,
      );
      return;
    }
    await loadMe();
  };

  const logout = async () => {
    await fetch("/api/auth/Logout", { method: "POST" });
    await loadMe();
  };

  // Legitimate change: sends the double-submit CSRF token the attacker can't read.
  const changeEmailProtected = async (e: SyntheticEvent) => {
    e.preventDefault();
    setNote(null);
    const res = await fetch("/api/auth/ChangeEmailProtected", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-TOKEN": getCookie("vs_csrf"),
      },
      body: JSON.stringify({ newEmail }),
    });
    setNote(
      res.ok
        ? "Email updated (legitimate, token sent)."
        : `Rejected: ${res.status}`,
    );
    setNewEmail("");
    await loadMe();
  };

  return (
    <div className="rounded-lg border border-red-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-lg font-semibold text-gray-900">Account</h2>
        <Badge tone="red">CSRF</Badge>
      </div>

      {me === null ? (
        <>
          <p className="mb-3 text-sm text-gray-500">
            Log in (no password — pick a seeded user). This sets a{" "}
            <code className="font-mono text-xs">SameSite=None</code> session
            cookie.
          </p>
          <form onSubmit={login} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:border-red-400 focus:ring-1 focus:ring-red-400 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900"
            >
              Log in
            </button>
          </form>
        </>
      ) : (
        <>
          <div className="mb-3 rounded bg-gray-50 p-3 text-sm">
            Logged in as <span className="font-medium">{me.name}</span> —
            current email:{" "}
            <span className="font-mono text-gray-700">{me.email}</span>
            <button
              onClick={logout}
              className="ml-3 text-xs text-gray-500 underline"
            >
              log out
            </button>
          </div>
          <p className="mb-3 text-sm text-gray-500">
            <strong>Attack:</strong> while logged in, open{" "}
            <code className="rounded bg-gray-100 px-1 font-mono text-xs">
              Lunch-and-learn/csrf-attacker-page.html
            </code>{" "}
            in another tab. Its hidden form POSTs to the vulnerable endpoint
            using your cookie — come back and hit Refresh to see your email
            changed.
          </p>
          <div className="mb-4 flex gap-2">
            <button
              onClick={loadMe}
              className="rounded bg-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-300"
            >
              Refresh
            </button>
          </div>
          <form
            onSubmit={changeEmailProtected}
            className="flex gap-2 border-t border-gray-100 pt-3"
          >
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Change my email (protected)…"
              className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:border-green-400 focus:ring-1 focus:ring-green-400 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
            >
              Update
            </button>
          </form>
          <p className="mt-2 text-xs text-gray-400">
            This form uses the token-protected endpoint — the legitimate path
            still works.
          </p>
        </>
      )}
      {note && (
        <p className="mt-3 rounded bg-gray-50 p-2 text-sm text-gray-700">
          {note}
        </p>
      )}
    </div>
  );
};

// ── SSRF (import from URL) ───────────────────────────────────────────────────
const SsrfSection = () => {
  const [url, setUrl] = useState("http://localhost:5000/api/user/GetUsers");
  const [safe, setSafe] = useState(false); // false = vulnerable
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchUrl = async (e: SyntheticEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(
        `/api/demo/FetchUrlPreview?Url=${encodeURIComponent(url)}&Safe=${String(safe)}`,
      );
      const text = await res.text();
      if (!res.ok) {
        setResult(`[${res.status}] ${text}`);
        return;
      }
      const data = JSON.parse(text) as {
        statusCode: number;
        contentType: string;
        body: string;
      };
      setResult(`[${data.statusCode}] ${data.contentType}\n\n${data.body}`);
    } catch (err) {
      setResult(String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-red-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold text-gray-900">Import from URL</h2>
        <Badge tone="red">SSRF</Badge>
        <div className="ml-auto flex items-center gap-2 text-xs">
          <button
            onClick={() => setSafe(false)}
            className={`rounded px-2 py-1 font-medium ${safe ? "bg-gray-100 text-gray-600" : "bg-red-600 text-white"}`}
          >
            Vulnerable
          </button>
          <button
            onClick={() => setSafe(true)}
            className={`rounded px-2 py-1 font-medium ${safe ? "bg-green-700 text-white" : "bg-gray-100 text-gray-600"}`}
          >
            Protected
          </button>
        </div>
      </div>
      <p className="mb-4 text-sm text-gray-500">
        The server fetches the URL you give it. Point it at an internal address
        only the server can reach — e.g.{" "}
        <code className="rounded bg-gray-100 px-1 font-mono text-xs">
          http://127.0.0.1:1407
        </code>{" "}
        (the DB port). Protected mode blocks private/loopback ranges.
      </p>
      <form onSubmit={fetchUrl} className="flex gap-2">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…"
          className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:border-red-400 focus:ring-1 focus:ring-red-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? "Fetching…" : "Fetch"}
        </button>
      </form>
      {result !== null && (
        <pre className="mt-4 max-h-64 overflow-auto rounded bg-gray-900 p-3 text-xs break-all whitespace-pre-wrap text-gray-100">
          {result}
        </pre>
      )}
    </div>
  );
};

export const MainPage = () => (
  <div className="mx-auto max-w-5xl">
    <p className="mb-6 text-sm text-gray-500">
      Each card is a live, deliberately vulnerable feature. Most have a
      Vulnerable ↔ Protected toggle so you can compare the exploit with the fix
      while the site runs locally.
    </p>
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <SqlSearchSection />
      <ProtectedSection />
      <StoredXssSection />
      <CsrfSection />
      <SsrfSection />
    </div>
  </div>
);
