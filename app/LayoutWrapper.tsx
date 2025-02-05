"use client"; // Mark this as a client component
import { usePathname } from "next/navigation";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname(); // Get current path

  return pathname === "/" ? (
    // Video Background for the home page
    <div className="relative w-full h-screen overflow-hidden">
      <video
        autoPlay
        loop
        muted
        className="absolute top-0 left-0 w-full h-full object-cover"
      >
        <source src="/video-bg.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Overlay (optional) */}
      <div className="absolute inset-0 bg-black bg-opacity-20"></div>

      {/* Content */}
      <div className="relative z-10">
        <div className="container mx-auto">{children}</div>
      </div>
    </div>
  ) : (
    // Normal layout for other pages
    <div className="container mx-auto bg-white">{children}</div>
  );
}
