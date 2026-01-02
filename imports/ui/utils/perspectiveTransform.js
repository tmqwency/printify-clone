/**
 * Perspective point configurations for each mockup view
 * These define the quadrilateral where the design should be mapped
 * Coordinates are relative to a 1200x1200 canvas
 */
export const MOCKUP_PERSPECTIVES = {
  folded: {
    // Folded t-shirt view - design appears centered and slightly compressed
    topLeft: { x: 420, y: 380 },
    topRight: { x: 780, y: 380 },
    bottomRight: { x: 800, y: 710 },
    bottomLeft: { x: 400, y: 710 }
  },
  hanging: {
    // Hanging t-shirt view - design on chest area with slight perspective
    topLeft: { x: 460, y: 280 },
    topRight: { x: 740, y: 280 },
    bottomRight: { x: 760, y: 650 },
    bottomLeft: { x: 440, y: 650 }
  }
};

/**
 * Calculate perspective transformation matrix coefficients
 * Based on homography transformation
 */
function getPerspectiveTransform(srcPts, dstPts) {
  // srcPts and dstPts are arrays of 8 values: [x1, y1, x2, y2, x3, y3, x4, y4]
  const A = [];
  const b = [];

  for (let i = 0; i < 4; i++) {
    const sx = srcPts[i * 2];
    const sy = srcPts[i * 2 + 1];
    const dx = dstPts[i * 2];
    const dy = dstPts[i * 2 + 1];

    A.push([sx, sy, 1, 0, 0, 0, -dx * sx, -dx * sy]);
    A.push([0, 0, 0, sx, sy, 1, -dy * sx, -dy * sy]);
    b.push(dx);
    b.push(dy);
  }

  // Solve using Gaussian elimination
  const coeffs = solveLinearSystem(A, b);
  coeffs.push(1); // h33 = 1

  return coeffs;
}

/**
 * Simple Gaussian elimination solver for linear systems
 */
function solveLinearSystem(A, b) {
  const n = b.length;
  const augmented = A.map((row, i) => [...row, b[i]]);

  // Forward elimination
  for (let i = 0; i < n; i++) {
    // Find pivot
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
        maxRow = k;
      }
    }
    [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];

    // Make all rows below this one 0 in current column
    for (let k = i + 1; k < n; k++) {
      const factor = augmented[k][i] / augmented[i][i];
      for (let j = i; j <= n; j++) {
        augmented[k][j] -= factor * augmented[i][j];
      }
    }
  }

  // Back substitution
  const x = new Array(n);
  for (let i = n - 1; i >= 0; i--) {
    x[i] = augmented[i][n];
    for (let j = i + 1; j < n; j++) {
      x[i] -= augmented[i][j] * x[j];
    }
    x[i] /= augmented[i][i];
  }

  return x;
}

/**
 * Transform a point using perspective transformation coefficients
 */
function transformPoint(x, y, coeffs) {
  const denominator = coeffs[6] * x + coeffs[7] * y + coeffs[8];
  return [
    (coeffs[0] * x + coeffs[1] * y + coeffs[2]) / denominator,
    (coeffs[3] * x + coeffs[4] * y + coeffs[5]) / denominator
  ];
}

/**
 * Apply perspective transformation to a canvas with bilinear interpolation
 * @param {HTMLCanvasElement} sourceCanvas - The canvas containing the design
 * @param {Object} perspective - The perspective points (topLeft, topRight, bottomRight, bottomLeft)
 * @param {number} targetSize - The size of the output canvas (width and height)
 * @returns {HTMLCanvasElement} - The transformed canvas
 */
export function applyPerspectiveTransformSmooth(sourceCanvas, perspective, targetSize) {
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = targetSize;
  outputCanvas.height = targetSize;
  const ctx = outputCanvas.getContext('2d');

  const sourceCtx = sourceCanvas.getContext('2d');
  const sourceData = sourceCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
  const sourcePixels = sourceData.data;

  const outputData = ctx.createImageData(targetSize, targetSize);
  const outputPixels = outputData.data;

  // Define source rectangle (entire source canvas)
  const srcPts = [
    0, 0,                           // top-left
    sourceCanvas.width, 0,          // top-right
    sourceCanvas.width, sourceCanvas.height, // bottom-right
    0, sourceCanvas.height          // bottom-left
  ];

  // Define destination quadrilateral
  const dstPts = [
    perspective.topLeft.x, perspective.topLeft.y,
    perspective.topRight.x, perspective.topRight.y,
    perspective.bottomRight.x, perspective.bottomRight.y,
    perspective.bottomLeft.x, perspective.bottomLeft.y
  ];

  // Get transformation coefficients (inverse: dst -> src)
  const coeffs = getPerspectiveTransform(dstPts, srcPts);

  // Bilinear interpolation helper
  function getPixelBilinear(x, y) {
    const x1 = Math.floor(x);
    const y1 = Math.floor(y);
    const x2 = Math.min(x1 + 1, sourceCanvas.width - 1);
    const y2 = Math.min(y1 + 1, sourceCanvas.height - 1);

    const fx = x - x1;
    const fy = y - y1;

    const getPixel = (px, py) => {
      if (px < 0 || px >= sourceCanvas.width || py < 0 || py >= sourceCanvas.height) {
        return [0, 0, 0, 0];
      }
      const idx = (py * sourceCanvas.width + px) * 4;
      return [
        sourcePixels[idx],
        sourcePixels[idx + 1],
        sourcePixels[idx + 2],
        sourcePixels[idx + 3]
      ];
    };

    const p11 = getPixel(x1, y1);
    const p21 = getPixel(x2, y1);
    const p12 = getPixel(x1, y2);
    const p22 = getPixel(x2, y2);

    const result = [];
    for (let i = 0; i < 4; i++) {
      const top = p11[i] * (1 - fx) + p21[i] * fx;
      const bottom = p12[i] * (1 - fx) + p22[i] * fx;
      result[i] = Math.round(top * (1 - fy) + bottom * fy);
    }

    return result;
  }

  // Apply transformation
  for (let y = 0; y < targetSize; y++) {
    for (let x = 0; x < targetSize; x++) {
      const [srcX, srcY] = transformPoint(x, y, coeffs);

      if (srcX >= 0 && srcX < sourceCanvas.width && srcY >= 0 && srcY < sourceCanvas.height) {
        const pixel = getPixelBilinear(srcX, srcY);
        const dstIndex = (y * targetSize + x) * 4;

        outputPixels[dstIndex] = pixel[0];
        outputPixels[dstIndex + 1] = pixel[1];
        outputPixels[dstIndex + 2] = pixel[2];
        outputPixels[dstIndex + 3] = pixel[3];
      }
    }
  }

  ctx.putImageData(outputData, 0, 0);
  return outputCanvas;
}
