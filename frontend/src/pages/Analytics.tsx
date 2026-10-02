import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Boxes,
  PackageCheck,
  Truck,
  RefreshCw,
  TrendingUp,
  ShieldAlert,
} from "lucide-react";
import api from "../lib/api";

type InventoryItem = {
  status: string;
  days_of_supply: number | string;
  current_quantity: number | string;
  daily_average_consumption: number | string;
};

type AlertItem = {
  severity: string;
  is_resolved: boolean;
};

type RequestItem = {
  priority: string;
  status: string;
  quantity: number | string;
};

type TransportAsset = {
  status: string;
  capacity: number | string;
};

type ForecastItem = {
  predicted_quantity: number | string;
  forecast_date: string;
};

export default function Analytics() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [assets, setAssets] = useState<TransportAsset[]>([]);
  const [forecasts, setForecasts] = useState<ForecastItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        inventoryResponse,
        alertsResponse,
        requestsResponse,
        assetsResponse,
        forecastResponse,
      ] = await Promise.all([
        api.get("/inventory"),
        api.get("/alerts"),
        api.get("/requests"),
        api.get("/transport/assets"),
        api.get("/forecast"),
      ]);

      setInventory(inventoryResponse.data?.data || []);
      setAlerts(alertsResponse.data?.data || []);
      setRequests(requestsResponse.data?.data || []);
      setAssets(assetsResponse.data?.data || []);
      setForecasts(forecastResponse.data?.data || []);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to load analytics data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const metrics = useMemo(() => {
    const redInventory = inventory.filter(
      (item) => item.status === "RED"
    );

    const amberInventory = inventory.filter(
      (item) => item.status === "AMBER"
    );

    const criticalAlerts = alerts.filter(
      (alert) =>
        alert.severity === "CRITICAL" &&
        !alert.is_resolved
    );

    const warningAlerts = alerts.filter(
      (alert) =>
        alert.severity === "WARNING" &&
        !alert.is_resolved
    );

    const pendingRequests = requests.filter(
      (request) =>
        [
          "SUBMITTED",
          "UNDER_REVIEW",
          "PLANNED",
          "APPROVED",
        ].includes(request.status)
    );

    const criticalRequests = requests.filter(
      (request) =>
        request.priority === "CRITICAL" &&
        pendingRequests.includes(request)
    );

    const availableAssets = assets.filter(
      (asset) => asset.status === "AVAILABLE"
    );

    const totalCapacity = assets.reduce(
      (sum, asset) =>
        sum + Number(asset.capacity || 0),
      0
    );

    const availableCapacity = availableAssets.reduce(
      (sum, asset) =>
        sum + Number(asset.capacity || 0),
      0
    );

    const totalForecastDemand = forecasts.reduce(
      (sum, forecast) =>
        sum + Number(forecast.predicted_quantity || 0),
      0
    );

    return {
      redInventory: redInventory.length,
      amberInventory: amberInventory.length,
      criticalAlerts: criticalAlerts.length,
      warningAlerts: warningAlerts.length,
      pendingRequests: pendingRequests.length,
      criticalRequests: criticalRequests.length,
      totalAssets: assets.length,
      availableAssets: availableAssets.length,
      totalCapacity,
      availableCapacity,
      totalForecastDemand,
    };
  }, [inventory, alerts, requests, assets, forecasts]);

  const riskLevel =
    metrics.criticalAlerts > 0 ||
    metrics.redInventory > 0
      ? "CRITICAL"
      : metrics.warningAlerts > 0 ||
        metrics.amberInventory > 0
      ? "ELEVATED"
      : "STABLE";

  return (
    <div className="page">

      {/* HEADER */}
      <div className="page-header">
        <div>
          <div className="eyebrow">
            DECISION INTELLIGENCE
          </div>

          <h1>Analytics</h1>

          <p>
            Operational analytics across inventory,
            demand, requests, alerts and transport.
          </p>
        </div>

        <button
          className="secondary-btn"
          onClick={loadAnalytics}
          disabled={loading}
        >
          <RefreshCw
            size={15}
            className={loading ? "spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div
          className="alert-banner"
          style={{ marginBottom: 18 }}
        >
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {/* KPI GRID */}
      <div className="kpi-grid">

        <div className="kpi-card">
          <div className="kpi-icon">
            <Boxes size={18} />
          </div>

          <div>
            <span>Critical Inventory</span>
            <strong>
              {metrics.redInventory}
            </strong>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">
            <ShieldAlert size={18} />
          </div>

          <div>
            <span>Critical Alerts</span>
            <strong>
              {metrics.criticalAlerts}
            </strong>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">
            <PackageCheck size={18} />
          </div>

          <div>
            <span>Pending Requests</span>
            <strong>
              {metrics.pendingRequests}
            </strong>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">
            <Truck size={18} />
          </div>

          <div>
            <span>Available Assets</span>
            <strong>
              {metrics.availableAssets}
            </strong>
          </div>
        </div>

      </div>

      {/* ANALYTICS GRID */}
      <div className="content-grid">

        {/* INVENTORY RISK */}
        <section className="panel">

          <div className="panel-header">
            <div>
              <h3>Inventory Risk</h3>
              <span>
                Current stock health
              </span>
            </div>

            <Boxes size={19} />
          </div>

          <div
            style={{
              padding: 20,
              display: "grid",
              gap: 14,
            }}
          >
            <MetricRow
              label="RED"
              value={metrics.redInventory}
              status="danger"
            />

            <MetricRow
              label="AMBER"
              value={metrics.amberInventory}
              status="warning"
            />

            <MetricRow
              label="GREEN"
              value={
                Math.max(
                  inventory.length -
                    metrics.redInventory -
                    metrics.amberInventory,
                  0
                )
              }
              status="success"
            />
          </div>

        </section>

        {/* ALERTS */}
        <section className="panel">

          <div className="panel-header">
            <div>
              <h3>Alert Distribution</h3>
              <span>
                Unresolved operational alerts
              </span>
            </div>

            <AlertTriangle size={19} />
          </div>

          <div
            style={{
              padding: 20,
              display: "grid",
              gap: 14,
            }}
          >
            <MetricRow
              label="Critical"
              value={metrics.criticalAlerts}
              status="danger"
            />

            <MetricRow
              label="Warning"
              value={metrics.warningAlerts}
              status="warning"
            />

            <MetricRow
              label="All Active"
              value={
                metrics.criticalAlerts +
                metrics.warningAlerts
              }
              status="success"
            />
          </div>

        </section>

        {/* REQUESTS */}
        <section className="panel">

          <div className="panel-header">
            <div>
              <h3>Supply Requests</h3>
              <span>
                Current planning workload
              </span>
            </div>

            <PackageCheck size={19} />
          </div>

          <div style={{ padding: 20 }}>
            <BigMetric
              label="Pending Requests"
              value={metrics.pendingRequests}
            />

            <div style={{ marginTop: 18 }}>
              <MetricRow
                label="Critical Priority"
                value={metrics.criticalRequests}
                status="danger"
              />
            </div>
          </div>

        </section>

        {/* TRANSPORT */}
        <section className="panel">

          <div className="panel-header">
            <div>
              <h3>Transport Capacity</h3>
              <span>
                Available logistics resources
              </span>
            </div>

            <Truck size={19} />
          </div>

          <div style={{ padding: 20 }}>
            <BigMetric
              label="Available Assets"
              value={metrics.availableAssets}
            />

            <div style={{ marginTop: 18 }}>
              <MetricRow
                label="Available Capacity"
                value={metrics.availableCapacity}
                status="success"
              />

              <MetricRow
                label="Total Capacity"
                value={metrics.totalCapacity}
                status="warning"
              />
            </div>
          </div>

        </section>

      </div>

      {/* FORECAST SUMMARY */}
      <section
        className="panel"
        style={{ marginTop: 18 }}
      >

        <div className="panel-header">

          <div>
            <h3>Demand Forecast Summary</h3>

            <span>
              Generated forecast records
            </span>
          </div>

          <TrendingUp size={19} />

        </div>

        <div
          style={{
            padding: 20,
            display: "grid",
            gridTemplateColumns:
              "repeat(3, minmax(0, 1fr))",
            gap: 16,
          }}
        >

          <BigMetric
            label="Forecast Records"
            value={forecasts.length}
          />

          <BigMetric
            label="Forecast Demand"
            value={Math.round(
              metrics.totalForecastDemand
            )}
          />

          <BigMetric
            label="Risk Level"
            value={riskLevel}
          />

        </div>

      </section>

      {/* SYSTEM HEALTH */}
      <section
        className="panel"
        style={{ marginTop: 18 }}
      >

        <div className="panel-header">

          <div>
            <h3>Operational Health</h3>

            <span>
              Current system-wide indicators
            </span>
          </div>

          <Activity size={19} />

        </div>

        <div
          style={{
            padding: 20,
            display: "grid",
            gap: 14,
          }}
        >

          <HealthRow
            label="Inventory availability"
            value={
              metrics.redInventory === 0
                ? "STABLE"
                : "ATTENTION REQUIRED"
            }
            positive={metrics.redInventory === 0}
          />

          <HealthRow
            label="Alert condition"
            value={
              metrics.criticalAlerts === 0
                ? "STABLE"
                : "CRITICAL ALERTS ACTIVE"
            }
            positive={metrics.criticalAlerts === 0}
          />

          <HealthRow
            label="Transport readiness"
            value={
              metrics.availableAssets > 0
                ? "AVAILABLE"
                : "LIMITED"
            }
            positive={metrics.availableAssets > 0}
          />

          <HealthRow
            label="Planning workload"
            value={`${metrics.pendingRequests} pending requests`}
            positive={metrics.pendingRequests === 0}
          />

        </div>

      </section>

    </div>
  );
}

/* =========================
   SMALL COMPONENTS
========================= */

function MetricRow({
  label,
  value,
  status,
}: {
  label: string;
  value: number | string;
  status: "success" | "warning" | "danger";
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 14px",
        borderRadius: 8,
        background: "var(--surface2)",
      }}
    >
      <span
        style={{
          color: "var(--muted)",
          fontSize: 13,
        }}
      >
        {label}
      </span>

      <span className={`status-badge ${status}`}>
        {value}
      </span>
    </div>
  );
}

function BigMetric({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div>
      <div
        style={{
          color: "var(--muted)",
          fontSize: 13,
          marginBottom: 5,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: "var(--text)",
        }}
      >
        {typeof value === "number"
          ? value.toLocaleString()
          : value}
      </div>
    </div>
  );
}

function HealthRow({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "13px 15px",
        borderRadius: 8,
        background: "var(--surface2)",
      }}
    >
      <span>{label}</span>

      <span
        className={`status-badge ${
          positive ? "success" : "warning"
        }`}
      >
        {value}
      </span>
    </div>
  );
}