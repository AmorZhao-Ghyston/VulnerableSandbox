import type { ReactNode } from "react";

export const DEMOS = [
  {
    path: "/csrf",
    label: "CSRF",
    category: "A01",
    blurb: "Forged requests that ride a logged-in user's session cookie.",
  },
  {
    path: "/ssrf",
    label: "SSRF",
    category: "A01",
    blurb: "Tricking the server into fetching internal-only URLs.",
  },
  {
    path: "/sql-injection",
    label: "SQL Injection",
    category: "A05",
    blurb: "Untrusted input concatenated straight into a database query.",
  },
  {
    path: "/stored-xss",
    label: "Stored XSS",
    category: "A05",
    blurb: "Stored comments rendered as HTML and run in the browser.",
  },
];

export type UserResult = {
  id: number;
  name: string;
  email: string;
};

export type CommentResult = {
  id: number;
  author: string;
  content: string;
};

export const SQLI_EXAMPLE = "' OR '1'='1";

export const getCookie = (name: string): string =>
  document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${name}=`))
    ?.split("=")[1] ?? "";

export const Badge = ({
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

export const UserTable = ({ users }: { users: Array<UserResult> }) => (
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

export const Code = ({ children }: { children: string }) => (
  <code className="rounded bg-gray-100 px-1 font-mono text-xs break-all">
    {children}
  </code>
);

export const EndpointTag = ({
  method,
  path,
}: {
  method: string;
  path: string;
}) => (
  <span className="inline-flex items-center gap-1.5 rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-600">
    <span className="font-semibold text-gray-700">{method}</span>
    {path}
  </span>
);

export const Snippet = ({ children }: { children: string }) => (
  <pre className="mt-3 overflow-x-auto rounded border border-gray-200 bg-gray-50 p-3 font-mono text-xs leading-relaxed text-gray-800">
    <code>{children}</code>
  </pre>
);

export type Reference = {
  label: string;
  href: string;
};

export const Section = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <section className="mt-10 border-t border-gray-100 pt-4 pl-6">
    <h2 className="mb-2 text-base font-semibold text-gray-900">{title}</h2>
    <div className="space-y-2 text-sm leading-relaxed text-gray-600">
      {children}
    </div>
  </section>
);

export const References = ({ items }: { items: Array<Reference> }) => (
  <Section title="References">
    <ul className="list-disc space-y-1 pl-5">
      {items.map((r) => (
        <li key={r.href}>
          <a
            href={r.href}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-blue-700 underline hover:text-blue-800"
          >
            {r.label}
          </a>
        </li>
      ))}
    </ul>
  </Section>
);

export const DemoPage = ({
  title,
  category,
  intro,
  references,
  children,
}: {
  title: string;
  category: string;
  intro: string;
  references: Array<Reference>;
  children: ReactNode;
}) => (
  <div className="mx-auto max-w-6xl">
    <div className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase">
      {category}
    </div>
    <h1 className="text-3xl font-bold tracking-tight text-gray-900">{title}</h1>
    <p className="mt-2 mb-8 text-sm text-gray-500">{intro}</p>
    {children}
    <References items={references} />
  </div>
);

export const Steps = ({ items }: { items: Array<ReactNode> }) => (
  <ol className="list-decimal space-y-1 pl-5">
    {items.map((item, i) => (
      <li key={i}>{item}</li>
    ))}
  </ol>
);

export const Bullets = ({ items }: { items: Array<ReactNode> }) => (
  <ul className="list-disc space-y-1 pl-5">
    {items.map((item, i) => (
      <li key={i}>{item}</li>
    ))}
  </ul>
);
