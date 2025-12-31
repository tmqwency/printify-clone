import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { toast } from 'react-toastify';

export const SubscriptionManagement = ({ storeId }) => {
    const [loading, setLoading] = useState(false);
    const [subscription, setSubscription] = useState(null);

    // Fetch subscription data
    useEffect(() => {
        if (!storeId) return;

        Meteor.call('subscriptions.get', storeId, (error, result) => {
            if (error) {
                console.error('Error fetching subscription:', error);
            } else {
                setSubscription(result);
            }
        });
    }, [storeId]);

    const handleOpenPortal = async () => {
        if (!storeId) {
            toast.error('No store selected');
            return;
        }

        setLoading(true);

        try {
            const result = await Meteor.callAsync('subscriptions.createPortalSession', storeId);
            // Redirect to Stripe Customer Portal
            window.location.href = result.url;
        } catch (error) {
            console.error('Portal error:', error);
            toast.error(error.reason || 'Failed to open billing portal');
            setLoading(false);
        }
    };

    const handleCancelSubscription = async () => {
        if (!confirm('Are you sure you want to cancel your subscription?')) {
            return;
        }

        setLoading(true);

        try {
            await Meteor.callAsync('subscriptions.cancel', storeId, false);
            toast.success('Subscription will be cancelled at the end of the billing period');
            
            // Refresh subscription data
            const result = await Meteor.callAsync('subscriptions.get', storeId);
            setSubscription(result);
        } catch (error) {
            console.error('Cancel error:', error);
            toast.error(error.reason || 'Failed to cancel subscription');
        } finally {
            setLoading(false);
        }
    };

    if (!subscription) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
            </div>
        );
    }

    const planDetails = subscription.planDetails || {};
    const isActive = subscription.status === 'active';
    const isCancelled = subscription.cancelAtPeriodEnd;

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Subscription</h2>
                <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                        isActive
                            ? 'bg-green-100 text-green-800'
                            : subscription.status === 'trialing'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                    }`}
                >
                    {subscription.status}
                </span>
            </div>

            {/* Current Plan */}
            <div className="mb-6">
                <div className="flex items-baseline gap-2 mb-2">
                    <h3 className="text-3xl font-bold text-gray-900">
                        {planDetails.name || subscription.planTier}
                    </h3>
                    {planDetails.price > 0 && (
                        <span className="text-xl text-gray-600">
                            ${planDetails.price / 100}/{subscription.billingCycle === 'monthly' ? 'mo' : 'yr'}
                        </span>
                    )}
                </div>

                {isCancelled && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                        <p className="text-yellow-800 text-sm">
                            ⚠️ Your subscription will be cancelled on{' '}
                            {subscription.currentPeriodEnd
                                ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                                : 'the end of the billing period'}
                        </p>
                    </div>
                )}

                {subscription.currentPeriodEnd && !isCancelled && (
                    <p className="text-gray-600 text-sm">
                        Next billing date:{' '}
                        {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                    </p>
                )}
            </div>

            {/* Plan Limits */}
            <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Plan Limits</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Orders</p>
                        <p className="text-lg font-semibold text-gray-900">
                            {subscription.limits.maxOrders === -1
                                ? 'Unlimited'
                                : subscription.limits.maxOrders}
                        </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Products</p>
                        <p className="text-lg font-semibold text-gray-900">
                            {subscription.limits.maxProducts === -1
                                ? 'Unlimited'
                                : subscription.limits.maxProducts}
                        </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">API Calls</p>
                        <p className="text-lg font-semibold text-gray-900">
                            {subscription.limits.maxApiCalls === -1
                                ? 'Unlimited'
                                : subscription.limits.maxApiCalls.toLocaleString()}
                        </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Storage</p>
                        <p className="text-lg font-semibold text-gray-900">
                            {subscription.limits.maxStorageMB === -1
                                ? 'Unlimited'
                                : `${subscription.limits.maxStorageMB} MB`}
                        </p>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
                {subscription.stripeCustomerId && (
                    <button
                        onClick={handleOpenPortal}
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                    >
                        {loading ? 'Loading...' : 'Manage Billing'}
                    </button>
                )}

                {subscription.planTier !== 'free' && !isCancelled && (
                    <button
                        onClick={handleCancelSubscription}
                        disabled={loading}
                        className="w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition disabled:opacity-50"
                    >
                        Cancel Subscription
                    </button>
                )}

                {subscription.planTier === 'free' && (
                    <a
                        href="/subscription/checkout"
                        className="block w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition text-center"
                    >
                        Upgrade Plan
                    </a>
                )}
            </div>
        </div>
    );
};

export default SubscriptionManagement;
