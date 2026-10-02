import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowUpRight,
  Boxes,
  BrainCircuit,
  CircleAlert,
  MapPin,
  Truck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import api from "../lib/api";

type Summary = {
  totalLocations: number;
  criticalLocations: number;
  pendingRequests: number;
  activeTransportAssets: number;
  lowInventoryItems: number;
  predictedShortages: number;
  openScenarios: number;
};

type AlertItem = {
  id: string;
  severity: string;
  alert_type: string;
  title: string;
  message: string;
  created_at: string;
};

type InventoryItem = {
  id: string;
  location_code: string;
  item_name: string;
  category: string;
  current_quantity: number;
  daily_average_consumption: number;
  days_of_supply: number;
  status: "GREEN" | "AMBER" | "RED";
};

type DashboardOverview = {
  summary: {
    locations: number;
    critical_inventory: number;
    pending_requests: number;
    active_assets: number;
  };
  alerts: AlertItem[];
  requests: unknown[];
  inventory: InventoryItem[];
};

const fallbackForecast = [
  { m: "Apr", a: 62, p: 64 },
  { m: "May", a: 66, p: 68 },
  { m: "Jun", a: 70, p: 73 },
  { m: "Jul", a: 75, p: 78 },
  { m: "Aug", a: 79, p: 84 },
  { m: "Sep", a: 83, p: 90 },
];

