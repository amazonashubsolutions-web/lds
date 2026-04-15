import { useState } from "react";

import LoadingSpinner from "../common/LoadingSpinner";
import { usePanelSession } from "../../contexts/PanelSessionContext";

export default function PanelLoginScreen() {
  const { authError, signInWithPassword } = usePanelSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setFormError("Completa correo y contrasena para entrar al panel.");
      return;
    }

    setFormError("");
    setIsSubmitting(true);

    try {
      await signInWithPassword({
        email: email.trim(),
        password,
      });
    } catch (error) {
      setFormError(error.message || "No fue posible iniciar sesion.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="panel-auth-shell">
      <div className="panel-auth-card">
        <div className="panel-auth-copy">
          <p>Panel de control LDS</p>
          <h1>Inicia sesion con tu usuario de Supabase</h1>
          <span>
            Usa el correo y la contrasena del usuario que ya tienes en Auth para
            habilitar la lectura y escritura real sobre Supabase.
          </span>
        </div>

        <form className="panel-auth-form" onSubmit={handleSubmit}>
          <label className="panel-auth-field">
            <span>Correo</span>
            <input
              autoComplete="email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="tu-correo@dominio.com"
            />
          </label>

          <label className="panel-auth-field">
            <span>Contrasena</span>
            <input
              autoComplete="current-password"
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Ingresa tu contrasena"
            />
          </label>

          {formError || authError ? (
            <div className="panel-auth-error" role="alert">
              {formError || authError}
            </div>
          ) : null}

          <button className="panel-auth-submit" disabled={isSubmitting} type="submit">
            <span className="lds-button-content">
              {isSubmitting ? <LoadingSpinner label="Entrando" size="sm" /> : null}
              <span>{isSubmitting ? "Entrando..." : "Entrar al panel"}</span>
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
