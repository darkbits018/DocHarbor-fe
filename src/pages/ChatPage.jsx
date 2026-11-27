import { useEffect, useState } from "react";
import { ArrowUp, Bot, FileText, LoaderCircle } from "lucide-react";
import { api } from "../api.js";

export default function ChatPage({ documents }) {
  const [items, setItems] = useState([]);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.chatHistory()
      .then((history) => setItems(history.messages || []))
      .catch((err) => setError(`Could not load saved chat history: ${err.message}`));
  }, []);

  async function send(value = question) {
    const text = value.trim();
    if (!text || busy) return;
    setQuestion("");
    setBusy(true);
    setError("");
    try {
      await api.chat(text);
      const history = await api.chatHistory();
      setItems(history.messages || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel chat-panel">
      <header className="chat-head">
        <span className="bot-mark"><Bot /></span>
        <div><strong>Document assistant</strong><small>{documents.length} documents available</small></div>
      </header>
      <div className="chat-history">
        {items.length === 0 && <div className="chat-welcome">
          <span className="bot-mark"><Bot /></span>
          <h2>What would you like to know?</h2>
          <p>Ask a question about documents in your knowledge base. Answers include source references.</p>
          {!documents.length && <span className="inline-warning">Upload documents from Overview to get started.</span>}
        </div>}
        {items.map((message, index) => <div className={`chat-message ${message.role}`} key={message.id || index}>
          <span className="message-mark">{message.role === "assistant" ? <Bot size={17} /> : "You"}</span>
          <div>
            <div className={`message-bubble ${message.text.startsWith("I couldn’t find") ? "fallback" : ""}`}>{message.text}</div>
            {message.sources?.map((source, sourceIndex) => <details className="source" key={`${source.document_name}-${source.reference}-${sourceIndex}`}>
              <summary><FileText size={14} />{source.document_name}<span>{source.reference}</span></summary>
              <p>{source.excerpt}</p>
            </details>)}
          </div>
        </div>)}
        {busy && <div className="chat-message"><span className="message-mark"><Bot size={17} /></span><div className="message-bubble"><LoaderCircle className="spin" /> Searching documents…</div></div>}
        {error && <p className="alert error">{error}</p>}
      </div>
      <form className="composer" onSubmit={(event) => { event.preventDefault(); send(); }}>
        <textarea value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); send(); }
        }} placeholder="Ask a question about your documents…" rows="1" />
        <button className="send-button" disabled={busy || !question.trim()} aria-label="Send"><ArrowUp /></button>
      </form>
      <small className="composer-foot">Chat history is saved in the workspace database.</small>
    </section>
  );
}
