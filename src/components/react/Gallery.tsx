import { useState } from 'react';

import { Gallery as ReactGridGallery } from 'react-grid-gallery';
import Lightbox from 'react-image-lightbox';

import type { ImageProps } from '@/types/common';

import 'react-image-lightbox/style.css';

interface Props {
  images: ImageProps[];
}

// global polyfill for react-image-lightbox
window.global = window.global || window;

const CaptionComponent = ({ image }: { image: ImageProps }) => (
  <div
    style={{
      position: 'fixed',
      top: '80px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      padding: '8px 16px',
      borderRadius: '4px',
      zIndex: 2000,
      fontFamily: 'system-ui, sans-serif',
      textAlign: 'center',
      minWidth: '120px',
    }}
  >
    <a
      href={image.link}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        color: '#fff',
        textDecoration: 'underline',
        cursor: 'pointer',
        fontSize: '14px',
        display: 'block',
        lineHeight: '1.4',
        whiteSpace: 'nowrap',
      }}
    >
      {image.caption}
    </a>
  </div>
);

const Gallery: React.FC<Props> = ({ images }) => {
  const [index, setIndex] = useState(-1);

  const currentImage = images[index];
  const nextIndex = (index + 1) % images.length;
  const nextImage = images[nextIndex] || currentImage;
  const prevIndex = (index + images.length - 1) % images.length;
  const prevImage = images[prevIndex] || currentImage;

  const handleClick = (index: number, _item: ImageProps) => setIndex(index);
  const handleClose = () => setIndex(-1);
  const handleMovePrev = () => setIndex(prevIndex);
  const handleMoveNext = () => setIndex(nextIndex);

  return (
    <div>
      <ReactGridGallery images={images} onClick={handleClick} enableImageSelection={false} />
      {!!currentImage && (
        <Lightbox
          mainSrc={currentImage.originalSrc}
          mainSrcThumbnail={currentImage.src}
          nextSrc={nextImage.originalSrc}
          nextSrcThumbnail={nextImage.src}
          prevSrc={prevImage.originalSrc}
          prevSrcThumbnail={prevImage.src}
          onCloseRequest={handleClose}
          onMovePrevRequest={handleMovePrev}
          onMoveNextRequest={handleMoveNext}
          imageCaption={<CaptionComponent image={currentImage} />}
          imagePadding={80}
        />
      )}
    </div>
  );
};

export default Gallery;
