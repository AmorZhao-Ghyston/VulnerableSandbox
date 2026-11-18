import { type SyntheticEvent, useEffect, useState } from "react";
import {
  Badge,
  Bullets,
  Code,
  DemoPage,
  EndpointTag,
  Section,
  Snippet,
  Steps,
  type UserResult,
  getCookie,
} from "@/features/shared";

type CardProps = {
  me: UserResult | null;
  onChange: () => Promise<void>;
};

const AccountCard = ({ me, onChange }: CardProps) => {
  const [email, setEmail] = useState("admin@acme.corp");
  const [note, setNote] = useState<string | null>(null);

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
    await onChange();
  };

  const logout = async () => {
    await fetch("/api/auth/Logout", { method: "POST" });
    await onChange();
  };

  return (
    <div className="rounded-lg border border-red-200 bg-white p-6 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-lg font-semibold text-gray-900">Account</h2>
        <Badge tone="red">CSRF</Badge>
      </div>
      <EndpointTag method="POST" path="/api/auth/ChangeEmail" />
      <p className="mt-3 text-sm text-gray-500">
        The session cookie is SameSite=None, and the change endpoint checks no
        anti-forgery token.
      </p>
      <Snippet>{`// AuthCookies.cs
SameSite = SameSiteMode.None
// ChangeEmail.cs — no anti-forgery check
user.ChangeEmail(request.NewEmail);`}</Snippet>

      {me === null ? (
        <>
          <p className="mt-4 mb-2 text-sm text-gray-500">
            Log in to start; this sets the session cookie.
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
        <div className="mt-4">
          <div className="rounded bg-gray-50 p-3 text-sm">
            Logged in as <span className="font-medium">{me.name}</span> (
            <span className="font-mono text-gray-700">{me.email}</span>)
            <button
              onClick={logout}
              className="ml-3 text-xs text-gray-500 underline"
            >
              log out
            </button>
          </div>
          <button
            onClick={() => void onChange()}
            className="mt-3 rounded bg-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-300"
          >
            Refresh
          </button>
        </div>
      )}
      {note && (
        <p className="mt-3 rounded bg-gray-50 p-2 text-sm text-gray-700">
          {note}
        </p>
      )}
    </div>
  );
};

const ProtectedCard = ({ me, onChange }: CardProps) => {
  const [newEmail, setNewEmail] = useState("safe@acme.corp");
  const [note, setNote] = useState<string | null>(null);

  const attemptForged = async () => {
    setNote(null);
    const res = await fetch("/api/auth/ChangeEmailProtected", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newEmail: "attacker@evil.test" }),
    });
    setNote(
      res.ok
        ? `Unexpected: changed (${res.status})`
        : `Rejected ${res.status}: no valid CSRF token, email unchanged.`,
    );
    if (res.ok) {
      await onChange();
    }
  };

  const changeWithToken = async () => {
    setNote(null);
    const res = await fetch("/api/auth/ChangeEmailProtected", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-TOKEN": getCookie("vs_csrf"),
      },
      body: JSON.stringify({ newEmail }),
    });
    setNote(res.ok ? "Email updated (token sent)." : `Rejected ${res.status}.`);
    if (res.ok) {
      await onChange();
    }
  };

  return (
    <div className="rounded-lg border border-green-200 bg-white p-6 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-lg font-semibold text-gray-900">
          Protected endpoint
        </h2>
        <Badge tone="green">TOKEN REQUIRED</Badge>
      </div>
      <EndpointTag method="POST" path="/api/auth/ChangeEmailProtected" />
      <p className="mt-3 text-sm text-gray-500">
        Requires a double-submit token: a header that must match the vs_csrf
        cookie. A cross-site attacker cannot read the cookie, so cannot forge
        it.
      </p>
      <Snippet>{`var header = Request.Headers["X-CSRF-TOKEN"];
var cookie = Request.Cookies["vs_csrf"];
if (header != cookie) return Unauthorized();`}</Snippet>

      {me === null ? (
        <p className="mt-4 text-sm text-gray-500">
          Log in on the Account card to try this.
        </p>
      ) : (
        <div className="mt-4 space-y-2">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="New email…"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-green-400 focus:ring-1 focus:ring-green-400 focus:outline-none"
          />
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => void attemptForged()}
              className="rounded bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Attempt without token
            </button>
            <button
              onClick={() => void changeWithToken()}
              className="rounded bg-green-700 px-3 py-2 text-sm font-medium text-white hover:bg-green-800"
            >
              Change with token
            </button>
          </div>
        </div>
      )}
      {note && (
        <p className="mt-3 rounded bg-gray-50 p-2 text-sm text-gray-700">
          {note}
        </p>
      )}
    </div>
  );
};

export const CsrfPage = () => {
  const [me, setMe] = useState<UserResult | null>(null);

  const loadMe = async () => {
    const res = await fetch("/api/auth/Me");
    setMe(res.ok ? ((await res.json()) as UserResult) : null);
  };

  useEffect(() => {
    void loadMe();
  }, []);

  return (
    <DemoPage
      title="Cross-Site Request Forgery"
      category="OWASP 2025 · A01 Broken Access Control"
      intro="CSRF rides the session cookie the browser sends automatically, so another site can act as the logged-in user."
      references={[
        {
          label: "OWASP Top 10 2025 — A01 Broken Access Control",
          href: "https://top10.owasp.org/2025/A01_2025-Broken_Access_Control/",
        },
        {
          label: "CWE-352: Cross-Site Request Forgery (CSRF)",
          href: "https://cwe.mitre.org/data/definitions/352.html",
        },
      ]}
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AccountCard me={me} onChange={loadMe} />
        <ProtectedCard me={me} onChange={loadMe} />
      </div>

      <Section title="What it is">
        <p>
          The browser attaches the session cookie to every request to the site,
          including ones triggered by another website. If the server trusts the
          cookie alone, any page the victim visits can act as them. Here the
          cookie is SameSite=None, so it is even sent cross-site.
        </p>
      </Section>

      <Section title="The fix">
        <Bullets
          items={[
            "Set session cookies to SameSite=Lax or Strict.",
            "Require an anti-forgery token on every state-changing request, verified server-side.",
            "Check the Origin or Referer header on sensitive actions.",
          ]}
        />
      </Section>

      <Section title="Run the demo">
        <Steps
          items={[
            <>
              On the Account card, log in as <Code>admin@acme.corp</Code>.
            </>,
            <>
              Open <Code>Lunch-and-learn/csrf-attacker-page.html</Code> from
              file:// (a different origin). Its hidden form POSTs to the
              vulnerable endpoint using your cookie.
            </>,
            <>
              Back here, click Refresh: the email changed to{" "}
              <Code>attacker@evil.test</Code>.
            </>,
            "On the Protected endpoint card, Attempt without token is rejected; Change with token works. The attacker cannot read the token, so the forged attack fails.",
          ]}
        />
      </Section>
    </DemoPage>
  );
};
