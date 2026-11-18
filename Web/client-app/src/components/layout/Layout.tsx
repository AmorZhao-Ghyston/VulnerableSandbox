import { Link, Outlet, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { DEMOS } from "@/features/shared";

const linkClass = (isActive: boolean) =>
  `block rounded px-3 py-2 text-sm font-medium transition ${
    isActive
      ? "bg-blue-50 text-blue-700"
      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
  }`;

export const Layout = () => {
  const location = useLocation();

  const isActive = (to: string) =>
    to === "/" ? location.pathname === "/" : location.pathname === to;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="flex h-16 w-full items-center border-b bg-white px-8 shadow-sm">
        <h1 className="text-xl font-bold tracking-tight text-gray-900">
          Vulnerable Sandbox
        </h1>
      </header>
      <div className="flex flex-1">
        <nav className="w-56 shrink-0 border-r bg-white p-4">
          <Link to="/" className={linkClass(isActive("/"))}>
            Overview
          </Link>
          <div className="my-3 border-t border-gray-100" />
          {DEMOS.map((d) => (
            <Link
              key={d.path}
              to={d.path}
              className={linkClass(isActive(d.path))}
            >
              {d.label}
            </Link>
          ))}
        </nav>
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
      <Toaster />
    </div>
  );
};
