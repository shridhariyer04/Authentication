import { Shield, Key, Clock, Activity, Mail, Github, ArrowRight, CheckCircle } from 'lucide-react';

export default function HomePage() {
  const features = [
    {
      icon: Shield,
      title: "Secure Authentication",
      description: "Email/password and Google OAuth with built-in brute force protection"
    },
    {
      icon: Mail,
      title: "OTP Verification",
      description: "Email-based OTP verification for signup and password recovery"
    },
    {
      icon: Activity,
      title: "Activity Tracking",
      description: "Users can view their own login history and account activity"
    },
    {
      icon: Clock,
      title: "Automated Cleanup",
      description: "Cron jobs automatically delete expired tokens and unused data"
    }
  ];

  const techStack = [
    "Next.js", "NextAuth.js", "TypeScript", "Tailwind CSS", 
    "Drizzle ORM", "Neon DB", "Resend", "Zod"
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="w-8 h-8 text-gray-700" />
            <span className="text-xl font-semibold text-gray-900">AuthSystem</span>
          </div>
          <nav className="flex items-center space-x-6">
            <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
            <a href="#tech" className="text-gray-600 hover:text-gray-900 transition-colors">Tech Stack</a>
            <a 
              href="https://www.authentication.sbs/register"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Get Started
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Secure Authentication
            <span className="block text-gray-700">Made Simple</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            A production-ready authentication system built with Next.js, featuring email/Google login, 
            OTP verification, activity tracking, and comprehensive security measures.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <a 
              href="https://www.authentication.sbs/register"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-900 text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2"
            >
              <span>Try Demo</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <a 
              href="https://github.com/shridhariyer04/Authentication"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              View Docs
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need for Authentication
            </h2>
            <p className="text-lg text-gray-600">
              Built with modern technologies and security best practices
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <feature.icon className="w-12 h-12 text-gray-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Features List */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Authentication Features</h3>
              <div className="space-y-4">
                {[
                  "Email & Password Signup/Signin",
                  "Google OAuth Integration",
                  "OTP-based Email Verification",
                  "Password Reset with Email",
                  "Brute Force Protection"
                ].map((item, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-gray-600 flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Advanced Features</h3>
              <div className="space-y-4">
                {[
                  "Personal Activity Dashboard",
                  "Automated Token Cleanup",
                  "Cron Job Data Management",
                  "User Profile Management",
                  "TypeScript + Drizzle ORM"
                ].map((item, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-gray-600 flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section id="tech" className="bg-gray-50 py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Built with Modern Technologies
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            {techStack.map((tech, index) => (
              <span 
                key={index}
                className="bg-white px-4 py-2 rounded-full text-gray-700 border border-gray-200 shadow-sm"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Database Schema */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Database Architecture
            </h2>
            <p className="text-lg text-gray-600">
              Clean, normalized schema with proper relationships
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { table: "users", desc: "User profiles with account status" },
              { table: "accounts", desc: "OAuth provider connections" },
              { table: "verification_tokens", desc: "OTP tokens (auto-cleaned)" },
              { table: "activity_logs", desc: "Personal activity history" }
            ].map((item, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg border-l-4 border-gray-600">
                <h4 className="font-mono text-lg font-semibold text-gray-900">
                  {item.table}
                </h4>
                <p className="text-gray-600 text-sm mt-1">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-900 py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-gray-300 text-lg mb-8">
            Clone the repository and have a secure authentication system running in minutes
          </p>
          <div className="flex items-center justify-center space-x-4">
            <a 
              href="https://github.com/shridhariyer04/Authentication"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-gray-900 px-8 py-3 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
            >
              View Documentation
            </a>
            <a 
              href="https://www.authentication.sbs/register"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-gray-600 text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Live Demo
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="w-6 h-6 text-gray-600" />
              <span className="text-lg font-semibold text-gray-900">AuthSystem</span>
            </div>
            
            <div className="flex items-center space-x-6">
              <span className="text-gray-600">Built with ❤️ for developers</span>
              <a 
                href="https://github.com/shridhariyer04/Authentication" 
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="w-5 h-5" />
                <span>View on GitHub</span>
              </a>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-100 text-center text-gray-500 text-sm">
            <p>© 2025 AuthSystem. Open source under MIT License.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}