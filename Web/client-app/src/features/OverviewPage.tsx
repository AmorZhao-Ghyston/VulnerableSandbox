import { Link } from "react-router-dom";
import { DEMOS } from "@/features/shared";

export const OverviewPage = () => (
  <div className="mx-auto max-w-6xl">
    <div className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase">
      OWASP Top 10 (2025)
    </div>
    <h1 className="text-3xl font-bold tracking-tight text-gray-900">
      Overview
    </h1>
    <p className="mt-2 mb-8 text-sm text-gray-500">
      This app is a .NET 10 + React demo used to illustrate common web
      vulnerabilities (SQL injection, XSS, CSRF, SSRF) against deliberately
      insecure endpoints alongside properly protected ones.
    </p>

    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {DEMOS.map((d) => (
        <Link
          key={d.path}
          to={d.path}
          className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow"
        >
          <div className="mb-1 text-xs font-semibold text-gray-400">
            {d.category}
          </div>
          <div className="text-lg font-semibold text-gray-900">{d.label}</div>
          <p className="mt-1 text-sm text-gray-500">{d.blurb}</p>
        </Link>
      ))}
    </div>
  </div>
);
