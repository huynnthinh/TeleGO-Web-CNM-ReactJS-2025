import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";

const AppLayout = () => (
  <div className="app-container">
    <Header />
    <Sidebar />
    <main>
      <Outlet />
    </main>
  </div>
);

export default AppLayout;
