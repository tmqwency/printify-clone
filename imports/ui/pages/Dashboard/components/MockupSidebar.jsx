
import React from 'react';
import { Stage, Layer, Image as KonvaImage, Rect } from 'react-konva';
import { FaPlus } from 'react-icons/fa';

const SidebarPreview = ({ 
  viewName, 
  mockupImage, 
  designImage, 
  isActive, 
  onClick,
  width = 120,
  height = 120
}) => {
  return (
    <div 
      className={`flex flex-col items-center cursor-pointer transition-all ${
        isActive ? 'opacity-100 scale-105' : 'opacity-70 hover:opacity-100'
      }`}
      onClick={onClick}
    >
      <div className={`relative bg-white rounded-lg shadow-sm border-2 overflow-hidden ${
        isActive ? 'border-primary-500' : 'border-transparent hover:border-gray-200'
      }`}
      style={{ width, height }}
      >
        {/* Mockup Preview using standard img tag for performance if static, but using Canvas for composition */}
        {/* Simply using the composite image as src */}
        {designImage ? (
            <img 
                src={designImage} 
                className="w-full h-full object-cover" 
                alt={`${viewName} preview`}
            />
        ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-400">
                <span className="text-xs">Generating...</span>
            </div>
        )}
      </div>
      <span className={`text-xs mt-2 font-medium capitalize ${
        isActive ? 'text-primary-600' : 'text-gray-600'
      }`}>
        {viewName}
      </span>
    </div>
  );
};

const MockupSidebar = ({
  views = [],
  activeView,
  onViewSelect,
  previews = {},
  isGenerating = false
}) => {
  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full right-sidebar shadow-lg z-20">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center">
        <h3 className="font-bold text-gray-800">Mockup view</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-2 gap-x-4 gap-y-8">
          {views.map((view) => (
            <SidebarPreview
              key={view.id}
              viewName={view.name}
              mockupImage={view.image}
              designImage={previews[view.name] || view.image} // Use generated preview or fallback to empty mockup
              isActive={activeView === view.id}
              onClick={() => onViewSelect(view)}
            />
          ))}
          
          {/* Placeholder for "Show more" to mimic Printify UI */}
          <div className="col-span-2 flex justify-center pt-2">
             <button className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors">
                 <FaPlus size={12} /> Show more
             </button>
          </div>
        </div>

        {/* Color Options Placeholder */}
        <div className="mt-8">
            <h4 className="font-bold text-sm text-gray-900 mb-2">Mockup color mode <a href="#" className="text-gray-400 font-normal ml-1 hover:underline">Learn more</a></h4>
            <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="colorMode" className="text-primary-600" />
                    <span className="text-sm text-gray-700">Realistic (CMYK)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="colorMode" className="text-primary-600" defaultChecked />
                    <span className="text-sm text-gray-700">Bright/colourful (RGB)</span>
                </label>
            </div>
        </div>
        
         {/* Colors Placeholder */}
         <div className="mt-6">
            <h4 className="font-bold text-sm text-gray-900 mb-2">Colors</h4>
             <div className="w-8 h-8 rounded-full border border-gray-300 bg-white cursor-pointer relative">
                 {/* Selected indicator */}
             </div>
        </div>

         {/* Background Placeholder */}
         <div className="mt-6">
            <h4 className="font-bold text-sm text-gray-900 mb-2">Mockup background</h4>
             <button className="w-full py-2 px-3 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left flex justify-between items-center">
                 <span>White</span>
             </button>
        </div>
      </div>
      
      <div className="p-4 border-t border-gray-200 bg-gray-50">
           <button className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-3 rounded-lg transition-colors shadow-sm">
               Save product
           </button>
      </div>
    </div>
  );
};

export default MockupSidebar;
