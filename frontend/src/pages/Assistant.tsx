import { useState } from "react";
import {
  BrainCircuit,
  Send,
  User,
  Bot,
  Loader2,
  Sparkles,
} from "lucide-react";
import api from "../lib/api";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const suggestions = [
  "Which locations have critical stock risk?",
  "Show pending critical supply requests.",
  "What is the current transport availability?",
  "Which items are predicted to run out?",
  "Explain the latest optimization recommendation.",
];

export default function Assistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "LOGIFORGE AI Assistant is ready. Ask about inventory, forecasts, alerts, supply requests, transport, optimization, or scenarios.",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const askAssistant = async (question?: string) => {
    const text = (question ?? input).trim();

    if (!text || loading) return;

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: text,
      },
    ]);

    setInput("");
    setLoading(true);

    try {
      const response = await api.post("/assistant/query", {
        question: text,
      });

      const answer =
        response.data?.data?.answer ||
        response.data?.answer ||
        response.data?.message ||
        "No response was returned.";

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: answer,
        },
      ]);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "Assistant request failed. Please check the backend assistant API.";

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: message,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      {/* HEADER */}
      <div className="page-header">
        <div>
          <div className="eyebrow">INTELLIGENCE</div>

          <h1>AI Assistant</h1>

          <p>
            Natural-language decision support for LOGIFORGE operations.
          </p>
        </div>

        <div className="status-badge success">
          <Sparkles size={14} />
          Decision Support
        </div>
      </div>

      {/* MAIN GRID */}
      <div
        className="content-grid"
        style={{
          gridTemplateColumns: "minmax(0, 1fr) 280px",
          alignItems: "stretch",
        }}
      >
        {/* CHAT */}
        <section className="panel">
          <div className="panel-header">
            <div>
              <h3>Command Assistant</h3>

              <span>
                Ask questions using operational system data
              </span>
            </div>

            <BrainCircuit size={20} />
          </div>

          {/* MESSAGES */}
          <div
            style={{
              minHeight: "420px",
              maxHeight: "520px",
              overflowY: "auto",
              padding: "20px",
            }}
          >
            {messages.map((message, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  gap: "12px",
                  marginBottom: "18px",
                  justifyContent:
                    message.role === "user"
                      ? "flex-end"
                      : "flex-start",
                  alignItems: "flex-start",
                }}
              >
                {/* BOT ICON */}
                {message.role === "assistant" && (
                  <div className="avatar">
                    <Bot size={16} />
                  </div>
                )}

                {/* MESSAGE */}
                <div
                  style={{
                    maxWidth: "78%",
                    padding: "12px 15px",
                    borderRadius: "10px",
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                    background:
                      message.role === "user"
                        ? "var(--accent)"
                        : "var(--surface2)",
                    color:
                      message.role === "user"
                        ? "#ffffff"
                        : "var(--text)",
                  }}
                >
                  {message.content}
                </div>

                {/* USER ICON */}
                {message.role === "user" && (
                  <div className="avatar">
                    <User size={16} />
                  </div>
                )}
              </div>
            ))}

            {/* LOADING */}
            {loading && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  color: "var(--muted)",
                }}
              >
                <Loader2
                  size={16}
                  className="spin"
                />

                LOGIFORGE is analyzing operational data...
              </div>
            )}
          </div>

          {/* INPUT */}
          <div
            style={{
              padding: "16px",
              borderTop: "1px solid var(--line)",
              display: "flex",
              gap: "10px",
            }}
          >
            <input
              value={input}
              onChange={(event) =>
                setInput(event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  askAssistant();
                }
              }}
              placeholder="Ask about inventory, forecasts, requests..."
              style={{
                flex: 1,
                padding: "12px 14px",
                borderRadius: "8px",
                border: "1px solid var(--line)",
                background: "var(--surface2)",
                color: "var(--text)",
                outline: "none",
              }}
            />

            <button
              className="primary-btn"
              onClick={() => askAssistant()}
              disabled={loading || !input.trim()}
            >
              {loading ? (
                <Loader2 size={16} />
              ) : (
                <Send size={16} />
              )}

              Ask
            </button>
          </div>
        </section>

        {/* SUGGESTIONS */}
        <section className="panel">
          <div className="panel-header">
            <div>
              <h3>Suggested Queries</h3>

              <span>
                Operational intelligence
              </span>
            </div>
          </div>

          <div style={{ padding: "16px" }}>
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() =>
                  askAssistant(suggestion)
                }
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "12px",
                  marginBottom: "10px",
                  borderRadius: "8px",
                  border: "1px solid var(--line)",
                  background: "var(--surface2)",
                  color: "var(--text)",
                  cursor: "pointer",
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}