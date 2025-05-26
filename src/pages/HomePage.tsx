import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRecipes } from "../contexts/RecipeContext";
import RecipeList from "../components/RecipeList";
import BatchCalculator from "../components/BatchCalculator";
import ClarificationCalculator from "../components/ClarificationCalculator";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Plus, DeviceMobile } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { useWakeLock } from "@/hooks/use-wake-lock";

const HomePage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const wakeLock = useWakeLock();
  const {
    recipes,
    removeRecipe,
    getRecipe,
    isLoading,
  } = useRecipes();

  const [batchRecipeId, setBatchRecipeId] = useState<string | null>(null);
  const [clarifyRecipeId, setClarifyRecipeId] = useState<string | null>(null);

  const batchRecipe = batchRecipeId ? getRecipe(batchRecipeId) : undefined;
  const clarifyRecipe = clarifyRecipeId
    ? getRecipe(clarifyRecipeId)
    : undefined;

  const handleCreateRecipe = () => {
    navigate("/recipes/new");
  };

  const handleWakeLockToggle = async (pressed: boolean) => {
    try {
      if (pressed) {
        await wakeLock.request();
        toast.success("Screen will stay awake");
      } else {
        await wakeLock.release();
        toast.success("Screen can now sleep normally");
      }
    } catch (error) {
      toast.error("Failed to toggle screen wake lock");
      console.error("Wake lock toggle error:", error);
    }
  };

  const handleEditRecipe = (recipeId: string) => {
    navigate(`/recipes/${recipeId}/edit`);
  };

  const handleBatchCalculate = (recipeId: string) => {
    setBatchRecipeId(recipeId);
  };

  const handleClarify = (recipeId: string) => {
    setClarifyRecipeId(recipeId);
  };

  const handleDeleteRecipe = (recipeId: string) => {
    removeRecipe(recipeId);
    toast.success("Recipe successfully deleted.");
  };

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
      <header className="mb-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-bold">Drinks</h1>
          
          {/* Mobile sleep prevention toggle - only show on mobile devices */}
          {isMobile && wakeLock.isSupported && (
            <div className="flex items-center gap-2">
              <Toggle
                pressed={wakeLock.isActive}
                onPressedChange={handleWakeLockToggle}
                variant="outline"
                size="sm"
                aria-label="Keep screen awake"
                className="text-xs"
              >
                <DeviceMobile className="h-3 w-3 mr-1" />
                {wakeLock.isActive ? "Awake" : "Sleep"}
              </Toggle>
            </div>
          )}
        </div>

        <p className="text-muted-foreground">
          Create, store, and scale your favorite cocktail recipes
        </p>
      </header>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Recipes</h2>

          <Button
            onClick={handleCreateRecipe}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-primary text-primary-foreground shadow-xs hover:bg-primary/80 h-9 px-4 py-2 has-[>svg]:px-3"
          >
            <Plus className="mr-1 h-4 w-4" />
            New Recipe
          </Button>
        </div>

        <div className="space-y-4 mt-4">
          <RecipeList
            recipes={recipes}
            onEditRecipe={handleEditRecipe}
            onDeleteRecipe={handleDeleteRecipe}
            onBatchCalculate={handleBatchCalculate}
            onClarify={handleClarify}
          />
        </div>
      </div>
      {batchRecipe && (
        <BatchCalculator
          recipe={batchRecipe}
          open={!!batchRecipeId}
          onClose={() => setBatchRecipeId(null)}
        />
      )}
      {clarifyRecipe && (
        <ClarificationCalculator
          recipe={clarifyRecipe}
          open={!!clarifyRecipeId}
          onClose={() => setClarifyRecipeId(null)}
        />
      )}
    </>
  );
};

export default HomePage;