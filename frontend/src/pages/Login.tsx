import { ArrowLeft, LockKeyhole, Shield, UserRound } from "lucide-react";
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../components/ThemeProvider";
import api from "../lib/api";

export default function Login() {
  const nav = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();

    setError("");

    if (!email.trim() || !pass.trim()) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/auth/login", {
        email: email.trim(),
        password: pass,
      });

      if (response.data.success) {
        localStorage.setItem("logiforge_token", response.data.token);
        localStorage.setItem(
          "logiforge_user",
          JSON.stringify(response.data.user)
        );

        nav("/dashboard");
      } else {
        setError(response.data.message || "Login failed.");
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        "Unable to connect to LOGIFORGE backend.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="ambient ambient-a" />
      <div className="grid-bg" />

      <header className="login-nav">
        <button className="brand" onClick={() => nav("/")}>
          <span className="brand-mark">
            <Shield size={20} />
          </span>

          <span>
            <b>LOGIFORGE</b>
            <small>AI LOGISTICS</small>
          </span>
        </button>

        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === "dark" ? "☀ Light" : "☾ Dark"}
        </button>
      </header>

      <main className="login-main">
        <div className="login-card">
          <div className="login-side">
            <span className="status-pill">
              <i /> SECURE COMMAND ACCESS
            </span>

            <h1>Welcome back.</h1>

            <p>
              Access predictive logistics intelligence, supply planning and
              scenario analysis.
            </p>

            <div className="login-points">
              {[
                "Demand intelligence",
                "Inventory risk",
                "Optimization plans",
                "Scenario simulation",
              ].map((x) => (
                <span key={x}>✓ {x}</span>
              ))}
            </div>
          </div>

          <div className="login-form-wrap">
            <button className="back-link" onClick={() => nav("/")}>
              <ArrowLeft size={15} /> Back to home
            </button>

            <h2>Sign in</h2>

            <p>Use your authorized planner credentials.</p>

            <form onSubmit={submit}>
              <label>
                EMAIL / USER ID

                <div className="input-wrap">
                  <UserRound size={17} />

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="planner@logiforge.demo"
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>
              </label>

              <label>
                PASSWORD

                <div className="input-wrap">
                  <LockKeyhole size={17} />

                  <input
                    type="password"
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    disabled={loading}
                  />
                </div>
              </label>

              {error && (
                <div className="login-error">
                  {error}
                </div>
              )}

              <button
                className="primary-btn full"
                type="submit"
                disabled={loading}
              >
                {loading ? "Authenticating..." : "Enter Dashboard"}
                {!loading && <ArrowRightIcon />}
              </button>
            </form>

            <div className="demo-note">
              Demo credentials: planner@logiforge.demo / Demo@12345
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function ArrowRightIcon() {
  return <span>→</span>;
}