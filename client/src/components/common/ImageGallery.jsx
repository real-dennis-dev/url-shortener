// ImageGallery.jsx
export const ImageGallery = ({
  images,
  className = "",
  columns = 3,
  aspectRatio = "1/1",
}) => {
  const [selectedImage, setSelectedImage] = React.useState(0);

  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
  };

  return (
    <div className={className}>
      {/* Main image */}
      {images.length > 0 && (
        <div className="mb-4 overflow-hidden rounded-lg bg-neutral-200">
          <img
            src={images[selectedImage]}
            alt={`Gallery image ${selectedImage + 1}`}
            className="h-full w-full object-cover"
            style={{ aspectRatio }}
          />
        </div>
      )}

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className={`grid gap-2 ${gridCols[columns]}`}>
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={`
                overflow-hidden rounded-lg transition-all
                ${
                  index === selectedImage
                    ? "ring-2 ring-primary-500"
                    : "opacity-70 hover:opacity-100"
                }
              `}
            >
              <img
                src={image}
                alt={`Thumbnail ${index + 1}`}
                className="h-full w-full object-cover"
                style={{ aspectRatio }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