export default function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get<{
          success: boolean;
          data: DashboardOverview;
        }>("/dashboard/overview");

        const data = response.data.data;

        setSummary({
          totalLocations: data.summary.locations,
          criticalLocations: data.summary.critical_inventory,
          pendingRequests: data.summary.pending_requests,
          activeTransportAssets: data.summary.active_assets,

          // These are calculated from the inventory/alert data below.
          lowInventoryItems: data.inventory.filter(
            (item) => item.status === "AMBER" || item.status === "RED"
          ).length,

          predictedShortages: data.alerts.filter(
            (alert) =>
              alert.severity === "CRITICAL" ||
              alert.alert_type.toLowerCase().includes("shortage")
          ).length,

          openScenarios: 0,
        });

        setAlerts(data.alerts);
        setInventory(data.inventory);
      } catch (err: any) {
        console.error("Dashboard loading error:", err);

        if (err?.response?.status === 401) {
          localStorage.removeItem("logiforge_token");
          localStorage.removeItem("logiforge_user");
          window.location.href = "/login";
          return;
        }

        setError(
          err?.response?.data?.message ||
            "Unable to load dashboard data from backend."
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const health = useMemo(() => {
    const categories = [
      "Food",
      "Fuel",
      "Medical",
      "Maintenance",
      "Essentials",
    ];

    return categories.map((category) => {
      const items = inventory.filter(
        (item) => item.category.toLowerCase() === category.toLowerCase()
      );

      if (!items.length) {
        return {
          n: category,
          v: 0,
        };
      }

      const score =
        items.reduce((total, item) => {
          if (item.status === "GREEN") return total + 100;
          if (item.status === "AMBER") return total + 65;
          return total + 30;
        }, 0) / items.length;

      return {
        n: category,
        v: Math.round(score),
      };
    });
  }, [inventory]);

  const stats = [
    [
      "Demo Locations",
      summary?.totalLocations ?? 0,
      "+4.2%",
      MapPin,
    ],
    [
      "Low Inventory",
      summary?.lowInventoryItems ?? 0,
      "-12.5%",
      Boxes,
    ],
    [
      "Predicted Shortages",
      summary?.predictedShortages ?? 0,
      "+8.1%",
      BrainCircuit,
    ],
    [
      "Active Assets",
      summary?.activeTransportAssets ?? 0,
      "+6.4%",
      Truck,
    ],
  ] as const;

  const formatAlertTime = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();

    const minutes = Math.max(1, Math.floor(diff / 60000));

    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);

    if (hours < 24) return `${hours}h ago`;

    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <section className="dashboard-page">
      <div className="dashboard-inner">
        <div className="dash-head">
          <div>
            <span className="status-pill small">
              <i /> SYSTEM OPERATIONAL
            </span>

            <h1>Good morning, Planner.</h1>

            <p>
              Current logistics intelligence snapshot across the synthetic
              network.
            </p>
          </div>

          <div className="demo-badge">
            SYNTHETIC DATA · HUMAN REVIEW
          </div>
        </div>

        {error && (
          <div
            style={{
              marginBottom: "16px",
              padding: "12px 14px",
              borderRadius: "10px",
              border: "1px solid rgba(239,68,68,.25)",
              background: "rgba(239,68,68,.08)",
              color: "#fca5a5",
              fontSize: "13px",
            }}
          >
            {error}
          </div>
        )}

        <div className="stat-grid">
          {stats.map(([label, value, trend, Icon]) => (
            <div className="stat-card" key={label}>
              <div className="stat-top">
                <span className="stat-icon">
                  <Icon size={18} />
                </span>

                <span className="trend">{trend}</span>
              </div>

              <b>{loading ? "—" : value}</b>

              <small>{label}</small>
            </div>
          ))}
        </div>

        <div className="dashboard-grid">
          <div className="panel large">
            <div className="panel-head">
              <div>
                <h2>Demand Forecast</h2>
                <p>Actual consumption vs predicted demand</p>
              </div>

              <span className="panel-tag">6 MONTHS</span>
            </div>

            <div className="chart">
              <ResponsiveContainer>
                <AreaChart data={fallbackForecast}>
                  <defs>
                    <linearGradient
                      id="f"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0"
                        stopColor="#22d3ee"
                        stopOpacity=".35"
                      />

                      <stop
                        offset="1"
                        stopColor="#22d3ee"
                        stopOpacity="0"
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(148,163,184,.12)"
                  />

                  <XAxis
                    dataKey="m"
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip />

                  <Area
                    type="monotone"
                    dataKey="a"
                    stroke="#64748b"
                    fill="transparent"
                    strokeWidth={2}
                    name="Actual"
                  />

                  <Area
                    type="monotone"
                    dataKey="p"
                    stroke="#22d3ee"
                    fill="url(#f)"
                    strokeWidth={3}
                    name="Predicted"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div
              style={{
                padding: "0 4px 4px",
                fontSize: "11px",
                opacity: 0.55,
              }}
            >
              Forecast visualization will use generated model results once
              forecasting is executed.
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <div>
                <h2>Inventory Health</h2>
                <p>Category readiness</p>
              </div>

              <Boxes size={18} />
            </div>

            <div className="chart">
              <ResponsiveContainer>
                <BarChart
                  data={health}
                  layout="vertical"
                >
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    hide
                  />

                  <YAxis
                    type="category"
                    dataKey="n"
                    width={80}
                    tick={{ fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip />

                  <Bar
                    dataKey="v"
                    fill="#14b8a6"
                    radius={[0, 6, 6, 0]}
                    barSize={18}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="dashboard-grid lower">
          <div className="panel">
            <div className="panel-head">
              <div>
                <h2>Synthetic Logistics Network</h2>

                <p>
                  Decision-support visualization · not operational navigation
                </p>
              </div>

              <MapPin size={18} />
            </div>

            <div className="dashboard-map">
              <div className="grid-bg" />

              <svg viewBox="0 0 700 310">
                <path
                  d="M100 105 C230 80 260 170 350 145 C450 115 500 75 610 110"
                  className="route cyan"
                />

                <path
                  d="M100 105 C210 180 260 235 370 220 C460 205 530 240 610 195"
                  className="route teal"
                />
              </svg>

              {[
                ["A01", "n1"],
                ["D01", "n2"],
                ["A07", "n3"],
                ["A12", "n4"],
                ["D03", "n5"],
              ].map(([name, node]) => (
                <div
                  className={`dash-node ${node}`}
                  key={name}
                >
                  <i />
                  <span>{name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <div>
                <h2>Critical Alerts</h2>
                <p>Requires planner review</p>
              </div>

              <CircleAlert size={18} />
            </div>

            <div className="alerts">
              {loading ? (
                <div
                  style={{
                    padding: "20px 0",
                    opacity: 0.6,
                    fontSize: "13px",
                  }}
                >
                  Loading alerts...
                </div>
              ) : alerts.length === 0 ? (
                <div
                  style={{
                    padding: "20px 0",
                    opacity: 0.6,
                    fontSize: "13px",
                  }}
                >
                  No unresolved alerts.
                </div>
              ) : (
                alerts.slice(0, 6).map((alert) => (
                  <div
                    className="alert-row"
                    key={alert.id}
                  >
                    <div>
                      <b
                        className={alert.severity.toLowerCase()}
                      >
                        {alert.severity}
                      </b>

                      <strong>
                        {alert.title}
                      </strong>
                    </div>

                    <small>
                      {formatAlertTime(alert.created_at)}
                    </small>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="human-note">
          <span>Human review</span>

          LOGIFORGE AI provides recommendations and scenario analysis; final
          logistics decisions remain with authorized users.

          <ArrowUpRight size={15} />
        </div>
      </div>
    </section>
  );
}