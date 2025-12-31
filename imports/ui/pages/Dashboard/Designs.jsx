import React, { useState, useRef, useEffect, useCallback } from "react";
import { Meteor } from "meteor/meteor";
import { useTracker } from "meteor/react-meteor-data";
import { useParams, useNavigate } from "react-router-dom";
import {
  Stage,
  Layer,
  Image as KonvaImage,
  Text as KonvaText,
  Transformer,
  Rect,
} from "react-konva";
import useImage from "use-image";
import { Designs as DesignsCollection } from "../../../api/collections/designs";
import StockImagesPanel from "./components/StockImagesPanel";
import FontSelector from "./components/FontSelector";
import ShapesPanel from "./components/ShapesPanel";
import CollapsibleSidebar from "./components/CollapsibleSidebar";
import {
  DesignRect,
  DesignCircle,
  DesignLine,
  DesignArrow,
  DesignStar,
} from "./components/ShapeComponents";
import {
  FaUpload,
  FaFont,
  FaTrash,
  FaSearchPlus,
  FaSearchMinus,
  FaSave,
  FaTshirt,
  FaArrowLeft,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { Products } from "../../../api/collections/products";

// Konva Image Component
const DesignImage = ({ image, isSelected, onSelect, onChange }) => {
  const [img] = useImage(image.src, 'anonymous');
  const shapeRef = useRef();
  const trRef = useRef();

  React.useEffect(() => {
    if (isSelected) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <KonvaImage
        image={img}
        ref={shapeRef}
        {...image}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => {
          onChange({
            ...image,
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransformEnd={(e) => {
          const node = shapeRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();

          node.scaleX(1);
          node.scaleY(1);
          onChange({
            ...image,
            x: node.x(),
            y: node.y(),
            width: Math.max(5, node.width() * scaleX),
            height: Math.max(node.height() * scaleY),
          });
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
};

// Konva Text Component
const DesignText = ({ text, isSelected, onSelect, onChange }) => {
  const shapeRef = useRef();
  const trRef = useRef();

  React.useEffect(() => {
    if (isSelected) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <KonvaText
        ref={shapeRef}
        {...text}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => {
          onChange({
            ...text,
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransformEnd={(e) => {
          const node = shapeRef.current;
          onChange({
            ...text,
            x: node.x(),
            y: node.y(),
            fontSize: Math.max(5, node.fontSize() * node.scaleX()),
          });
          node.scaleX(1);
          node.scaleY(1);
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          enabledAnchors={["middle-left", "middle-right"]}
          boundBoxFunc={(oldBox, newBox) => {
            newBox.width = Math.max(30, newBox.width);
            return newBox;
          }}
        />
      )}
    </>
  );
};

// Simplified Image component for Preview
const PreviewImage = ({ image }) => {
  const [img] = useImage(image.src);
  return <KonvaImage image={img} {...image} />;
};

const Designs = () => {
  const { productId } = useParams(); // Get product ID from URL
  const navigate = useNavigate();
  const [designs, setDesigns] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentPrintAreaIndex, setCurrentPrintAreaIndex] = useState(0); // Track which print area (front/back)
  const [canvasStates, setCanvasStates] = useState({});
  const [isSaving, setIsSaving] = useState(false); // Store canvas elements for each print area
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const [canvasElements, setCanvasElements] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [zoom, setZoom] = useState(1); // Default 100% zoom
  const [activeLibraryTab, setActiveLibraryTab] = useState("uploads"); // 'uploads' or 'stock'
  const [productName, setProductName] = useState("");
  const [textInput, setTextInput] = useState("");
  const [textColor, setTextColor] = useState("#000000");
  const [fontSize, setFontSize] = useState(24);
  
  // Enhanced text formatting states
  const [fontFamily, setFontFamily] = useState("Inter");
  const [fontWeight, setFontWeight] = useState("400");
  const [textAlign, setTextAlign] = useState("left");
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [lineHeight, setLineHeight] = useState(1.2);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  
  const [editingProductId, setEditingProductId] = useState(null); // Track if editing existing product
  const [pendingEditProduct, setPendingEditProduct] = useState(null); // Store fetched product while waiting for base products to load
  const [isFetchingEdit, setIsFetchingEdit] = useState(false); // Prevent duplicate fetches
  const fileInputRef = useRef();
  const stageRef = useRef(); // Reference to Konva Stage for exporting

  // State to track actual mockup image dimensions and rendered scale
  const [mockupDimensions, setMockupDimensions] = useState(null);
  const [renderInfo, setRenderInfo] = useState({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  });
  const mockupImgRef = useRef(null);
  const containerRef = useRef(null);
  const lastDimensionsRef = useRef({ width: 0, height: 0 });

  // Function to calculate and update render info
  const updateRenderInfo = useCallback(() => {
    if (!mockupDimensions || !mockupImgRef.current) {
      setRenderInfo({ scale: 1, offsetX: 0, offsetY: 0 });
      return;
    }

    const imgWidth = mockupImgRef.current.offsetWidth;
    const imgHeight = mockupImgRef.current.offsetHeight;

    // If dimensions are not ready yet, retry
    if (imgWidth === 0 || imgHeight === 0) {
      console.log("Image dimensions not ready, retrying...");
      requestAnimationFrame(() => {
        updateRenderInfo();
      });
      return;
    }

    // Check if dimensions have changed since last check
    const dimensionsChanged =
      lastDimensionsRef.current.width !== imgWidth ||
      lastDimensionsRef.current.height !== imgHeight;

    if (dimensionsChanged) {
      console.log(
        "Dimensions changed, waiting for stability...",
        imgWidth,
        imgHeight
      );
      lastDimensionsRef.current = { width: imgWidth, height: imgHeight };

      // Wait and check again to ensure dimensions are stable
      requestAnimationFrame(() => {
        updateRenderInfo();
      });
      return;
    }

    // Dimensions are stable, calculate scale
    console.log("Image natural dimensions:", mockupDimensions);
    console.log("Image rendered dimensions (stable):", imgWidth, imgHeight);

    // Calculate scale based on actual rendered image size
    const scale = imgWidth / mockupDimensions.width;

    console.log("Calculated scale:", scale);
    setRenderInfo({ scale, offsetX: 0, offsetY: 0 });
  }, [mockupDimensions]);

  // Calculate render info whenever dimensions or zoom changes
  useEffect(() => {
    updateRenderInfo();

    // Update on window resize
    window.addEventListener("resize", updateRenderInfo);
    return () => window.removeEventListener("resize", updateRenderInfo);
  }, [updateRenderInfo, zoom]);

  const handleMockupLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target;
    if (naturalWidth && naturalHeight) {
      setMockupDimensions({ width: naturalWidth, height: naturalHeight });

      // Use requestAnimationFrame to ensure the image is fully rendered
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          updateRenderInfo();
        });
      });
    }
  };

  // Reset dimensions when product/side changes
  useEffect(() => {
    setMockupDimensions(null);
    setRenderInfo({ scale: 1, offsetX: 0, offsetY: 0 });
  }, [selectedProduct?.id, currentPrintAreaIndex]);

  // Fetch user's uploaded designs and products
  const { products, productsLoading, userDesigns, designsLoading } = useTracker(() => {
    const productsHandle = Meteor.subscribe("products.all");
    const designsHandle = Meteor.subscribe("designs.mine");
    
    // Design mockup templates for each product type and side
    const mockupTemplates = {
      "t-shirt": {
        front: "/images/mockups/tshirt-template.png",
        back: "/images/mockups/tshirt-back-template.png",
      },
      hoodie: {
        front: "/images/mockups/hoodie-template.png",
        back: "/images/mockups/hoodie-back-template.png",
      },
      mug: {
        "all-over": "/images/mockups/mug-template.png",
      },
      "phone-case": {
        back: "/images/mockups/phone-case-template.png",
      },
      poster: {
        full: "/images/mockups/poster-template.png",
      },
      // Fallback
      default: {
        front: "/images/mockups/tshirt-template.png",
      },
    };

    return {
      productsLoading: !productsHandle.ready(),
      designsLoading: !designsHandle.ready(),
      userDesigns: DesignsCollection.find({}, { sort: { createdAt: -1 } }).fetch(),
      products: Products.find({ status: "active" })
        .fetch()
        .map((p) => {
          // Create mockup images object for each print area
          const mockupImages = {};
          if (p.printAreas) {
            p.printAreas.forEach((area) => {
              mockupImages[area.name] =
                mockupTemplates[p.type]?.[area.name] ||
                `/images/mockups/${p.type}-${area.name}-template.png`;
            });
          }

          return {
            id: p._id,
            name: p.name,
            description: p.description,
            type: p.type,
            basePrice: p.basePrice,
            // Use designMockup for the canvas (flat template) - default to first
            image:
              p.designMockup ||
              mockupImages[p.printAreas?.[0]?.name] ||
              "/images/mockups/tshirt-template.png",
            // Map of mockup images for each print area
            mockupImages: mockupImages,
            // Use productImage for sidebar display (realistic photo)
            productImage: p.productImage || "/images/placeholder.png",
            // Include all print areas for multi-side support
            printAreas: p.printAreas || [
              { name: "front", width: 500, height: 600, x: 150, y: 100 },
            ],
            // Keep first print area for backward compatibility
            printArea: p.printAreas?.[0] || {
              width: 500,
              height: 600,
              x: 150,
              y: 100,
            },
            mockupSize: { width: 800, height: 900 },
          };
        }),
    };
  }, []);

  // 1. Fetch product data for editing
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const editProductId = urlParams.get("edit");

    if (editProductId && !editingProductId && !isFetchingEdit) {
      setIsFetchingEdit(true);
      setIsLoadingProduct(true);
      // Fetch product data
      Meteor.call("userProducts.getById", editProductId, (error, product) => {
        setIsFetchingEdit(false);
        setIsLoadingProduct(false);

        if (error) {
          toast.error("Failed to load product for editing");
          console.error(error);
          return;
        }

        if (product) {
          setEditingProductId(editProductId);
          setPendingEditProduct(product);
        }
      });
    }
  }, [editingProductId, isFetchingEdit]);

  // 2. Match fetched product with base products when available
  useEffect(() => {
    if (pendingEditProduct && products.length > 0 && !selectedProduct) {
      // Find and select the base product
      const baseProduct = products.find(
        (p) => p.id === pendingEditProduct.baseProductId
      );

      if (baseProduct) {
        setSelectedProduct(baseProduct);
        setProductName(pendingEditProduct.name);

        // Load design data
        if (pendingEditProduct.designData) {
          // Load all print area states first
          if (pendingEditProduct.designData.allPrintAreas) {
            setCanvasStates(pendingEditProduct.designData.allPrintAreas);

            // Set initial elements based on current print area (default 0)
            const initialElements =
              pendingEditProduct.designData.allPrintAreas[0] || [];
            setCanvasElements(initialElements);
            setCurrentPrintAreaIndex(0);
          } else if (pendingEditProduct.designData.elements) {
            // Fallback for logic where only elements were saved (single view)
            setCanvasElements(pendingEditProduct.designData.elements);
            setCanvasStates({ 0: pendingEditProduct.designData.elements });
          }
        }

        toast.success("Product loaded for editing");
        setPendingEditProduct(null); // Clear pending state
      }
    }
  }, [products, pendingEditProduct, selectedProduct]);

  // Generate preview image from canvas with mockup background
  const generatePreviewImage = async () => {
    if (!stageRef.current || !selectedProduct) return null;

    try {
      // Temporarily deselect to hide transformer
      const previousSelection = selectedId;
      setSelectedId(null);

      // Wait for transformer to be removed from DOM
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Get current print area
      const printArea = selectedProduct.printAreas[currentPrintAreaIndex];
      const mockupImage =
        selectedProduct.mockupImages?.[printArea.name] || selectedProduct.image;

      // Store current scale
      const stage = stageRef.current;
      const originalScaleX = stage.scaleX();
      const originalScaleY = stage.scaleY();

      // Temporarily reset scale to 1 for export
      stage.scaleX(1);
      stage.scaleY(1);

      // Load mockup image first to get its actual dimensions
      const img = new Image();
      img.crossOrigin = "anonymous";

      return new Promise((resolve) => {
        img.onload = () => {
          // Use actual mockup image dimensions for canvas
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");

          // Draw mockup background
          ctx.drawImage(img, 0, 0);

          // Export design from Konva stage at 1:1 scale
          const designDataURL = stage.toDataURL({
            pixelRatio: 1,
          });

          // Load design image
          const designImg = new Image();
          designImg.onload = () => {
            // Calculate scale factor if mockup image size differs from expected size
            let scaleX = 1;
            let scaleY = 1;

            if (selectedProduct.mockupDimensions) {
              // Product has stored mockup dimensions - scale coordinates accordingly
              scaleX = img.width / selectedProduct.mockupDimensions.width;
              scaleY = img.height / selectedProduct.mockupDimensions.height;
            }

            // Draw design on top of mockup at print area position (scaled if needed)
            ctx.drawImage(
              designImg,
              printArea.x * scaleX,
              printArea.y * scaleY,
              printArea.width * scaleX,
              printArea.height * scaleY
            );

            // Restore original scale
            stage.scaleX(originalScaleX);
            stage.scaleY(originalScaleY);

            // Restore previous selection
            setSelectedId(previousSelection);

            // Return composite image as data URL
            resolve(canvas.toDataURL("image/png"));
          };
          designImg.src = designDataURL;
        };

        img.onerror = () => {
          console.error("Failed to load mockup image");
          // Restore original scale
          stage.scaleX(originalScaleX);
          stage.scaleY(originalScaleY);
          setSelectedId(previousSelection);
          resolve(null);
        };

        img.src = mockupImage;
      });
    } catch (error) {
      console.error("Error generating preview:", error);
      return null;
    }
  };

  // Generate preview images for ALL print areas
  const generateAllPreviewImages = async () => {
    if (!selectedProduct || !selectedProduct.printAreas) return null;

    const previews = {};

    // Get mockup dimensions (use stored dimensions or default)
    const mockupWidth = selectedProduct.mockupDimensions?.width || 1024;
    const mockupHeight = selectedProduct.mockupDimensions?.height || 1024;

    // Reduce size significantly to prevent MongoDB BSON limit (16MB)
    const maxWidth = 300; // Further reduced from 400
    const maxHeight = 350; // Further reduced from 450
    const scale = Math.min(maxWidth / mockupWidth, maxHeight / mockupHeight);

    // Generate preview for each print area
    for (let i = 0; i < selectedProduct.printAreas.length; i++) {
      const printArea = selectedProduct.printAreas[i];
      const mockupImage =
        selectedProduct.mockupImages?.[printArea.name] || selectedProduct.image;

      // Get canvas elements for this print area
      const elements =
        i === currentPrintAreaIndex ? canvasElements : canvasStates[i] || [];

      if (elements.length === 0) continue; // Skip if no design on this side

      try {
        // Create a smaller canvas to reduce file size
        const canvas = document.createElement("canvas");
        canvas.width = mockupWidth * scale;
        canvas.height = mockupHeight * scale;
        const ctx = canvas.getContext("2d");

        // Load mockup image
        const img = new Image();
        img.crossOrigin = "anonymous";

        const previewDataURL = await new Promise((resolve) => {
          img.onload = async () => {
            // Draw mockup background (scaled down)
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            // Create a temporary Konva stage to render this print area's elements
            const tempStage = new window.Konva.Stage({
              container: document.createElement("div"),
              width: printArea.width,
              height: printArea.height,
            });

            const tempLayer = new window.Konva.Layer();
            tempStage.add(tempLayer);

            // Load all images first before adding to layer
            const imageLoadPromises = [];

            elements.forEach((el) => {
              if (el.type === "text") {
                const text = new window.Konva.Text({
                  x: el.x,
                  y: el.y,
                  text: el.text,
                  fontSize: el.fontSize,
                  fill: el.fill,
                  fontFamily: el.fontFamily,
                });
                tempLayer.add(text);
              } else if (el.type === "image") {
                // Create promise for image loading
                const imagePromise = new Promise((resolveImg) => {
                  const imageObj = new Image();
                  imageObj.crossOrigin = "anonymous";
                  imageObj.onload = () => {
                    const konvaImage = new window.Konva.Image({
                      x: el.x,
                      y: el.y,
                      image: imageObj,
                      width: el.width,
                      height: el.height,
                    });
                    tempLayer.add(konvaImage);
                    resolveImg();
                  };
                  imageObj.onerror = () => {
                    console.error("Failed to load image:", el.src);
                    resolveImg(); // Resolve anyway to not block
                  };
                  imageObj.src = el.src;
                });
                imageLoadPromises.push(imagePromise);
              }
            });

            // Wait for all images to load
            await Promise.all(imageLoadPromises);

            // Now draw the layer with all elements
            tempLayer.draw();

            // Small delay to ensure rendering is complete
            await new Promise((r) => setTimeout(r, 100));

            // Get design from temp stage with lower quality
            const designDataURL = tempStage.toDataURL({
              pixelRatio: 1, // Reduced from 2
              quality: 0.7, // Lower quality
            });

            // Load design image
            const designImg = new Image();
            designImg.onload = () => {
              // Calculate coordinate scale if mockup dimensions differ from actual image
              let coordScaleX = 1;
              let coordScaleY = 1;

              if (selectedProduct.mockupDimensions) {
                coordScaleX =
                  img.width / selectedProduct.mockupDimensions.width;
                coordScaleY =
                  img.height / selectedProduct.mockupDimensions.height;
              }

              // Draw design on top of mockup at print area position (scaled)
              // Apply both thumbnail scale AND coordinate scale
              ctx.drawImage(
                designImg,
                printArea.x * scale * coordScaleX,
                printArea.y * scale * coordScaleY,
                printArea.width * scale * coordScaleX,
                printArea.height * scale * coordScaleY
              );

              // Return composite image as data URL with aggressive JPEG compression
              resolve(canvas.toDataURL("image/jpeg", 0.5)); // JPEG with 50% quality (reduced from 70%)
            };
            designImg.src = designDataURL;

            // Cleanup temp stage
            tempStage.destroy();
          };

          img.onerror = () => {
            console.error(`Failed to load mockup image for ${printArea.name}`);
            resolve(null);
          };

          img.src = mockupImage;
        });

        if (previewDataURL) {
          previews[printArea.name] = previewDataURL;
        }
      } catch (error) {
        console.error(`Error generating preview for ${printArea.name}:`, error);
      }
    }

    return Object.keys(previews).length > 0 ? previews : null;
  };

  // Auto-select product from URL parameter
  useEffect(() => {
    if (productId && products.length > 0 && !selectedProduct) {
      const product = products.find((p) => p.id === productId);
      if (product) {
        setSelectedProduct(product);
      }
    }
  }, [productId, products, selectedProduct]);

  // Load user's designs on mount
  useEffect(() => {
    loadDesigns();
  }, []);

  const loadDesigns = () => {
    Meteor.call("designs.listMy", (error, result) => {
      if (error) {
        console.error("Failed to load designs:", error);
      } else {
        setDesigns(
          result.map((d) => ({
            id: d._id,
            name: d.name,
            src: d.originalFileUrl,
            uploadedAt: d.createdAt,
          }))
        );
      }
    });
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const fileUrl = event.target.result;

          // Save to backend
          Meteor.call(
            "designs.upload",
            {
              name: file.name,
              fileUrl: fileUrl,
              fileType: file.type,
              fileSize: file.size,
            },
            (error, designId) => {
              if (error) {
                toast.error(`Failed to upload ${file.name}`);
                console.error(error);
              } else {
                const newDesign = {
                  id: designId,
                  name: file.name,
                  src: fileUrl,
                  uploadedAt: new Date(),
                };
                setDesigns((prev) => [...prev, newDesign]);
                toast.success(`Design "${file.name}" uploaded successfully!`);
              }
            }
          );
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const addDesignToCanvas = (design) => {
    if (!selectedProduct) {
      toast.error("Please select a product first!");
      return;
    }

    const newElement = {
      id: `image-${Date.now()}`,
      type: "image",
      src: design.src,
      x: 50,
      y: 50,
      width: 150,
      height: 150,
    };
    setCanvasElements((prev) => [...prev, newElement]);
    toast.success("Design added to canvas!");
  };

  // Add stock image to canvas (accepts URL string)
  const addStockImageToCanvas = (imageUrl) => {
    if (!selectedProduct) {
      toast.error("Please select a product first!");
      return;
    }

    const newElement = {
      id: `image-${Date.now()}`,
      type: "image",
      src: imageUrl,
      x: 50,
      y: 50,
      width: 200,
      height: 200,
    };
    setCanvasElements((prev) => [...prev, newElement]);
  };

  const addTextToCanvas = () => {
    if (!selectedProduct) {
      toast.error("Please select a product first!");
      return;
    }

    if (!textInput.trim()) {
      toast.error("Please enter some text!");
      return;
    }

    // Calculate actual font weight based on bold toggle
    const actualFontWeight = isBold ? '700' : fontWeight;
    
    // Build font style string
    const fontStyle = isItalic ? 'italic' : 'normal';
    
    // Build text decoration
    const textDecoration = isUnderline ? 'underline' : '';

    const newElement = {
      id: `text-${Date.now()}`,
      type: "text",
      text: textInput,
      x: 50,
      y: 50,
      fontSize: fontSize,
      fill: textColor,
      fontFamily: fontFamily,
      fontStyle: fontStyle,
      fontVariant: actualFontWeight,
      textDecoration: textDecoration,
      align: textAlign,
      letterSpacing: letterSpacing,
      lineHeight: lineHeight,
    };
    setCanvasElements((prev) => [...prev, newElement]);
    setTextInput("");
    toast.success("Text added to canvas!");
  };

  // Add shape to canvas
  const addShapeToCanvas = (shape) => {
    if (!selectedProduct) {
      toast.error("Please select a product first!");
      return;
    }

    setCanvasElements((prev) => [...prev, shape]);
    toast.success(`${shape.type.charAt(0).toUpperCase() + shape.type.slice(1)} added to canvas!`);
  };

  // Switch between print areas (front/back)
  // Switch between print areas (front/back)
  const switchPrintArea = (index) => {
    if (!selectedProduct || !selectedProduct.printAreas || index === currentPrintAreaIndex) return;

    // 1. Get the latest canvas elements for the CURRENT side
    const currentElements = canvasElements;

    // 2. Update the master state map with current elements
    const updatedStates = {
      ...canvasStates,
      [currentPrintAreaIndex]: currentElements,
    };
    setCanvasStates(updatedStates);

    // 3. Load the elements for the NEW side (or empty array if none exist yet)
    const nextElements = updatedStates[index] || [];
    setCanvasElements(nextElements);

    // 4. Update the index and reset selection
    setCurrentPrintAreaIndex(index);
    setSelectedId(null);
  };

  const deleteSelected = () => {
    if (selectedId) {
      setCanvasElements((prev) => prev.filter((el) => el.id !== selectedId));
      setSelectedId(null);
      toast.success("Element deleted!");
    }
  };

  const saveCustomProduct = async () => {
    if (!selectedProduct) {
      toast.error("Please select a product!");
      return;
    }

    if (!productName.trim()) {
      toast.error("Please enter a product name!");
      return;
    }

    if (canvasElements.length === 0) {
      toast.error("Please add at least one design element!");
      return;
    }

    if (isSaving) {
      return; // Prevent duplicate saves
    }

    setIsSaving(true);

    // Temporarily deselect to hide transformer
    const previousSelection = selectedId;
    setSelectedId(null);
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Generate preview images for ALL print areas
    const previewImages = await generateAllPreviewImages();

    // Restore selection
    setSelectedId(previousSelection);

    if (!previewImages || Object.keys(previewImages).length === 0) {
      toast.error("Failed to generate preview images!");
      return;
    }

    // Collect all canvas states for all print areas
    const allDesignData = {
      ...canvasStates,
      [currentPrintAreaIndex]: canvasElements, // Include current state
    };

    // Save to backend with multiple previews (as file paths)
    const methodName = editingProductId
      ? "userProducts.update"
      : "userProducts.create";
    const methodArgs = editingProductId
      ? [
          editingProductId,
          {
            name: productName,
            description: `Custom ${selectedProduct.name}`,
            designData: {
              elements: canvasElements,
              allPrintAreas: allDesignData,
            },
            previewImages: previewImages,
          },
        ]
      : [
          {
            name: productName,
            description: `Custom ${selectedProduct.name}`,
            baseProductId: selectedProduct.id,
            designData: {
              elements: canvasElements,
              allPrintAreas: allDesignData,
            },
            previewImages: previewImages,
            price: 2999,
          },
        ];

    Meteor.call(methodName, ...methodArgs, (error, result) => {
      setIsSaving(false);

      if (error) {
        toast.error(
          editingProductId
            ? "Failed to update product"
            : "Failed to save product"
        );
        console.error(error);
      } else {
        toast.success(
          editingProductId
            ? `Product "${productName}" updated successfully!`
            : `Custom product "${productName}" saved successfully!`
        );

        // Reset form and navigate back to My Products
        setProductName("");
        setCanvasElements([]);
        setCanvasStates({});
        setSelectedId(null);
        setEditingProductId(null);
        navigate("/dashboard/my-products");
      }
    });
  };

  const checkDeselect = (e) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      setSelectedId(null);
    }
  };

  if (!selectedProduct || productsLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8 bg-gray-50">
        <div className="text-center">
          {editingProductId || isLoadingProduct || productsLoading ? (
            <>
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-500 mx-auto mb-4"></div>
              <h2 className="text-2xl font-bold text-gray-700 mb-2">
                {productsLoading ? "Loading Products..." : "Loading Design..."}
              </h2>
              <p className="text-gray-500">
                {productsLoading
                  ? "Fetching available products..."
                  : "Fetching your product design..."}
              </p>
            </>
          ) : (
            <>
              <div className="text-gray-400 mb-4 text-6xl"></div>
              <h2 className="text-2xl font-bold text-gray-700 mb-2">
                No Product Selected
              </h2>
              <p className="text-gray-500 mb-6">
                Please go back to the catalog and select a product to design.
              </p>
              <button
                onClick={() => navigate("/dashboard/products")}
                className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors font-semibold"
              >
                Go to Catalog
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header with Back Button */}


      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Collapsible Sidebar */}
        <CollapsibleSidebar
          selectedProduct={selectedProduct}
          onShapeAdd={addShapeToCanvas}
          textInput={textInput}
          setTextInput={setTextInput}
          fontFamily={fontFamily}
          fontWeight={fontWeight}
          fontSize={fontSize}
          textColor={textColor}
          textAlign={textAlign}
          letterSpacing={letterSpacing}
          lineHeight={lineHeight}
          isBold={isBold}
          isItalic={isItalic}
          isUnderline={isUnderline}
          setFontFamily={setFontFamily}
          setFontWeight={setFontWeight}
          setFontSize={setFontSize}
          setTextColor={setTextColor}
          setTextAlign={setTextAlign}
          setLetterSpacing={setLetterSpacing}
          setLineHeight={setLineHeight}
          setIsBold={setIsBold}
          setIsItalic={setIsItalic}
          setIsUnderline={setIsUnderline}
          addTextToCanvas={addTextToCanvas}
          designs={designs}
          activeLibraryTab={activeLibraryTab}
          setActiveLibraryTab={setActiveLibraryTab}
          fileInputRef={fileInputRef}
          handleFileUpload={handleFileUpload}
          addDesignToCanvas={addDesignToCanvas}
          addStockImageToCanvas={addStockImageToCanvas}
          productName={productName}
          setProductName={setProductName}
          saveCustomProduct={saveCustomProduct}
          isSaving={isSaving}
          editingProductId={editingProductId}
          ShapesPanel={ShapesPanel}
          FontSelector={FontSelector}
          StockImagesPanel={StockImagesPanel}
        />

        {/* Center - Product Mockup with Canvas Overlay (Expanded) */}
        <div className="flex-1 bg-white shadow-soft p-4 flex flex-col ml-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">
              Product Preview
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Zoom Out"
              >
                <FaSearchMinus />
              </button>
              <span className="text-sm text-gray-600 min-w-[60px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Zoom In"
              >
                <FaSearchPlus />
              </button>
              <button
                onClick={deleteSelected}
                disabled={!selectedId}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-2"
                title="Delete Selected"
              >
                <FaTrash />
              </button>
            </div>
          </div>

          {/* Print Area Toggle Buttons */}
          {selectedProduct &&
            selectedProduct.printAreas &&
            selectedProduct.printAreas.length > 1 && (
              <div className="flex items-center justify-center gap-2 mb-4">
                {selectedProduct.printAreas.map((area, index) => (
                  <button
                    key={index}
                    onClick={() => switchPrintArea(index)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      currentPrintAreaIndex === index
                        ? "bg-gray-700 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {area.name.charAt(0).toUpperCase() + area.name.slice(1)}{" "}
                    side
                  </button>
                ))}
              </div>
            )}

          {selectedProduct ? (
            <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg overflow-auto p-8">
              {/* Product Mockup with Canvas Overlay */}
              <div ref={containerRef} className="relative">
                {/* Product Background Image */}
                <img
                  ref={mockupImgRef}
                  src={
                    selectedProduct.mockupImages?.[
                      selectedProduct.printAreas[currentPrintAreaIndex].name
                    ] || selectedProduct.image
                  }
                  alt={selectedProduct.name}
                  className="block max-w-full max-h-[80vh] object-contain"
                  style={{ pointerEvents: "none" }}
                  onLoad={handleMockupLoad}
                />

                {/* Design Canvas Overlay on Print Area */}
                <div
                  className="absolute overflow-hidden"
                  style={{
                    opacity:
                      mockupDimensions && mockupImgRef.current?.offsetWidth > 0
                        ? 1
                        : 0,
                    left: (() => {
                      if (!mockupImgRef.current || !mockupDimensions) return 0;
                      const scale =
                        mockupImgRef.current.offsetWidth /
                        mockupDimensions.width;
                      return (
                        selectedProduct.printAreas[currentPrintAreaIndex].x *
                        scale
                      );
                    })(),
                    top: (() => {
                      if (!mockupImgRef.current || !mockupDimensions) return 0;
                      const scale =
                        mockupImgRef.current.offsetWidth /
                        mockupDimensions.width;
                      return (
                        selectedProduct.printAreas[currentPrintAreaIndex].y *
                        scale
                      );
                    })(),
                    width: (() => {
                      if (!mockupImgRef.current || !mockupDimensions) return 0;
                      const scale =
                        mockupImgRef.current.offsetWidth /
                        mockupDimensions.width;
                      return (
                        selectedProduct.printAreas[currentPrintAreaIndex]
                          .width * scale
                      );
                    })(),
                    height: (() => {
                      if (!mockupImgRef.current || !mockupDimensions) return 0;
                      const scale =
                        mockupImgRef.current.offsetWidth /
                        mockupDimensions.width;
                      return (
                        selectedProduct.printAreas[currentPrintAreaIndex]
                          .height * scale
                      );
                    })(),
                  }}
                >
                  <Stage
                    ref={stageRef}
                    width={
                      selectedProduct.printAreas[currentPrintAreaIndex].width *
                      (() => {
                        if (!mockupImgRef.current || !mockupDimensions)
                          return zoom;
                        const scale =
                          mockupImgRef.current.offsetWidth /
                          mockupDimensions.width;
                        return zoom * scale;
                      })()
                    }
                    height={
                      selectedProduct.printAreas[currentPrintAreaIndex].height *
                      (() => {
                        if (!mockupImgRef.current || !mockupDimensions)
                          return zoom;
                        const scale =
                          mockupImgRef.current.offsetWidth /
                          mockupDimensions.width;
                        return zoom * scale;
                      })()
                    }
                    onMouseDown={checkDeselect}
                    onTouchStart={checkDeselect}
                    scaleX={(() => {
                      if (!mockupImgRef.current || !mockupDimensions)
                        return zoom;
                      const scale =
                        mockupImgRef.current.offsetWidth /
                        mockupDimensions.width;
                      return zoom * scale;
                    })()}
                    scaleY={(() => {
                      if (!mockupImgRef.current || !mockupDimensions)
                        return zoom;
                      const scale =
                        mockupImgRef.current.offsetWidth /
                        mockupDimensions.width;
                      return zoom * scale;
                    })()}
                  >
                    <Layer>
                      {/* Print area outline - dashed border */}
                      <Rect
                        x={0}
                        y={0}
                        width={
                          selectedProduct.printAreas[currentPrintAreaIndex]
                            .width
                        }
                        height={
                          selectedProduct.printAreas[currentPrintAreaIndex]
                            .height
                        }
                        stroke="#39B54A"
                        strokeWidth={2 / zoom}
                        dash={[10 / zoom, 5 / zoom]}
                      />

                      {/* Design elements */}
                      {canvasElements.map((element) => {
                        if (element.type === "image") {
                          return (
                            <DesignImage
                              key={element.id}
                              image={element}
                              isSelected={element.id === selectedId}
                              onSelect={() => setSelectedId(element.id)}
                              onChange={(newAttrs) => {
                                setCanvasElements((prev) =>
                                  prev.map((el) =>
                                    el.id === element.id ? newAttrs : el
                                  )
                                );
                              }}
                            />
                          );
                        } else if (element.type === "text") {
                          return (
                            <DesignText
                              key={element.id}
                              text={element}
                              isSelected={element.id === selectedId}
                              onSelect={() => setSelectedId(element.id)}
                              onChange={(newAttrs) => {
                                setCanvasElements((prev) =>
                                  prev.map((el) =>
                                    el.id === element.id ? newAttrs : el
                                  )
                                );
                              }}
                            />
                          );
                        } else if (element.type === "rectangle") {
                          return (
                            <DesignRect
                              key={element.id}
                              shape={element}
                              isSelected={element.id === selectedId}
                              onSelect={() => setSelectedId(element.id)}
                              onChange={(newAttrs) => {
                                setCanvasElements((prev) =>
                                  prev.map((el) =>
                                    el.id === element.id ? newAttrs : el
                                  )
                                );
                              }}
                            />
                          );
                        } else if (element.type === "circle") {
                          return (
                            <DesignCircle
                              key={element.id}
                              shape={element}
                              isSelected={element.id === selectedId}
                              onSelect={() => setSelectedId(element.id)}
                              onChange={(newAttrs) => {
                                setCanvasElements((prev) =>
                                  prev.map((el) =>
                                    el.id === element.id ? newAttrs : el
                                  )
                                );
                              }}
                            />
                          );
                        } else if (element.type === "line") {
                          return (
                            <DesignLine
                              key={element.id}
                              shape={element}
                              isSelected={element.id === selectedId}
                              onSelect={() => setSelectedId(element.id)}
                              onChange={(newAttrs) => {
                                setCanvasElements((prev) =>
                                  prev.map((el) =>
                                    el.id === element.id ? newAttrs : el
                                  )
                                );
                              }}
                            />
                          );
                        } else if (element.type === "arrow") {
                          return (
                            <DesignArrow
                              key={element.id}
                              shape={element}
                              isSelected={element.id === selectedId}
                              onSelect={() => setSelectedId(element.id)}
                              onChange={(newAttrs) => {
                                setCanvasElements((prev) =>
                                  prev.map((el) =>
                                    el.id === element.id ? newAttrs : el
                                  )
                                );
                              }}
                            />
                          );
                        } else if (element.type === "star") {
                          return (
                            <DesignStar
                              key={element.id}
                              shape={element}
                              isSelected={element.id === selectedId}
                              onSelect={() => setSelectedId(element.id)}
                              onChange={(newAttrs) => {
                                setCanvasElements((prev) =>
                                  prev.map((el) =>
                                    el.id === element.id ? newAttrs : el
                                  )
                                );
                              }}
                            />
                          );
                        }
                        return null;
                      })}
                    </Layer>
                  </Stage>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <FaTshirt className="text-6xl text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">
                  Select a product to start designing
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  Choose a product from the right sidebar
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Designs;
