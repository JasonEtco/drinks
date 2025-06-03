import { useState, useCallback, useMemo } from "react";
import { useRecipes } from "../contexts/RecipeContext";
import RecipeList from "../components/RecipeList";
import BatchCalculator from "../components/BatchCalculator";
import ClarificationCalculator from "../components/ClarificationCalculator";
import Header from "@/components/Header";

export default function HomePage() {
  const { recipes, getRecipe, isLoading } = useRecipes();

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
          <RecipeList recipes={recipes} />
        </div>
      </div>
    </>
  );
}
