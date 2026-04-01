import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "../../hooks/useAuth";

export default function Login() {
  const { session, signIn } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [authError, setAuthError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (session) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [session, navigate]);

  async function onSubmit({ email, password }) {
    setAuthError(null);
    setSubmitting(true);
    try {
      await signIn(email, password);
      navigate("/admin/dashboard", { replace: true });
    } catch {
      setAuthError("Nepareizs e-pasts vai parole.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="admin-login">
      <div className="login-card">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-group">
            <label htmlFor="email">E-pasts</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...register("email", { required: true })}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Parole</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register("password", { required: true })}
            />
          </div>

          {authError && (
            <p className="error-message">{authError}</p>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={submitting}
          >
            {submitting ? "Lūdzu uzgaidiet…" : "Pieslēgties"}
          </button>
        </form>
      </div>
    </div>
  );
}
