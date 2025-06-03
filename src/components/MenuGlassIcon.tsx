import React from "react";
import { GlassType } from "../lib/types";
import coupe from "../icons/coupe.svg";

interface MenuGlassIconProps {
  glassType?: GlassType;
  className?: string;
}

const MenuGlassIcon: React.FC<MenuGlassIconProps> = ({
  glassType,
  className = "h-6 w-6",
}) => {
  const getGlassIcon = (glass?: GlassType) => {
    switch (glass) {
      case GlassType.MARTINI:
        return (
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full"
            fill="currentColor"
          >
            <path d="M77.2 21.3c.3-.6.2-1.3-.2-1.9s-1-.9-1.7-.9H24.6c-.7 0-1.3.3-1.7.9s-.4 1.3-.2 1.9c3.9 9.3 20.6 15.9 25.4 17.6v33.6l-16.9 4c-1.3.3-2.1 1.4-1.9 2.7s1.2 2.2 2.5 2.2h36.7c1.3 0 2.3-.9 2.5-2.2s-.6-2.4-1.9-2.7l-16.9-4V38.8c5.1-1.9 21.2-8.4 25-17.5M50 35.3c-5.3-1.8-16.9-6.8-21.8-12.8h43.6c-4.9 6-16.5 11-21.8 12.8" />
          </svg>
        );
      case GlassType.COUPE:
        return coupe;
      case GlassType.ROCKS:
      case GlassType.DOUBLE_ROCKS:
        return (
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full"
            fill="currentColor"
          >
            <path d="M66.6 18.6c-9 0-16.4 6.8-17.4 15.5H25.1c-.9 0-1.7.6-1.9 1.5-1.7 6.1-4.8 18.2-6.4 26.7-.5 2.5-.8 4.5-.9 5.9-.2 2.4.5 4.8 1.9 6.7 1 1.3 2.5 3 4.2 4.6 1.3 1.2 3 1.9 4.9 1.9h37.9c1.8 0 3.5-.7 4.9-1.9 1.7-1.6 3.2-3.2 4.2-4.6 1.5-1.9 2.1-4.3 1.9-6.7-.1-1.5-.4-3.5-.9-5.9-.6-3-1.3-6.4-2.1-9.8 6.6-2.5 11.3-8.9 11.3-16.3 0-9.7-7.8-17.6-17.5-17.6M26.7 38.1h22.5c1 8.7 8.4 15.5 17.4 15.5.8 0 1.6-.1 2.4-.2.7 3.1 1.4 6.1 1.9 8.8-.1.1-.1.2-.2.2-.9 1.2-2.2 2.6-3.8 4.1-.6.5-1.3.8-2.1.8H26.9c-.8 0-1.6-.3-2.1-.8-1.5-1.4-2.9-2.9-3.8-4.1l-.2-.2c1.6-7.6 4.2-17.9 5.9-24.1" />
          </svg>
        );
      case GlassType.WINE:
        return (
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full"
            fill="currentColor"
          >
            <path d="M71.9 6.4c-.1 0-.1 0-.2 0H28.3c-.1 0-.1 0-.2 0-1.1 0-2 .9-2 2s.9 2 2 2h7.5v24.9c0 12.9 9.1 23.8 21.2 26.2v21.1h-8.6c-1.1 0-2 .9-2 2s.9 2 2 2h21.6c1.1 0 2-.9 2-2s-.9-2-2-2h-8.6V61.5c12.1-2.4 21.2-13.3 21.2-26.2V10.4h7.5c1.1 0 2-.9 2-2s-.9-2-2-2M65.8 10.4v24.9c0 10.6-8.6 19.2-19.2 19.2s-19.2-8.6-19.2-19.2V10.4h38.4z" />
          </svg>
        );
      case GlassType.FLUTE:
        return (
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full"
            fill="currentColor"
          >
            <path d="M58.7 8.7c-.4-.7-1.1-1.1-1.9-1.1H43.2c-.8 0-1.5.4-1.9 1.1-.4.7-.3 1.5.1 2.1L50 25.7l8.6-14.9c.4-.6.5-1.4.1-2.1M51 77.9h-2V30.2l11.8-20.4h-2.5L50 26.2 41.7 9.8h-2.5L51 30.2v47.7z" />
          </svg>
        );
      case GlassType.COLLINS:
      case GlassType.HIGHBALL:
        return (
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full"
            fill="currentColor"
          >
            <path d="M65.9 12.4H34.1c-1.9 0-3.5 1.6-3.5 3.5v68.2c0 1.9 1.6 3.5 3.5 3.5h31.8c1.9 0 3.5-1.6 3.5-3.5V15.9c0-1.9-1.6-3.5-3.5-3.5M65.4 83.6H34.6V16.4h30.8v67.2z" />
          </svg>
        );
      case GlassType.NICK_AND_NORA:
        return (
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full"
            fill="currentColor"
          >
            <path d="M71.9 6.4c-.1 0-.1 0-.2 0H28.3c-.1 0-.1 0-.2 0-1.1 0-2 .9-2 2s.9 2 2 2h7.5v24.9c0 12.9 9.1 23.8 21.2 26.2v21.1h-8.6c-1.1 0-2 .9-2 2s.9 2 2 2h21.6c1.1 0 2-.9 2-2s-.9-2-2-2h-8.6V61.5c12.1-2.4 21.2-13.3 21.2-26.2V10.4h7.5c1.1 0 2-.9 2-2s-.9-2-2-2" />
          </svg>
        );
      case GlassType.HURRICANE:
      case GlassType.TIKI:
        return (
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full"
            fill="currentColor"
          >
            <path d="M64.5 15.3c-2.8 0-5.5.8-7.9 2.3-.5-1.3-1.3-2.5-2.3-3.5-2.1-2.1-4.9-3.3-7.8-3.3s-5.7 1.2-7.8 3.3c-1 1-1.8 2.2-2.3 3.5-2.4-1.5-5.1-2.3-7.9-2.3-8.3 0-15.1 6.8-15.1 15.1 0 2.8.8 5.5 2.3 7.9-1.5 2.4-2.3 5.1-2.3 7.9 0 8.3 6.8 15.1 15.1 15.1 2.8 0 5.5-.8 7.9-2.3 2.4 1.5 5.1 2.3 7.9 2.3s5.5-.8 7.9-2.3c2.4 1.5 5.1 2.3 7.9 2.3 8.3 0 15.1-6.8 15.1-15.1 0-2.8-.8-5.5-2.3-7.9 1.5-2.4 2.3-5.1 2.3-7.9 0-8.3-6.8-15.1-15.1-15.1" />
          </svg>
        );
      case GlassType.COPPER_MUG:
      case GlassType.JULEP:
        return (
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full"
            fill="currentColor"
          >
            <path d="M72.1 25.4H61.5V19c0-3.3-2.7-6-6-6H27.9c-3.3 0-6 2.7-6 6v56.6c0 3.3 2.7 6 6 6h27.6c3.3 0 6-2.7 6-6v-6.4h10.6c7.7 0 14-6.3 14-14V39.4c0-7.7-6.3-14-14-14M58.1 75.6c0 1.5-1.2 2.6-2.6 2.6H27.9c-1.5 0-2.6-1.2-2.6-2.6V19c0-1.5 1.2-2.6 2.6-2.6h27.6c1.5 0 2.6 1.2 2.6 2.6v56.6zm24.6-20.6c0 6-4.9 10.9-10.9 10.9H61.5V28.5h10.3c6 0 10.9 4.9 10.9 10.9V55z" />
          </svg>
        );
      default:
        return (
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full"
            fill="currentColor"
          >
            <path d="M77.2 21.3c.3-.6.2-1.3-.2-1.9s-1-.9-1.7-.9H24.6c-.7 0-1.3.3-1.7.9s-.4 1.3-.2 1.9c3.9 9.3 20.6 15.9 25.4 17.6v33.6l-16.9 4c-1.3.3-2.1 1.4-1.9 2.7s1.2 2.2 2.5 2.2h36.7c1.3 0 2.3-.9 2.5-2.2s-.6-2.4-1.9-2.7l-16.9-4V38.8c5.1-1.9 21.2-8.4 25-17.5M50 35.3c-5.3-1.8-16.9-6.8-21.8-12.8h43.6c-4.9 6-16.5 11-21.8 12.8" />
          </svg>
        );
    }
  };

  return (
    <div
      className={`${className} flex items-center justify-center text-muted-foreground`}
    >
      {getGlassIcon(glassType)}
    </div>
  );
};

export default MenuGlassIcon;
