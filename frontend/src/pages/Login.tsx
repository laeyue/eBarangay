import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "@/lib/api";
import { toast } from "sonner";
import { z } from "zod";
import {
  Users,
  Vote,
  Bell,
  FileText,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

const loginSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
});

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load saved credentials on component mount
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    const wasRemembered = localStorage.getItem("wasRemembered") === "true";
    if (savedEmail && wasRemembered) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = loginSchema.safeParse({ email: email.trim(), password });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setLoading(true);

    try {
      const user = await auth.login(
        validation.data.email,
        validation.data.password
      );

      // Save email if remember me is checked
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", validation.data.email);
        localStorage.setItem("wasRemembered", "true");
      } else {
        localStorage.removeItem("rememberedEmail");
        localStorage.removeItem("wasRemembered");
      }

      toast.success("Welcome back! 🎉");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: Vote,
      title: "Community Polls",
      desc: "Participate in local decision-making",
    },
    {
      icon: Bell,
      title: "Real-time Notifications",
      desc: "Stay updated with announcements",
    },
    {
      icon: FileText,
      title: "Document Requests",
      desc: "Request certificates online",
    },
    {
      icon: Users,
      title: "Report Incidents",
      desc: "Report issues to authorities",
    },
  ];

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left Side - Hero Section */}
      <div className="hidden lg:flex lg:w-3/5 gradient-user relative overflow-hidden flex-col">
        {/* Animated background layer */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-600 opacity-95"></div>

        {/* Decorative animated orbs */}
        <div
          className="absolute top-0 right-0 w-96 h-96 bg-white/15 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "0s" }}
        />
        <div
          className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute top-1/2 right-1/4 w-80 h-80 bg-cyan-300/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "4s" }}
        />

        {/* Mesh pattern overlay */}
        <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-white to-transparent" />

        <div className="relative z-10 flex flex-col h-full px-12 text-white w-full py-8">
          <div className="mb-6">
            <img
              src="/ebarangay-logo.svg"
              alt="eBarangay Logo"
              className="h-16 w-16 mb-4 drop-shadow-lg filter brightness-110 group-hover:scale-110 group-hover:drop-shadow-2xl transition-all duration-300 cursor-pointer hover:scale-110 hover:drop-shadow-2xl"
              onClick={() => {
                navigate("/");
                setTimeout(() => {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }, 0);
              }}
            />
            <h1 className="text-4xl font-bold mb-3 leading-tight drop-shadow-lg">
              Welcome to
              <br />
              <span className="bg-gradient-to-r from-yellow-300 via-white to-cyan-200 bg-clip-text text-transparent drop-shadow-sm">
                BarangayConnect
              </span>
            </h1>
            <p className="text-sm text-white/95 mb-6 max-w-lg leading-relaxed font-medium drop-shadow">
              Your digital gateway to transparent local governance, community
              services, and citizen engagement.
            </p>
          </div>

          {/* Features Grid - Enhanced Cards */}
          <div className="grid grid-cols-2 gap-3 max-w-xl">
            {features.map((feature, idx) => (
              <div key={idx} className="group cursor-pointer">
                <div className="bg-white/12 backdrop-blur-md border border-white/20 rounded-lg p-3 hover:bg-white/18 hover:border-white/40 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                  <div className="flex items-start gap-2 mb-2">
                    <div className="p-1.5 bg-gradient-to-br from-yellow-400 to-cyan-400 rounded-lg group-hover:shadow-lg group-hover:scale-110 transition-all duration-300 flex-shrink-0">
                      <feature.icon className="h-4 w-4 text-blue-700" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-sm text-white group-hover:text-yellow-300 transition-colors mb-0.5">
                        {feature.title}
                      </h3>
                      <p className="text-xs text-white/75 group-hover:text-white/90 transition-colors">
                        {feature.desc}
                      </p>
                    </div>
                  </div>
                  <div className="h-0.5 bg-gradient-to-r from-yellow-400 to-cyan-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </div>
            ))}
          </div>

          {/* Spacer to push CTA to bottom */}
          <div className="flex-1" />

          {/* CTA Section - Bottom */}
          <div className="p-3 bg-white/8 backdrop-blur-md border border-white/15 rounded-lg">
            <div className="h-0.5 bg-gradient-to-r from-yellow-400 via-cyan-400 to-yellow-400 rounded-full mb-2" />
            <p className="text-white/90 text-center text-xs font-medium">
              ✨ Join thousands of residents already connected
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-background via-blue-50/40 to-cyan-50/30 relative overflow-hidden h-screen">
        {/* Background decorative elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Top-right soft orb */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-200/15 to-cyan-200/10 rounded-full blur-3xl -mr-48 -mt-48" />
          {/* Bottom-left soft orb */}
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-cyan-200/10 to-blue-200/08 rounded-full blur-3xl -mb-40 -ml-40" />
          {/* Subtle mesh pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-30 pointer-events-none" />
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <img
              src="/ebarangay-logo.svg"
              alt="eBarangay Logo"
              className="h-16 w-16 mx-auto mb-4 cursor-pointer hover:scale-110 hover:drop-shadow-lg transition-all duration-300"
              onClick={() => {
                navigate("/");
                setTimeout(() => {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }, 0);
              }}
            />
            <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-cyan-500 bg-clip-text text-transparent">
              BarangayConnect
            </h2>
          </div>

          <Card className="border-0 shadow-2xl hover:shadow-3xl transition-shadow duration-300 bg-white/99 backdrop-blur-sm rounded-2xl overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600" />
            <CardHeader className="space-y-1 pb-4 pt-6 px-6">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent">
                Welcome Back
              </CardTitle>
              <CardDescription className="text-sm text-gray-600 font-medium">
                Login to access your community account
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-1 px-6 pb-6">
              <form onSubmit={handleLogin} className="space-y-3.5">
                {/* Email Field */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="email"
                    className="text-xs font-semibold text-gray-900 block"
                  >
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-10 text-sm border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200/50 transition-all duration-200 rounded-lg bg-gray-50/50"
                    required
                    aria-label="Email Address"
                    aria-required="true"
                  />
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="password"
                    className="text-xs font-semibold text-gray-900 block"
                  >
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-10 text-sm border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200/50 transition-all duration-200 rounded-lg bg-gray-50/50"
                    required
                    aria-label="Password"
                    aria-required="true"
                  />
                </div>

                {/* Remember & Forgot */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) =>
                        setRememberMe(checked as boolean)
                      }
                      className="w-4 h-4 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    />
                    <label
                      htmlFor="remember"
                      className="text-xs cursor-pointer text-gray-700 font-medium hover:text-gray-900 transition-colors"
                    >
                      Remember me
                    </label>
                  </div>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Login Button */}
                <Button
                  type="submit"
                  className="w-full h-10 text-sm font-bold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white btn-scale transition-all duration-300 shadow-lg hover:shadow-xl rounded-lg mt-4"
                  disabled={loading}
                  aria-busy={loading}
                >
                  {loading ? (
                    "Logging in..."
                  ) : (
                    <>
                      Login <ArrowRight className="ml-2 w-3 h-3" />
                    </>
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="mt-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500 font-semibold text-xs tracking-wider">
                      New to BarangayConnect?
                    </span>
                  </div>
                </div>
                <div className="mt-3 text-center">
                  <Link to="/signup">
                    <Button
                      variant="outline"
                      className="w-full h-10 text-sm font-bold btn-scale border-2 border-blue-200 hover:bg-blue-50 text-gray-900 transition-all duration-200 rounded-lg"
                    >
                      Create an Account
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Footer Links */}
              <div className="mt-4 pt-3 border-t border-gray-200 text-center space-y-1.5">
                <Link
                  to="/"
                  className="block text-xs text-gray-600 hover:text-gray-900 font-semibold transition-colors"
                >
                  ← Back to home
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
