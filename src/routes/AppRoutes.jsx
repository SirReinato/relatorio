import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainGeral from '../pages/Outlet/index.jsx';
import Home from '../pages/Home/index.jsx';
import AdminArea from '../pages/AdminArea/index.jsx';
import AdminLogin from '../pages/AdminLogin/index.jsx';
import RelatorioNovo from '../pages/RelatorioNovo/index.jsx';

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainGeral />}>
          <Route index element={<Home />} />
          <Route path="relatorios/novo" element={<RelatorioNovo />} />
          <Route path="relatorios/novo/:draftId" element={<RelatorioNovo />} />
          <Route path="admin/login" element={<AdminLogin />} />
          <Route path="admin" element={<AdminArea />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
