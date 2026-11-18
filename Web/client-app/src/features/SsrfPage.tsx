import { type SyntheticEvent, useState } from "react";
import {
  Badge,
  Bullets,
  Code,
  DemoPage,
  EndpointTag,
  Section,
  Snippet,
  Steps,
} from "@/features/shared";

const FetchCard = ({ safe }: { safe: boolean }) => {
  const [url, setUrl] = useState("https://localhost:5000/api/user/GetUsers");
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
    <div
      className={`rounded-lg border bg-white p-6 shadow-sm ${safe ? "border-green-200" : "border-red-200"}`}
    >
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-lg font-semibold text-gray-900">
          {safe ? "Validated import" : "Import from URL"}
        </h2>
        {safe ? (
          <Badge tone="green">BLOCKS INTERNAL</Badge>
        ) : (
          <Badge tone="red">SSRF</Badge>
        )}
      </div>
      <EndpointTag
        method="GET"
        path={
          safe
            ? "/api/demo/FetchUrlPreview?Safe=true"
            : "/api/demo/FetchUrlPreview"
        }
      />
      <p className="mt-3 text-sm text-gray-500">
        {safe
          ? "Resolves the host to an IP and rejects private, loopback and link-local ranges before any request is made."
          : "Fetches whatever URL you pass, exactly as given, with no check on where it points."}
      </p>
      <Snippet>
        {safe
          ? `var addresses = await Dns.GetHostAddressesAsync(uri.Host);
if (addresses.Any(IsPrivate))
    return await Send.StringAsync("Blocked", 403);`
          : "await client.GetAsync(request.Url);"}
      </Snippet>
      <form onSubmit={fetchUrl} className="mt-4 flex gap-2">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…"
          className={`flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:outline-none ${safe ? "focus:border-green-400 focus:ring-green-400" : "focus:border-red-400 focus:ring-red-400"}`}
        />
        <button
          type="submit"
          disabled={loading}
          className={`rounded px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${safe ? "bg-green-700 hover:bg-green-800" : "bg-red-600 hover:bg-red-700"}`}
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

export const SsrfPage = () => (
  <DemoPage
    title="Server-Side Request Forgery"
    category="OWASP 2025 · A01 Broken Access Control"
    intro="SSRF abuses a feature that fetches a URL on the server's behalf, letting an attacker reach internal systems the server can see but they cannot."
    references={[
      {
        label: "OWASP Top 10 2025 — A01 Broken Access Control",
        href: "https://top10.owasp.org/2025/A01_2025-Broken_Access_Control/",
      },
      {
        label: "CWE-918: Server-Side Request Forgery (SSRF)",
        href: "https://cwe.mitre.org/data/definitions/918.html",
      },
    ]}
  >
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <FetchCard safe={false} />
      <FetchCard safe />
    </div>

    <Section title="What it is">
      <p>
        An import-from-URL feature fetches a URL on the server. Because the
        request comes from inside the network, it can reach internal services
        the client cannot, such as admin panels on localhost or a cloud metadata
        endpoint that hands out credentials.
      </p>
    </Section>

    <Section title="The fix">
      <Bullets
        items={[
          "Allow-list the destinations the feature needs.",
          "Resolve the host and block private, loopback and link-local ranges; re-check after redirects.",
          "Fetch from an isolated network with no access to internal services or metadata.",
        ]}
      />
    </Section>

    <Section title="Run the demo">
      <Steps
        items={[
          <>
            In the left card (Import from URL), fetch{" "}
            <Code>https://localhost:5000/api/user/GetUsers</Code>: the server
            returns the internal user list.
          </>,
          <>
            In the right card (Validated import), fetch the same URL: blocked
            with 403 before the request is sent, because it resolves to
            loopback.
          </>,
        ]}
      />
    </Section>
  </DemoPage>
);
