import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';

/**
 * Custom hook to fetch products from the catalog
 */
export const useProducts = () => {
    return useTracker(() => {
        const handle = Meteor.subscribe('catalog.products');
        const loading = !handle.ready();

        return {
            products: [],
            loading
        };
    }, []);
};

/**
 * Custom hook to call Meteor methods
 */
export const useMeteorCall = () => {
    const call = async (method, ...args) => {
        return new Promise((resolve, reject) => {
            Meteor.call(method, ...args, (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            });
        });
    };

    return { call };
};
