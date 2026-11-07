import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainGeral from '../pages/Outlet/index.jsx';
import Home from '../pages/Home/index.jsx';

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainGeral />}>
          <Route index element={<Home />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
