import { useEffect, useMemo, useState } from "react";
import {
  MapPinned,
  Search,
  RefreshCw,
  Boxes,
  Package,
  AlertTriangle,
} from "lucide-react";
import api from "../lib/api";

type Location = {
  id: string;
  code: string;
  name: string;
  type: string;
  total_stock: number | string;
  item_count: number | string;
};

export default function Locations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLocations = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/locations");

      setLocations(response.data?.data || []);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to load locations."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocations();
  }, []);

  const locationTypes = useMemo(() => {
    return [
      "ALL",
      ...Array.from(
        new Set(locations.map((location) => location.type))
      ),
    ];
  }, [locations]);

  const filteredLocations = useMemo(() => {
    const query = search.trim().toLowerCase();

    return locations.filter((location) => {
      const matchesSearch =
        !query ||
        location.code.toLowerCase().includes(query) ||
        location.name.toLowerCase().includes(query);

      const matchesType =
        type === "ALL" || location.type === type;

      return matchesSearch && matchesType;
    });
  }, [locations, search, type]);

  const totalLocations = locations.length;

  const totalStock = locations.reduce(
    (sum, location) =>
      sum + Number(location.total_stock || 0),
    0
  );

  const totalItems = locations.reduce(
    (sum, location) =>
      sum + Number(location.item_count || 0),
    0
  );

  return (
    <div className="page">

      {/* HEADER */}
      <div className="page-header">
        <div>
          <div className="eyebrow">NETWORK</div>

          <h1>Locations</h1>

          <p>
            Monitor operational locations, inventory footprint,
            and supply network distribution.
          </p>
        </div>

        <button
          className="secondary-btn"
          onClick={loadLocations}
          disabled={loading}
        >
          <RefreshCw
            size={15}
            className={loading ? "spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* KPI CARDS */}
      <div className="kpi-grid">

        <div className="kpi-card">
          <div className="kpi-icon">
            <MapPinned size={18} />
          </div>

          <div>
            <span>Total Locations</span>
            <strong>{totalLocations}</strong>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">
            <Package size={18} />
          </div>

          <div>
            <span>Total Stock</span>
            <strong>
              {totalStock.toLocaleString()}
            </strong>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">
            <Boxes size={18} />
          </div>

          <div>
            <span>Tracked Items</span>
            <strong>{totalItems}</strong>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">
            <AlertTriangle size={18} />
          </div>

          <div>
            <span>Network Status</span>
            <strong>ACTIVE</strong>
          </div>
        </div>

      </div>

      {/* TABLE PANEL */}
      <section className="panel">

        <div className="panel-header">

          <div>
            <h3>Location Network</h3>

            <span>
              {filteredLocations.length} locations shown
            </span>
          </div>

          <MapPinned size={19} />

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
              placeholder="Search location code or name..."
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
            value={type}
            onChange={(event) =>
              setType(event.target.value)
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
            {locationTypes.map((locationType) => (
              <option
                key={locationType}
                value={locationType}
              >
                {locationType === "ALL"
                  ? "All Types"
                  : locationType}
              </option>
            ))}
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
            Loading locations...
          </div>
        ) : filteredLocations.length === 0 ? (
          <div
            style={{
              padding: "50px",
              textAlign: "center",
              color: "var(--muted)",
            }}
          >
            No locations found.
          </div>
        ) : (
          <div className="table-wrap">

            <table className="data-table">

              <thead>
                <tr>
                  <th>Location</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Tracked Items</th>
                  <th>Total Stock</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredLocations.map((location) => (
                  <tr key={location.id}>

                    <td>
                      <strong>
                        {location.code}
                      </strong>
                    </td>

                    <td>
                      {location.name}
                    </td>

                    <td>
                      <span className="status-badge">
                        {location.type}
                      </span>
                    </td>

                    <td>
                      {Number(
                        location.item_count || 0
                      )}
                    </td>

                    <td>
                      {Number(
                        location.total_stock || 0
                      ).toLocaleString()}
                    </td>

                    <td>
                      <span className="status-badge success">
                        ACTIVE
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