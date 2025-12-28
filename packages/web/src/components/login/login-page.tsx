import { logInUser } from "@overdrip/core/user";
import { useState } from "react";
import { useForm } from "react-hook-form";

type LoginForm = {
  email: string;
  password: string;
};

const LoginPage = () => {
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginForm) => {
    setAuthError(null);
    setAuthSuccess(false);

    try {
      await logInUser(values.email, values.password);
      setAuthSuccess(true);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to log in. Please try again.";
      setAuthError(message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-md bg-slate-900/80 border border-white/10 shadow-2xl rounded-2xl p-8 backdrop-blur">
        <h1 className="text-2xl font-bold tracking-tight mb-2">
          Overdrip login
        </h1>
        <p className="text-slate-300 leading-relaxed mb-5">
          Sign in with your email to access your devices.
        </p>

        {authError && (
          <div className="mb-4 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm leading-relaxed text-rose-50">
            {authError}
          </div>
        )}

        {authSuccess && (
          <div className="mb-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm leading-relaxed text-emerald-50">
            Signed in successfully.
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-3"
        >
          <div className="flex flex-col gap-2">
            <label
              htmlFor="email"
              className="text-sm font-semibold text-slate-200"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/30"
              placeholder="you@example.com"
              {...register("email", { required: "Email is required" })}
            />
            {errors.email?.message && (
              <span className="text-xs font-medium text-rose-200">
                {errors.email.message}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="password"
              className="text-sm font-semibold text-slate-200"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-300/30"
              placeholder="••••••••"
              {...register("password", { required: "Password is required" })}
            />
            {errors.password?.message && (
              <span className="text-xs font-medium text-rose-200">
                {errors.password.message}
              </span>
            )}
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-cyan-300 to-violet-400 px-4 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-cyan-300/25 transition hover:translate-y-[1px] hover:shadow-cyan-300/30 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
