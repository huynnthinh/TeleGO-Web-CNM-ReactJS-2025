import React, { useState, useEffect, useRef } from "react";
import { BiZoomIn, BiZoomOut, BiX, BiDownload } from "react-icons/bi";

const ImageViewerModal = ({ isOpen, onClose, imageUrl, allImages }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [currentImage, setCurrentImage] = useState(imageUrl);
  const imageRef = useRef(null);
  const imageListRef = useRef(null); // Tham chiếu đến danh sách ảnh

  // console.log("allImages in ImageViewerModal:", allImages);

  // Reset scale, position, and current image when modal opens
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setCurrentImage(imageUrl);
    }
  }, [isOpen, imageUrl]);

  // Cuộn để ảnh được chọn luôn ở giữa danh sách
  useEffect(() => {
    if (imageListRef.current && allImages && allImages.length > 0) {
      const selectedIndex = allImages.findIndex((img) => img === currentImage);
      if (selectedIndex !== -1) {
        const imageList = imageListRef.current;
        const selectedThumbnail = imageList.children[selectedIndex];
        if (selectedThumbnail) {
          const listHeight = imageList.clientHeight;
          const thumbnailHeight = selectedThumbnail.offsetHeight;
          const scrollPosition =
            selectedThumbnail.offsetTop - listHeight / 2 + thumbnailHeight / 2;
          imageList.scrollTo({
            top: scrollPosition,
            behavior: "smooth",
          });
        }
      }
    }
  }, [currentImage, allImages]);

  const handleZoomIn = () => {
    setScale((prevScale) => Math.min(prevScale + 0.25, 3));
  };

  const handleZoomOut = () => {
    setScale((prevScale) => Math.max(prevScale - 0.25, 0.5));
  };

  const handleMouseDown = (e) => {
    if (scale > 1) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      setPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    if (scale > 1) {
      e.preventDefault();
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({
        x: touch.clientX - position.x,
        y: touch.clientY - position.y,
      });
    }
  };

  const handleTouchMove = (e) => {
    if (isDragging) {
      const touch = e.touches[0];
      const newX = touch.clientX - dragStart.x;
      const newY = touch.clientY - dragStart.y;
      setPosition({ x: newX, y: newY });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = currentImage;
    link.setAttribute("download", currentImage.split("/").pop() || "image.jpg");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImageClick = (url) => {
    setCurrentImage(url);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Image List on the Left */}
        <div className="image-list" ref={imageListRef}>
          {allImages && allImages.length > 0 ? (
            allImages.map((img, index) => (
              <div
                key={index}
                className={`thumbnail ${
                  currentImage === img ? "selected" : ""
                }`}
                onClick={() => handleImageClick(img)}
              >
                <img
                  src={img}
                  alt={`Thumbnail ${index}`}
                  onError={(e) => {
                    console.warn("Thumbnail load error:", img);
                    e.target.src = "/fallback-image.png";
                  }}
                />
              </div>
            ))
          ) : (
            <p className="no-images">Không có ảnh nào</p>
          )}
        </div>

        {/* Main Image Viewer */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="modal-buttons">
            <button className="modal-button" onClick={handleZoomIn}>
              <BiZoomIn size={24} />
            </button>
            <button className="modal-button" onClick={handleZoomOut}>
              <BiZoomOut size={24} />
            </button>
            <button className="modal-button" onClick={handleDownload}>
              <BiDownload size={24} />
            </button>
            <button className="modal-button" onClick={onClose}>
              <BiX size={24} />
            </button>
          </div>

          <div
            className="modal-image-container"
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          >
            <img
              ref={imageRef}
              src={currentImage}
              alt="Enlarged view"
              className="modal-image"
              style={{
                transform: `scale(${scale}) translate(${
                  position.x / scale
                }px, ${position.y / scale}px)`,
                cursor: scale > 1 ? "grab" : "default",
              }}
              onError={(e) => {
                console.warn("Image load error:", currentImage);
                e.target.src = "/fallback-image.png";
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageViewerModal;
