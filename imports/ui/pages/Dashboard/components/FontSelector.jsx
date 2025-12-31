import React, { useState } from 'react';
import { FaFont, FaBold, FaItalic, FaUnderline, FaAlignLeft, FaAlignCenter, FaAlignRight, FaAlignJustify } from 'react-icons/fa';

// Popular Google Fonts list
const GOOGLE_FONTS = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Oswald',
  'Raleway',
  'Poppins',
  'Playfair Display',
  'Merriweather',
  'Bebas Neue',
  'Dancing Script',
  'Pacifico',
  'Righteous',
  'Permanent Marker',
  'Lobster',
  'Abril Fatface',
  'Comfortaa',
  'Quicksand',
  'Nunito',
  'Ubuntu',
  'PT Sans',
  'Crimson Text',
  'Indie Flower',
  'Shadows Into Light',
  'Caveat',
  'Satisfy',
  'Great Vibes',
  'Amatic SC',
  'Architects Daughter',
];

const FONT_WEIGHTS = [
  { value: '300', label: 'Light' },
  { value: '400', label: 'Regular' },
  { value: '600', label: 'Semibold' },
  { value: '700', label: 'Bold' },
  { value: '900', label: 'Black' },
];

const FontSelector = ({ 
  selectedFont = 'Inter',
  selectedWeight = '400',
  fontSize = 24,
  textColor = '#000000',
  textAlign = 'left',
  letterSpacing = 0,
  lineHeight = 1.2,
  isBold = false,
  isItalic = false,
  isUnderline = false,
  onFontChange,
  onWeightChange,
  onSizeChange,
  onColorChange,
  onAlignChange,
  onLetterSpacingChange,
  onLineHeightChange,
  onBoldToggle,
  onItalicToggle,
  onUnderlineToggle,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFontDropdown, setShowFontDropdown] = useState(false);

  const filteredFonts = GOOGLE_FONTS.filter(font =>
    font.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Font Family Selector */}
      <div>
        <label className="text-xs font-medium text-gray-700 mb-1 block">
          Font Family
        </label>
        <div className="relative">
          <button
            onClick={() => setShowFontDropdown(!showFontDropdown)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-left bg-white hover:border-primary-500 transition-colors flex items-center justify-between"
            style={{ fontFamily: selectedFont }}
          >
            <span className="truncate">{selectedFont}</span>
            <FaFont className="text-gray-400 ml-2" />
          </button>
          
          {showFontDropdown && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-hidden">
              <div className="p-2 border-b border-gray-200">
                <input
                  type="text"
                  placeholder="Search fonts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="overflow-y-auto max-h-48">
                {filteredFonts.map((font) => (
                  <button
                    key={font}
                    onClick={() => {
                      onFontChange(font);
                      setShowFontDropdown(false);
                      setSearchTerm('');
                    }}
                    className={`w-full px-3 py-2 text-left hover:bg-primary-50 transition-colors ${
                      selectedFont === font ? 'bg-primary-100' : ''
                    }`}
                    style={{ fontFamily: font }}
                  >
                    {font}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Font Weight */}
      <div>
        <label className="text-xs font-medium text-gray-700 mb-1 block">
          Font Weight
        </label>
        <select
          value={selectedWeight}
          onChange={(e) => onWeightChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          {FONT_WEIGHTS.map((weight) => (
            <option key={weight.value} value={weight.value}>
              {weight.label}
            </option>
          ))}
        </select>
      </div>

      {/* Font Size and Color */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">
            Size
          </label>
          <input
            type="number"
            value={fontSize}
            onChange={(e) => onSizeChange(Number(e.target.value))}
            className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            min="8"
            max="200"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">
            Color
          </label>
          <input
            type="color"
            value={textColor}
            onChange={(e) => onColorChange(e.target.value)}
            className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      {/* Text Formatting */}
      <div>
        <label className="text-xs font-medium text-gray-700 mb-1 block">
          Formatting
        </label>
        <div className="flex gap-1">
          <button
            onClick={onBoldToggle}
            className={`flex-1 p-2 border rounded-lg transition-colors ${
              isBold
                ? 'bg-primary-500 text-white border-primary-500'
                : 'border-gray-300 hover:bg-gray-100'
            }`}
            title="Bold"
          >
            <FaBold className="mx-auto" />
          </button>
          <button
            onClick={onItalicToggle}
            className={`flex-1 p-2 border rounded-lg transition-colors ${
              isItalic
                ? 'bg-primary-500 text-white border-primary-500'
                : 'border-gray-300 hover:bg-gray-100'
            }`}
            title="Italic"
          >
            <FaItalic className="mx-auto" />
          </button>
          <button
            onClick={onUnderlineToggle}
            className={`flex-1 p-2 border rounded-lg transition-colors ${
              isUnderline
                ? 'bg-primary-500 text-white border-primary-500'
                : 'border-gray-300 hover:bg-gray-100'
            }`}
            title="Underline"
          >
            <FaUnderline className="mx-auto" />
          </button>
        </div>
      </div>

      {/* Text Alignment */}
      <div>
        <label className="text-xs font-medium text-gray-700 mb-1 block">
          Alignment
        </label>
        <div className="flex gap-1">
          <button
            onClick={() => onAlignChange('left')}
            className={`flex-1 p-2 border rounded-lg transition-colors ${
              textAlign === 'left'
                ? 'bg-primary-500 text-white border-primary-500'
                : 'border-gray-300 hover:bg-gray-100'
            }`}
            title="Align Left"
          >
            <FaAlignLeft className="mx-auto" />
          </button>
          <button
            onClick={() => onAlignChange('center')}
            className={`flex-1 p-2 border rounded-lg transition-colors ${
              textAlign === 'center'
                ? 'bg-primary-500 text-white border-primary-500'
                : 'border-gray-300 hover:bg-gray-100'
            }`}
            title="Align Center"
          >
            <FaAlignCenter className="mx-auto" />
          </button>
          <button
            onClick={() => onAlignChange('right')}
            className={`flex-1 p-2 border rounded-lg transition-colors ${
              textAlign === 'right'
                ? 'bg-primary-500 text-white border-primary-500'
                : 'border-gray-300 hover:bg-gray-100'
            }`}
            title="Align Right"
          >
            <FaAlignRight className="mx-auto" />
          </button>
          <button
            onClick={() => onAlignChange('justify')}
            className={`flex-1 p-2 border rounded-lg transition-colors ${
              textAlign === 'justify'
                ? 'bg-primary-500 text-white border-primary-500'
                : 'border-gray-300 hover:bg-gray-100'
            }`}
            title="Justify"
          >
            <FaAlignJustify className="mx-auto" />
          </button>
        </div>
      </div>

      {/* Letter Spacing */}
      <div>
        <label className="text-xs font-medium text-gray-700 mb-1 block">
          Letter Spacing: {letterSpacing}px
        </label>
        <input
          type="range"
          value={letterSpacing}
          onChange={(e) => onLetterSpacingChange(Number(e.target.value))}
          min="-5"
          max="20"
          step="0.5"
          className="w-full"
        />
      </div>

      {/* Line Height */}
      <div>
        <label className="text-xs font-medium text-gray-700 mb-1 block">
          Line Height: {lineHeight}
        </label>
        <input
          type="range"
          value={lineHeight}
          onChange={(e) => onLineHeightChange(Number(e.target.value))}
          min="0.8"
          max="3"
          step="0.1"
          className="w-full"
        />
      </div>
    </div>
  );
};

export default FontSelector;
