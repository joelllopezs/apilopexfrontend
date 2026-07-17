import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  LayoutDashboard,
  Scissors,
  Users,
  UserRound,
  Clock,
  Building2,
  LogOut,
} from "lucide-react";

const menu = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Serviços",
    path: "/services",
    icon: Scissors,
  },
  {
    label: "Profissionais",
    path: "/professionals",
    icon: UserRound,
  },
  {
    label: "Clientes",
    path: "/clients",
    icon: Users,
  },
  {
    label: "Horários",
    path: "/business-hours",
    icon: Clock,
  },
  {
    label: "Agenda",
    path: "/appointments",
    icon: CalendarDays,
  },
  {
 label: "Empresa",
 path: "/company",
 icon: Building2,
},
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  function logout() {
    localStorage.removeItem("@lopex:token");
    localStorage.removeItem("@lopex:user");
    navigate("/");
  }

  return (
    <aside
      style={{
        width: 270,
        background: "#09090d",
        borderRight: "1px solid #23232e",
        padding: 22,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ marginBottom: 30 }}>
        <div
          style={{
            fontSize: 34,
            fontWeight: 900,
            letterSpacing: -2,
          }}
        >
          <span>L</span>
          <span style={{ color: "#885AFE" }}>X</span>
        </div>
        <div style={{ color: "#b8b8c8", marginTop: 4 }}>Lopex Agenda</div>
      </div>

      <nav style={{ display: "grid", gap: 8 }}>
        {menu.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "13px 14px",
                borderRadius: 12,
                background: active ? "rgba(136, 90, 254, 0.18)" : "transparent",
                color: active ? "#fff" : "#b8b8c8",
                border: active
                  ? "1px solid rgba(136, 90, 254, 0.35)"
                  : "1px solid transparent",
              }}
            >
              <Icon size={19} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={logout}
        style={{
          marginTop: "auto",
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "transparent",
          color: "#ff8f8f",
          border: "1px solid #38252a",
          padding: "12px 14px",
          borderRadius: 12,
          cursor: "pointer",
        }}
      >
        <LogOut size={18} />
        Sair
      </button>
    </aside>
  );
}