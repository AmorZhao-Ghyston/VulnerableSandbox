import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { CsrfPage } from "@/features/CsrfPage";
import { OverviewPage } from "@/features/OverviewPage";
import { SqlInjectionPage } from "@/features/SqlInjectionPage";
import { SsrfPage } from "@/features/SsrfPage";
import { StoredXssPage } from "@/features/StoredXssPage";

export const App = () => (
  <Routes>
    <Route path="/" element={<Layout />}>
      <Route index element={<OverviewPage />} />
      <Route path="sql-injection" element={<SqlInjectionPage />} />
      <Route path="stored-xss" element={<StoredXssPage />} />
      <Route path="csrf" element={<CsrfPage />} />
      <Route path="ssrf" element={<SsrfPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  </Routes>
);
