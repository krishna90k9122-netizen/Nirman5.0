import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { MapPin, Activity } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import SubmitComplaint from './pages/SubmitComplaint';
import './index.css';

// Hero Section Component
const Hero = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/submit-complaint');
  };

  const handleViewDemo = () => {
    // Scroll to features section
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleViewHeatmap = () => {
    // Open the standalone heatmap page
    window.open('/heatmap.html', '_blank');
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Content */}
      <div className="text-center px-6 max-w-4xl mx-auto">
        <div className="mb-8">
          <span className="inline-block px-4 py-2 bg-green-600/20 border border-green-500/50 text-green-300 font-medium text-sm rounded-lg mb-6 backdrop-blur-sm">
            🏛️ Smart Complaint Management
          </span>
        </div>
        
        <h1 className="text-6xl font-bold text-white mb-6 drop-shadow-lg">
          Lokai
        </h1>
        
        <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
          Transform your complaint management system with real-time tracking, smart analytics, and seamless citizen engagement
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <button 
            onClick={handleGetStarted}
            className="btn btn-primary text-lg px-8 py-3 shadow-xl hover:shadow-green-500/25"
          >
            Get Started
          </button>
          <button 
            onClick={handleViewHeatmap}
            className="btn btn-secondary text-lg px-8 py-3 shadow-xl hover:shadow-blue-500/25 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
          >
            <Activity className="inline-block mr-2" size={20} />
            View Heatmap
          </button>
          <button 
            onClick={handleViewDemo}
            className="btn btn-secondary text-lg px-8 py-3 shadow-xl"
          >
            View Demo
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
            <div className="text-4xl font-bold text-green-400 mb-2">50K+</div>
            <div className="text-gray-300">Complaints Resolved</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
            <div className="text-4xl font-bold text-green-400 mb-2">95%</div>
            <div className="text-gray-300">Resolution Rate</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
            <div className="text-4xl font-bold text-green-400 mb-2">24hrs</div>
            <div className="text-gray-300">Avg Response Time</div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Features Section Component
const Features = () => {
  const navigate = useNavigate();
  
  const features = [
    {
      icon: '📝',
      title: 'Easy Complaint Submission',
      description: 'Submit complaints quickly with our intuitive interface. Attach photos, documents, and track status in real-time.'
    },
    {
      icon: '📍',
      title: 'Location-Based Tracking',
      description: 'Pinpoint exact locations with interactive maps. Automatically assign complaints to the right department.'
    },
    {
      icon: '📊',
      title: 'Smart Analytics Dashboard',
      description: 'Get comprehensive insights with real-time analytics, trend analysis, and performance metrics.'
    },
    {
      icon: '🔔',
      title: 'Instant Notifications',
      description: 'Stay updated with real-time SMS and email notifications. Never miss important updates on your complaints.'
    },
    {
      icon: '🛡️',
      title: 'Secure & Private',
      description: 'Your data is protected with enterprise-grade security. End-to-end encryption ensures complete privacy.'
    },
    {
      icon: '📱',
      title: 'Mobile First Design',
      description: 'Access Lokai from any device. Our responsive design ensures a seamless experience on mobile, tablet, or desktop.'
    }
  ];

  const handleFeatureClick = (featureTitle) => {
    navigate('/dashboard', { state: { feature: featureTitle } });
  };

  return (
    <section id="features" className="py-20 px-6 bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">Powerful Features</h2>
          <p className="text-gray-300 max-w-2xl mx-auto text-lg">
            Everything you need for effective complaint management
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              onClick={() => handleFeatureClick(feature.title)}
              className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 cursor-pointer hover:bg-gray-800/80 hover:border-green-500/30 hover:shadow-xl hover:shadow-green-500/10 transition-all duration-300"
            >
              <div className="w-14 h-14 bg-green-600/20 rounded-xl flex items-center justify-center text-3xl mb-4 border border-green-500/30">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// CTA Section Component
const CTA = () => {
  const navigate = useNavigate();

  const handleSubmitComplaint = () => {
    navigate('/submit-complaint');
  };

  const handleViewDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <section className="py-20 px-6 bg-gradient-to-b from-slate-800 to-slate-900">
      <div className="max-w-4xl mx-auto text-center">
        <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Transform Your Community?</h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto text-lg leading-relaxed">
            Join thousands of citizens and organizations who are already making their communities better with Lokai
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={handleSubmitComplaint}
              className="btn btn-primary text-lg px-8 py-3 shadow-xl hover:shadow-green-500/25"
            >
              Submit Complaint
            </button>
            <button 
              onClick={handleViewDashboard}
              className="btn btn-secondary text-lg px-8 py-3 shadow-xl"
            >
              View Dashboard
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

// Footer Component
const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer className="border-t border-gray-700 py-12 px-6 bg-slate-900">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-bold text-lg mb-4 text-white">Lokai</h3>
            <p className="text-gray-300">Smart complaint management system for better communities.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-white">Features</h4>
            <ul className="space-y-2 text-gray-300">
              <li><button onClick={() => navigate('/dashboard')} className="hover:text-green-400 transition-colors text-left">Submit Complaint</button></li>
              <li><button onClick={() => navigate('/dashboard')} className="hover:text-green-400 transition-colors text-left">Track Status</button></li>
              <li><button onClick={() => navigate('/dashboard')} className="hover:text-green-400 transition-colors text-left">Analytics</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-white">About</h4>
            <ul className="space-y-2 text-gray-300">
              <li><button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-green-400 transition-colors text-left">How It Works</button></li>
              <li><button onClick={() => navigate('/dashboard')} className="hover:text-green-400 transition-colors text-left">Success Stories</button></li>
              <li><button onClick={() => navigate('/dashboard')} className="hover:text-green-400 transition-colors text-left">Partners</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-white">Support</h4>
            <ul className="space-y-2 text-gray-300">
              <li><button onClick={() => navigate('/dashboard')} className="hover:text-green-400 transition-colors text-left">Help Center</button></li>
              <li><button onClick={() => navigate('/dashboard')} className="hover:text-green-400 transition-colors text-left">Contact Us</button></li>
              <li><button onClick={() => navigate('/dashboard')} className="hover:text-green-400 transition-colors text-left">FAQ</button></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 pt-8 text-center text-gray-300">
          <p>&copy; 2024 Lokai. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

// Landing Page Component
const LandingPage = () => {
  return (
    <div className="min-h-screen bg-slate-900">
      <Hero />
      <Features />
      <CTA />
      <Footer />
    </div>
  );
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-900 text-slate-50">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/submit-complaint" element={<SubmitComplaint />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
