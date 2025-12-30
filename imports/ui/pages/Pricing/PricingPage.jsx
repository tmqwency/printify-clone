import React from "react";
import { Link } from "react-router-dom";
import Navigation from "../../components/Navigation";
import { FaCheck } from "react-icons/fa";

const PricingPage = () => {
  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for getting started",
      features: [
        "5 stores",
        "Unlimited product designs",
        "Premium products",
        "24/7 merchant support",
        "Manual order creation",
      ],
      cta: "Start for free",
      popular: false,
    },
    {
      name: "Premium",
      price: "$29",
      period: "per month",
      description: "Best for growing businesses",
      features: [
        "Everything in Free",
        "Up to 10 stores",
        "20% discount on all products",
        "Priority support",
        "Advanced analytics",
        "Custom branding",
      ],
      cta: "Start free trial",
      popular: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "contact us",
      description: "For large-scale operations",
      features: [
        "Everything in Premium",
        "Unlimited stores",
        "30% discount on all products",
        "Dedicated account manager",
        "API access",
        "White-label solution",
        "Custom integrations",
      ],
      cta: "Contact sales",
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* Hero */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600">
            Start for free, upgrade as you grow. No hidden fees.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`bg-white rounded-2xl shadow-lg overflow-hidden ${
                  plan.popular
                    ? "ring-2 ring-primary-500 transform scale-105"
                    : ""
                }`}
              >
                {plan.popular && (
                  <div className="bg-primary-500 text-white text-center py-2 text-sm font-semibold">
                    MOST POPULAR
                  </div>
                )}
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 mb-6">{plan.description}</p>
                  <div className="mb-6">
                    <span className="text-5xl font-bold text-gray-900">
                      {plan.price}
                    </span>
                    <span className="text-gray-600 ml-2">/ {plan.period}</span>
                  </div>
                  <Link
                    to="/signup"
                    className={`block w-full text-center py-3 rounded-lg font-semibold transition-colors ${
                      plan.popular
                        ? "bg-primary-500 text-white hover:bg-primary-600"
                        : "border-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                  <ul className="mt-8 space-y-4">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <FaCheck className="text-primary-500 mt-1 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {[
              {
                q: "Can I change plans later?",
                a: "Yes! You can upgrade or downgrade your plan at any time.",
              },
              {
                q: "What payment methods do you accept?",
                a: "We accept all major credit cards, PayPal, and bank transfers for Enterprise plans.",
              },
              {
                q: "Is there a free trial?",
                a: "The Free plan is available forever. Premium plans come with a 14-day free trial.",
              },
            ].map((faq, index) => (
              <div key={index} className="bg-white p-6 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default PricingPage;
