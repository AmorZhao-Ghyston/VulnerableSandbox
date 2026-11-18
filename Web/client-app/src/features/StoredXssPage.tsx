import { type SyntheticEvent, useEffect, useState } from "react";
import {
  Badge,
  Bullets,
  Code,
  type CommentResult,
  DemoPage,
  EndpointTag,
  Section,
  Snippet,
  Steps,
} from "@/features/shared";

const StoredXssSection = () => {
  const [author, setAuthor] = useState("");
  const [content, setContent] = useState("");
  const [comments, setComments] = useState<Array<CommentResult>>([]);
  const [renderHtml, setRenderHtml] = useState(() => {
    try {
      return localStorage.getItem("xssRenderHtml") !== "false";
    } catch {
      return true;
    }
  });
  const [error, setError] = useState<string | null>(null);

  const chooseRendering = (value: boolean) => {
    setRenderHtml(value);
    try {
      localStorage.setItem("xssRenderHtml", String(value));
    } catch {
      return;
    }
  };

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
    <div className="rounded-lg border border-red-200 bg-white p-6 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold text-gray-900">Comments</h2>
        <Badge tone="red">STORED XSS</Badge>
        <div className="ml-auto flex items-center gap-2 text-xs">
          <span className="text-gray-500">Rendering:</span>
          <button
            onClick={() => chooseRendering(true)}
            className={`rounded px-2 py-1 font-medium ${renderHtml ? "bg-red-600 text-white" : "bg-gray-100 text-gray-600"}`}
          >
            Vulnerable (innerHTML)
          </button>
          <button
            onClick={() => chooseRendering(false)}
            className={`rounded px-2 py-1 font-medium ${renderHtml ? "bg-gray-100 text-gray-600" : "bg-green-700 text-white"}`}
          >
            Protected (text)
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <EndpointTag method="POST" path="/api/comment/AddComment" />
        <EndpointTag method="GET" path="/api/comment/GetComments" />
      </div>
      <p className="mt-3 text-sm text-gray-500">
        The server stores comments verbatim. The toggle switches how the client
        renders them: as HTML (the flaw) or as text.
      </p>
      <Snippet>{`// Vulnerable
<span dangerouslySetInnerHTML={{ __html: comment }} />
// Protected
<span>{comment}</span>`}</Snippet>
      <form onSubmit={post} className="mt-4 flex flex-col gap-2 sm:flex-row">
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

export const StoredXssPage = () => (
  <DemoPage
    title="Stored XSS"
    category="OWASP 2025 · A05 Injection"
    intro="Stored content is saved raw and replayed to every viewer. Rendered as HTML, any script inside it runs in their browser."
    references={[
      {
        label: "OWASP Top 10 2025 — A05 Injection",
        href: "https://top10.owasp.org/2025/A05_2025-Injection/",
      },
      {
        label: "CWE-79: Cross-site Scripting (XSS)",
        href: "https://cwe.mitre.org/data/definitions/79.html",
      },
      {
        label: "Real case: Samy worm, MySpace 2005 (stored XSS)",
        href: "https://en.wikipedia.org/wiki/Samy_(computer_worm)",
      },
    ]}
  >
    <StoredXssSection />

    <Section title="What it is">
      <p>
        A comment is saved exactly as typed and shown to everyone who later
        opens the page. Rendered as HTML, any script inside it runs in the
        browser of each visitor, with their cookies, their session and the page
        itself. Because it is stored, one poisoned comment hits the whole
        audience.
      </p>
    </Section>

    <Section title="The fix">
      <Bullets
        items={[
          "Encode on output so stored content renders as text, not markup.",
          "Sanitise on input with a trusted library if HTML must be stored.",
          "Add a Content-Security-Policy as a second layer.",
        ]}
      />
    </Section>

    <Section title="Run the demo">
      <Steps
        items={[
          "Keep the toggle on Vulnerable.",
          <>
            Post <Code>{"<img src=x onerror=alert(document.cookie)>"}</Code>:
            the alert fires.
          </>,
          "Reload: it fires again for everyone, because it is stored.",
          "Switch to Protected and reload: the same comment shows as text.",
        ]}
      />
    </Section>
  </DemoPage>
);
