import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, 
  X, 
  Dumbbell, 
  Brain, 
  Target, 
  TrendingUp, 
  Users, 
  Calendar,
  PlayCircle,
  CheckCircle,
  Star,
  ArrowRight,
  Activity,
  Award,
  Heart,
  Zap,
  Clock,
  BarChart3,
  ChevronRight,
  Instagram,
  Twitter,
  Facebook,
  Youtube,
  Monitor,
  Globe,
  Laptop,
  LogOut,
  User,
  LayoutDashboard,
  Github,
  Linkedin
} from 'lucide-react';
import AuthPage from './pages/AuthPage';
import AuthCallback from './pages/AuthCallback';
import Dashboard from './pages/Dashboard';
import Onboarding from './pages/Onboarding';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import EmailVerificationSuccess from './pages/EmailVerificationSuccess';
import ProtectedRoute from './components/ProtectedRoute';
import ProfileDropdown from './components/ProfileDropdown';
import { useAuth } from './contexts/AuthContext';

function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth/signup');
    }
  };

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Training",
      description: "Advanced AI creates personalized workout plans that evolve with your progress, accessible instantly from your browser."
    },
    {
      icon: Target,
      title: "Goal-Oriented Plans",
      description: "Customized programs designed specifically for your objectives - weight loss, muscle building, or endurance improvement."
    },
    {
      icon: TrendingUp,
      title: "Real-Time Tracking",
      description: "Monitor your improvements with detailed analytics and visual progress reports to stay motivated and on track."
    },
    {
      icon: Globe,
      title: "Access Anywhere",
      description: "Train from home, office, or gym with our web-based platform. No downloads required - just open your browser."
    }
  ];

  const processSteps = [
    {
      number: 1,
      icon: Monitor,
      title: "Create Account",
      description: "Sign up in seconds with our simple registration process."
    },
    {
      number: 2,
      icon: Target,
      title: "Set Your Goals",
      description: "Tell us about your fitness objectives and current level."
    },
    {
      number: 3,
      icon: Dumbbell,
      title: "Start Training",
      description: "Follow your AI-generated workout plans with video guidance."
    },
    {
      number: 4,
      icon: TrendingUp,
      title: "Track Progress",
      description: "Watch your strength and fitness improve with detailed analytics."
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Marketing Executive",
      avatar: "https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=400",
      quote: "MyFitCoach's web platform is incredibly convenient. I can access my workouts from any device without downloading anything.",
      rating: 5
    },
    {
      name: "Mike Chen",
      role: "Software Engineer",
      avatar: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400",
      quote: "The browser-based interface is smooth and responsive. I love being able to switch between my laptop and tablet seamlessly.",
      rating: 5
    },
    {
      name: "Emma Rodriguez",
      role: "Teacher",
      avatar: "https://images.pexels.com/photos/3992656/pexels-photo-3992656.jpeg?auto=compress&cs=tinysrgb&w=400",
      quote: "No app downloads, no storage issues. Just instant access to personalized fitness coaching whenever I need it.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrollY > 50 ? 'bg-gray-900 shadow-xl' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Left Side - Logo and Brand */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl flex items-center justify-center">
                <Dumbbell className="w-6 h-6 text-white" />
              </div>
              <span className={`text-2xl font-bold transition-colors duration-300 ${
                scrollY > 50 ? 'text-white' : 'text-white'
              }`}>
                MyFitCoach
              </span>
            </div>

            {/* Right Side - Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {/* Navigation Links */}
              <div className="flex items-center space-x-6">
                <a href="#home" className={`font-medium transition-colors duration-300 hover:scale-105 ${
                  scrollY > 50 ? 'text-gray-300 hover:text-white' : 'text-white hover:text-gray-200'
                }`}>
                  Home
                </a>
                <a href="#features" className={`font-medium transition-colors duration-300 hover:scale-105 ${
                  scrollY > 50 ? 'text-gray-300 hover:text-white' : 'text-white hover:text-gray-200'
                }`}>
                  Features
                </a>
                <a href="#how-it-works" className={`font-medium transition-colors duration-300 hover:scale-105 ${
                  scrollY > 50 ? 'text-gray-300 hover:text-white' : 'text-white hover:text-gray-200'
                }`}>
                  How It Works
                </a>
              </div>
              
              {/* Authentication Buttons */}
              {user ? (
                <div className="flex items-center space-x-3 ml-6 pl-6 border-l border-white/20">
                  <div className="relative group">
                    <div className="flex items-center space-x-2 text-white cursor-pointer">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm font-medium text-white hidden sm:block">
                        {user.email}
                      </span>
                      <ChevronRight className="w-4 h-4 text-white transition-transform duration-200 group-hover:rotate-90" />
                    </div>
                    
                    {/* Dropdown Menu - Shows on hover */}
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-1 group-hover:translate-y-0">
                      {/* Menu Items */}
                      <div className="py-1">
                        {/* Dashboard Link */}
                        <button
                          onClick={() => navigate('/dashboard')}
                          className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-all duration-200"
                        >
                          <LayoutDashboard className="w-4 h-4 mr-3 text-gray-500" />
                          <span className="font-medium">Dashboard</span>
                        </button>

                        {/* Sign Out Button */}
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-all duration-200"
                        >
                          <LogOut className="w-4 h-4 mr-3 text-red-500" />
                          <span className="font-medium">Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-3 ml-6 pl-6 border-l border-white/20">
                  <button 
                    onClick={() => navigate('/auth/login')}
                    className="text-white border-2 border-tomato px-6 py-2 rounded-lg font-semibold hover:bg-tomato hover:border-tomato hover:scale-105 transition-all duration-300" 
                    style={{ borderColor: '#FF6347' }}
                  >
                    Login
                  </button>
                  <button 
                    onClick={() => navigate('/auth/signup')}
                    className="text-white px-6 py-2 rounded-lg font-semibold hover:scale-105 transition-all duration-300 shadow-lg" 
                    style={{ backgroundColor: '#FF6347' }}
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`p-2 rounded-lg transition-all duration-300 ${
                  scrollY > 50 ? 'text-white hover:bg-gray-800' : 'text-white hover:bg-white/10'
                }`}
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          <div className={`md:hidden transition-all duration-300 ease-in-out ${
            isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          } overflow-hidden`}>
            <div className="bg-gray-900/95 backdrop-blur-lg border-t border-gray-700 rounded-b-2xl mt-2 mx-2">
              <div className="px-4 py-6 space-y-4">
                {/* Mobile Navigation Links */}
                <div className="space-y-3">
                  <a 
                    href="#home" 
                    className="block px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Home
                  </a>
                  <a 
                    href="#features" 
                    className="block px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Features
                  </a>
                  <a 
                    href="#how-it-works" 
                    className="block px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    How It Works
                  </a>
                </div>
                
                {/* Mobile Authentication */}
                {user ? (
                  <div className="pt-4 border-t border-gray-700 space-y-3">
                    <button 
                      onClick={() => {
                        navigate('/dashboard');
                        setIsMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 text-purple-400 hover:text-purple-300 hover:bg-gray-800 rounded-lg transition-all duration-200"
                    >
                      Dashboard
                    </button>
                    <div className="px-4 py-2 text-gray-400 text-sm">{user.email}</div>
                    <button 
                      onClick={() => {
                        handleSignOut();
                        setIsMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 text-red-400 hover:text-red-300 hover:bg-gray-800 rounded-lg transition-all duration-200"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="pt-4 border-t border-gray-700 space-y-3">
                    <button 
                      onClick={() => {
                        navigate('/auth/login');
                        setIsMenuOpen(false);
                      }}
                      className="block w-full text-center px-6 py-3 text-white border-2 rounded-lg font-semibold hover:bg-tomato transition-all duration-300" 
                      style={{ borderColor: '#FF6347' }}
                    >
                      Login
                    </button>
                    <button 
                      onClick={() => {
                        navigate('/auth/signup');
                        setIsMenuOpen(false);
                      }}
                      className="block w-full text-center px-6 py-3 text-white rounded-lg font-semibold transition-colors duration-300" 
                      style={{ backgroundColor: '#FF6347' }}
                    >
                      Sign Up
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background Image with Proper Visibility */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1434682881908-b43d0467b798?q=80&w=1174&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')`,
            filter: 'grayscale(100%) blur(1px) brightness(0.7) contrast(1.1)',
          }}
        ></div>
        
        {/* Semi-Transparent Dark Overlay for Text Readability */}
        <div className="absolute inset-0 bg-black/50"></div>
        
        {/* Subtle Grid Pattern Overlay */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h2V0h2v20h2V0h2v20h2V0h2v20h2v2H20v-1.5zM0 20h2v20H0V20zm4 0h2v20H4V20zm4 0h2v20H8V20zm4 0h2v20h-2V20zm4 0h2v20h-2V20zm4 4h20v2H20v-2zm0 4h20v2H20v-2zm0 4h20v2H20v-2zm0 4h20v2H20v-2z'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '40px 40px'
          }}
        ></div>
        
        {/* Bolt.new badge */}
        <a 
          href="https://bolt.new/" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="absolute top-24 right-24 z-20 transition-transform duration-300 hover:scale-105"
        >
          <img 
            src="/white_circle_360x360.png" 
            alt="Powered by Bolt.new" 
            className="w-16 h-16 md:w-20 md:h-20"
          />
        </a>
        
        {/* Content Container */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center min-h-screen">
            {/* Left Content */}
            <div className="max-w-2xl text-left">
              <h1 
                className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight drop-shadow-2xl"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                Smash Your Fitness Goals with{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                  AI Coaching
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-200 mb-8 leading-relaxed drop-shadow-lg">
                Personalized workouts and real-time tracking — all from your browser
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={handleGetStarted}
                  className="text-white px-8 py-4 rounded-xl font-semibold text-lg hover:scale-105 transition-all duration-300 shadow-2xl flex items-center justify-center space-x-2"
                  style={{ backgroundColor: '#FF6347' }}
                >
                  <Zap className="w-6 h-6" />
                  <span>{user ? 'Go to Dashboard' : 'Get Started'}</span>
                </button>
                <button className="border-2 border-gray-300 text-gray-200 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-800 hover:text-white transition-all duration-300 flex items-center justify-center space-x-2">
                  <PlayCircle className="w-6 h-6" />
                  <span>Watch Demo</span>
                </button>
              </div>
            </div>

            {/* Right Side - Empty space for balance */}
            <div className="hidden lg:block"></div>
          </div>
        </div>

        {/* Ambient Lighting Effects */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-purple-600/20 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-32 right-32 w-24 h-24 bg-tomato/20 rounded-full blur-xl animate-pulse delay-1000" style={{ backgroundColor: 'rgba(255, 99, 71, 0.2)' }}></div>
        <div className="absolute top-1/2 right-10 w-16 h-16 bg-purple-400/30 rounded-full blur-lg animate-pulse delay-500"></div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 
              className="text-4xl md:text-5xl font-bold mb-6"
              style={{ fontFamily: 'Poppins, sans-serif', color: '#6C63FF' }}
            >
              Why Choose Our Platform?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Experience the future of fitness with our browser-based AI training platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100"
              >
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ backgroundColor: '#6C63FF' }}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 
                  className="text-2xl font-bold mb-4"
                  style={{ fontFamily: 'Poppins, sans-serif', color: '#1F1F1F' }}
                >
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed text-lg">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 
              className="text-4xl md:text-5xl font-bold mb-6"
              style={{ fontFamily: 'Poppins, sans-serif', color: '#6C63FF' }}
            >
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Get started in just four simple steps and begin your transformation today.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {processSteps.map((step, index) => (
              <div key={index} className="text-center relative">
                <div className="relative inline-block mb-6">
                  <div 
                    className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4 mx-auto shadow-lg"
                    style={{ backgroundColor: '#6C63FF' }}
                  >
                    {step.number}
                  </div>
                  <div className="absolute -top-2 -right-2 w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <step.icon className="w-6 h-6" style={{ color: '#FF6347' }} />
                  </div>
                </div>
                <h3 
                  className="text-xl font-bold mb-4"
                  style={{ fontFamily: 'Poppins, sans-serif', color: '#1F1F1F' }}
                >
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>
                {index < processSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-full w-full">
                    <ChevronRight className="w-8 h-8 mx-auto" style={{ color: '#6C63FF' }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20" style={{ background: 'linear-gradient(135deg, #6C63FF, #FF6347)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">100K+</div>
              <div className="text-white/80 text-lg">Active Users</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">2M+</div>
              <div className="text-white/80 text-lg">Workouts Completed</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">95%</div>
              <div className="text-white/80 text-lg">Success Rate</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">4.9/5</div>
              <div className="text-white/80 text-lg">User Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 lg:py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 
              className="text-4xl md:text-5xl font-bold mb-6"
              style={{ fontFamily: 'Poppins, sans-serif', color: '#6C63FF' }}
            >
              What Our Users Say
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Join thousands of satisfied users who have transformed their fitness journey.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index}
                className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100"
              >
                <div className="flex items-center mb-6">
                  <img 
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-16 h-16 rounded-full object-cover mr-4"
                  />
                  <div>
                    <h4 className="font-bold text-lg" style={{ color: '#1F1F1F' }}>{testimonial.name}</h4>
                    <p className="text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 italic leading-relaxed text-lg">
                  "{testimonial.quote}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #6C63FF, #FF6347)' }}>
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 
            className="text-4xl md:text-5xl font-bold text-white mb-6"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            Ready to Transform Your Fitness?
          </h2>
          <p className="text-xl text-white/90 mb-8 leading-relaxed">
            Join over 100,000 users who have started their journey with our web-based platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button 
              onClick={handleGetStarted}
              className="bg-white px-8 py-4 rounded-xl font-semibold text-lg hover:scale-105 transition-all duration-300 shadow-2xl flex items-center space-x-2" 
              style={{ color: '#6C63FF' }}
            >
              <Zap className="w-6 h-6" />
              <span>{user ? 'Go to Dashboard' : 'Get Started'}</span>
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white transition-all duration-300 flex items-center space-x-2 hover:text-purple-600">
              <Laptop className="w-6 h-6" />
              <span>Try Demo</span>
            </button>
          </div>
        </div>
        
        {/* Floating shapes */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-10 right-10 w-24 h-24 bg-purple-400/20 rounded-full blur-xl"></div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {/* Logo and description */}
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#6C63FF' }}>
                  <Dumbbell className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  MyFitCoach
                </span>
              </div>
              <p className="text-gray-400 leading-relaxed mb-6">
                AI-powered fitness coaching accessible from any browser. No downloads, just results.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center hover:bg-purple-600 transition-colors duration-300">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center hover:bg-purple-600 transition-colors duration-300">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center hover:bg-purple-600 transition-colors duration-300">
                  <Instagram className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-bold text-lg mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>Product</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">Features</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">Pricing</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">AI Technology</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">Web Platform</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>Company</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">About Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">Careers</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">Press</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>Support</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">Community</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 mb-4 md:mb-0 text-center md:text-left">
              © 2025 MyFitCoach. All rights reserved.
            </p>
            <div className="flex flex-col md:flex-row items-center md:space-x-4 space-y-2 md:space-y-0">
              <span className="text-gray-400 text-center">Designed and developed by Dhiraj Sah</span>
              <div className="flex space-x-3">
                <a 
                  href="https://github.com/DhirajSah736" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  aria-label="GitHub Profile"
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  <Github className="w-5 h-5" />
                </a>
                <a 
                  href="https://www.linkedin.com/in/dhiraj-sah-7a3522220/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  aria-label="LinkedIn Profile"
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
                <a 
                  href="https://www.dhirajsah99.com.np" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  aria-label="Personal Portfolio"
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  <Globe className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/auth/:type" element={<AuthPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/payment/success" element={<PaymentSuccessPage />} />
      <Route path="/email-verification-success" element={<EmailVerificationSuccess />} />
      <Route 
        path="/onboarding" 
        element={
          <ProtectedRoute>
            <Onboarding />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute requiresOnboarding={true}>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

export default App;