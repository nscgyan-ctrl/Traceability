import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Droplets, Shield, Users, FileText, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-amber-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xl">🍯</span>
            </div>
            <h1 className="text-xl font-bold text-amber-900">HoneyTrace</h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 text-amber-700 hover:text-amber-900 font-medium transition-colors"
            >
              Login
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-medium transition-colors shadow-md"
            >
              Register
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Shield className="w-4 h-4" />
            Complete Traceability Solution
          </div>
          <h2 className="text-5xl font-bold text-amber-900 mb-6 leading-tight">
            Track Every Drop of Honey from <span className="text-amber-600">Hive to Home</span>
          </h2>
          <p className="text-xl text-amber-700 mb-10 leading-relaxed">
            A comprehensive traceability platform connecting Beekeepers, Traders, and Processors. 
            Ensure authenticity, quality, and transparency in every transaction.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/register')}
              className="px-8 py-4 bg-amber-500 text-white rounded-xl hover:bg-amber-600 font-semibold text-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              Get Started <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-4 border-2 border-amber-500 text-amber-700 rounded-xl hover:bg-amber-50 font-semibold text-lg transition-all"
            >
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-center text-amber-900 mb-12">How It Works</h3>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-amber-100 hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center mb-5">
              <span className="text-2xl">🐝</span>
            </div>
            <h4 className="text-xl font-bold text-amber-900 mb-3">Beekeepers</h4>
            <p className="text-amber-700 leading-relaxed">
              Register your apiary, log maintenance activities, record harvests, and sell directly to processors or consumers with full traceability.
            </p>
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-amber-100 hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center mb-5">
              <span className="text-2xl">🔄</span>
            </div>
            <h4 className="text-xl font-bold text-amber-900 mb-3">Traders</h4>
            <p className="text-amber-700 leading-relaxed">
              Purchase honey from beekeepers, maintain inventory, and sell to processors with complete traceability documentation.
            </p>
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-amber-100 hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 bg-yellow-100 rounded-xl flex items-center justify-center mb-5">
              <span className="text-2xl">🏭</span>
            </div>
            <h4 className="text-xl font-bold text-amber-900 mb-3">Processors</h4>
            <p className="text-amber-700 leading-relaxed">
              Source honey with verified origin, track the complete supply chain, and ensure quality from hive to processing unit.
            </p>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h3 className="text-3xl font-bold text-center text-amber-900 mb-12">Key Features</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <Droplets className="w-6 h-6" />, title: 'Batch Tracking', desc: 'Unique batch IDs for every harvest' },
              { icon: <FileText className="w-6 h-6" />, title: 'Auto Invoices', desc: 'Generate invoices with traceability' },
              { icon: <Shield className="w-6 h-6" />, title: 'Unique IDs', desc: 'Traceable stakeholder identification' },
              { icon: <Users className="w-6 h-6" />, title: 'Multi-Stakeholder', desc: 'Connect all parties in the chain' },
            ].map((feature, idx) => (
              <div key={idx} className="flex flex-col items-center text-center p-6 rounded-xl bg-amber-50">
                <div className="w-12 h-12 bg-amber-500 text-white rounded-full flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h5 className="font-bold text-amber-900 mb-2">{feature.title}</h5>
                <p className="text-amber-600 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-amber-900 text-amber-100 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-amber-300">🍯 HoneyTrace - Complete Honey Supply Chain Traceability</p>
          <p className="text-amber-400 text-sm mt-2">Ensuring purity and transparency from hive to home</p>
        </div>
      </footer>
    </div>
  );
}
