import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  Search,
  XCircle,
} from "lucide-react";
import api from "../lib/api";

type InventoryItem = {
  id: string;
  location_code: string;
  location_name?: string;
  item_name: string;
  category: string;
  current_quantity: number;
  daily_average_consumption: number;
  days_of_supply: number;
  status: "GREEN" | "AMBER" | "RED";
};

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    const loadInventory = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/inventory");

        const data = response.data?.data ?? response.data ?? [];

        setItems(Array.isArray(data) ? data : []);
      } catch (err: any) {
        console.error("Inventory loading error:", err);

        if (err?.response?.status === 401) {
          localStorage.removeItem("logiforge_token");
          localStorage.removeItem("logiforge_user");
          window.location.href = "/login";
          return;
        }

        setError(
          err?.response?.data?.message ||
            "Unable to load inventory data."
        );
      } finally {
        setLoading(false);
      }
    };

    loadInventory();
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.item_name
          ?.toLowerCase()
          .includes(search.toLowerCase()) ||
        item.location_code
          ?.toLowerCase()
          .includes(search.toLowerCase()) ||
        item.category
          ?.toLowerCase()
          .includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" ||
        item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [items, search, statusFilter]);

  const greenCount = items.filter(
    (item) => item.status === "GREEN"
  ).length;

  const amberCount = items.filter(
    (item) => item.status === "AMBER"
  ).length;

  const redCount = items.filter(
    (item) => item.status === "RED"
  ).length;

  const getStatusIcon = (status: string) => {
    if (status === "GREEN") {
      return <CheckCircle2 size={15} />;
    }

    if (status === "AMBER") {
      return <AlertTriangle size={15} />;
    }

    return <XCircle size={15} />;
  };

  return (
    <section className="dashboard-page">
      <div className="dashboard-inner">

        {/* Header */}
        <div className="dash-head">
          <div>
            <span className="status-pill small">
              <i /> INVENTORY MONITORING
            </span>

            <h1>Inventory Intelligence</h1>

            <p>
              Monitor stock levels, consumption rates and days of
              supply across the synthetic logistics network.
            </p>
          </div>

          <div className="demo-badge">
            SYNTHETIC DATA · HUMAN REVIEW
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              marginBottom: "18px",
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

        {/* KPI cards */}
        <div className="stat-grid">

          <div className="stat-card">
            <div className="stat-top">
              <span className="stat-icon">
                <Boxes size={18} />
              </span>
            </div>

            <b>{loading ? "—" : items.length}</b>
            <small>Total Inventory Records</small>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <span className="stat-icon">
                <CheckCircle2 size={18} />
              </span>
            </div>

            <b>{loading ? "—" : greenCount}</b>
            <small>Healthy Stock</small>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <span className="stat-icon">
                <AlertTriangle size={18} />
              </span>
            </div>

            <b>{loading ? "—" : amberCount}</b>
            <small>Attention Required</small>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <span className="stat-icon">
                <XCircle size={18} />
              </span>
            </div>

            <b>{loading ? "—" : redCount}</b>
            <small>Critical Stock</small>
          </div>

        </div>

        {/* Main panel */}
        <div className="panel">

          <div className="panel-head">
            <div>
              <h2>Inventory Status</h2>
              <p>
                Current stock and estimated days of supply
              </p>
            </div>

            <Boxes size={18} />
          </div>

          {/* Filters */}
          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              marginBottom: "18px",
            }}
          >
            <div
              className="input-wrap"
              style={{
                maxWidth: "320px",
                flex: "1 1 240px",
              }}
            >
              <Search size={16} />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search item, category or location..."
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
              style={{
                minWidth: "150px",
                borderRadius: "10px",
                padding: "10px 12px",
                background: "transparent",
                border: "1px solid rgba(148,163,184,.2)",
                color: "inherit",
              }}
            >
              <option value="ALL">All Status</option>
              <option value="GREEN">Green</option>
              <option value="AMBER">Amber</option>
              <option value="RED">Red</option>
            </select>
          </div>

          {/* Table */}
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "850px",
              }}
            >
              <thead>
                <tr>
                  <th style={thStyle}>ITEM</th>
                  <th style={thStyle}>CATEGORY</th>
                  <th style={thStyle}>LOCATION</th>
                  <th style={thStyle}>CURRENT STOCK</th>
                  <th style={thStyle}>DAILY CONSUMPTION</th>
                  <th style={thStyle}>DAYS OF SUPPLY</th>
                  <th style={thStyle}>STATUS</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      style={emptyStyle}
                    >
                      Loading inventory...
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      style={emptyStyle}
                    >
                      No inventory records found.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item.id}>
                      <td style={tdStyle}>
                        <strong>{item.item_name}</strong>
                      </td>

                      <td style={tdStyle}>
                        {item.category}
                      </td>

                      <td style={tdStyle}>
                        {item.location_code}
                      </td>

                      <td style={tdStyle}>
                        {Number(
                          item.current_quantity
                        ).toLocaleString()}
                      </td>

                      <td style={tdStyle}>
                        {Number(
                          item.daily_average_consumption
                        ).toFixed(1)}
                      </td>

                      <td style={tdStyle}>
                        <strong>
                          {Number(
                            item.days_of_supply
                          ).toFixed(1)}{" "}
                          days
                        </strong>
                      </td>

                      <td style={tdStyle}>
                        <span
                          className={`inventory-status ${item.status.toLowerCase()}`}
                        >
                          {getStatusIcon(item.status)}
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>

        {/* Human review */}
        <div className="human-note">
          <span>Human review</span>

          Inventory status is calculated from synthetic stock and
          consumption data. LOGIFORGE AI provides decision support;
          final logistics decisions remain with authorized users.
        </div>

      </div>
    </section>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "12px 10px",
  fontSize: "10px",
  letterSpacing: "0.08em",
  opacity: 0.6,
  borderBottom: "1px solid rgba(148,163,184,.12)",
};

const tdStyle: React.CSSProperties = {
  padding: "14px 10px",
  fontSize: "13px",
  borderBottom: "1px solid rgba(148,163,184,.08)",
};

const emptyStyle: React.CSSProperties = {
  textAlign: "center",
  padding: "40px 20px",
  opacity: 0.6,
};