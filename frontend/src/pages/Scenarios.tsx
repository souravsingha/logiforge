import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  GitBranch,
  RefreshCw,
  XCircle,
  Zap,
} from "lucide-react";
import api from "../lib/api";

type Scenario = {
  id: string;
  name: string;
  type: string;
  parameter: number;
  status: string;
  baseline_snapshot?: {
    stock?: string | number;
    pending?: number;
  };
  created_at: string;
  closed_at?: string;
};

type ScenarioResult = {
  scenario: Scenario;
  impact: string;
  baseline: {
    stock: string | number;
    pending: number;
  };
  recommendation: string;
};

const scenarioTypes = [
  {
    value: "DEMAND_INCREASE",
    label: "Demand Increase",
    description: "Model increased supply demand.",
  },
  {
    value: "TRANSPORT_REDUCTION",
    label: "Transport Capacity Reduction",
    description: "Model reduced transport availability.",
  },
  {
    value: "ROUTE_UNAVAILABLE",
    label: "Route Unavailable",
    description: "Model disruption of a supply route.",
  },
  {
    value: "SUPPLY_DELAY",
    label: "Supply Delay",
    description: "Model delayed incoming supply.",
  },
  {
    value: "INVENTORY_REDUCTION",
    label: "Inventory Reduction",
    description: "Model reduction in available inventory.",
  },
  {
    value: "WEATHER_DISRUPTION",
    label: "Weather Disruption",
    description: "Model weather-related logistics disruption.",
  },
];

