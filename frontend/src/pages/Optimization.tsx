import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  RefreshCw,
  ShieldCheck,
  Truck,
  Zap,
} from "lucide-react";
import api from "../lib/api";

type OptimizationRun = {
  id: string;
  run_type: string;
  status: string;
  solver_name: string;
  input_summary?: {
    requests?: number;
    inventory?: string | number;
    transport_capacity?: string | number;
  };
  created_at: string;
};

type PlanItem = {
  requestId: string;
  requestCode: string;
  item: string;
  destination: string;
  allocatedQuantity: number;
  priority: string;
  source: string;
  transport: string;
  modeledCost: number;
  explanation: string[];
};

type OptimizationResult = {
  run: OptimizationRun;
  plan: PlanItem[];
};

export default function Optimization() {
  const [runs, setRuns] = useState<OptimizationRun[]>([]);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  const loadRuns = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/optimization/runs");
      setRuns(response.data?.data || []);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to load optimization runs."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRuns();
  }, []);

  const runOptimization = async () => {
    try {
      setRunning(true);
      setError("");

      const response = await api.post("/optimization/run", {});

      setResult(response.data?.data || null);
      await loadRuns();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Optimization failed."
      );
    } finally {
      setRunning(false);
    }
  };

  const latestRun = useMemo(() => {
    return runs[0];
  }, [runs]);

  const totalAllocated = useMemo(() => {
    return (
      result?.plan?.reduce(
        (sum, item) => sum + item.allocatedQuantity,
        0
      ) || 0
    );
  }, [result]);

  const totalCost = useMemo(() => {
    return (
      result?.plan?.reduce(
        (sum, item) => sum + item.modeledCost,
        0
      ) || 0
    );
  }, [result]);

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow">DECISION SUPPORT</span>
          <h1>Optimization</h1>
          <p className="page-subtitle">
            Generate allocation recommendations using current
            requests, inventory and transport availability.
          </p>
        </div>

        <div className="page-actions">
          <button
            className="secondary-btn"
            onClick={loadRuns}
            disabled={loading}
          >
            <RefreshCw size={15} />
            Refresh
          </button>

          <button
            className="primary-btn"
            onClick={runOptimization}
            disabled={running}
          >
            <Zap size={15} />
            {running ? "Running..." : "Run Optimization"}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert-banner danger">
          <AlertTriangle size={17} />
          <span>{error}</span>
        </div>
      )}

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon">
            <Clock3 size={18} />
          </div>
          <div>
            <span>Optimization Runs</span>
            <strong>{runs.length}</strong>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">
            <Truck size={18} />
          </div>
          <div>
            <span>Pending Requests</span>
            <strong>
              {latestRun?.input_summary?.requests ?? "—"}
            </strong>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">
            <ShieldCheck size={18} />
          </div>
          <div>
            <span>Allocated Quantity</span>
            <strong>
              {result ? totalAllocated.toLocaleString() : "—"}
            </strong>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">
            <Zap size={18} />
          </div>
          <div>
            <span>Modeled Cost</span>
            <strong>
              {result
                ? totalCost.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })
                : "—"}
            </strong>
          </div>
        </div>
      </div>

      {result && (
        <div className="content-grid">
          <div className="panel">
            <div className="panel-header">
              <div>
                <span className="eyebrow">LATEST RESULT</span>
                <h2>Recommended Allocation Plan</h2>
              </div>

              <span className="status-badge green">
                <CheckCircle2 size={13} />
                {result.run.status}
              </span>
            </div>

            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Request</th>
                    <th>Destination</th>
                    <th>Item</th>
                    <th>Priority</th>
                    <th>Allocated</th>
                    <th>Source</th>
                    <th>Transport</th>
                    <th>Cost</th>
                  </tr>
                </thead>

                <tbody>
                  {result.plan.length === 0 ? (
                    <tr>
                      <td colSpan={8}>
                        No eligible supply requests found.
                      </td>
                    </tr>
                  ) : (
                    result.plan.map((item) => (
                      <tr key={item.requestId}>
                        <td>
                          <strong>{item.requestCode}</strong>
                        </td>

                        <td>{item.destination}</td>

                        <td>{item.item}</td>

                        <td>
                          <span
                            className={`priority-badge ${item.priority.toLowerCase()}`}
                          >
                            {item.priority}
                          </span>
                        </td>

                        <td>
                          <strong>
                            {item.allocatedQuantity.toLocaleString()}
                          </strong>
                        </td>

                        <td>{item.source}</td>

                        <td>{item.transport}</td>

                        <td>
                          {item.modeledCost.toLocaleString(
                            undefined,
                            {
                              maximumFractionDigits: 2,
                            }
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <div>
                <span className="eyebrow">EXPLAINABILITY</span>
                <h2>Recommendation Logic</h2>
              </div>
            </div>

            <div className="recommendation-list">
              {result.plan.slice(0, 6).map((item) => (
                <div
                  className="recommendation-card"
                  key={item.requestId}
                >
                  <div className="recommendation-title">
                    <strong>{item.requestCode}</strong>
                    <span
                      className={`priority-badge ${item.priority.toLowerCase()}`}
                    >
                      {item.priority}
                    </span>
                  </div>

                  <div className="recommendation-destination">
                    {item.destination} · {item.item}
                  </div>

                  <ul>
                    {item.explanation.map((text, index) => (
                      <li key={index}>{text}</li>
                    ))}
                  </ul>
                </div>
              ))}

              {result.plan.length === 0 && (
                <div className="empty-state">
                  No recommendations generated.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">RUN HISTORY</span>
            <h2>Optimization Runs</h2>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            Loading optimization runs...
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Run</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Solver</th>
                  <th>Requests</th>
                  <th>Inventory</th>
                  <th>Transport Capacity</th>
                  <th>Created</th>
                </tr>
              </thead>

              <tbody>
                {runs.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      No optimization runs yet. Run an optimization
                      to generate the first plan.
                    </td>
                  </tr>
                ) : (
                  runs.map((run) => (
                    <tr key={run.id}>
                      <td>
                        <code>
                          {run.id.slice(0, 8).toUpperCase()}
                        </code>
                      </td>

                      <td>{run.run_type}</td>

                      <td>
                        <span className="status-badge green">
                          <CheckCircle2 size={13} />
                          {run.status}
                        </span>
                      </td>

                      <td>{run.solver_name}</td>

                      <td>
                        {run.input_summary?.requests ?? "—"}
                      </td>

                      <td>
                        {run.input_summary?.inventory ?? "—"}
                      </td>

                      <td>
                        {run.input_summary?.transport_capacity ??
                          "—"}
                      </td>

                      <td>
                        {new Date(
                          run.created_at
                        ).toLocaleString()}
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