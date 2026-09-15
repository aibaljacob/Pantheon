import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Check, Move } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  fileName?: string;
  aspectRatio?: number; // e.g. 16/9, 3/1, 1/1
  cropShape?: 'rect' | 'round';
  title?: string;
  onClose: () => void;
  onCropComplete: (croppedFile: File, croppedPreviewUrl: string) => void;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  imageSrc,
  fileName = 'cropped-image.jpg',
  aspectRatio = 16 / 9,
  cropShape = 'rect',
  title = 'Crop & Choose Image Section',
  onClose,
  onCropComplete,
}) => {
  const [zoom, setZoom] = useState<number>(1.0);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [imgLoaded, setImgLoaded] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Reset zoom & offset on new image load or modal open
  useEffect(() => {
    if (isOpen) {
      setZoom(1.0);
      setOffset({ x: 0, y: 0 });
      setImgLoaded(false);
    }
  }, [isOpen, imageSrc]);

  // Clamp offset to ensure image fills crop frame completely
  const clampOffset = useCallback(
    (newOffset: { x: number; y: number }, currentZoom: number) => {
      if (!imgRef.current || !containerRef.current) return newOffset;
      const img = imgRef.current;
      const box = containerRef.current.getBoundingClientRect();

      const boxWidth = box.width;
      const boxHeight = box.height;

      const baseScale = Math.max(boxWidth / img.naturalWidth, boxHeight / img.naturalHeight);
      const currentScale = baseScale * currentZoom;

      const renderedW = img.naturalWidth * currentScale;
      const renderedH = img.naturalHeight * currentScale;

      const maxX = Math.max(0, (renderedW - boxWidth) / 2);
      const maxY = Math.max(0, (renderedH - boxHeight) / 2);

      return {
        x: Math.min(maxX, Math.max(-maxX, newOffset.x)),
        y: Math.min(maxY, Math.max(-maxY, newOffset.y)),
      };
    },
    [],
  );

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const rawX = e.clientX - dragStart.x;
    const rawY = e.clientY - dragStart.y;
    setOffset(clampOffset({ x: rawX, y: rawY }, zoom));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX - offset.x, y: touch.clientY - offset.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const rawX = touch.clientX - dragStart.x;
    const rawY = touch.clientY - dragStart.y;
    setOffset(clampOffset({ x: rawX, y: rawY }, zoom));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const nextZoom = Math.min(3.0, Math.max(1.0, parseFloat((zoom + delta).toFixed(2))));
    setZoom(nextZoom);
    setOffset((prev) => clampOffset(prev, nextZoom));
  };

  const handleReset = () => {
    setZoom(1.0);
    setOffset({ x: 0, y: 0 });
  };

  // Generate high-resolution cropped canvas & export File
  const handleApplyCrop = () => {
    if (!imgRef.current || !containerRef.current) return;
    const img = imgRef.current;
    const box = containerRef.current.getBoundingClientRect();

    const boxWidth = box.width;
    const boxHeight = box.height;

    const baseScale = Math.max(boxWidth / img.naturalWidth, boxHeight / img.naturalHeight);
    const currentScale = baseScale * zoom;

    // Source coordinates on original image
    const srcW = boxWidth / currentScale;
    const srcH = boxHeight / currentScale;
    const srcX = (img.naturalWidth - srcW) / 2 - offset.x / currentScale;
    const srcY = (img.naturalHeight - srcH) / 2 - offset.y / currentScale;

    // Output target resolution
    const outputW = Math.min(1920, Math.max(400, Math.round(srcW)));
    const outputH = Math.round(outputW / aspectRatio);

    const canvas = document.createElement('canvas');
    canvas.width = outputW;
    canvas.height = outputH;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Draw source crop region onto output canvas
    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, outputW, outputH);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const cleanName = fileName.replace(/\.[^/.]+$/, '') + '-cropped.jpeg';
        const file = new File([blob], cleanName, { type: 'image/jpeg' });
        const previewUrl = URL.createObjectURL(blob);
        onCropComplete(file, previewUrl);
        onClose();
      },
      'image/jpeg',
      0.92,
    );
  };

  if (!isOpen) return null;

  // Viewport Box Dimensions
  const maxBoxWidth = 520;
  const computedBoxHeight = Math.min(360, Math.round(maxBoxWidth / aspectRatio));

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
      <div className="relative w-full max-w-xl rounded-3xl border border-[#363433] bg-[#1c1b1a] p-6 shadow-2xl space-y-5 flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2b2a29] pb-4">
          <div className="flex items-center gap-2">
            <Move className="h-5 w-5 text-amber-400" />
            <div>
              <h2 className="font-headline text-lg font-bold text-[#ffffff]">{title}</h2>
              <p className="text-xs text-[#8c887e]">Drag to position & scroll or use slider to scale</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#363433] bg-[#141312] p-1.5 text-[#8c887e] hover:text-[#ffffff]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Interactive Crop Viewport Frame */}
        <div className="flex justify-center items-center py-2 select-none">
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
            style={{
              width: `${maxBoxWidth}px`,
              height: `${computedBoxHeight}px`,
              maxWidth: '100%',
            }}
            className={`relative overflow-hidden cursor-grab active:cursor-grabbing border-2 border-amber-500/80 shadow-2xl bg-[#0f0e0d] ${
              cropShape === 'round' ? 'rounded-full' : 'rounded-2xl'
            }`}
          >
            {/* Source Image */}
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Crop target"
              onLoad={() => setImgLoaded(true)}
              draggable={false}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
                maxHeight: 'none',
                maxWidth: 'none',
                height: '100%',
                width: '100%',
                objectFit: 'cover',
                pointerEvents: 'none',
              }}
            />

            {/* Grid Overlay / Guidelines */}
            <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 border border-white/20">
              <div className="border-r border-b border-white/10" />
              <div className="border-r border-b border-white/10" />
              <div className="border-b border-white/10" />
              <div className="border-r border-b border-white/10" />
              <div className="border-r border-b border-white/10" />
              <div className="border-b border-white/10" />
              <div className="border-r border-white/10" />
              <div className="border-r border-white/10" />
              <div />
            </div>
          </div>
        </div>

        {/* Controls Bar: Zoom Slider & Reset */}
        <div className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-4 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
          <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(1.0, parseFloat((z - 0.1).toFixed(2))))}
              className="text-[#cac6bc] hover:text-[#ffffff] p-1"
              title="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>

            <input
              type="range"
              min="1.0"
              max="3.0"
              step="0.05"
              value={zoom}
              onChange={(e) => {
                const nextZoom = parseFloat(e.target.value);
                setZoom(nextZoom);
                setOffset((prev) => clampOffset(prev, nextZoom));
              }}
              className="w-full accent-amber-400 bg-[#2b2a29] rounded-lg h-1.5 cursor-pointer"
            />

            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(3.0, parseFloat((z + 0.1).toFixed(2))))}
              className="text-[#cac6bc] hover:text-[#ffffff] p-1"
              title="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </button>

            <span className="text-[#8c887e] w-12 text-right">{Math.round(zoom * 100)}%</span>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#363433] bg-[#201f1e] px-3 py-1.5 text-[#cac6bc] hover:border-[#e6e2df] hover:text-[#ffffff] transition-colors shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Position</span>
          </button>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-[#2b2a29] pt-4">
          <Button variant="secondary" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="button"
            onClick={handleApplyCrop}
            disabled={!imgLoaded}
            icon={<Check className="h-4 w-4" />}
          >
            Apply Crop & Use Image
          </Button>
        </div>
      </div>
    </div>
  );
};
