import React, { useEffect, useRef, useState } from "react";
import {
  Stage,
  Layer,
  Image as KonvaImage,
  Rect,
  Transformer,
} from "react-konva";
import useImage from "use-image";

const URLImage = ({ src, onDimensionsLoaded }) => {
  const [image] = useImage(src);

  useEffect(() => {
    if (image && onDimensionsLoaded) {
      onDimensionsLoaded({ width: image.width, height: image.height });
    }
  }, [image, onDimensionsLoaded]);

  return <KonvaImage image={image} />;
};

const PrintAreaEditor = ({ imageUrl, initialArea, onSave, onCancel }) => {
  const [imageDimensions, setImageDimensions] = useState(null);
  const [rectProps, setRectProps] = useState({
    x: initialArea.x || 50,
    y: initialArea.y || 50,
    width: initialArea.width || 200,
    height: initialArea.height || 300,
    id: "printArea",
  });

  const stageRef = useRef(null);
  const rectRef = useRef(null);
  const trRef = useRef(null);

  useEffect(() => {
    if (trRef.current && rectRef.current) {
      trRef.current.nodes([rectRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [imageDimensions]); // Re-attach transformer when image loads/editor initializes

  const handleDragEnd = (e) => {
    setRectProps({
      ...rectProps,
      x: e.target.x(),
      y: e.target.y(),
    });
  };

  const handleTransformEnd = (e) => {
    const node = rectRef.current;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Reset scale to 1 and update width/height
    node.scaleX(1);
    node.scaleY(1);

    setRectProps({
      ...rectProps,
      x: node.x(),
      y: node.y(),
      width: Math.round(node.width() * scaleX),
      height: Math.round(node.height() * scaleY),
    });
  };

  const handleSave = () => {
    onSave({
      x: Math.round(rectProps.x),
      y: Math.round(rectProps.y),
      width: Math.round(rectProps.width),
      height: Math.round(rectProps.height),
    });
  };

  const handleCenter = () => {
    if (imageDimensions) {
      const centerX = (imageDimensions.width - rectProps.width) / 2;
      const centerY = (imageDimensions.height - rectProps.height) / 2;
      setRectProps({
        ...rectProps,
        x: Math.max(0, centerX),
        y: Math.max(0, centerY),
      });
    }
  };

  // If no image url, show error or placeholder
  if (!imageUrl) {
    return <div className="p-4 text-red-500">No background image provided</div>;
  }

  // Calculate stage size based on image (or max container size)
  // For simplicity, we'll let the stage be the image size once loaded,
  // or a default 500x500 if loading.
  // In a real app we might scale the stage to fit the screen.
  // Here we'll try to display at natural size or capped width.

  return (
    <div className="flex flex-col bg-gray-100 p-4 rounded-lg">
      <div className="mb-4 text-center">
        <h3 className="font-bold text-lg mb-1">Configure Print Area</h3>
        <p className="text-sm text-gray-500">
          Drag and resize the blue box to define the printable area.
        </p>
        {imageDimensions && (
          <p className="text-xs text-gray-400 mt-1">
            Image Size: {imageDimensions.width}x{imageDimensions.height}px
          </p>
        )}
      </div>

      <div className="border border-gray-300 shadow-sm bg-white overflow-auto max-w-full max-h-[70vh] mx-auto">
        <Stage
          width={imageDimensions ? imageDimensions.width : 500}
          height={imageDimensions ? imageDimensions.height : 500}
          ref={stageRef}
        >
          <Layer>
            <URLImage src={imageUrl} onDimensionsLoaded={setImageDimensions} />
            {imageDimensions && (
              <>
                <Rect
                  ref={rectRef}
                  {...rectProps}
                  fill="rgba(0, 161, 255, 0.3)"
                  stroke="#00a1ff"
                  strokeWidth={2}
                  draggable
                  onDragEnd={handleDragEnd}
                  onTransformEnd={handleTransformEnd}
                />
                <Transformer
                  ref={trRef}
                  boundBoxFunc={(oldBox, newBox) => {
                    // Start minimum size check
                    if (newBox.width < 50 || newBox.height < 50) {
                      return oldBox;
                    }
                    return newBox;
                  }}
                />
              </>
            )}
            {!imageDimensions &&
              // Loading placeholder text on canvas
              null}
          </Layer>
        </Stage>
      </div>

      <div className="mt-2 text-sm text-gray-600 font-mono text-center">
        X: {Math.round(rectProps.x)}, Y: {Math.round(rectProps.y)} | W:{" "}
        {Math.round(rectProps.width)}, H: {Math.round(rectProps.height)}
      </div>

      <div className="flex gap-4 mt-6 w-full max-w-md mx-auto">
        <button
          onClick={handleCenter}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
        >
          Center Box
        </button>
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-semibold"
        >
          Save Print Area
        </button>
      </div>
    </div>
  );
};

export default PrintAreaEditor;
