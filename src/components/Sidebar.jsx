import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Scissors,
  User,
  Users,
  Clock,
  CalendarDays,
  Building2,
  LogOut,
  ShieldCheck,
} from "lucide-react";

import api from "../api/api";

export default function Sidebar() {
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [user, setUser] = useState(null);

  const menuItems = [
    {
      path: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      path: "/admin",
      label: "Admin Master",
      icon: ShieldCheck,
      onlySuperAdmin: true,
    },
    {
      path: "/services",
      label: "Serviços",
      icon: Scissors,
    },
    {
      path: "/professionals",
      label: "Profissionais",
      icon: User,
    },
    {
      path: "/clients",
      label: "Clientes",
      icon: Users,
    },
    {
      path: "/business-hours",
      label: "Horários",
      icon: Clock,
    },
    {
      path: "/appointments",
      label: "Agenda",
      icon: CalendarDays,
    },
    {
      path: "/company",
      label: "Empresa",
      icon: Building2,
    },
  ];

  async function loadCompany() {
    try {
      const storedUser = localStorage.getItem("@lopex:user");

      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }

      const response = await api.get("/companies/me");
      const companyData = response.data;

      setCompany(companyData);

      localStorage.setItem("@lopex:company", JSON.stringify(companyData));

      document.documentElement.style.setProperty(
        "--primary-color",
        companyData.primaryColor || "#885AFE"
      );
    } catch (error) {
      const storedCompany = localStorage.getItem("@lopex:company");

      if (storedCompany) {
        const companyData = JSON.parse(storedCompany);
        setCompany(companyData);

        document.documentElement.style.setProperty(
          "--primary-color",
          companyData.primaryColor || "#885AFE"
        );
      }

      console.error(error);
    }
  }

  function handleLogout() {
    localStorage.removeItem("@lopex:token");
    localStorage.removeItem("@lopex:user");
    localStorage.removeItem("@lopex:company");
    navigate("/");
  }

  useEffect(() => {
    loadCompany();
  }, []);

  const visibleMenuItems = menuItems.filter((item) => {
    if (item.onlySuperAdmin) {
      return user?.role === "super_admin";
    }

    return true;
  });

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          {company?.logoUrl ? (
            <img src={company.logoUrl} alt={company.name} />
          ) : (
            <span>LX</span>
          )}
        </div>

        <div>
          <strong>{company?.name || "Lopex Agenda"}</strong>
          <small>{company?.slug || "Painel de agendamentos"}</small>
        </div>
      </div>

      <nav className="sidebar-menu">
        {visibleMenuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                isActive ? "sidebar-link active" : "sidebar-link"
              }
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <button type="button" className="logout-button" onClick={handleLogout}>
        <LogOut size={20} />
        <span>Sair</span>
      </button>
    </aside>
  );
}