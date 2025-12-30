import React, { useState, useEffect } from "react";
import { Meteor } from "meteor/meteor";
import { FaSearch, FaSpinner } from "react-icons/fa";
import { toast } from "react-toastify";

const StockImagesPanel = ({ onImageSelect }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  // Load random popular images on mount
  useEffect(() => {
    const randomTopics = [
      "nature",
      "business",
      "technology",
      "abstract",
      "people",
      "food",
    ];
    const randomTopic =
      randomTopics[Math.floor(Math.random() * randomTopics.length)];

    setLoading(true);
    Meteor.call("stockImages.search", randomTopic, 1, (error, result) => {
      setLoading(false);
      if (!error && result) {
        setImages(result.images);
      }
    });
  }, []);

  const handleSearch = (newPage = 1) => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a search term");
      return;
    }

    console.log("Searching for:", searchQuery, "page:", newPage);
    setLoading(true);
    Meteor.call("stockImages.search", searchQuery, newPage, (error, result) => {
      setLoading(false);
      if (error) {
        console.error("Search error:", error);
        toast.error(
          `Failed to search images: ${error.reason || error.message}`
        );
      } else {
        console.log("Search results:", result);
        setImages(result.images);
        setPage(newPage);
        toast.success(`Found ${result.total} images!`);
      }
    });
  };

  const handleImageClick = (image) => {
    // Add image to canvas
    onImageSelect(image.url);
    toast.success("Image added to canvas!");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Fixed search bar */}
      <div className="flex-shrink-0 mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search stock images..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
          />
          <button
            onClick={() => handleSearch()}
            disabled={loading}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors"
          >
            {loading ? <FaSpinner className="animate-spin" /> : <FaSearch />}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Images from Pixabay - Free to use
        </p>
      </div>

      {/* Scrollable images area */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 gap-2">
          {images.map((image) => (
            <div
              key={image.id}
              onClick={() => handleImageClick(image)}
              className="cursor-pointer border border-gray-200 rounded-lg overflow-hidden hover:border-primary-500 hover:shadow-md transition-all"
            >
              <img
                src={image.thumbnail}
                alt="Stock"
                className="w-full h-32 object-cover"
              />
              <div className="p-1 bg-gray-50">
                <p className="text-xs text-gray-600 truncate">
                  by {image.author}
                </p>
              </div>
            </div>
          ))}
        </div>

        {images.length === 0 && !loading && (
          <div className="text-center text-gray-500 py-8">
            <FaSearch className="text-4xl mx-auto mb-2 opacity-50" />
            <p>Search for images to get started</p>
            <p className="text-xs mt-1">Try "nature", "business", "abstract"</p>
          </div>
        )}

        {loading && (
          <div className="text-center text-gray-500 py-8">
            <FaSpinner className="text-4xl mx-auto mb-2 animate-spin" />
            <p>Searching...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockImagesPanel;
