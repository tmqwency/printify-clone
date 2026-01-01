
const { Subscriptions } = require('/imports/api/collections/subscriptions');

async function debugState() {
    const user = await Meteor.users.findOneAsync({});
    if (!user) return "No user found";
    
    const sub = await Subscriptions.findOneAsync({ userId: user._id });
    if (!sub) return "No subscription found";

    let result = "User ID: " + user._id + "\n";
    result += "Limits: " + JSON.stringify(sub.limits) + "\n";
    result += "Warnings Sent: " + JSON.stringify(sub.usage.warningsSent) + "\n";
    
    const metrics = [
        { id: 'orders', name: 'Orders', val: sub.usage.ordersThisMonth || 0, max: sub.limits.maxOrders },
        { id: 'products', name: 'Products', val: sub.usage.productsCreated || 0, max: sub.limits.maxProducts },
        { id: 'storage', name: 'Storage', val: sub.usage.storageUsedMB || 0, max: sub.limits.maxStorageMB }
    ];
    
    metrics.forEach(m => {
        if (m.max === -1) {
             result += `${m.name}: Unlimited (Val: ${m.val})\n`;
             return;
        }
        const pct = m.val / m.max;
        const threshold = 0.75;
        const isOver = pct >= threshold;
        const warned = sub.usage.warningsSent?.[m.id];
        
        result += `${m.name}: ${m.val}/${m.max} (${(pct*100).toFixed(1)}%) - Over: ${isOver}, Warned: ${warned}\n`;
    });
    return result;
}

debugState().then(r => console.log(r));
