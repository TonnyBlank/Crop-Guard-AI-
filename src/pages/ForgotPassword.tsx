import { useEffect, useState } from "react";
import { Leaf, Sparkles, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Mail, Key } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email"),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { resetPassword } = useAuth(); // Will be added
  const [formLoading, setFormLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  useEffect(() => {
    // Auto-redirect if logged in
    // Handled by potential future auth logic
  }, []);

  const onSubmit = async (data: ForgotPasswordForm) => {
    setFormLoading(true);
    try {
      await resetPassword(data.email);
      setSubmitted(true);
      toast.success("Password reset email sent! Check your inbox.");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Something went wrong. Please try again.";
      toast.error(message);
    } finally {
      setFormLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start mb-4"
              onClick={() => navigate("/login")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Button>
            <CardTitle className="text-2xl text-center">Check Your Email</CardTitle>
            <CardDescription className="text-center">
              We've sent a password reset link to your email.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button className="w-full" onClick={() => navigate("/login")}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left panel - same as Login */}
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
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-start mb-4"
                onClick={() => navigate("/login")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Button>
              <CardTitle className="text-2xl text-center font-display">Forgot Password</CardTitle>
              <CardDescription className="text-center">
                Enter your email and we'll send you a reset link
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

                <Button type="submit" className="w-full gap-2" disabled={formLoading}>
                  {formLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Send Reset Link
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
