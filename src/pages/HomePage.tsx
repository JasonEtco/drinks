import { useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { useRecipes } from "../contexts/RecipeContext";
import RecipeList from "../components/RecipeList";
import BatchCalculator from "../components/BatchCalculator";
import ClarificationCalculator from "../components/ClarificationCalculator";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "@phosphor-icons/react";
import { WakeLockToggle } from "@/components/WakeLockToggle";
import Header from "@/components/Header";

export default function HomePage() {
  const { recipes, getRecipe, isLoading } = useRecipes();

  const [batchRecipeId, setBatchRecipeId] = useState<string | null>(null);
  const [clarifyRecipeId, setClarifyRecipeId] = useState<string | null>(null);

  // Memoize recipe lookups
  const batchRecipe = useMemo(
    () => (batchRecipeId ? getRecipe(batchRecipeId) : undefined),
    [batchRecipeId, getRecipe]
  );

  const clarifyRecipe = useMemo(
    () => (clarifyRecipeId ? getRecipe(clarifyRecipeId) : undefined),
    [clarifyRecipeId, getRecipe]
  );

  const handleBatchCalculate = useCallback((recipeId: string) => {
    setBatchRecipeId(recipeId);
  }, []);

  const handleClarify = useCallback((recipeId: string) => {
    setClarifyRecipeId(recipeId);
  }, []);

  const handleCloseBatch = useCallback(() => setBatchRecipeId(null), []);
  const handleCloseClarify = useCallback(() => setClarifyRecipeId(null), []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="text-center">
          <p>Loading recipes...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="space-y-6">
        <div className="space-y-4 mt-4">
          <RecipeList
            recipes={recipes}
            onBatchCalculate={handleBatchCalculate}
            onClarify={handleClarify}
          />
        </div>
      </div>
      {batchRecipe && (
        <BatchCalculator
          recipe={batchRecipe}
          open={!!batchRecipeId}
          onClose={handleCloseBatch}
        />
      )}
      {clarifyRecipe && (
        <ClarificationCalculator
          recipe={clarifyRecipe}
          open={!!clarifyRecipeId}
          onClose={handleCloseClarify}
        />
      )}
    </>
  );
}
