import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';

const PLANS = {
    free: {
        name: 'Free',
        price: 0,
        features: [
            '10 orders per month',
            '5 products',
            '1,000 API calls',
            '100 MB storage'
        ]
    },
    starter: {
        name: 'Starter',
        price: 29,
        features: [
            '100 orders per month',
            '50 products',
            '10,000 API calls',
            '1 GB storage'
        ]
    },
    pro: {
        name: 'Pro',
        price: 99,
        features: [
            '1,000 orders per month',
            '500 products',
            '100,000 API calls',
            '10 GB storage'
        ]
    },
    enterprise: {
        name: 'Enterprise',
        price: 299,
        features: [
            'Unlimited orders',
            'Unlimited products',
            'Unlimited API calls',
            'Unlimited storage'
        ]
    }
};

export const CheckoutPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(searchParams.get('plan') || 'starter');
    const [billingCycle, setBillingCycle] = useState('monthly');

    // Get current store from user context (you may need to adjust this based on your app structure)
    const storeId = Meteor.user()?.profile?.currentStoreId;

    const handleCheckout = async (planTier) => {
        if (!storeId) {
            toast.error('Please select a store first');
            return;
        }

        if (planTier === 'free') {
            toast.info('You are already on the free plan');
            return;
        }

        setLoading(true);

        try {
            const result = await Meteor.callAsync(
                'subscriptions.createCheckoutSession',
                storeId,
                planTier,
                billingCycle
            );

            // Redirect to Stripe Checkout
            window.location.href = result.url;
        } catch (error) {
            console.error('Checkout error:', error);
            toast.error(error.reason || 'Failed to create checkout session');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        Choose Your Plan
                    </h1>
                    <p className="text-xl text-gray-600">
                        Select the perfect plan for your business
                    </p>

                    {/* Billing Cycle Toggle */}
                    <div className="mt-8 flex justify-center items-center gap-4">
                        <span className={billingCycle === 'monthly' ? 'font-semibold' : 'text-gray-500'}>
                            Monthly
                        </span>
                        <button
                            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                            className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600"
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                                    billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                                }`}
                            />
                        </button>
                        <span className={billingCycle === 'yearly' ? 'font-semibold' : 'text-gray-500'}>
                            Yearly <span className="text-green-600 text-sm">(Save 20%)</span>
                        </span>
                    </div>
                </div>

                {/* Plans Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {Object.entries(PLANS).map(([tier, plan]) => {
                        const price = billingCycle === 'yearly' ? Math.floor(plan.price * 0.8) : plan.price;
                        const isPopular = tier === 'pro';

                        return (
                            <div
                                key={tier}
                                className={`relative bg-white rounded-lg shadow-lg p-8 ${
                                    isPopular ? 'ring-2 ring-blue-600' : ''
                                }`}
                            >
                                {isPopular && (
                                    <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2">
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-600 text-white">
                                            Popular
                                        </span>
                                    </div>
                                )}

                                <div className="text-center mb-8">
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                        {plan.name}
                                    </h3>
                                    <div className="mt-4">
                                        <span className="text-4xl font-bold text-gray-900">
                                            ${price}
                                        </span>
                                        {tier !== 'free' && (
                                            <span className="text-gray-600">
                                                /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <ul className="space-y-4 mb-8">
                                    {plan.features.map((feature, index) => (
                                        <li key={index} className="flex items-start">
                                            <svg
                                                className="h-6 w-6 text-green-500 mr-2 flex-shrink-0"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M5 13l4 4L19 7"
                                                />
                                            </svg>
                                            <span className="text-gray-700">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={() => handleCheckout(tier)}
                                    disabled={loading || tier === 'free'}
                                    className={`w-full py-3 px-6 rounded-lg font-semibold transition ${
                                        isPopular
                                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                                            : tier === 'free'
                                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                            : 'bg-gray-800 text-white hover:bg-gray-900'
                                    } disabled:opacity-50`}
                                >
                                    {loading ? 'Loading...' : tier === 'free' ? 'Current Plan' : 'Get Started'}
                                </button>
                            </div>
                        );
                    })}
                </div>

                {/* Back Button */}
                <div className="mt-12 text-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                        ← Back to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
};

// Success Page
export const CheckoutSuccessPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const [syncing, setSyncing] = useState(true);

    React.useEffect(() => {
        const syncSubscription = async () => {
            if (!sessionId) return;
            try {
                await Meteor.callAsync('subscriptions.syncFromSession', sessionId);
                toast.success('Subscription activated successfully!');
            } catch (error) {
                console.error('Sync error:', error);
                // Even if sync fails, the webhook might have worked, so just warn
                toast.warning('Subscription updated in background.');
            } finally {
                setSyncing(false);
            }
        };

        syncSubscription();
    }, [sessionId]);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                {syncing ? (
                    <div className="py-12">
                         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto mb-4"></div>
                         <p className="text-gray-600">Finalizing your subscription...</p>
                    </div>
                ) : (
                    <>
                        <div className="mb-6">
                            <svg
                                className="mx-auto h-16 w-16 text-green-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">
                            Payment Successful!
                        </h1>
                        <p className="text-gray-600 mb-8">
                            Your subscription has been activated. You can now enjoy all the features of your plan.
                        </p>
                        <button
                            onClick={() => navigate('/dashboard/billing')}
                            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition"
                        >
                            Go to Billing
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

// Cancel Page
export const CheckoutCancelPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                <div className="mb-6">
                    <svg
                        className="mx-auto h-16 w-16 text-yellow-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                    </svg>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    Payment Cancelled
                </h1>
                <p className="text-gray-600 mb-8">
                    Your payment was cancelled. No charges were made to your account.
                </p>
                <div className="space-y-4">
                    <button
                        onClick={() => navigate('/subscription/checkout')}
                        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition"
                    >
                        Try Again
                    </button>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
};
