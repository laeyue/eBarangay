import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Mail,
  Phone,
  MessageCircle,
  HelpCircle,
} from "lucide-react";

const Support = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="mb-6 btn-scale"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-xl gradient-user mb-4 shadow-lg">
            <HelpCircle className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Support Center</h1>
          <p className="text-lg text-muted-foreground">
            We're here to help you
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="border-2 card-interactive hover-lift">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-3">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Email Support</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Get help via email. We typically respond within 24 hours.
              </p>
              <a href="mailto:support@barangayconnect.ph">
                <Button variant="outline" className="w-full btn-scale">
                  support@barangayconnect.ph
                </Button>
              </a>
            </CardContent>
          </Card>

          <Card className="border-2 card-interactive hover-lift">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-3">
                <Phone className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Phone Support</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Call us during office hours: Mon-Fri, 8AM-5PM
              </p>
              <a href="tel:+639123456789">
                <Button variant="outline" className="w-full btn-scale">
                  +63 912 345 6789
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>

        <Card className="border-2 shadow-xl" id="faq-section">
          <CardHeader>
            <CardTitle className="text-2xl">
              Frequently Asked Questions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-2">
                How do I reset my password?
              </h3>
              <p className="text-muted-foreground">
                Click on "Forgot Password" on the login page and follow the
                instructions sent to your email.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">
                How do I verify my resident status?
              </h3>
              <p className="text-muted-foreground">
                Go to your Profile page and upload a valid proof of residency
                (Barangay Certificate, Utility Bill, or Valid ID with address).
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">
                How long does document processing take?
              </h3>
              <p className="text-muted-foreground">
                Most document requests are processed within 3-5 business days.
                You'll receive a notification when your document is ready.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">
                Can I vote in multiple polls?
              </h3>
              <p className="text-muted-foreground">
                Yes, you can participate in all active polls. However, you can
                only vote once per poll.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">
                How do I report a bug or issue?
              </h3>
              <p className="text-muted-foreground">
                Please email us at support@barangayconnect.ph with a detailed
                description of the issue and screenshots if possible.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">
                Is my information secure?
              </h3>
              <p className="text-muted-foreground">
                Yes, we use industry-standard encryption and security measures
                to protect your data. Read our{" "}
                <a href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </a>{" "}
                for more details.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Support;
