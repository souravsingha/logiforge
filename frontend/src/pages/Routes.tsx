import { useEffect, useMemo, useState } from "react";
import {
  Route as RouteIcon,
  RefreshCw,
  Search,
  MapPin,
  Clock3,
  Truck,
  CloudRain,
  AlertTriangle,
} from "lucide-react";
import api from "../lib/api";

type RouteItem = {
  id: string;
  route_code: string;
  from_code: string;
  to_code: string;
  distance_km: number | string;
  estimated_time_minutes: number | string;
  capacity: number | string;
  road_condition: string;
  weather_impact: string;
  availability: string;
};

export default function Routes() {
  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRoutes = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/transport/routes");

      setRoutes(response.data?.data || []);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to load route network."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoutes();
  }, []);

  const filteredRoutes = useMemo(() => {
    const query = search.trim().toLowerCase();

    return routes.filter((route) => {
      const matchesSearch =
        !query ||
        route.route_code.toLowerCase().includes(query) ||
        route.from_code.toLowerCase().includes(query) ||
        route.to_code.toLowerCase().includes(query);

      const matchesFilter =
        filter === "ALL" ||
        route.availability?.toUpperCase() === filter;

      return matchesSearch && matchesFilter;
    });
  }, [routes, search, filter]);

  const available = routes.filter(
    (route) =>
      route.availability?.toUpperCase() === "AVAILABLE"
  ).length;

  const disrupted = routes.filter(
    (route) =>
      route.availability?.toUpperCase() === "DISRUPTED"
  ).length;

  const unavailable = routes.filter(
    (route) =>
      route.availability?.toUpperCase() === "UNAVAILABLE"
  ).length;

  const totalCapacity = routes.reduce(
    (sum, route) => sum + Number(route.capacity || 0),
    0
  );

  const formatAvailability = (value: string) => {
    const status = value?.toUpperCase();

    if (status === "AVAILABLE") {
      return "success";
    }

    if (status === "DISRUPTED") {
      return "warning";
    }

    return "danger";
  };

  return (
    <div className="page">

      {/* HEADER */}
      <div className="page-header">
        <div>
          <div className="eyebrow">NETWORK PLANNING</div>

          <h1>Routes</h1>

          <p>
            Monitor synthetic logistics routes, capacity,
            travel time, road condition and disruptions.
          </p>
        </div>

        <button
          className="secondary-btn"
          onClick={loadRoutes}
          disabled={loading}
        >
          <RefreshCw
            size={15}
            className={loading ? "spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">

        <div className="kpi-card">
          <div className="kpi-icon">
            <RouteIcon size={18} />
          </div>

          <div>
            <span>Total Routes</span>
            <strong>{routes.length}</strong>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">
            <MapPin size={18} />
          </div>

          <div>
            <span>Available</span>
            <strong>{available}</strong>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">
            <AlertTriangle size={18} />
          </div>

          <div>
            <span>Disrupted</span>
            <strong>{disrupted}</strong>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">
            <Truck size={18} />
          </div>

          <div>
            <span>Network Capacity</span>
            <strong>
              {totalCapacity.toLocaleString()}
            </strong>
          </div>
        </div>

      </div>

      {/* ROUTE PANEL */}
      <section className="panel">

        <div className="panel-header">

          <div>
            <h3>Route Network</h3>

            <span>
              {filteredRoutes.length} routes shown
            </span>
          </div>

          <RouteIcon size={19} />

        </div>

        {/* FILTERS */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            padding: "16px",
            borderBottom: "1px solid var(--line)",
            flexWrap: "wrap",
          }}
        >

          <div
            style={{
              position: "relative",
              flex: 1,
              minWidth: "220px",
            }}
          >
            <Search
              size={16}
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--muted)",
              }}
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search route or location..."
              style={{
                width: "100%",
                padding: "11px 12px 11px 38px",
                borderRadius: "8px",
                border: "1px solid var(--line)",
                background: "var(--surface2)",
                color: "var(--text)",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <select
            value={filter}
            onChange={(event) =>
              setFilter(event.target.value)
            }
            style={{
              minWidth: "170px",
              padding: "11px 12px",
              borderRadius: "8px",
              border: "1px solid var(--line)",
              background: "var(--surface2)",
              color: "var(--text)",
              outline: "none",
            }}
          >
            <option value="ALL">All Routes</option>
            <option value="AVAILABLE">Available</option>
            <option value="DISRUPTED">Disrupted</option>
            <option value="UNAVAILABLE">Unavailable</option>
          </select>

        </div>

        {/* ERROR */}
        {error && (
          <div
            className="alert-banner"
            style={{ margin: "16px" }}
          >
            <AlertTriangle size={16} />
            {error}
          </div>
        )}

        {/* LOADING */}
        {loading ? (
          <div
            style={{
              padding: "50px",
              textAlign: "center",
              color: "var(--muted)",
            }}
          >
            Loading route network...
          </div>
        ) : filteredRoutes.length === 0 ? (
          <div
            style={{
              padding: "50px",
              textAlign: "center",
              color: "var(--muted)",
            }}
          >
            No routes found.
          </div>
        ) : (
          <div className="table-wrap">

            <table className="data-table">

              <thead>
                <tr>
                  <th>Route</th>
                  <th>Network</th>
                  <th>Distance</th>
                  <th>ETA</th>
                  <th>Capacity</th>
                  <th>Road</th>
                  <th>Weather</th>
                  <th>Availability</th>
                </tr>
              </thead>

              <tbody>
                {filteredRoutes.map((route) => (

                  <tr key={route.id}>

                    {/* ROUTE */}
                    <td>
                      <strong>
                        {route.route_code}
                      </strong>
                    </td>

                    {/* NETWORK */}
                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "7px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <span>
                          {route.from_code}
                        </span>

                        <RouteIcon size={13} />

                        <span>
                          {route.to_code}
                        </span>
                      </div>
                    </td>

                    {/* DISTANCE */}
                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <MapPin size={14} />
                        {Number(
                          route.distance_km || 0
                        ).toFixed(1)}{" "}
                        km
                      </div>
                    </td>

                    {/* ETA */}
                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <Clock3 size={14} />

                        {Math.round(
                          Number(
                            route.estimated_time_minutes || 0
                          )
                        )}{" "}
                        min
                      </div>
                    </td>

                    {/* CAPACITY */}
                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <Truck size={14} />

                        {Number(
                          route.capacity || 0
                        ).toLocaleString()}
                      </div>
                    </td>

                    {/* ROAD */}
                    <td>
                      {route.road_condition || "—"}
                    </td>

                    {/* WEATHER */}
                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <CloudRain size={14} />

                        {route.weather_impact || "—"}
                      </div>
                    </td>

                    {/* AVAILABILITY */}
                    <td>
                      <span
                        className={`status-badge ${formatAvailability(
                          route.availability
                        )}`}
                      >
                        {route.availability}
                      </span>
                    </td>

                  </tr>

                ))}
              </tbody>

            </table>

          </div>
        )}

      </section>
    </div>
  );
}