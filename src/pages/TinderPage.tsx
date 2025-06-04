import { useState, useCallback, useMemo } from "react";
import { useRecipes } from "../contexts/RecipeContext";
import { Button } from "@/components/ui/button";
import { HeartIcon, XIcon, ArrowClockwiseIcon } from "@phosphor-icons/react";
import SwipeableCard from "@/components/SwipeableCard";

const TinderPage = () => {
  const { recipes, isLoading } = useRecipes();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedRecipes, setLikedRecipes] = useState<string[]>([]);
  const [passedRecipes, setPassedRecipes] = useState<string[]>([]);

  // Shuffle recipes to make it more interesting
  const shuffledRecipes = useMemo(() => {
    return [...recipes].sort(() => Math.random() - 0.5);
  }, [recipes]);

  const currentRecipe = shuffledRecipes[currentIndex];

  const handleLike = useCallback(() => {
    if (currentRecipe) {
      setLikedRecipes((prev) => [...prev, currentRecipe.id]);
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentRecipe]);

  const handlePass = useCallback(() => {
    if (currentRecipe) {
      setPassedRecipes((prev) => [...prev, currentRecipe.id]);
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentRecipe]);

  const handleReset = useCallback(() => {
    setCurrentIndex(0);
    setLikedRecipes([]);
    setPassedRecipes([]);
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="text-center">
          <p>Loading drinks...</p>
        </div>
      </div>
    );
  }

  if (currentIndex >= shuffledRecipes.length) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold">No More Drinks!</h1>
          <p className="text-muted-foreground">
            You've swiped through all {shuffledRecipes.length} drinks.
          </p>
          <div className="space-y-2">
            <p className="text-sm">❤️ Liked: {likedRecipes.length} drinks</p>
            <p className="text-sm">👋 Passed: {passedRecipes.length} drinks</p>
          </div>
          <Button onClick={handleReset} className="mt-4">
            <ArrowClockwiseIcon className="h-4 w-4 mr-2" />
            Start Over
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold">Drink Tinder</h1>
        <p className="text-muted-foreground">
          Swipe through drinks and find your next favorite cocktail
        </p>
        <div className="text-sm text-muted-foreground">
          {currentIndex + 1} of {shuffledRecipes.length}
        </div>
      </div>

      {currentRecipe && (
        <div className="max-w-md mx-auto">
          <SwipeableCard
            recipe={currentRecipe}
            onSwipeLeft={handlePass}
            onSwipeRight={handleLike}
          />

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 mt-6">
            <Button
              variant="outline"
              size="lg"
              onClick={handlePass}
              className="rounded-full w-16 h-16 border-red-200 hover:border-red-300 hover:bg-red-50"
            >
              <XIcon className="h-6 w-6 text-red-500" />
            </Button>
            <Button
              size="lg"
              onClick={handleLike}
              className="rounded-full w-16 h-16 bg-green-600 hover:bg-green-700"
            >
              <HeartIcon className="h-6 w-6 text-white" />
            </Button>
          </div>

          {/* Progress indicator */}
          <div className="mt-4">
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${
                    ((currentIndex + 1) / shuffledRecipes.length) * 100
                  }%`,
                }}
              />
            </div>
          </div>

          {/* Swipe hints */}
          <div className="text-center mt-4 text-sm text-muted-foreground">
            Swipe right to ❤️ like • Swipe left to 👋 pass
          </div>
        </div>
      )}
    </div>
  );
};

export default TinderPage;
