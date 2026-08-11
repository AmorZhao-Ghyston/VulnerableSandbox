import { useState, type FormEvent } from "react";

interface UserResult {
  id: number;
  name: string;
  email: string;
}

const UserTable = ({ users }: { users: UserResult[] }) => (
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

const SqlSearchSection = () => {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<UserResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: FormEvent) => {
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
      const data = (await res.json()) as { users: UserResult[] };
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
        <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
          SQL INJECTION VULNERABLE
        </span>
      </div>
      <p className="mb-4 text-sm text-gray-500">
        Search users by name. This endpoint builds its SQL query via string
        concatenation — try{" "}
        <code className="rounded bg-gray-100 px-1 font-mono text-xs">
          ' OR '1'='1
        </code>{" "}
        to dump all records.
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

const ProtectedSection = () => {
  const [apiKey, setApiKey] = useState("");
  const [users, setUsers] = useState<UserResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAccess = async (e: FormEvent) => {
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
      const data = (await res.json()) as { users: UserResult[] };
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
        <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
          API KEY REQUIRED
        </span>
      </div>
      <p className="mb-4 text-sm text-gray-500">
        Returns all users only when a valid API key is provided. Uses
        parameterised queries — SQL injection payloads have no effect here.
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
      {users !== null && users.length === 0 && (
        <p className="mt-3 text-sm text-gray-500">No users in database.</p>
      )}
      {users !== null && users.length > 0 && <UserTable users={users} />}
    </div>
  );
};

export const MainPage = () => (
  <div className="mx-auto max-w-5xl">
    <p className="mb-6 text-sm text-gray-500">
      This sandbox demonstrates the contrast between a SQL-injection-vulnerable
      endpoint and one that enforces access control with safe, parameterised
      queries.
    </p>
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <SqlSearchSection />
      <ProtectedSection />
    </div>
  </div>
);
