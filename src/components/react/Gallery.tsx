import { useState } from 'react';

import { Gallery as ReactGridGallery } from 'react-grid-gallery';
import Lightbox from 'yet-another-react-lightbox';
import Captions from 'yet-another-react-lightbox/plugins/captions';

import type { ImageProps } from '@/types/common';

import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/captions.css';

interface Props {
  images: ImageProps[];
}

const Gallery: React.FC<Props> = ({ images }) => {
  const [index, setIndex] = useState(-1);

  const handleClick = (index: number, _item: ImageProps) => setIndex(index);

  const slides = images.map((img) => ({
    src: img.originalSrc,
    title: img.link ? (
      <a
        href={img.link}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: '#fff',
          textDecoration: 'none',
          fontSize: '14px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(255,255,255,0.15)',
          border: '1px solid rgba(255,255,255,0.3)',
          borderRadius: '20px',
          padding: '8px 20px',
          transition: 'background 0.2s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.3)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
      >
        {img.caption} →
      </a>
    ) : undefined,
  }));

  return (
    <div>
      <ReactGridGallery images={images} onClick={handleClick} enableImageSelection={false} />
      <Lightbox
        open={index >= 0}
        close={() => setIndex(-1)}
        index={index}
        slides={slides}
        plugins={[Captions]}
        captions={{ showToggle: false }}
      />
    </div>
  );
};

export default Gallery;
