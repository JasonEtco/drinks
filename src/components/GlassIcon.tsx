import React from "react";
import { GlassType } from "../lib/types";

import Beer from "@/icons/beer.svg?react";
import Champagne from "@/icons/champagne.svg?react";
import Coupe from "@/icons/coupe.svg?react";
import Margarita from "@/icons/margarita.svg?react";
import MartiniWheel from "@/icons/martini-wheel.svg?react";
import Martini from "@/icons/martini.svg?react";
import NickAndNora from "@/icons/nick-and-nora.svg?react";
import RocksWheel from "@/icons/rocks-wheel.svg?react";
import Rocks from "@/icons/rocks.svg?react";
import WhiskeyWheel from "@/icons/whiskey-wheel.svg?react";
import Whiskey from "@/icons/whiskey.svg?react";
import Wine from "@/icons/wine.svg?react";

interface GlassIconProps {
  glassType?: GlassType;
  className?: string;
}

function getGlassIcon(
  glass?: GlassType
): React.FunctionComponent<React.SVGProps<SVGSVGElement>> {
  switch (glass) {
    case GlassType.MARTINI:
      return Martini;
    case GlassType.COUPE:
      return Coupe;
    case GlassType.ROCKS:
    case GlassType.DOUBLE_ROCKS:
      return Rocks;
    case GlassType.WINE:
      return Wine;
    case GlassType.FLUTE:
      return Champagne;
    // TODO: Better collins/highball
    case GlassType.COLLINS:
    case GlassType.HIGHBALL:
      return Beer;
    case GlassType.NICK_AND_NORA:
      return NickAndNora;
    // TODO: Better Tiki
    case GlassType.HURRICANE:
    case GlassType.TIKI:
      return Margarita;
    // TODO: Better copper mug
    case GlassType.COPPER_MUG:
    case GlassType.JULEP:
      return WhiskeyWheel;
    default:
      return RocksWheel;
  }
}

export function GlassIcon({ glassType }: GlassIconProps) {
  const GlassIcon = getGlassIcon(glassType);
  return <GlassIcon className="w-full h-full" fill="currentColor" />;
}
