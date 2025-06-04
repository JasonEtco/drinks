import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GlassIcon } from "@/components/GlassIcon";
import { calculateTotalVolume } from "../lib/recipe-utils";
import { CategoryLabel } from "@/components/CategoryLabel";
import { Recipe } from "../lib/types";

interface SwipeableCardProps {
  recipe: Recipe;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  className?: string;
}

const SwipeableCard: React.FC<SwipeableCardProps> = ({
  recipe,
  onSwipeLeft,
  onSwipeRight,
  className = "",
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const startPos = useRef({ x: 0, y: 0 });

  const totalVolume = calculateTotalVolume(recipe);

  const handleStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    startPos.current = { x: clientX, y: clientY };
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;

    const deltaX = clientX - startPos.current.x;
    const deltaY = clientY - startPos.current.y;

    setDragOffset({ x: deltaX, y: deltaY });
    setRotation(deltaX * 0.1); // Slight rotation based on horizontal movement
  };

  const handleEnd = () => {
    if (!isDragging) return;

    setIsDragging(false);

    const threshold = 100; // Minimum swipe distance

    if (Math.abs(dragOffset.x) > threshold) {
      if (dragOffset.x > 0) {
        onSwipeRight(); // Swipe right = like
      } else {
        onSwipeLeft(); // Swipe left = pass
      }
    }

    // Reset position and rotation
    setDragOffset({ x: 0, y: 0 });
    setRotation(0);
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    handleStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  // Global mouse move and up events
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleMove(e.clientX, e.clientY);
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleEnd();
      }
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleGlobalMouseMove);
      document.addEventListener("mouseup", handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isDragging, startPos.current]);

  const cardStyle = {
    transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotation}deg)`,
    transition: isDragging ? "none" : "transform 0.3s ease-out",
    opacity: Math.abs(dragOffset.x) > 50 ? 1 - Math.abs(dragOffset.x) / 300 : 1,
    cursor: isDragging ? "grabbing" : "grab",
  };

  const overlayOpacity = Math.min(Math.abs(dragOffset.x) / 100, 0.8);
  const showLikeOverlay = dragOffset.x > 50;
  const showPassOverlay = dragOffset.x < -50;

  return (
    <div className={`relative select-none ${className}`}>
      <Card
        ref={cardRef}
        className="overflow-hidden relative"
        style={cardStyle}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Swipe overlays */}
        {showLikeOverlay && (
          <div
            className="absolute inset-0 bg-green-500 bg-opacity-20 flex items-center justify-center z-10"
            style={{ opacity: overlayOpacity }}
          >
            <div className="text-green-600 font-bold text-4xl transform rotate-12 border-4 border-green-600 rounded-lg px-4 py-2">
              LIKE
            </div>
          </div>
        )}

        {showPassOverlay && (
          <div
            className="absolute inset-0 bg-red-500 bg-opacity-20 flex items-center justify-center z-10"
            style={{ opacity: overlayOpacity }}
          >
            <div className="text-red-600 font-bold text-4xl transform -rotate-12 border-4 border-red-600 rounded-lg px-4 py-2">
              PASS
            </div>
          </div>
        )}

        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <CardTitle className="text-2xl md:text-3xl">
              {recipe.name}
            </CardTitle>
            {recipe.category && <CategoryLabel category={recipe.category} />}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold">Ingredients</h3>
              <Badge variant="outline">{totalVolume.toFixed(1)} oz total</Badge>
            </div>
            <ul className="space-y-2">
              {recipe.ingredients.map((ingredient, index) => (
                <li key={index} className="flex justify-between text-sm">
                  <span className="font-medium">{ingredient.name}</span>
                  <span className="text-muted-foreground">
                    {ingredient.amount} {ingredient.unit}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {recipe.instructions && (
            <div>
              <h3 className="font-semibold mb-2">Instructions</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {recipe.instructions}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recipe.glass && (
              <div className="flex items-center space-x-2">
                <GlassIcon
                  glassType={recipe.glass}
                  className="h-5 w-5 text-primary"
                />
                <div>
                  <span className="text-xs text-muted-foreground">Glass</span>
                  <p className="text-sm font-medium">{recipe.glass}</p>
                </div>
              </div>
            )}

            {recipe.garnish && (
              <div>
                <span className="text-xs text-muted-foreground">Garnish</span>
                <p className="text-sm font-medium">{recipe.garnish}</p>
              </div>
            )}
          </div>

          {recipe.tags && recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {recipe.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SwipeableCard;
