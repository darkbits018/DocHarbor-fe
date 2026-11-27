import { useEffect, useState } from "react";
import { api } from "../api.js";

const providers = [["google", "Google Gemini"], ["groq", "Groq"], ["openrouter", "OpenRouter"], ["openai", "OpenAI"], ["anthropic", "Anthropic"]];

export default function SettingsPage({ onOwnerUrlChange }) {
  const [form, setForm] = useState({ provider: "google", model: "", api_key: "", base_url: "", owner_contact_url: "" });
  const [savedProvider, setSavedProvider] = useState("");
  const [keySaved, setKeySaved] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [models, setModels] = useState([]);
  const [limit, setLimit] = useState("");
  const [loading, setLoading] = useState(false);
  const keyCanBeKept = keySaved && savedProvider === form.provider;

  useEffect(() => {
    api.settings().then((settings) => {
      setConfigured(settings.configured);
      setSavedProvider(settings.provider || "");
      setKeySaved(settings.api_key_saved || false);
      setForm((current) => ({
        ...current,
        provider: settings.provider || "google",
        model: settings.model || "",
        base_url: settings.base_url || "",
        owner_contact_url: settings.owner_contact_url || "",
      }));
    }).catch((err) => setError(err.message));
  }, []);

  function change(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    if (field === "provider") {
      setModels([]);
      setLimit("");
      setForm((current) => ({ ...current, provider: value, model: "", api_key: "" }));
    }
  }

  async function fetchModels() {
    setError(""); setMessage(""); setLoading(true);
    try {
      const result = await api.models(form.provider, form.api_key);
      setModels(result.models); setLimit(result.free_limit);
      if (result.models.length) {
        setForm((current) => ({ ...current, model: result.models[0].id }));
        setMessage(`Loaded ${result.models.length} models.`);
      } else setMessage("No eligible free models were returned for this key.");
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function save(event) {
    event.preventDefault(); setError(""); setMessage("");
    try {
      const result = await api.saveSettings({
        ...form,
        api_key: form.api_key || null,
        owner_contact_url: form.owner_contact_url || "https://example.com/contact",
      });
      setConfigured(true); setSavedProvider(form.provider); setKeySaved(true);
      setMessage("Settings saved to the database. The provider key is encrypted at rest.");
      setForm((current) => ({ ...current, api_key: "" }));
      onOwnerUrlChange(result.owner_contact_url || "");
    } catch (err) { setError(err.message); }
  }

  return <div className="settings-grid">
    <form className="panel settings-card" onSubmit={save}>
      <h2>Choose a model</h2>
      <p>Provider settings are saved in the workspace database. Enter a new key only when setting up or rotating it.</p>
      <label>Provider<select value={form.provider} onChange={(event) => change("provider", event.target.value)}>
        {providers.map(([id, name]) => <option value={id} key={id}>{name}{["google", "groq", "openrouter"].includes(id) ? " · free options" : ""}</option>)}
      </select></label>
      <label>Provider API key<input required={!keyCanBeKept} type="password" autoComplete="new-password" value={form.api_key} onChange={(event) => change("api_key", event.target.value)} placeholder={keyCanBeKept ? "Saved securely; leave blank to keep current key" : "Paste your provider key"} /></label>
      {keyCanBeKept && <small>Provider key is saved encrypted. It is never sent back to the browser.</small>}
      <button type="button" className="button secondary" disabled={loading || !form.api_key} onClick={fetchModels}>{loading ? "Fetching models…" : "Fetch free models and limits"}</button>
      {limit && <div className="quota-note"><strong>Free-tier / quota information</strong><br />{limit}</div>}
      {models.length ? <label>Free model<select required value={form.model} onChange={(event) => change("model", event.target.value)}>{models.map((model) => <option key={model.id} value={model.id}>{model.name} · free</option>)}</select></label> : <label>Model name<input required value={form.model} onChange={(event) => change("model", event.target.value)} placeholder="Fetch models or type model ID" /></label>}
      {["openai", "anthropic"].includes(form.provider) && <p className="muted">This provider does not have a general free API tier. Usage is typically billed by the provider.</p>}
      {["openrouter", "openai"].includes(form.provider) && <label>Compatible API endpoint (optional)<input value={form.base_url} onChange={(event) => change("base_url", event.target.value)} placeholder={form.provider === "openrouter" ? "https://openrouter.ai/api/v1/chat/completions" : "https://…/v1/chat/completions"} /></label>}
      <label>Contact owner URL<input type="url" value={form.owner_contact_url} onChange={(event) => change("owner_contact_url", event.target.value)} placeholder="https://business.com/contact" /></label>
      <button className="button primary">Save provider settings</button>
      {configured && <small>Provider configured and saved</small>}
      {message && <p>{message}</p>}{error && <p className="error">{error}</p>}
    </form>
    <aside className="panel safety-card">
      <h3>About free models</h3><p>Free model catalogs and quotas change. Provider accounts may have different limits.</p><hr />
      <h3>Credential privacy</h3><p>The provider key is encrypted in PostgreSQL with a server encryption key from the backend .env file. Keep that encryption key stable and backed up.</p><hr />
      <h3>Your document privacy</h3><p>Questions and retrieved excerpts are sent to the provider you choose. Avoid uploading sensitive files unless the business approves that provider.</p><hr />
      <h3>Embeddings and history</h3><p>Cloudflare embedding credentials remain in backend configuration. The single chat thread and its source references are saved in PostgreSQL.</p>
    </aside>
  </div>;
}
