import { Outlet } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";

export const Layout = () => (
  <div className="flex min-h-screen flex-col bg-gray-50">
    <header className="flex h-16 w-full items-center border-b bg-white px-8 shadow-sm">
      <h1 className="text-xl font-bold tracking-tight text-gray-900">
        Vulnerable Sandbox
      </h1>
      <span className="ml-3 rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
        DEMO ONLY
      </span>
    </header>
    <main className="flex-1 p-8">
      <Outlet />
    </main>
    <Toaster />
  </div>
);
