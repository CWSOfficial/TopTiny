import React from 'react';

const glyphs = {
  dashboard: 0xf523,
  users: 0xfea6,
  user: 0xfea0,
  venues: 0xf8f8,
  cities: 0xf705,
  add: 0xfaac,
  reviews: 0xfce9,
  reports: 0xf695,
  refresh: 0xfb34,
  chart: 0xf3ad,
  coffee: 0xf48f,
  edit: 0xf5c1,
  trash: 0xfe17,
  search: 0xfbba,
  camera: 0xf348,
  shield: 0xfbdb,
  arrow: 0xf1b4,
  list: 0xf8c4,
  import: 0xf664,
  check: 0xf3c8,
  close: 0xf4f6,
  lock: 0xf8d5,
};

export function Icon({ name, size = 16, className = '' }) {
  const glyph = glyphs[name];
  if (!glyph) return null;

  return (
    <span
      className={`flaticon-icon ${className}`.trim()}
      style={{ fontSize: size }}
      aria-hidden="true"
    >
      {String.fromCodePoint(glyph)}
    </span>
  );
}

export function BrandLogo({ tone = 'cream', className = '' }) {
  return (
    <img
      className={`brand-logo ${className}`.trim()}
      src={`/brand/toptini-logo-${tone}.png`}
      alt="TopTini"
    />
  );
}
