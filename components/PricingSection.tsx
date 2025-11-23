'use client';

import { Check, Star } from 'lucide-react';

const pricingPlans = [
  {
    name: 'Harian',
    price: '150K',
    period: 'per jam',
    description: 'Perfect untuk main sesekali',
    features: [
      'Akses semua lapangan',
      'Peralatan gratis',
      'Air mineral gratis',
      'Parkir gratis'
    ],
    color: 'from-gray-500 to-gray-600',
    popular: false
  },
  {
    name: 'Mingguan',
    price: '1.2JT',
    period: 'per minggu',
    description: 'Hemat untuk rutin bermain',
    features: [
      'Semua fitur Harian',
      'Diskon 15%',
      'Priority booking',
      'Loker pribadi',
      'Shower gratis'
    ],
    color: 'from-orange-500 to-red-500',
    popular: true
  },
  {
    name: 'Bulanan',
    price: '4.5JT',
    period: 'per bulan',
    description: 'Solusi terbaik untuk atlet',
    features: [
      'Semua fitur Mingguan',
      'Diskon 25%',
      'Personal trainer',
      'Akses gym gratis',
      'Tournament gratis'
    ],
    color: 'from-emerald-500 to-green-600',
    popular: false
  }
];

export default function PricingSection() {
  return (
    <section id="pricing" className="py-20 bg-[#333333]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Pricing <span className="bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">Plans</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Choose the package that suits your needs and budget. All packages include full facilities!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-[#404040] rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-white/5 ${
                plan.popular ? 'ring-2 ring-orange-500 transform scale-105 z-10' : 'hover:border-white/20'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-2 rounded-b-2xl flex items-center space-x-1 shadow-lg">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="font-semibold text-sm">MOST POPULAR</span>
                  </div>
                </div>
              )}

              <div className="p-8">
                <div className={`inline-flex p-3 rounded-2xl bg-gradient-to-r ${plan.color} mb-6 shadow-lg`}>
                  <div className="text-white font-bold text-lg">
                    {plan.name.charAt(0)}
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-white mb-2">
                  {plan.name}
                </h3>
                
                <p className="text-gray-400 mb-6">
                  {plan.description}
                </p>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-white">
                    {plan.price}
                  </span>
                  <span className="text-gray-400 ml-2">
                    {plan.period}
                  </span>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center space-x-3">
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-r ${plan.color} flex items-center justify-center`}>
                        <Check className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full py-4 px-6 rounded-xl font-semibold transition-all ${
                    plan.popular
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:shadow-lg hover:shadow-orange-500/20'
                      : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                  }`}
                >
                  {plan.popular ? 'Select Plan' : 'Choose Plan'}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-400 mb-4">
            Need a custom package for a team or tournament?
          </p>
          <button className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg hover:shadow-blue-500/20 transition-all">
            Contact Support
          </button>
        </div>
      </div>
    </section>
  );
}