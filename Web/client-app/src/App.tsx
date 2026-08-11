import { Route, Routes } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { MainPage } from "@/features/MainPage";

export const App = () => (
  <Routes>
    <Route path="/" element={<Layout />}>
      <Route index element={<MainPage />} />
    </Route>
  </Routes>
);
