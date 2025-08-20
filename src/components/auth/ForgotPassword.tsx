import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";

export function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [miniStep, setMiniStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { sendOtp, forgotpassword, resetpassword, resendOtp } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleSendOtp = async () => {
    if (!email) {
      setError("Please enter your email");
      return;
    }
    setIsSubmitting(true);
    setError("");

    try {
      const success = await sendOtp(email); // backend generates & stores OTP
      if (success) {
        setMiniStep(2);
        setCooldown(30); // start cooldown immediately
      } else {
        setError("Failed to send OTP");
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("yeah its comes");

    if (!/^\d{4}$/.test(otp)) {
      setError("OTP must be a 4-digit number");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const success = await forgotpassword(email, otp);
      if (success) {
        setStep(2);
      } else {
        setError("Invalid or expired OTP");
      }
    } catch (err) {
      setError("" + err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) {
      setError("Please enter your email first");
      return;
    }

    setIsResending(true);
    setError("");

    try {
      await resendOtp(email); // new API call in useAuth
      setCooldown(30); // 30 seconds cooldown
    } catch (err) {
      setError("Failed to resend OTP");
    } finally {
      setIsResending(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      setError("Please fill in both password fields");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const success = await resetpassword(email, otp, newPassword);
      if (success) {
        navigate("/login");
      } else {
        setError("Failed to reset password");
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-[#1877F2] font-bold">
          {step === 1 ? "Forgot Password" : "Reset Password"}
        </CardTitle>
        <CardDescription>
          {step === 1
            ? miniStep === 1
              ? "Enter your email to receive OTP"
              : "Enter the OTP sent to your email"
            : "Set your new password"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {step === 1 && miniStep === 1 && (
          <>
            <div className="space-y-2 mb-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-gray-300"
              />
            </div>
            <Button
              onClick={handleSendOtp}
              disabled={isSubmitting}
              className="w-full bg-[#1877F2] hover:bg-[#166FE5] text-white"
            >
              {isSubmitting ? "Sending..." : "Send OTP"}
            </Button>
          </>
        )}

        {step === 1 && miniStep === 2 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input value={email} disabled className="border-gray-300" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="otp">4-Digit OTP</Label>
                <span
                  onClick={() => {
                    if (!isResending && cooldown === 0) handleResendOtp();
                  }}
                  style={{
                    color: cooldown > 0 ? "#999" : "#007bff",
                    cursor:
                      cooldown > 0 || isResending ? "not-allowed" : "pointer",
                    textDecoration:
                      cooldown === 0 && !isResending ? "underline" : "none",
                    fontSize: "14px",
                    display: "inline-block",
                    marginTop: "6px",
                  }}
                >
                  {isResending
                    ? "Sending..."
                    : cooldown > 0
                    ? `Resend in ${cooldown}s`
                    : "Resend"}
                </span>
              </div>
              <Input
                id="otp"
                type="number"
                onInput={(e) => {
                  e.currentTarget.value = e.currentTarget.value.slice(0, 4);
                }}
                placeholder="1234"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                className="border-gray-300"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#1877F2] hover:bg-[#166FE5] text-white"
            >
              {isSubmitting ? "Verifying..." : "Verify OTP"}
            </Button>
          </form>
        )}
        {step === 2 && (
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="border-gray-300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="border-gray-300"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#1877F2] hover:bg-[#166FE5] text-white"
            >
              {isSubmitting ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        )}
      </CardContent>
      <CardFooter className="flex justify-center border-t p-4">
        <p>
          Back to {""}
          <Link
            to="/login"
            className="text-[#1877F2] hover:underline font-medium"
          >
            Login
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
