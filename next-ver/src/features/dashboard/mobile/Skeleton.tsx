"use client";

// Shimmer block for mobile loading states. Reserves final layout height so cards
// don't "dance" when data arrives. Shimmer recipe lives in globals.css (.ft-skel).
interface Props {
  width?: number | string;
  height?: number | string;
  radius?: number;
  style?: React.CSSProperties;
}

export default function Skeleton({ width = "100%", height = 12, radius, style }: Props) {
  return (
    <span
      aria-hidden
      className="ft-skel"
      style={{
        display: "block",
        width,
        height,
        borderRadius: radius,
        ...style,
      }}
    />
  );
}