export default function Scenarios() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [closing, setClosing] = useState("");

  const [name, setName] = useState("Transport Capacity Stress Test");
  const [type, setType] =
    useState("TRANSPORT_REDUCTION");
  const [parameter, setParameter] = useState(30);

  const [result, setResult] =
    useState<ScenarioResult | null>(null);

  const [error, setError] = useState("");

  const loadScenarios = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/scenarios");

      setScenarios(response.data?.data || []);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to load scenarios."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScenarios();
  }, []);

  const runScenario = async () => {
    try {
      if (name.trim().length < 3) {
        setError("Scenario name must contain at least 3 characters.");
        return;
      }

      setRunning(true);
      setError("");
      setResult(null);

      const response = await api.post("/scenarios/run", {
        name: name.trim(),
        type,
        parameter: Number(parameter),
      });

      setResult(response.data?.data || null);

      await loadScenarios();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Scenario simulation failed."
      );
    } finally {
      setRunning(false);
    }
  };

  const closeScenario = async (id: string) => {
    try {
      setClosing(id);
      setError("");

      await api.post(`/scenarios/${id}/close`);

      await loadScenarios();

      if (result?.scenario.id === id) {
        setResult(null);
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to close scenario."
      );
    } finally {
      setClosing("");
    }
  };

  const formatType = (value: string) =>
    value.replaceAll("_", " ");

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow">
            WHAT-IF DECISION SUPPORT
          </span>

          <h1>Scenario Simulation</h1>

          <p className="page-subtitle">
            Test logistics disruption scenarios and review their
            modeled impact before making operational decisions.
          </p>
        </div>

        <div className="page-actions">
          <button
            className="secondary-btn"
            onClick={loadScenarios}
            disabled={loading}
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="alert-banner danger">
          <AlertTriangle size={17} />
          <span>{error}</span>
        </div>
      )}

      {/* Scenario Builder */}
      <div className="content-grid">
        <div className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">
                SCENARIO BUILDER
              </span>

              <h2>Create What-If Scenario</h2>
            </div>

            <GitBranch
              size={19}
              color="var(--accent)"
            />
          </div>

          <div
            style={{
              display: "grid",
              gap: "16px",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "7px",
                  color: "var(--muted)",
                  fontSize: "9px",
                  fontWeight: 800,
                  letterSpacing: ".06em",
                }}
              >
                SCENARIO NAME
              </label>

              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter scenario name"
                style={{
                  width: "100%",
                  padding: "11px 12px",
                  border: "1px solid var(--line)",
                  borderRadius: "10px",
                  outline: "none",
                  background: "var(--surface2)",
                  color: "var(--text)",
                  fontSize: "11px",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "7px",
                  color: "var(--muted)",
                  fontSize: "9px",
                  fontWeight: 800,
                  letterSpacing: ".06em",
                }}
              >
                SCENARIO TYPE
              </label>

              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                style={{
                  width: "100%",
                  padding: "11px 12px",
                  border: "1px solid var(--line)",
                  borderRadius: "10px",
                  outline: "none",
                  background: "var(--surface2)",
                  color: "var(--text)",
                  fontSize: "11px",
                }}
              >
                {scenarioTypes.map((item) => (
                  <option
                    key={item.value}
                    value={item.value}
                  >
                    {item.label}
                  </option>
                ))}
              </select>

              <p
                style={{
                  margin: "7px 0 0",
                  color: "var(--muted)",
                  fontSize: "9px",
                }}
              >
                {
                  scenarioTypes.find(
                    (item) => item.value === type
                  )?.description
                }
              </p>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "7px",
                  color: "var(--muted)",
                  fontSize: "9px",
                  fontWeight: 800,
                  letterSpacing: ".06em",
                }}
              >
                PARAMETER
              </label>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={parameter}
                  onChange={(e) =>
                    setParameter(
                      Math.max(
                        1,
                        Math.min(
                          100,
                          Number(e.target.value)
                        )
                      )
                    )
                  }
                  style={{
                    width: "120px",
                    padding: "11px 12px",
                    border: "1px solid var(--line)",
                    borderRadius: "10px",
                    outline: "none",
                    background: "var(--surface2)",
                    color: "var(--text)",
                    fontSize: "11px",
                  }}
                />

                <span
                  style={{
                    color: "var(--muted)",
                    fontSize: "10px",
                  }}
                >
                  %
                </span>
              </div>
            </div>

            <button
              className="primary-btn"
              onClick={runScenario}
              disabled={running}
              style={{
                marginTop: "4px",
              }}
            >
              <Zap size={15} />

              {running
                ? "Running Simulation..."
                : "Run Scenario Simulation"}
            </button>
          </div>
        </div>

        {/* Scenario Result */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">
                SIMULATION RESULT
              </span>

              <h2>Impact Assessment</h2>
            </div>
          </div>

          {!result ? (
            <div className="empty-state">
              <GitBranch
                size={28}
                style={{
                  marginBottom: "10px",
                  opacity: 0.6,
                }}
              />

              <div>
                Run a scenario to generate an impact
                assessment.
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: "12px",
              }}
            >
              <div
                style={{
                  padding: "14px",
                  border: "1px solid var(--line)",
                  borderRadius: "11px",
                  background: "var(--surface2)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "10px",
                  }}
                >
                  <strong
                    style={{
                      fontSize: "11px",
                    }}
                  >
                    {result.scenario.name}
                  </strong>

                  <span className="status-badge green">
                    <CheckCircle2 size={13} />
                    {result.scenario.status}
                  </span>
                </div>

                <div
                  style={{
                    marginTop: "7px",
                    color: "var(--muted)",
                    fontSize: "9px",
                  }}
                >
                  {formatType(result.scenario.type)}
                  {" · "}
                  Parameter: {result.scenario.parameter}%
                </div>
              </div>

              <div className="kpi-grid">
                <div className="kpi-card">
                  <div className="kpi-icon">
                    <Zap size={17} />
                  </div>

                  <div>
                    <span>Baseline Stock</span>
                    <strong>
                      {Number(
                        result.baseline.stock
                      ).toLocaleString()}
                    </strong>
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-icon">
                    <GitBranch size={17} />
                  </div>

                  <div>
                    <span>Pending Requests</span>
                    <strong>
                      {result.baseline.pending}
                    </strong>
                  </div>
                </div>
              </div>

              <div
                style={{
                  padding: "13px",
                  border: "1px solid rgba(245,158,11,.18)",
                  borderRadius: "11px",
                  background: "rgba(245,158,11,.06)",
                }}
              >
                <span
                  className="eyebrow"
                  style={{
                    color: "#f59e0b",
                  }}
                >
                  MODELED IMPACT
                </span>

                <p
                  style={{
                    margin: "7px 0 0",
                    color: "var(--text)",
                    fontSize: "10px",
                    lineHeight: 1.6,
                  }}
                >
                  {result.impact}
                </p>
              </div>

              <div className="human-note">
                <div>
                  <strong>
                    Recommendation
                  </strong>

                  <p>
                    {result.recommendation}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scenario History */}
      <div className="panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">
              SCENARIO HISTORY
            </span>

            <h2>Previous Simulations</h2>
          </div>

          <span className="status-badge green">
            {scenarios.length} RUNS
          </span>
        </div>

        {loading ? (
          <div className="loading-state">
            Loading scenario history...
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Parameter</th>
                  <th>Status</th>
                  <th>Baseline Stock</th>
                  <th>Pending Requests</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {scenarios.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      No scenarios created yet.
                    </td>
                  </tr>
                ) : (
                  scenarios.map((scenario) => (
                    <tr key={scenario.id}>
                      <td>
                        <strong>
                          {scenario.name}
                        </strong>
                      </td>

                      <td>
                        {formatType(scenario.type)}
                      </td>

                      <td>
                        {scenario.parameter}%
                      </td>

                      <td>
                        {scenario.status ===
                        "OPEN" ? (
                          <span className="status-badge green">
                            <CheckCircle2 size={13} />
                            OPEN
                          </span>
                        ) : (
                          <span
                            className="status-badge"
                            style={{
                              color: "var(--muted)",
                              background:
                                "var(--surface2)",
                            }}
                          >
                            <XCircle size={13} />
                            CLOSED
                          </span>
                        )}
                      </td>

                      <td>
                        {Number(
                          scenario.baseline_snapshot
                            ?.stock || 0
                        ).toLocaleString()}
                      </td>

                      <td>
                        {
                          scenario
                            .baseline_snapshot
                            ?.pending
                        }
                      </td>

                      <td>
                        {new Date(
                          scenario.created_at
                        ).toLocaleString()}
                      </td>

                      <td>
                        {scenario.status === "OPEN" && (
                          <button
                            className="secondary-btn"
                            disabled={
                              closing === scenario.id
                            }
                            onClick={() =>
                              closeScenario(
                                scenario.id
                              )
                            }
                            style={{
                              minHeight: "32px",
                              padding: "0 10px",
                              fontSize: "9px",
                            }}
                          >
                            {closing ===
                            scenario.id
                              ? "Closing..."
                              : "Close"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}