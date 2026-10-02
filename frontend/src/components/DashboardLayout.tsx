import {
  Activity,
  AlertTriangle,
  BarChart3,
  Boxes,
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  LayoutDashboard,
  MapPinned,
  PackageCheck,
  Route as RouteIcon,
  Settings,
  Truck,
  Zap,
  Bell,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
} from "lucide-react";

import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";

import { useState } from "react";
import { useTheme } from "./ThemeProvider";

const navigation = [
  {
    label: "Command Center",
    icon: LayoutDashboard,
    path: "/dashboard",
  },
  {
    label: "Locations",
    icon: MapPinned,
    path: "/locations",
  },
  {
    label: "Inventory",
    icon: Boxes,
    path: "/inventory",
  },
  {
    label: "Demand Forecast",
    icon: Activity,
    path: "/forecast",
  },
  {
    label: "Supply Requests",
    icon: PackageCheck,
    path: "/requests",
  },
  {
    label: "Transport",
    icon: Truck,
    path: "/transport",
  },
  {
    label: "Routes",
    icon: RouteIcon,
    path: "/routes",
  },
  {
    label: "Optimization",
    icon: Zap,
    path: "/optimization",
  },
  {
    label: "Scenarios",
    icon: GitBranch,
    path: "/scenarios",
  },
  {
    label: "Alerts",
    icon: AlertTriangle,
    path: "/alerts",
  },
  {
    label: "Analytics",
    icon: BarChart3,
    path: "/analytics",
  },
  {
    label: "AI Assistant",
    icon: BrainCircuit,
    path: "/assistant",
  },
];

export default function DashboardLayout() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const user = (() => {
    try {
      return JSON.parse(
        localStorage.getItem("logiforge_user") || "{}"
      );
    } catch {
      return {};
    }
  })();

  const logout = () => {
    localStorage.removeItem("logiforge_token");
    localStorage.removeItem("logiforge_user");
    navigate("/login");
  };

  const initials =
    user?.name
      ?.split(" ")
      .map((x: string) => x[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "DP";

  return (
    <>
      {/* SIDEBAR */}

      <aside
        className={`sidebar ${
          collapsed ? "collapsed" : ""
        } ${mobileOpen ? "mobile-open" : ""}`}
      >
        <div className="brand-row">
          <NavLink
            to="/dashboard"
            className="brand"
            onClick={() => setMobileOpen(false)}
          >
            <span className="brand-mark">LF</span>

            {!collapsed && (
              <span>
                <b>LOGIFORGE</b>
                <small>AI COMMAND SYSTEM</small>
              </span>
            )}
          </NavLink>

          <button
            className="mobile-menu"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Collapse */}

        <button
          className="collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
          aria-label="Collapse sidebar"
        >
          {collapsed ? (
            <ChevronRight size={14} />
          ) : (
            <ChevronLeft size={14} />
          )}
        </button>

        {!collapsed && (
          <div className="nav-section">
            OPERATIONS
          </div>
        )}

        <nav className="side-nav">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `nav-item ${
                    isActive ? "active" : ""
                  }`
                }
              >
                <Icon size={16} />

                {!collapsed && (
                  <span>{item.label}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <NavLink
            to="/settings"
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `nav-item ${
                isActive ? "active" : ""
              }`
            }
          >
            <Settings size={16} />

            {!collapsed && (
              <span>Settings</span>
            )}
          </NavLink>

          <button
            className="nav-item danger"
            onClick={logout}
          >
            <LogOut size={16} />

            {!collapsed && (
              <span>Logout</span>
            )}
          </button>
        </div>
      </aside>

      {/* MAIN AREA */}

      <div
        className={`main-area ${
          collapsed ? "wide" : ""
        }`}
      >
        {/* TOP BAR */}

        <header className="topbar">

          <div className="top-left">

            <button
              className="mobile-menu mobile-only"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={19} />
            </button>

            <div>
              <span className="eyebrow">
                LOGIFORGE AI
              </span>

              <strong>
                Predictive Logistics Command Center
              </strong>
            </div>

          </div>

          <div className="top-actions">

            {/* Notification */}

            <button
              className="notification"
              title="Notifications"
            >
              <Bell size={16} />
              <i />
            </button>

            {/* Theme */}

            <button
              className="theme-switch"
              onClick={toggleTheme}
              title="Toggle theme"
            >
              <span className="theme-switch-icon">
                {theme === "dark" ? (
                  <Moon size={17} />
                ) : (
                  <Sun size={17} />
                )}
              </span>

              <span className="theme-switch-copy">
                <b>
                  {theme === "dark"
                    ? "Dark"
                    : "Light"}
                </b>

                <small>
                  APPEARANCE
                </small>
              </span>
            </button>

            <span className="top-divider" />

            {/* Profile */}

            <div className="profile-card">
              <div className="avatar">
                {initials}
              </div>

              <div className="profile-copy">
                <b>
                  {user?.name || "Demo Planner"}
                </b>

                <small>
                  {user?.role ||
                    "LOGISTICS PLANNER"}
                </small>
              </div>
            </div>

          </div>
        </header>

        {/* CONTENT */}

        <main>
          <Outlet />
        </main>
      </div>
    </>
  );
}