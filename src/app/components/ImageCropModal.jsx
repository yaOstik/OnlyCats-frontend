import { useEffect, useMemo, useState } from 'react';

const PREVIEW_WIDTH = 320;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export default function ImageCropModal({
  isOpen,
  file,
  title = 'Crop image',
  aspect = 1,
  shape = 'square',
  onCancel,
  onApply,
}) {
  const [imageUrl, setImageUrl] = useState('');
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [busy, setBusy] = useState(false);

  const previewHeight = useMemo(() => Math.round(PREVIEW_WIDTH / aspect), [aspect]);

  useEffect(() => {
    if (!file || !isOpen) {
      setImageUrl('');
      setImageSize({ width: 0, height: 0 });
      return undefined;
    }

    const nextUrl = URL.createObjectURL(file);
    setImageUrl(nextUrl);
    setZoom(1);
    setOffsetX(0);
    setOffsetY(0);

    const image = new Image();
    image.onload = () => {
      setImageSize({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.src = nextUrl;

    return () => URL.revokeObjectURL(nextUrl);
  }, [file, isOpen]);

  if (!isOpen || !file) return null;

  const baseScale =
    imageSize.width && imageSize.height
      ? Math.max(PREVIEW_WIDTH / imageSize.width, previewHeight / imageSize.height)
      : 1;

  const renderScale = baseScale * zoom;
  const displayedWidth = imageSize.width * renderScale;
  const displayedHeight = imageSize.height * renderScale;

  const maxPanX = Math.max(0, (displayedWidth - PREVIEW_WIDTH) / 2);
  const maxPanY = Math.max(0, (displayedHeight - previewHeight) / 2);
  const translateX = clamp(offsetX, -100, 100) * (maxPanX / 100);
  const translateY = clamp(offsetY, -100, 100) * (maxPanY / 100);

  const createCroppedBlob = () =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        const outputWidth = 1200;
        const outputHeight = Math.max(1, Math.round(outputWidth / aspect));
        const canvas = document.createElement('canvas');
        canvas.width = outputWidth;
        canvas.height = outputHeight;
        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('Failed to create canvas context.'));
          return;
        }

        const localBaseScale = Math.max(
          PREVIEW_WIDTH / image.naturalWidth,
          previewHeight / image.naturalHeight,
        );
        const localRenderScale = localBaseScale * zoom;
        const localDisplayedWidth = image.naturalWidth * localRenderScale;
        const localDisplayedHeight = image.naturalHeight * localRenderScale;
        const localMaxPanX = Math.max(0, (localDisplayedWidth - PREVIEW_WIDTH) / 2);
        const localMaxPanY = Math.max(0, (localDisplayedHeight - previewHeight) / 2);
        const localTranslateX = clamp(offsetX, -100, 100) * (localMaxPanX / 100);
        const localTranslateY = clamp(offsetY, -100, 100) * (localMaxPanY / 100);

        const imageTopLeftX = (PREVIEW_WIDTH - localDisplayedWidth) / 2 + localTranslateX;
        const imageTopLeftY = (previewHeight - localDisplayedHeight) / 2 + localTranslateY;

        const sourceX = (0 - imageTopLeftX) / localRenderScale;
        const sourceY = (0 - imageTopLeftY) / localRenderScale;
        const sourceWidth = PREVIEW_WIDTH / localRenderScale;
        const sourceHeight = previewHeight / localRenderScale;

        context.drawImage(
          image,
          sourceX,
          sourceY,
          sourceWidth,
          sourceHeight,
          0,
          0,
          outputWidth,
          outputHeight,
        );

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to export cropped image.'));
              return;
            }
            const extension = file.type?.includes('png') ? 'png' : 'jpg';
            const croppedFile = new File([blob], `cropped-${Date.now()}.${extension}`, {
              type: blob.type || file.type || 'image/jpeg',
            });
            resolve(croppedFile);
          },
          file.type || 'image/jpeg',
          0.95,
        );
      };
      image.onerror = () => reject(new Error('Failed to load image for cropping.'));
      image.src = imageUrl;
    });

  const handleApply = async () => {
    setBusy(true);
    try {
      const croppedFile = await createCroppedBlob();
      onApply(croppedFile);
    } catch (error) {
      alert(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1400] flex items-center justify-center bg-gray-900/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[28px] border border-fuchsia-100 bg-white p-5 sm:p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-black text-gray-900">{title}</h3>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl p-2 text-gray-400 hover:bg-fuchsia-50 hover:text-[#d946ef]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="relative mx-auto overflow-hidden rounded-2xl border border-fuchsia-100 bg-gray-50">
          <div style={{ width: PREVIEW_WIDTH, height: previewHeight }} className="relative max-w-full">
            {imageUrl && (
              <img
                src={imageUrl}
                alt="Crop preview"
                className="h-full w-full object-cover"
                style={{
                  width: displayedWidth || '100%',
                  height: displayedHeight || '100%',
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: `translate(calc(-50% + ${translateX}px), calc(-50% + ${translateY}px))`,
                  maxWidth: 'none',
                }}
              />
            )}

            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-1/3 top-0 h-full w-px bg-white/70" />
              <div className="absolute left-2/3 top-0 h-full w-px bg-white/70" />
              <div className="absolute left-0 top-1/3 h-px w-full bg-white/70" />
              <div className="absolute left-0 top-2/3 h-px w-full bg-white/70" />
              {shape === 'circle' && (
                <div className="absolute inset-2 rounded-full border-2 border-white shadow-[inset_0_0_0_2000px_rgba(0,0,0,0.15)]" />
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <label className="block">
            <div className="mb-1 flex items-center justify-between text-xs font-black uppercase tracking-wider text-gray-500">
              <span>Zoom</span>
              <span>{zoom.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="w-full accent-[#d946ef]"
            />
          </label>

          <label className="block">
            <div className="mb-1 flex items-center justify-between text-xs font-black uppercase tracking-wider text-gray-500">
              <span>Horizontal</span>
              <span>{offsetX}</span>
            </div>
            <input
              type="range"
              min={-100}
              max={100}
              step={1}
              value={offsetX}
              onChange={(event) => setOffsetX(Number(event.target.value))}
              className="w-full accent-[#d946ef]"
            />
          </label>

          <label className="block">
            <div className="mb-1 flex items-center justify-between text-xs font-black uppercase tracking-wider text-gray-500">
              <span>Vertical</span>
              <span>{offsetY}</span>
            </div>
            <input
              type="range"
              min={-100}
              max={100}
              step={1}
              value={offsetY}
              onChange={(event) => setOffsetY(Number(event.target.value))}
              className="w-full accent-[#d946ef]"
            />
          </label>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={busy}
            className="rounded-xl bg-[#d946ef] px-4 py-2.5 text-sm font-black text-white hover:bg-[#c026d3] disabled:opacity-60"
          >
            {busy ? 'Cropping...' : 'Apply Crop'}
          </button>
        </div>
      </div>
    </div>
  );
}
