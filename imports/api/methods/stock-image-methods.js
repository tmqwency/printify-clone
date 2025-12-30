import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { HTTP } from 'meteor/http';

const PIXABAY_API_KEY = Meteor.settings.private?.pixabayApiKey || '53960464-d8064365c2d3d5893b41323ef';

Meteor.methods({
    async 'stockImages.search'(query, page = 1) {
        check(query, String);
        check(page, Number);

        console.log('Stock image search called:', { query, page, userId: this.userId });

        if (!this.userId) {
            throw new Meteor.Error('not-authorized', 'You must be logged in');
        }

        if (!query.trim()) {
            throw new Meteor.Error('invalid-query', 'Search query cannot be empty');
        }

        try {
            console.log('Making Pixabay API request...');

            // Make the HTTP request
            const url = `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(query)}&page=${page}&per_page=20&image_type=photo&safesearch=true`;
            console.log('Request URL:', url);

            const response = await fetch(url);
            const data = await response.json();

            console.log('Response received - totalHits:', data.totalHits);

            const result = {
                images: data.hits.map(img => ({
                    id: img.id,
                    url: img.largeImageURL,
                    thumbnail: img.previewURL,
                    author: img.user,
                    authorUrl: `https://pixabay.com/users/${img.user}-${img.user_id}/`,
                })),
                total: data.totalHits,
                totalPages: Math.ceil(data.totalHits / 20),
            };

            console.log('Returning', result.images.length, 'images');
            return result;
        } catch (error) {
            console.error('Pixabay API error:', error.message);
            throw new Meteor.Error('api-error', `Failed to fetch stock images: ${error.message}`);
        }
    },
});
