import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  RefreshCw,
  ShieldAlert,
  TriangleAlert,
} from "lucide-react";
import api from "../lib/api";

type AlertItem = {
  id: string;
  severity: "CRITICAL" | "WARNING" | "INFO" | string;
  alert_type?: string;
  title?: string;
  message?: string;
  description?: string;
  location_code?: string;
  item_name?: string;
  is_resolved: boolean;
  created_at: string;
  resolved_at?: string | null;
};

export default function Alerts() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(false);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      setError("");

      const params =
        filter === "all"
          ? {}
          : {
              resolved:
                filter === "resolved"
                  ? "true"
                  : "false",
            };

      const response = await api.get("/alerts", {
        params,
      });

      setAlerts(response.data?.data || []);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Unable to load alerts."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [filter]);

  /*
   * Run predictive stock-out risk scan
   *
   * Backend:
   * POST /api/alerts/scan
   */
  const runRiskScan = async () => {
    try {
      setScanning(true);
      setError("");

      const response = await api.post(
        "/alerts/scan"
      );

      const message =
        response.data?.message ||
        "Risk scan completed.";

      alert(message);

      await loadAlerts();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Risk scan failed."
      );
    } finally {
      setScanning(false);
    }
  };

  const counts = useMemo(() => {
    return {
      total: alerts.length,

      critical: alerts.filter(
        (a) => a.severity === "CRITICAL"
      ).length,

      warning: alerts.filter(
        (a) => a.severity === "WARNING"
      ).length,

      info: alerts.filter(
        (a) => a.severity === "INFO"
      ).length,

      unresolved: alerts.filter(
        (a) => !a.is_resolved
      ).length,
    };
  }, [alerts]);

  const resolveAlert = async (id: string) => {
    try {
      setResolving(id);
      setError("");

      await api.patch(
        `/alerts/${id}/resolve`
      );

      await loadAlerts();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Unable to resolve alert."
      );
    } finally {
      setResolving(null);
    }
  };

  const severityIcon = (severity: string) => {
    if (severity === "CRITICAL") {
      return <ShieldAlert size={18} />;
    }

    if (severity === "WARNING") {
      return <TriangleAlert size={18} />;
    }

    return <AlertTriangle size={18} />;
  };

  const formatDate = (value: string) => {
    if (!value) return "-";

    return new Date(value).toLocaleString(
      "en-IN",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  };

  return (
    <section className="dashboard-page">
      <div className="dashboard-inner">

        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="dash-head">
          <div>
            <span className="eyebrow">
              RISK & NOTIFICATIONS
            </span>

            <h1>
              Alerts & Stock-out Risk
            </h1>

            <p>
              Monitor inventory risks,
              operational warnings and
              critical logistics alerts.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            {/* RUN RISK SCAN */}

            <button
              className="primary-btn"
              onClick={runRiskScan}
              disabled={loading || scanning}
              title="Run predictive stock-out risk analysis"
            >
              <ShieldAlert size={15} />

              {scanning
                ? "Scanning..."
                : "Run Risk Scan"}
            </button>

            {/* REFRESH */}

            <button
              className="outline-btn"
              onClick={loadAlerts}
              disabled={loading || scanning}
              title="Refresh alerts"
            >
              <RefreshCw
                size={15}
                className={
                  loading ? "spin" : ""
                }
              />

              Refresh
            </button>
          </div>
        </div>

        {/* =====================================================
            KPI CARDS
        ====================================================== */}

        <div className="stat-grid">

          {/* TOTAL */}

          <div className="stat-card">
            <div className="stat-icon">
              <AlertTriangle size={18} />
            </div>

            <span>
              Total Alerts
            </span>

            <strong>
              {counts.total}
            </strong>

            <small>
              Current view
            </small>
          </div>

          {/* CRITICAL */}

          <div className="stat-card">
            <div className="stat-icon">
              <ShieldAlert size={18} />
            </div>

            <span>
              Critical
            </span>

            <strong>
              {counts.critical}
            </strong>

            <small>
              Immediate attention
            </small>
          </div>

          {/* WARNING */}

          <div className="stat-card">
            <div className="stat-icon">
              <TriangleAlert size={18} />
            </div>

            <span>
              Warnings
            </span>

            <strong>
              {counts.warning}
            </strong>

            <small>
              Requires review
            </small>
          </div>

          {/* UNRESOLVED */}

          <div className="stat-card">
            <div className="stat-icon">
              <Clock3 size={18} />
            </div>

            <span>
              Unresolved
            </span>

            <strong>
              {counts.unresolved}
            </strong>

            <small>
              Pending action
            </small>
          </div>

        </div>

        {/* =====================================================
            OPERATIONAL ALERTS
        ====================================================== */}

        <div className="panel">

          <div className="panel-head">

            <div>
              <h3>
                Operational Alerts
              </h3>

              <span>
                Inventory and logistics
                risk signals
              </span>
            </div>

            {/* FILTERS */}

            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
              }}
            >

              {/* ALL */}

              <button
                className={
                  filter === "all"
                    ? "primary-btn"
                    : "outline-btn"
                }
                onClick={() =>
                  setFilter("all")
                }
              >
                All
              </button>

              {/* UNRESOLVED */}

              <button
                className={
                  filter === "unresolved"
                    ? "primary-btn"
                    : "outline-btn"
                }
                onClick={() =>
                  setFilter("unresolved")
                }
              >
                Unresolved
              </button>

              {/* RESOLVED */}

              <button
                className={
                  filter === "resolved"
                    ? "primary-btn"
                    : "outline-btn"
                }
                onClick={() =>
                  setFilter("resolved")
                }
              >
                Resolved
              </button>

            </div>

          </div>

          {/* ERROR */}

          {error && (
            <div
              className="human-note"
              style={{
                marginBottom: 16,
                borderColor: "#ef4444",
              }}
            >
              {error}
            </div>
          )}

          {/* =====================================================
              LOADING
          ====================================================== */}

          {loading ? (
            <div
              style={{
                padding: "45px 20px",
                textAlign: "center",
                color: "var(--muted)",
              }}
            >
              Loading alerts...
            </div>

          ) : alerts.length === 0 ? (

            /* =================================================
               EMPTY STATE
            ================================================== */

            <div
              style={{
                padding: "55px 20px",
                textAlign: "center",
              }}
            >
              <CheckCircle2
                size={38}
                style={{
                  opacity: 0.6,
                }}
              />

              <h3
                style={{
                  marginBottom: 6,
                }}
              >
                No alerts found
              </h3>

              <p
                style={{
                  color: "var(--muted)",
                  margin: 0,
                }}
              >
                No alerts match the
                selected filter.
              </p>
            </div>

          ) : (

            /* =================================================
               ALERT LIST
            ================================================== */

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >

              {alerts.map((alert) => {

                const severity =
                  alert.severity?.toUpperCase();

                return (
                  <div
                    key={alert.id}
                    style={{
                      border:
                        "1px solid var(--line)",
                      borderRadius: 12,
                      padding: 16,
                      background:
                        "var(--surface2)",
                      opacity:
                        alert.is_resolved
                          ? 0.72
                          : 1,
                    }}
                  >

                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        gap: 16,
                        alignItems:
                          "flex-start",
                      }}
                    >

                      {/* =====================================
                          ALERT INFORMATION
                      ====================================== */}

                      <div
                        style={{
                          display: "flex",
                          gap: 12,
                          minWidth: 0,
                        }}
                      >

                        {/* ICON */}

                        <div
                          className="stat-icon"
                          style={{
                            flexShrink: 0,
                          }}
                        >
                          {severityIcon(
                            severity
                          )}
                        </div>

                        <div>

                          {/* SEVERITY */}

                          <div
                            style={{
                              display:
                                "flex",
                              alignItems:
                                "center",
                              gap: 8,
                              flexWrap:
                                "wrap",
                            }}
                          >

                            <span
                              className={`inventory-status ${
                                severity ===
                                "CRITICAL"
                                  ? "red"
                                  : severity ===
                                    "WARNING"
                                  ? "amber"
                                  : "green"
                              }`}
                            >
                              {severity}
                            </span>

                            {alert.is_resolved && (
                              <span className="inventory-status green">
                                RESOLVED
                              </span>
                            )}

                          </div>

                          {/* TITLE */}

                          <h3
                            style={{
                              margin:
                                "8px 0 5px",
                            }}
                          >
                            {alert.title ||
                              alert.alert_type ||
                              "Operational Alert"}
                          </h3>

                          {/* MESSAGE */}

                          <p
                            style={{
                              margin: 0,
                              color:
                                "var(--muted)",
                              lineHeight:
                                1.55,
                            }}
                          >
                            {alert.message ||
                              alert.description ||
                              "No alert description available."}
                          </p>

                          {/* CONTEXT */}

                          <div
                            style={{
                              display:
                                "flex",
                              gap: 18,
                              flexWrap:
                                "wrap",
                              marginTop: 12,
                              fontSize: 12,
                              color:
                                "var(--muted)",
                            }}
                          >

                            {alert.location_code && (
                              <span>
                                <b>
                                  Location:
                                </b>{" "}
                                {
                                  alert.location_code
                                }
                              </span>
                            )}

                            {alert.item_name && (
                              <span>
                                <b>
                                  Item:
                                </b>{" "}
                                {
                                  alert.item_name
                                }
                              </span>
                            )}

                            <span>
                              <b>
                                Created:
                              </b>{" "}
                              {formatDate(
                                alert.created_at
                              )}
                            </span>

                          </div>

                        </div>
                      </div>

                      {/* =====================================
                          RESOLVE BUTTON
                      ====================================== */}

                      {!alert.is_resolved && (
                        <button
                          className="outline-btn"
                          disabled={
                            resolving ===
                            alert.id
                          }
                          onClick={() =>
                            resolveAlert(
                              alert.id
                            )
                          }
                          style={{
                            flexShrink: 0,
                          }}
                        >
                          {resolving ===
                          alert.id
                            ? "Resolving..."
                            : "Resolve"}
                        </button>
                      )}

                    </div>
                  </div>
                );
              })}

            </div>
          )}

        </div>

        {/* =====================================================
            EXPLAINABILITY NOTE
        ====================================================== */}

        <div className="human-note">
          <b>
            Risk interpretation:
          </b>{" "}
          Critical alerts represent the
          highest-severity operational
          signals. Warning alerts indicate
          conditions requiring review, while
          informational alerts provide
          lower-severity operational context.
          Resolve an alert only after the
          corresponding operational issue has
          been reviewed.
        </div>

      </div>
    </section>
  );
}