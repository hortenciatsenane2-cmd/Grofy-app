import React from 'react';

interface GrofyLogoProps {
  className?: string;
  size?: number | string;
}

export default function GrofyLogo({ className = '', size = 24 }: GrofyLogoProps) {
  return (
    <svg
      id="grofy-logo-svg"
      viewBox="0 0 500 500"
      width={size}
      height={size}
      className={`inline-block select-none flex-shrink-0 ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g>
        {/* We use a mask for the inner elegant F cutout so it's fully transparent under the monogram */}
        <mask id="grofy-logo-clean-mask">
          {/* Base shape showing everything */}
          <rect width="500" height="500" fill="white" />
          
          {/* Inner custom calligraphic F-swoop cutout (drawn in black to hide from G) */}
          <path
            d="M 235 155
               C 178 140, 142 195, 148 265
               C 152 310, 172 342, 218 368
               C 275 400, 322 355, 328 318
               C 310 270, 278 245, 255 245
               C 230 245, 215 258, 222 284
               C 230 315, 280 348, 290 322
               C 294 312, 280 292, 260 290
               C 242 288, 235 258, 245 220
               C 255 180, 298 168, 312 165
               C 328 162, 332 153, 312 153
               C 292 153, 268 162, 235 155 Z"
            fill="black"
          />
        </mask>

        {/* The elegant high-contrast Serif G shape, matching the uploaded Didot/Bodoni premium style logo */}
        <path
          d="M 368 115
             C 375 92, 355 50, 250 50
             C 125 50, 48 135, 48 245
             C 48 355, 138 450, 250 450
             C 345 450, 396 385, 396 312
             L 396 215
             L 245 215
             L 245 260
             L 348 260
             C 348 260, 345 320, 328 350
             C 305 390, 275 408, 240 408
             C 172 408, 108 340, 108 245
             C 108 148, 178 92, 255 92
             C 298 92, 328 108, 348 128
             C 355 135, 362 142, 368 142
             C 373 142, 375 130, 368 115 Z"
          fill="currentColor"
          mask="url(#grofy-logo-clean-mask)"
        />

        {/* Elegant cross-bar detail of serif "G" monogram matching the upscale design */}
        <path
          d="M 245 215 L 245 260 L 265 260 L 265 215 Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}
