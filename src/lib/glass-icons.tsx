import React from 'react';
import {
  Wine,
  BeerBottle,
  GlassHalf,
  CoffeeCup,
  Cup,
  Glass
} from '@phosphor-icons/react';
import { GlassType } from './types';

export interface GlassIconProps {
  glassType: GlassType | undefined;
  className?: string;
}

export const GlassIcon: React.FC<GlassIconProps> = ({ glassType, className = "h-4 w-4" }) => {
  switch (glassType) {
    case GlassType.COUPE:
      return <Wine weight="fill" className={className} />;
    case GlassType.MARTINI:
      return <Cup weight="fill" className={className} />;
    case GlassType.ROCKS:
    case GlassType.DOUBLE_ROCKS:
      return <Glass weight="fill" className={className} />;
    case GlassType.COLLINS:
    case GlassType.HIGHBALL:
      return <BeerBottle weight="fill" className={className} />;
    case GlassType.NICK_AND_NORA:
      return <Wine weight="fill" className={className} />;
    case GlassType.WINE:
      return <Wine weight="fill" className={className} />;
    case GlassType.FLUTE:
      return <Cup weight="fill" className={className} />;
    case GlassType.HURRICANE:
    case GlassType.TIKI:
      return <CoffeeCup weight="fill" className={className} />;
    case GlassType.COPPER_MUG:
      return <CoffeeCup weight="fill" className={className} />;
    case GlassType.JULEP:
      return <CoffeeCup weight="fill" className={className} />;
    case GlassType.OTHER:
    default:
      return <GlassHalf weight="fill" className={className} />;
  }
};

export const getGlassIcon = (glassType: GlassType | undefined): JSX.Element => {
  return <GlassIcon glassType={glassType} />;
};