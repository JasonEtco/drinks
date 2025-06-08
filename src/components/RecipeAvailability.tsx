import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useRecipes } from "../contexts/RecipeContext";
import { useInventory } from "../contexts/InventoryContext";
import { Button } from "@/components/ui/button";
import { CheckCircleIcon, ClockIcon, ShoppingBagIcon } from "@phosphor-icons/react";
import { analyzeRecipeAvailability, getIngredientSuggestions } from "../lib/recipe-inventory";

export default function RecipeAvailability() {
  const { recipes } = useRecipes();
  const { inventory } = useInventory();

  const analysis = useMemo(() => {
    if (!recipes.length || !inventory.length) {
      return {
        available: [],
        partial: [],
        suggestions: [],
      };
    }

    const recipeAnalysis = analyzeRecipeAvailability(recipes, inventory);
    const available = recipeAnalysis.filter(r => r.canMake);
    const partial = recipeAnalysis.filter(r => r.partialMatch).slice(0, 5);
    const suggestions = getIngredientSuggestions(recipes, inventory).slice(0, 5);

    return { available, partial, suggestions };
  }, [recipes, inventory]);

  if (!inventory.length) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
        <ShoppingBagIcon className="h-8 w-8 text-blue-500 mx-auto mb-2" />
        <p className="text-blue-800 font-medium">Add items to your inventory</p>
        <p className="text-blue-600 text-sm">
          Start tracking your bar ingredients to see which recipes you can make
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Available Recipes */}
      {analysis.available.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
            <h3 className="font-medium text-green-800">
              Ready to Make ({analysis.available.length})
            </h3>
          </div>
          <div className="grid gap-2">
            {analysis.available.slice(0, 3).map(({ recipe }) => (
              <div key={recipe.id} className="flex justify-between items-center">
                <Link
                  to={`/recipes/${recipe.id}`}
                  className="text-green-700 hover:text-green-900 font-medium"
                >
                  {recipe.name}
                </Link>
                <span className="text-green-600 text-sm">
                  {recipe.ingredients.length} ingredients
                </span>
              </div>
            ))}
            {analysis.available.length > 3 && (
              <p className="text-green-600 text-sm">
                +{analysis.available.length - 3} more recipes
              </p>
            )}
          </div>
        </div>
      )}

      {/* Partial Recipes */}
      {analysis.partial.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <ClockIcon className="h-5 w-5 text-yellow-600 mr-2" />
            <h3 className="font-medium text-yellow-800">
              Almost Ready ({analysis.partial.length})
            </h3>
          </div>
          <div className="space-y-2">
            {analysis.partial.slice(0, 3).map(({ recipe, missingIngredients, availableIngredients }) => (
              <div key={recipe.id} className="border border-yellow-300 rounded p-2">
                <div className="flex justify-between items-center mb-1">
                  <Link
                    to={`/recipes/${recipe.id}`}
                    className="text-yellow-700 hover:text-yellow-900 font-medium"
                  >
                    {recipe.name}
                  </Link>
                  <span className="text-yellow-600 text-sm">
                    {availableIngredients.length}/{recipe.ingredients.length} ingredients
                  </span>
                </div>
                <div className="text-yellow-600 text-xs">
                  Missing: {missingIngredients.map(ing => ing.name).join(", ")}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shopping Suggestions */}
      {analysis.suggestions.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <ShoppingBagIcon className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="font-medium text-blue-800">Shopping Suggestions</h3>
          </div>
          <div className="space-y-1">
            {analysis.suggestions.map(({ ingredient, recipeCount }) => (
              <div key={ingredient} className="flex justify-between items-center text-sm">
                <span className="text-blue-700 capitalize">{ingredient}</span>
                <span className="text-blue-600">
                  {recipeCount} recipe{recipeCount !== 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {analysis.available.length === 0 && analysis.partial.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-gray-600">
            No matching recipes found with current inventory.
          </p>
          <p className="text-gray-500 text-sm mt-1">
            Add more ingredients to see recipe suggestions.
          </p>
        </div>
      )}
    </div>
  );
}