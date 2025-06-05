import { useState, useCallback, useMemo } from "react";
import { useRecipes } from "../contexts/RecipeContext";
import { Button } from "@/components/ui/button";
import {
  HeartIcon,
  XIcon,
  ArrowClockwiseIcon,
  SparkleIcon,
} from "@phosphor-icons/react";
import SwipeableCard from "@/components/SwipeableCard";
import { ApiService } from "../lib/api";
import { Recipe } from "../lib/types";

function TinderPage() {
  const { recipes, isLoading } = useRecipes();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedRecipes, setLikedRecipes] = useState<string[]>([]);
  const [passedRecipes, setPassedRecipes] = useState<string[]>([]);
  const [generatedRecipes, setGeneratedRecipes] = useState<Recipe[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Combine original recipes with generated ones
  const allRecipes = useMemo(() => {
    return [...recipes, ...generatedRecipes];
  }, [recipes, generatedRecipes]);

  // Shuffle recipes to make it more interesting
  const shuffledRecipes = useMemo(() => {
    return [...allRecipes].sort(() => Math.random() - 0.5);
  }, [allRecipes]);

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
    setGeneratedRecipes([]);
  }, []);

  /**
   * Generate a new recipe based on the user's liked recipes
   * Uses the LLM to create a personalized cocktail recommendation
   */
  const handleGenerateFromLikes = useCallback(async () => {
    if (likedRecipes.length === 0) {
      return;
    }

    setIsGenerating(true);
    try {
      const generatedRecipe = await ApiService.generateRecipeFromLikes(
        likedRecipes,
        passedRecipes
      );

      // Add the generated recipe to our state
      setGeneratedRecipes((prev) => [...prev, generatedRecipe]);
      setCurrentIndex(shuffledRecipes.length); // Move to the end of the list

      // Optionally, move to the new recipe immediately
      // setCurrentIndex(shuffledRecipes.length);
    } catch (error) {
      console.error("Error generating recipe:", error);
      // You could add a toast notification here to show the error to the user
    } finally {
      setIsGenerating(false);
    }
  }, [likedRecipes, passedRecipes]);

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
      <div className="space-y-6 overflow-x-hidden w-full">
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold">No More Drinks!</h1>
          <p className="text-muted-foreground">
            You've swiped through all {shuffledRecipes.length} drinks.
          </p>
          <div className="space-y-2">
            <p className="text-sm">❤️ Liked: {likedRecipes.length} drinks</p>
            <p className="text-sm">👋 Passed: {passedRecipes.length} drinks</p>
          </div>
          <div className="flex flex-col gap-3 mt-4">
            {likedRecipes.length > 0 && (
              <Button
                onClick={handleGenerateFromLikes}
                disabled={isGenerating}
                variant="outline"
                className="border-purple-200 hover:border-purple-300 hover:bg-purple-50"
              >
                <SparkleIcon className="h-4 w-4 mr-2" />
                {isGenerating ? "Generating..." : "Generate Recipe from Likes"}
              </Button>
            )}
            <Button onClick={handleReset}>
              <ArrowClockwiseIcon className="h-4 w-4 mr-2" />
              Start Over
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-xl md:text-4xl font-bold mb-0">Drink Tinder</h1>
        <p className="text-muted-foreground text-sm">
          Swipe through drinks and find your next favorite cocktail
        </p>
      </div>

      {currentRecipe && (
        <div className="max-w-md mx-auto">
          <SwipeableCard
            recipe={currentRecipe}
            onSwipeLeft={handlePass}
            onSwipeRight={handleLike}
          />

          {/* Action Buttons */}
          <div className="fixed bottom-6 left-0 right-0 max-w-md mx-auto px-4">
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

            {/* Generate Recipe Button - Show when user has liked some recipes */}
            {likedRecipes.length > 0 && (
              <div className="flex justify-center mt-4">
                <Button
                  onClick={handleGenerateFromLikes}
                  disabled={isGenerating}
                  variant="outline"
                  size="sm"
                  className="border-purple-200 hover:border-purple-300 hover:bg-purple-50"
                >
                  <SparkleIcon className="h-4 w-4 mr-2" />
                  {isGenerating
                    ? "Generating..."
                    : "Generate Recipe from Likes"}
                </Button>
              </div>
            )}

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
              <p>Swipe right to ❤️ like • Swipe left to 👋 pass</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TinderPage;
