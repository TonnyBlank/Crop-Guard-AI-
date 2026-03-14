import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Leaf, Loader2, Lock, Mail, Eye, EyeOff, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";

const signInSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signUpSchema = z
  .object({
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignInForm = z.infer<typeof signInSchema>;
type SignUpForm = z.infer<typeof signUpSchema>;
type LoginForm = SignInForm | SignUpForm;

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp, session, loading: authLoading } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const redirectTo = useMemo(() => {
    const state = location.state as { from?: { pathname?: string } } | null;
    return state?.from?.pathname || "/";
  }, [location.state]);

  const form = useForm<LoginForm>({
    resolver: zodResolver(isSignUp ? signUpSchema : signInSchema),
    defaultValues: { email: "", password: "", ...(isSignUp && { confirmPassword: "" }) },
  });

  useEffect(() => {
    if (session && !authLoading) navigate(redirectTo, { replace: true });
  }, [authLoading, navigate, redirectTo, session]);

  // Reset form and clear errors when switching modes
  const handleToggleMode = () => {
    form.reset({ email: "", password: "", confirmPassword: "" });
    setShowPassword(false);
    setShowConfirmPassword(false);
    setIsSignUp((prev) => !prev);
  };

  const onSubmit = async (data: LoginForm) => {
    setFormLoading(true);
    try {
      if (isSignUp) {
        await signUp(data.email, data.password);
        toast.success("Check your email for confirmation!");
      } else {
        await signIn(data.email, data.password);
        toast.success("Logged in successfully!");
        navigate(redirectTo, { replace: true });
      } 
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      toast.error(message);
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left panel */}
        <div className="hidden lg:flex flex-col justify-between bg-green-700 px-10 py-12 text-white">
          <div className="flex items-center gap-2">
            <Leaf className="h-7 w-7" />
            <span className="font-display text-2xl font-bold">CropGuard AI</span>
          </div>

          <div className="max-w-md">
            <h1 className="font-display text-3xl font-bold leading-tight">Smart crop diagnosis.</h1>
            <p className="mt-3 text-white/90">
              Capture or upload a leaf photo to get a quick diagnosis and treatment guidance.
            </p>
            <div className="mt-6 space-y-3 text-sm text-white/90">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-5 w-5 text-white" />
                <p>AI-powered detection in seconds.</p>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-white" />
                <p>Your diagnosis history is saved to your profile.</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-white/70">Tip: Use “Open camera” on Diagnose for live capture.</p>
        </div>

        {/* Right panel */}
        <div className="container grid place-items-center py-8">
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-1">
              <div className="flex items-center justify-center lg:hidden">
                <Leaf className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl text-center font-display">
                {isSignUp ? "Create Account" : "Welcome Back"}
              </CardTitle>
              <CardDescription className="text-center">
                {isSignUp ? "Create your account to get started" : "Sign in to your account"}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10"
                      {...form.register("email")}
                    />
                  </div>
                  {form.formState.errors.email && (
                    <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      {...form.register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {form.formState.errors.password && (
                    <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
                  )}
                </div>

                {!isSignUp && (
                  <div className="text-right">
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto p-0 text-sm text-muted-foreground hover:text-foreground"
                      onClick={() => navigate("/forgot-password")}
                    >
                      Forgot Password?
                    </Button>
                  </div>
                )}

                {/* Confirm Password — only shown during sign up */}
                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-10 pr-10"
                        {...form.register("confirmPassword" as keyof LoginForm)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {"confirmPassword" in form.formState.errors && (
                      <p className="text-sm text-destructive">{form.formState.errors.confirmPassword?.message}</p>
                    )}
                  </div>
                )}

                <Button type="submit" className="w-full gap-2" disabled={formLoading || authLoading}>
                  {formLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isSignUp ? "Create Account" : "Sign In"}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Button type="button" variant="ghost" className="w-full" onClick={handleToggleMode}>
                  {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
                </Button>
              </div>

              <div className="mt-4 text-xs text-muted-foreground text-center">
                By clicking continue, you agree to our Terms of Service and Privacy Policy.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
