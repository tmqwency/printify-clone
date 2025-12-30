import React from "react";
import Navigation from "./Navigation";

const GenericPage = ({ title, subtitle, content }) => {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">{title}</h1>
          {subtitle && (
            <p className="text-xl text-gray-600 mb-12">{subtitle}</p>
          )}
          <div className="prose prose-lg max-w-none">{content}</div>
        </div>
      </section>
    </div>
  );
};

export default GenericPage;
