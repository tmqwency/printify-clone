import { Meteor } from 'meteor/meteor';
import fs from 'fs';
import path from 'path';

/**
 * Save a base64 image to the public/uploads directory
 * @param {string} base64Data - Base64 encoded image data
 * @param {string} filename - Desired filename (without extension)
 * @returns {string} - Public URL path to the saved image
 */
export const saveImageToFile = (base64Data, filename) => {
    try {
        // Remove data URL prefix if present
        const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, '');

        // Create uploads directory in public folder
        const publicDir = path.join(process.cwd().split('.meteor')[0], 'public', 'uploads');
        if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir, { recursive: true });
        }

        // Generate unique filename with timestamp
        const timestamp = Date.now();
        const imageFilename = `${filename}_${timestamp}.jpg`;
        const filepath = path.join(publicDir, imageFilename);

        // Convert base64 to buffer and save
        const imageBuffer = Buffer.from(base64Image, 'base64');
        fs.writeFileSync(filepath, imageBuffer);

        console.log(`Image saved: ${filepath}`);

        // Return public URL path
        return `/uploads/${imageFilename}`;
    } catch (error) {
        console.error('Error saving image:', error);
        throw new Meteor.Error('file-save-error', 'Failed to save image file: ' + error.message);
    }
};

/**
 * Delete an image file from the uploads directory
 * @param {string} imagePath - Public URL path to the image
 */
export const deleteImageFile = (imagePath) => {
    if (imagePath && imagePath.startsWith('/uploads/')) {
        try {
            const filename = path.basename(imagePath);
            const publicDir = path.join(process.cwd().split('.meteor')[0], 'public', 'uploads');
            const filepath = path.join(publicDir, filename);

            if (fs.existsSync(filepath)) {
                fs.unlinkSync(filepath);
                console.log(`Image deleted: ${filepath}`);
            }
        } catch (error) {
            console.error('Error deleting image:', error);
        }
    }
};
