import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  MessageSquare,
  AlertCircle,
  Users,
  Vote,
  Bell,
  ArrowRight,
  CheckCircle2,
  Shield,
  Zap,
  Building,
  TrendingUp,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { useBackgroundInteraction } from "@/hooks/useBackgroundInteraction";

interface Stats {
  activeResidents: number;
  connectedBarangays: number;
  satisfactionRate: number;
}

const Index = () => {
  const navigate = useNavigate();
  const featuresRef = useRef<HTMLElement>(null);
  const { splashParticles } = useBackgroundInteraction(featuresRef);
  const [stats, setStats] = useState<Stats>({
    activeResidents: 10500,
    connectedBarangays: 44,
    satisfactionRate: 67,
  });
  const [loading, setLoading] = useState(true);
  const [parallaxScale, setParallaxScale] = useState(1);
  const heroRef = useRef<HTMLElement>(null);

  // Parallax effect that responds immediately to scroll
  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const heroHeight = heroRef.current.offsetHeight;
        // Calculate scale based on current scroll position
        const progress = Math.min(1, window.scrollY / heroHeight);
        const newScale = 1 + 0.15 * progress; // Direct response, no interpolation lag
        setParallaxScale(newScale);
      }
    };

    // Use passive listener for better scroll performance
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/stats/public");
        const result = await response.json();
        if (result.success && result.data) {
          setStats(result.data);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
        // Keep default values on error
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K+`;
    }
    return num.toString();
  };

  const handleNavigateAndScroll = (path: string) => {
    navigate(path);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 0);
  };

  const features = [
    {
      icon: AlertCircle,
      title: "Incident Reporting System",
      description:
        "Quickly report community incidents directly to your barangay officials. Include photos, location data, and priority levels for immediate response.",
      color: "text-red-500",
      badge: "24/7 Support",
    },
    {
      icon: FileText,
      title: "Government Permits & Certificates",
      description:
        "Apply for barangay certifications, clearances, and permits online. Process applications faster and reduce wait times at the barangay office.",
      color: "text-blue-500",
      badge: "Official Documents",
    },
    {
      icon: Bell,
      title: "Official Alerts & Announcements",
      description:
        "Receive critical updates from your barangay via SMS and push notifications. Stay informed about community events and emergencies.",
      color: "text-amber-500",
      badge: "Real-time Updates",
    },
    {
      icon: Vote,
      title: "Community Consultations & Voting",
      description:
        "Participate in barangay decisions through secure online voting and consultations. Your voice matters in community governance.",
      color: "text-purple-500",
      badge: "Democratic Participation",
    },
    {
      icon: Users,
      title: "Barangay Directory & Services",
      description:
        "Access your barangay's contact information, services list, and official staff directory. Know how to reach local government services.",
      color: "text-green-500",
      badge: "Easy Access",
    },
    {
      icon: MessageSquare,
      title: "Direct Communication Channel",
      description:
        "Send messages directly to barangay officials, track inquiries, and receive responses. Transparent and accountable governance.",
      color: "text-cyan-500",
      badge: "Transparent Government",
    },
  ];

  const benefits = [
    { icon: CheckCircle2, text: "Transparent Government" },
    { icon: Zap, text: "Efficient Service Delivery" },
    { icon: Shield, text: "Secure Citizen Data" },
    { icon: Users, text: "Citizen Participation" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-blue-50/30 to-cyan-50/20 relative">
      {/* Subtle animated background pattern */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-100/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute top-1/3 right-5 w-96 h-96 bg-cyan-100/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-blue-50/15 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "4s" }}
        />
      </div>
      <div className="relative z-10">
        {/* Navigation */}
        <nav
          className="sticky top-0 z-50 border-b border-blue-200/60 bg-gradient-to-r from-background via-blue-50/40 to-background backdrop-blur supports-[backdrop-filter]:bg-background/85 shadow-lg"
          style={{ backgroundColor: "hsl(var(--background))" }}
        >
          {/* Top accent gradient line */}
          <div className="h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-60" />

          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Logo Section */}
              <div
                className="flex items-center gap-3 group cursor-pointer"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              >
                <img
                  src="/ebarangay-logo.svg"
                  alt="eBarangay Logo"
                  className="h-12 w-12 rounded-xl shadow-lg group-hover:shadow-2xl transition-all group-hover:scale-110"
                />
                <div className="space-y-0.5">
                  <span className="font-bold text-lg bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-600 bg-clip-text text-transparent group-hover:from-blue-700 group-hover:via-cyan-600 group-hover:to-teal-700 transition-all duration-300">
                    BarangayConnect
                  </span>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section with Iligan City Aerial Background + Zoom Parallax */}
        <section
          ref={heroRef}
          className="relative w-full flex items-center overflow-hidden"
          style={{
            height: "90vh",
            backgroundImage: `url('/images/iligan-aerial.webp'), url('/assets/iligan-aerial.jpeg')`,
            backgroundPosition: "center",
            backgroundSize: `${parallaxScale * 100}%`,
            backgroundRepeat: "no-repeat",
            backgroundAttachment: "scroll",
            backgroundOrigin: "center",
            willChange: "background-size",
          }}
        >
          {/* Dynamic Overlay for text contrast with enhanced visual depth */}
          <div
            className="absolute inset-0 pointer-events-none z-0"
            aria-hidden="true"
          >
            {/* Primary dark gradient overlay with blue/teal tint */}
            <div className="absolute inset-0 bg-gradient-to-br from-[rgba(3,105,161,0.70)] via-[rgba(16,185,129,0.20)] to-[rgba(6,182,212,0.15)]" />
            {/* Secondary gradient for depth */}
            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.45)] via-transparent to-[rgba(0,0,0,0.10)]" />
            {/* Soft vignette for focused text - enhanced */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.10)_0%,rgba(0,0,0,0.55)_100%)]" />
            {/* Subtle animated light leak effect */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-b from-cyan-500 to-transparent opacity-5 blur-3xl animate-pulse" />
          </div>

          <div className="container mx-auto px-4 relative z-20 h-full flex flex-col justify-center items-center py-0">
            <div className="flex flex-col justify-center items-center w-full">
              <div className="max-w-4xl mx-auto text-center animate-fade-in w-full">
                <Badge
                  variant="secondary"
                  className="mb-4 px-4 py-2 text-xs md:text-sm font-medium shadow-lg bg-blue-600 hover:bg-blue-700 inline-flex"
                >
                  <Zap className="h-4 w-4 mr-1 inline" />
                  Digital Government Innovation
                </Badge>

                <h1 className="text-3xl md:text-6xl font-bold mb-4 text-white drop-shadow-lg">
                  Connect with Your
                  <br />
                  <span className="bg-gradient-to-r from-yellow-300 via-white to-cyan-200 bg-clip-text text-transparent">
                    Barangay Government
                  </span>
                </h1>

                <p className="text-base md:text-xl text-white/95 mb-8 max-w-3xl mx-auto drop-shadow leading-relaxed">
                  Bringing Local Government Closer to You. Access barangay
                  services, participate in community decisions, and stay
                  informed—all through one secure, transparent digital platform.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
                  <Link to="/signup">
                    <Button
                      size="lg"
                      className="text-base px-8 h-12 bg-yellow-400 text-blue-900 hover:bg-yellow-300 shadow-xl btn-scale group font-bold"
                    >
                      Join Your Barangay
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button
                      size="lg"
                      variant="outline"
                      className="text-base px-6 h-12 border-2 border-white bg-white/10 text-white hover:bg-white/20 shadow-xl btn-scale font-semibold"
                    >
                      Sign In
                    </Button>
                  </Link>
                </div>

                {/* Benefits Row - Positioned below buttons */}
                <div className="flex flex-wrap justify-center gap-2 mt-8 px-2">
                  {benefits.map((benefit, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-white/95 px-3 py-2 rounded-full shadow-lg hover:shadow-xl transition-shadow hover:bg-white whitespace-nowrap"
                    >
                      <benefit.icon className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      <span className="text-xs md:text-sm font-semibold text-blue-700">
                        {benefit.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section - Core Government Services */}
        <section ref={featuresRef} className="py-20 relative overflow-hidden">
          {/* Dynamic animated gradient background - subtle */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-cyan-50 animate-pulse"
            style={{ animationDuration: "8s" }}
          />

          {/* Animated mesh pattern background - very subtle */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(45deg, rgba(59, 130, 246, 0.03) 25%, transparent 25%, transparent 75%, rgba(59, 130, 246, 0.03) 75%, rgba(59, 130, 246, 0.03)),
                linear-gradient(45deg, rgba(6, 182, 212, 0.02) 25%, transparent 25%, transparent 75%, rgba(6, 182, 212, 0.02) 75%, rgba(6, 182, 212, 0.02))
              `,
              backgroundSize: "60px 60px, 90px 90px",
              backgroundPosition: "0 0, 30px 30px",
            }}
          />

          {/* Layered blobs with reduced opacity for readability */}
          {/* Top-left blob - Subtle Blue - animated */}
          <div
            className="absolute -top-32 -left-40 w-[900px] h-[900px] bg-gradient-to-br from-blue-500/15 via-blue-400/10 to-transparent rounded-full blur-3xl pointer-events-none"
            style={{ animation: "float-slow 10s ease-in-out infinite" }}
          />

          {/* Top-right blob - Subtle Cyan - animated */}
          <div
            className="absolute -top-48 -right-24 w-[1000px] h-[1000px] bg-gradient-to-bl from-cyan-500/12 via-cyan-400/8 to-transparent rounded-full blur-3xl pointer-events-none"
            style={{ animation: "float-slow 12s ease-in-out infinite reverse" }}
          />

          {/* Bottom-left blob - Subtle Indigo */}
          <div
            className="absolute -bottom-32 -left-56 w-[850px] h-[850px] bg-gradient-to-tr from-indigo-500/12 via-blue-400/8 to-transparent rounded-full blur-3xl pointer-events-none"
            style={{ animation: "float-slow 14s ease-in-out infinite" }}
          />

          {/* Bottom-right blob - Subtle Cyan */}
          <div
            className="absolute -bottom-40 -right-32 w-[950px] h-[950px] bg-gradient-to-tl from-cyan-500/10 via-blue-400/6 to-transparent rounded-full blur-3xl pointer-events-none"
            style={{ animation: "float-slow 11s ease-in-out infinite reverse" }}
          />

          {/* Center stage blob - subtle accent */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-br from-blue-400/10 via-cyan-400/6 to-transparent rounded-full blur-3xl pointer-events-none"
            style={{ animation: "float-slow 13s ease-in-out infinite" }}
          />

          {/* Right side subtle accent */}
          <div className="absolute top-1/3 right-0 w-[800px] h-[800px] bg-gradient-to-l from-cyan-500/10 via-blue-400/5 to-transparent rounded-full blur-3xl pointer-events-none" />

          {/* Left side accent blob */}
          <div className="absolute bottom-1/3 left-0 w-[750px] h-[750px] bg-gradient-to-r from-blue-500/10 via-cyan-400/5 to-transparent rounded-full blur-3xl pointer-events-none" />

          {/* Subtle radial dot pattern - readable */}
          <div className="features-radial-pattern-enhanced absolute inset-0 pointer-events-none opacity-20" />

          {/* Minimal color overlay for polish */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-100/5 via-transparent to-cyan-100/8 pointer-events-none mix-blend-overlay" />

          {/* Splash particles container */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {splashParticles.map((particle) => {
              // Get the container's position to convert viewport coords to relative coords
              const containerRect =
                featuresRef.current?.getBoundingClientRect();
              const relativeX = containerRect
                ? particle.x - containerRect.left
                : particle.x;
              const relativeY = containerRect
                ? particle.y - containerRect.top
                : particle.y;

              return (
                <div
                  key={particle.id}
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    left: `${relativeX}px`,
                    top: `${relativeY}px`,
                    width: `${particle.size}px`,
                    height: `${particle.size}px`,
                    backgroundColor: particle.color,
                    opacity: particle.life * 0.9,
                    transform: `translate(-50%, -50%) scale(${particle.life})`,
                    transition: "none",
                    boxShadow: `0 0 ${
                      particle.size * 2
                    }px ${particle.color.replace("1.0", "0.6")}`,
                    willChange: "transform, opacity",
                  }}
                />
              );
            })}
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-16 animate-fade-in">
              <Badge
                variant="secondary"
                className="mb-4 px-4 py-2 bg-blue-100 text-blue-700"
              >
                Core Barangay Services
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
                Complete Government Service Platform
              </h2>
              <p className="text-gray-600 text-lg max-w-3xl mx-auto leading-relaxed">
                Streamline your barangay operations and enhance citizen
                engagement through our comprehensive digital government
                services. Transparent, efficient, and accessible.
              </p>
            </div>

            <div className="grid md:grid-cols-3 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {features.map((feature, index) => (
                <Card
                  key={index}
                  data-card="true"
                  className="card-interactive hover-lift group animate-fade-in border-2 border-blue-100 hover:border-blue-400 shadow-md hover:shadow-2xl transition-all duration-300 relative overflow-hidden cursor-pointer"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Enhanced glow effect on hover */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500 rounded-lg opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300 pointer-events-none" />

                  {/* Gradient background on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-cyan-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                  <CardHeader className="relative z-10">
                    <div
                      className={`h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:shadow-xl transition-all duration-300 group-hover:from-blue-200 group-hover:to-cyan-200`}
                    >
                      <feature.icon
                        className={`h-8 w-8 ${feature.color} group-hover:scale-125 transition-transform duration-300`}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                        {feature.title}
                      </CardTitle>
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 whitespace-nowrap border border-blue-200 group-hover:bg-blue-100 group-hover:border-blue-300 transition-colors">
                        {feature.badge}
                      </span>
                    </div>
                    <CardDescription className="text-base leading-relaxed text-gray-700 group-hover:text-gray-800 transition-colors">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>

                  {/* Accent line at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-cyan-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section - Impact & Trust Metrics */}
        <section className="py-20 bg-gradient-to-br from-background via-blue-50/40 to-cyan-50/40 relative overflow-hidden">
          {/* Subtle background accents */}
          <div className="absolute top-0 left-10 w-96 h-96 bg-blue-300/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-20 w-80 h-80 bg-cyan-300/10 rounded-full blur-3xl pointer-events-none" />

          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-16 animate-fade-in">
              <Badge className="mb-4 px-4 py-1.5 bg-blue-600 text-white border-0 font-semibold hover:bg-blue-700 transition-colors cursor-default">
                Real Impact
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
                Growing Community Trust
              </h2>
              <p className="text-gray-600 text-sm">
                Real impact across Filipino barangays
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {/* Stat Card 1 */}
              <div className="group animate-fade-in relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-400/5 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative p-8 rounded-2xl bg-white/80 backdrop-blur border border-blue-200/40 hover:border-blue-300 shadow-sm hover:shadow-xl transition-all duration-300 text-center hover:translate-y-[-4px]">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 mb-4 group-hover:scale-110 transition-transform">
                    <Users className="text-blue-600 h-8 w-8" />
                  </div>
                  <div className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent mb-2">
                    {loading ? "..." : formatNumber(stats.activeResidents)}
                  </div>
                  <div className="text-lg font-bold text-gray-900 mb-1">
                    Active Residents
                  </div>
                  <p className="text-sm text-gray-600">
                    Engaged in their barangay
                  </p>
                  <div className="mt-4 h-1 w-12 mx-auto bg-gradient-to-r from-blue-400 to-transparent rounded-full" />
                </div>
              </div>

              {/* Stat Card 2 */}
              <div
                className="group animate-fade-in relative"
                style={{ animationDelay: "100ms" }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-cyan-400/5 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative p-8 rounded-2xl bg-white/80 backdrop-blur border border-cyan-200/40 hover:border-cyan-300 shadow-sm hover:shadow-xl transition-all duration-300 text-center hover:translate-y-[-4px]">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-100 to-cyan-50 mb-4 group-hover:scale-110 transition-transform">
                    <Building className="text-cyan-600 h-8 w-8" />
                  </div>
                  <div className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent mb-2">
                    {loading ? "..." : `${stats.connectedBarangays}+`}
                  </div>
                  <div className="text-lg font-bold text-gray-900 mb-1">
                    Barangay Partners
                  </div>
                  <p className="text-sm text-gray-600">
                    Connected and serving citizens
                  </p>
                  <div className="mt-4 h-1 w-12 mx-auto bg-gradient-to-r from-cyan-400 to-transparent rounded-full" />
                </div>
              </div>

              {/* Stat Card 3 */}
              <div
                className="group animate-fade-in relative"
                style={{ animationDelay: "200ms" }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-emerald-400/5 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative p-8 rounded-2xl bg-white/80 backdrop-blur border border-emerald-200/40 hover:border-emerald-300 shadow-sm hover:shadow-xl transition-all duration-300 text-center hover:translate-y-[-4px]">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 mb-4 group-hover:scale-110 transition-transform">
                    <TrendingUp className="text-emerald-600 h-8 w-8" />
                  </div>
                  <div className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent mb-2">
                    {loading ? "..." : `${stats.satisfactionRate}%`}
                  </div>
                  <div className="text-lg font-bold text-gray-900 mb-1">
                    Satisfaction Rate
                  </div>
                  <p className="text-sm text-gray-600">
                    Citizen approval rating
                  </p>
                  <div className="mt-4 h-1 w-12 mx-auto bg-gradient-to-r from-emerald-400 to-transparent rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section - Government Service Call to Action */}
        <section className="py-16 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-10 right-10 w-64 h-64 bg-white rounded-full blur-2xl animate-pulse" />
            <div
              className="absolute bottom-10 left-10 w-56 h-56 bg-cyan-200 rounded-full blur-2xl animate-pulse"
              style={{ animationDelay: "1s" }}
            />
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center space-y-6">
              <Badge className="inline-block mb-2 px-4 py-1.5 bg-yellow-400 text-blue-900 font-bold rounded-full hover:bg-yellow-300 transition-colors">
                Join Your Barangay Today
              </Badge>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white drop-shadow-lg leading-tight">
                Become Part of the Digital Government Revolution
              </h2>
              <p className="text-lg md:text-xl text-blue-100 drop-shadow-md max-w-3xl mx-auto leading-relaxed">
                Experience transparent, efficient government services. Report
                incidents, request documents, participate in decisions, and stay
                connected with your barangay officials—all in one secure
                platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Link to="/signup">
                  <Button
                    size="lg"
                    className="text-base px-8 h-12 bg-yellow-400 text-blue-900 hover:bg-yellow-300 shadow-xl font-bold rounded-full hover:shadow-2xl hover:scale-105 transition-all"
                  >
                    Create Your Account
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button
                    size="lg"
                    className="text-base px-8 h-12 border-2 border-white bg-transparent text-white hover:bg-white hover:text-blue-600 font-semibold rounded-full hover:shadow-2xl transition-all"
                  >
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-blue-200/50 bg-gradient-to-b from-background via-blue-50/60 to-blue-100/40 py-6">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid md:grid-cols-3 gap-8 items-center">
              {/* Status */}
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                  <span className="text-white font-bold text-xs">✓</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900 uppercase opacity-80">
                    Status
                  </p>
                  <p className="text-xs text-gray-600">Operational</p>
                </div>
              </div>

              {/* Connect */}
              <div className="text-center">
                <p className="text-xs font-bold text-gray-900 uppercase opacity-80 mb-1">
                  Connect
                </p>
                <p className="text-xs text-gray-600">
                  <a
                    href="mailto:support@barangayconnect.ph"
                    className="text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    support@barangayconnect.ph
                  </a>
                </p>
              </div>

              {/* Resources */}
              <div className="md:text-right">
                <p className="text-xs font-bold text-gray-900 uppercase opacity-80 mb-1">
                  Resources
                </p>
                <div className="flex md:justify-end gap-3 flex-wrap">
                  <button
                    onClick={() => handleNavigateAndScroll("/privacy")}
                    className="text-xs text-gray-700 hover:text-blue-600 transition-colors bg-none border-none p-0 cursor-pointer hover:underline"
                  >
                    Privacy
                  </button>
                  <span className="text-gray-400">•</span>
                  <button
                    onClick={() => handleNavigateAndScroll("/terms")}
                    className="text-xs text-gray-700 hover:text-blue-600 transition-colors bg-none border-none p-0 cursor-pointer hover:underline"
                  >
                    Terms
                  </button>
                  <span className="text-gray-400">•</span>
                  <button
                    onClick={() => handleNavigateAndScroll("/support")}
                    className="text-xs text-gray-700 hover:text-blue-600 transition-colors bg-none border-none p-0 cursor-pointer hover:underline"
                  >
                    Support
                  </button>
                </div>
              </div>
            </div>

            <p className="text-center text-xs text-gray-600 mt-4 pt-3 border-t border-blue-200/30">
              © 2025 BarangayConnect. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
