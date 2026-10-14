import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { StakeholderType } from '../types';
import { ArrowLeft, CheckCircle } from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { registerStakeholder } = useApp();
  const [step, setStep] = useState(1);
  const [registered, setRegistered] = useState(false);
  const [uniqueId, setUniqueId] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    password: '',
    confirmPassword: '',
    type: 'beekeeper' as StakeholderType,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    if (formData.password.length < 6) {
      alert('Password must be at least 6 characters!');
      return;
    }

    const stakeholder = registerStakeholder({
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      address: formData.address,
      password: formData.password,
      type: formData.type,
    });

    setUniqueId(stakeholder.uniqueId);
    setRegistered(true);
  };

  if (registered) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-amber-900 mb-2">Registration Successful!</h2>
          <p className="text-amber-700 mb-4">Your unique traceability ID has been generated:</p>
          <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 mb-6">
            <p className="text-sm text-amber-600 mb-1">Your Unique ID</p>
            <p className="text-2xl font-bold text-amber-900 font-mono">{uniqueId}</p>
          </div>
          <p className="text-sm text-amber-600 mb-6">
            ⚠️ Please save this ID. You'll need it along with your password to login.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 font-semibold transition-colors"
          >
            Proceed to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-amber-700 hover:text-amber-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🍯</span>
            </div>
            <h2 className="text-2xl font-bold text-amber-900">Register as Stakeholder</h2>
            <p className="text-amber-600 mt-1">Join the honey traceability network</p>
          </div>

          {/* Progress */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step >= s ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-400'
                }`}>
                  {s}
                </div>
                {s < 2 && <div className={`w-12 h-1 rounded ${step > s ? 'bg-amber-500' : 'bg-amber-100'}`} />}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-amber-800 mb-1">Stakeholder Type</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['beekeeper', 'trader', 'processor'] as StakeholderType[]).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData({ ...formData, type })}
                        className={`p-3 rounded-xl border-2 text-center transition-all ${
                          formData.type === type
                            ? 'border-amber-500 bg-amber-50 text-amber-900'
                            : 'border-gray-200 text-gray-500 hover:border-amber-300'
                        }`}
                      >
                        <div className="text-2xl mb-1">
                          {type === 'beekeeper' ? '🐝' : type === 'trader' ? '🔄' : '🏭'}
                        </div>
                        <div className="text-xs font-medium capitalize">{type}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-amber-800 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-amber-800 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-amber-800 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                    placeholder="your@email.com"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!formData.name || !formData.phone || !formData.email}
                  className="w-full py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                >
                  Continue
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-amber-800 mb-1">Address</label>
                  <textarea
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none resize-none"
                    rows={3}
                    placeholder="Full address with city, state, pincode"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-amber-800 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                    placeholder="Minimum 6 characters"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-amber-800 mb-1">Confirm Password</label>
                  <input
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                    placeholder="Re-enter password"
                  />
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 border-2 border-amber-300 text-amber-700 rounded-xl hover:bg-amber-50 font-semibold transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={!formData.address || !formData.password || !formData.confirmPassword}
                    className="flex-1 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Register
                  </button>
                </div>
              </div>
            )}
          </form>

          <p className="text-center text-sm text-amber-600 mt-6">
            Already registered?{' '}
            <button onClick={() => navigate('/login')} className="text-amber-700 font-semibold hover:underline">
              Login here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
