import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowDown, Bot, FileText, LoaderCircle, Send } from "lucide-react";
import { api } from "../api.js";

function inlineFormatting(text, keyPrefix) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${keyPrefix}-${index}`}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function formatAnswer(text) {
  return text.split(/\n\s*\n/).map((block, blockIndex) => {
    const lines = block.split("\n");
    if (lines.every((line) => /^\s*[-*]\s+/.test(line))) {
      return <ul key={blockIndex}>{lines.map((line, lineIndex) => <li key={lineIndex}>{inlineFormatting(line.replace(/^\s*[-*]\s+/, ""), `${blockIndex}-${lineIndex}`)}</li>)}</ul>;
    }
    return <p key={blockIndex}>{lines.map((line, lineIndex) => <span key={lineIndex}>{lineIndex > 0 && <br />}{inlineFormatting(line, `${blockIndex}-${lineIndex}`)}</span>)}</p>;
  });
}

export default function ChatPage({ documents, onThreadsChange }) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const threadId = params.get("thread");
  const [items, setItems] = useState([]);
  const historyRef = useRef(null);
  const stickToBottom = useRef(true);
  const [showJumpButton, setShowJumpButton] = useState(false);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!threadId) {
      setItems([]);
      api.createThread().then((thread) => { onThreadsChange?.(); navigate(`/chat?thread=${thread.id}`, { replace: true }); })
        .catch((err) => setError(err.message));
      return;
    }
    api.chatHistory(threadId)
      .then((history) => setItems(history.messages || []))
      .catch((err) => setError(`Could not load saved chat history: ${err.message}`));
  }, [threadId]);

  useEffect(() => {
    if (stickToBottom.current && historyRef.current) {
      historyRef.current.scrollTo({ top: historyRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [items, busy]);

  function handleHistoryScroll() {
    const element = historyRef.current;
    if (!element) return;
    const atBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 100;
    stickToBottom.current = atBottom;
    setShowJumpButton(!atBottom);
  }

  function jumpToLatest() {
    stickToBottom.current = true;
    historyRef.current?.scrollTo({ top: historyRef.current.scrollHeight, behavior: "smooth" });
    setShowJumpButton(false);
  }

  async function send(value = question) {
    const text = value.trim();
    if (!text || busy) return;
    stickToBottom.current = true;
    setShowJumpButton(false);
    setQuestion("");
    setBusy(true);
    setError("");
    try {
      await api.chat({ question: text, thread_id: Number(threadId) });
      const history = await api.chatHistory(threadId);
      setItems(history.messages || []);
      onThreadsChange?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="chat-panel chatgpt-layout">
      <div className="chat-history" ref={historyRef} onScroll={handleHistoryScroll}>
        {items.length === 0 && <div className="chat-welcome">
          <h2>What would you like to know?</h2>
          <p>Ask across {documents.length} uploaded {documents.length === 1 ? "document" : "documents"}. Answers include source references.</p>
          {!documents.length && <span className="inline-warning">Upload documents from Overview to get started.</span>}
        </div>}
        {items.map((message, index) => <div className={`chat-message ${message.role}`} key={message.id || index}>
          <span className="message-mark">{message.role === "assistant" ? <Bot size={17} /> : "You"}</span>
          <div>
            <div className={`message-bubble ${message.text.startsWith("I couldn’t find") ? "fallback" : ""} ${message.role === "assistant" ? "assistant-bubble" : ""}`}>
              {message.role === "assistant" ? formatAnswer(message.text) : message.text}
            </div>
            {message.sources?.map((source, sourceIndex) => <details className="source" key={`${source.document_name}-${source.reference}-${sourceIndex}`}>
              <summary><FileText size={14} />{source.document_name}<span>{source.reference}</span></summary>
              <p>{source.excerpt}</p>
            </details>)}
          </div>
        </div>)}
        {busy && <div className="chat-message"><span className="message-mark"><Bot size={17} /></span><div className="message-bubble"><LoaderCircle className="spin" /> Searching documents…</div></div>}
        {error && <p className="alert error">{error}</p>}
      </div>
      {showJumpButton && <button className="jump-bottom" onClick={jumpToLatest} aria-label="Go to latest message" title="Go to latest message"><ArrowDown size={18}/></button>}
      <form className="composer" onSubmit={(event) => { event.preventDefault(); send(); }}>
        <textarea value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); send(); }
        }} placeholder="Ask a question about your documents…" rows="1" />
        <button className="send-button" disabled={busy || !question.trim()} aria-label="Send"><Send size={17} /></button>
      </form>
      <small className="composer-foot">Chat history is saved in the workspace database.</small>
    </section>
  );
}
