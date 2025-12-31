import React from 'react';
import { FaSquare, FaCircle, FaMinus, FaArrowRight, FaStar, FaShapes } from 'react-icons/fa';

const ShapesPanel = ({ onShapeAdd }) => {
  const shapes = [
    {
      id: 'rectangle',
      name: 'Rectangle',
      icon: FaSquare,
      defaultProps: {
        width: 150,
        height: 100,
        fill: '#3B82F6',
        stroke: '#1E40AF',
        strokeWidth: 2,
      },
    },
    {
      id: 'circle',
      name: 'Circle',
      icon: FaCircle,
      defaultProps: {
        radius: 75,
        fill: '#10B981',
        stroke: '#059669',
        strokeWidth: 2,
      },
    },
    {
      id: 'line',
      name: 'Line',
      icon: FaMinus,
      defaultProps: {
        points: [0, 0, 150, 0],
        stroke: '#000000',
        strokeWidth: 3,
      },
    },
    {
      id: 'arrow',
      name: 'Arrow',
      icon: FaArrowRight,
      defaultProps: {
        points: [0, 0, 150, 0],
        stroke: '#000000',
        strokeWidth: 3,
        pointerLength: 10,
        pointerWidth: 10,
      },
    },
    {
      id: 'star',
      name: 'Star',
      icon: FaStar,
      defaultProps: {
        numPoints: 5,
        innerRadius: 30,
        outerRadius: 60,
        fill: '#F59E0B',
        stroke: '#D97706',
        strokeWidth: 2,
      },
    },
  ];

  const handleShapeClick = (shape) => {
    const newShape = {
      id: `${shape.id}-${Date.now()}`,
      type: shape.id,
      x: 50,
      y: 50,
      ...shape.defaultProps,
    };
    onShapeAdd(newShape);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <FaShapes className="text-gray-700" />
        <h3 className="text-sm font-semibold text-gray-900">Shapes</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {shapes.map((shape) => {
          const Icon = shape.icon;
          return (
            <button
              key={shape.id}
              onClick={() => handleShapeClick(shape)}
              className="flex flex-col items-center gap-2 p-3 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all group"
              title={`Add ${shape.name}`}
            >
              <Icon className="text-2xl text-gray-600 group-hover:text-primary-600 transition-colors" />
              <span className="text-xs font-medium text-gray-700 group-hover:text-primary-700">
                {shape.name}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-800">
          <strong>Tip:</strong> Click a shape to add it to the canvas. You can then resize, rotate, and customize its colors.
        </p>
      </div>
    </div>
  );
};

export default ShapesPanel;
