import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUpload, FaFont, FaShapes, FaImages, FaSave, FaTimes, FaBox, FaArrowLeft } from 'react-icons/fa';

const CollapsibleSidebar = ({
  // ... existing props ...
  selectedProduct,
  onShapeAdd,
  textInput,
  setTextInput,
  fontFamily,
  fontWeight,
  fontSize,
  textColor,
  textAlign,
  letterSpacing,
  lineHeight,
  isBold,
  isItalic,
  isUnderline,
  setFontFamily,
  setFontWeight,
  setFontSize,
  setTextColor,
  setTextAlign,
  setLetterSpacing,
  setLineHeight,
  setIsBold,
  setIsItalic,
  setIsUnderline,
  addTextToCanvas,
  designs,
  activeLibraryTab,
  setActiveLibraryTab,
  fileInputRef,
  handleFileUpload,
  addDesignToCanvas,
  addStockImageToCanvas,
  productName,
  setProductName,
  saveCustomProduct,
  isSaving,
  editingProductId,
  ShapesPanel,
  FontSelector,
  StockImagesPanel,
}) => {
  const [activePanel, setActivePanel] = useState(null);
  const navigate = useNavigate();

  const sidebarItems = [
    { id: 'product', icon: FaBox, label: 'Product', show: !!selectedProduct },
    { id: 'shapes', icon: FaShapes, label: 'Shapes' },
    { id: 'text', icon: FaFont, label: 'Text' },
    { id: 'library', icon: FaImages, label: 'Images' },
    { id: 'save', icon: FaSave, label: 'Save' },
  ];

  const togglePanel = (panelId) => {
    setActivePanel(activePanel === panelId ? null : panelId);
  };

  return (
    <div className="flex h-full">
      {/* Icon Sidebar */}
      <div className="w-16 bg-gray-800 flex flex-col items-center py-4 justify-between z-20 relative">
        <div className="flex flex-col items-center space-y-2 w-full">
          {sidebarItems.map((item) => {
            if (item.show === false) return null;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => togglePanel(item.id)}
                className={`w-12 h-12 flex flex-col items-center justify-center rounded-lg transition-colors ${
                  activePanel === item.id
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
                title={item.label}
              >
                <Icon className="text-xl mb-1" />
                <span className="text-xs">{item.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Back Button */}
        <button
          onClick={() => navigate("/dashboard/products")}
          className="w-12 h-12 flex flex-col items-center justify-center rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white transition-colors mb-2"
          title="Back to Products"
        >
          <FaArrowLeft className="text-xl mb-1" />
          <span className="text-xs">Exit</span>
        </button>
      </div>

      {/* Expandable Panel */}
      {activePanel && (
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            {/* Panel Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {sidebarItems.find(item => item.id === activePanel)?.label}
              </h2>
              <button
                onClick={() => setActivePanel(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <FaTimes className="text-gray-500" />
              </button>
            </div>

            {/* Panel Content */}
            {activePanel === 'product' && selectedProduct && (
              <div className="border-2 border-gray-200 rounded-lg p-3">
                <img
                  src={selectedProduct.productImage}
                  alt={selectedProduct.name}
                  className="w-full h-32 object-cover rounded-lg mb-2"
                />
                <h3 className="text-sm font-bold text-gray-900 mb-1">
                  {selectedProduct.name}
                </h3>
                {selectedProduct.description && (
                  <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                    {selectedProduct.description}
                  </p>
                )}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 uppercase">
                    {selectedProduct.type}
                  </span>
                  <span className="text-sm font-bold text-primary-600">
                    ${(selectedProduct.basePrice / 100).toFixed(2)}
                  </span>
                </div>
                {selectedProduct.printArea && (
                  <div className="text-xs text-gray-600 bg-gray-50 rounded p-2">
                    <p className="font-medium text-gray-700 mb-1">Print Area:</p>
                    <p>
                      {selectedProduct.printArea.width}px × {selectedProduct.printArea.height}px
                    </p>
                  </div>
                )}
              </div>
            )}

            {activePanel === 'shapes' && (
              <ShapesPanel onShapeAdd={onShapeAdd} />
            )}

            {activePanel === 'text' && (
              <div>
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Enter text..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 text-sm focus:ring-2 focus:ring-primary-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addTextToCanvas();
                    }
                  }}
                />
                
                <FontSelector
                  selectedFont={fontFamily}
                  selectedWeight={fontWeight}
                  fontSize={fontSize}
                  textColor={textColor}
                  textAlign={textAlign}
                  letterSpacing={letterSpacing}
                  lineHeight={lineHeight}
                  isBold={isBold}
                  isItalic={isItalic}
                  isUnderline={isUnderline}
                  onFontChange={setFontFamily}
                  onWeightChange={setFontWeight}
                  onSizeChange={setFontSize}
                  onColorChange={setTextColor}
                  onAlignChange={setTextAlign}
                  onLetterSpacingChange={setLetterSpacing}
                  onLineHeightChange={setLineHeight}
                  onBoldToggle={() => setIsBold(!isBold)}
                  onItalicToggle={() => setIsItalic(!isItalic)}
                  onUnderlineToggle={() => setIsUnderline(!isUnderline)}
                />
                
                <button
                  onClick={addTextToCanvas}
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors mt-3 text-sm"
                >
                  Add Text to Canvas
                </button>
              </div>
            )}

            {activePanel === 'library' && (
              <div>
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setActiveLibraryTab("uploads")}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      activeLibraryTab === "uploads"
                        ? "bg-primary-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    My Uploads
                  </button>
                  <button
                    onClick={() => setActiveLibraryTab("stock")}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      activeLibraryTab === "stock"
                        ? "bg-primary-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Stock Images
                  </button>
                </div>

                {activeLibraryTab === "uploads" && (
                  <>
                    <button
                      onClick={() => fileInputRef.current.click()}
                      className="w-full flex items-center justify-center gap-2 bg-primary-500 text-white px-3 py-2 rounded-lg hover:bg-primary-600 transition-colors text-xs mb-3"
                    >
                      <FaUpload />
                      Upload Design
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    
                    <div className="space-y-2">
                      {designs.map((design) => (
                        <div
                          key={design.id}
                          className="border border-gray-200 rounded-lg p-2 cursor-pointer hover:border-primary-500 transition-colors"
                          onClick={() => addDesignToCanvas(design)}
                        >
                          <img
                            src={design.src}
                            alt={design.name}
                            className="w-full h-20 object-contain bg-gray-50 rounded mb-1"
                          />
                          <p className="text-xs text-gray-700 truncate">
                            {design.name}
                          </p>
                        </div>
                      ))}
                      {designs.length === 0 && (
                        <div className="text-center py-8">
                          <p className="text-gray-500 text-xs mb-2">Nothing here yet</p>
                          <p className="text-gray-400 text-xs">
                            Your design files will appear here once added.
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {activeLibraryTab === "stock" && (
                  <StockImagesPanel onImageSelect={addStockImageToCanvas} />
                )}
              </div>
            )}

            {activePanel === 'save' && (
              <div>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Product name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 text-sm focus:ring-2 focus:ring-primary-500"
                />
                <button
                  onClick={saveCustomProduct}
                  disabled={isSaving}
                  className={`w-full py-3 rounded-lg transition-colors font-semibold text-sm ${
                    isSaving
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-primary-500 text-white hover:bg-primary-600"
                  }`}
                >
                  {isSaving
                    ? "Saving..."
                    : editingProductId
                    ? "Update Product"
                    : "Save Product"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CollapsibleSidebar;
