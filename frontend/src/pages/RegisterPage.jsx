import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { registerUser } from "../services/authService";
import { useAuth } from "../hooks/useAuth.js";

const RegisterPage = () => {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    try {
      setLoading(true);
      const data = await registerUser(form);
      login(data.token, data.user);
      navigate("/dashboard");
    } catch (error) {
      setMessage(error?.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-enter min-h-screen">
      <Navbar />

      <main className="mx-auto flex w-full max-w-xl px-4 py-12 md:px-6">
        <section className="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h1 className="text-4xl font-bold text-slate-900">Create your account</h1>
          <p className="mt-2 text-sm text-slate-600">Join ECE ExamHub and contribute exam preparation resources.</p>

          <form className="mt-6 grid gap-3" onSubmit={handleSubmit}>
            <input
              type="text"
              required
              value={form.name}
              onChange={(event) => {
                setMessage("");
                setForm((prev) => ({ ...prev, name: event.target.value }));
              }}
              placeholder="Full name"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-teal-600 transition focus:ring"
            />
            <input
              type="email"
              required
              value={form.email}
              onChange={(event) => {
                setMessage("");
                setForm((prev) => ({ ...prev, email: event.target.value }));
              }}
              placeholder="Email"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-teal-600 transition focus:ring"
            />
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 focus-within:ring-2 focus-within:ring-teal-600">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={form.password}
                onChange={(event) => {
                  setMessage("");
                  setForm((prev) => ({ ...prev, password: event.target.value }));
                }}
                placeholder="Password (min 6 chars)"
                className="w-full text-sm outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="text-xs font-semibold text-teal-700"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {message && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{message}</p>}

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating..." : "Register"}
            </button>
          </form>

          <p className="mt-4 text-sm text-slate-600">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-teal-700">
              Login
            </Link>
          </p>
        </section>
      </main>
    </div>
  );
};

export default RegisterPage;


