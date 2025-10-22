import { useCallback, useMemo, useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useRecipes } from "../contexts/RecipeContext";
import { ApiService } from "../lib/api";
import { Recipe } from "../lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PencilIcon,
  TrashIcon,
  CalculatorIcon,
  FunnelIcon,
  CaretDownIcon,
  CaretRightIcon,
  SpinnerIcon,
} from "@phosphor-icons/react";
import { GlassIcon } from "@/components/GlassIcon";
import { calculateTotalVolume } from "../lib/recipe-utils";

import BatchCalculator from "@/components/BatchCalculator";
import ClarificationCalculator from "@/components/ClarificationCalculator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

function RecipePage() {
  const { id } = useParams<{ id: string }>();
  const { getRecipe, removeRecipe, isLoading: contextLoading } = useRecipes();
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBatchCalculator, setShowBatchCalculator] = useState(false);
  const [showClarificationCalculator, setShowClarificationCalculator] =
    useState(false);

  // State for ingredient alternatives
  const [ingredientAlternatives, setIngredientAlternatives] = useState<
    Record<string, string[]>
  >({});
  const [loadingAlternatives, setLoadingAlternatives] = useState<
    Record<string, boolean>
  >({});
  const [expandedIngredients, setExpandedIngredients] = useState<
    Record<string, boolean>
  >({});

  // State for direct recipe loading
  const [directRecipe, setDirectRecipe] = useState<Recipe | null>(null);
  const [loadingDirectRecipe, setLoadingDirectRecipe] = useState(false);
  const [recipeNotFound, setRecipeNotFound] = useState(false);

  // Get recipe from context or direct load
  const contextRecipe = id ? getRecipe(id) : undefined;
  const recipe = contextRecipe || directRecipe;

  // If recipe is not in context and context is still loading, wait
  // If context finished loading and recipe still not found, try direct API call
  useEffect(() => {
    if (!id) return;
    
    // If we already have the recipe from context or direct load, no need to fetch
    if (contextRecipe || directRecipe) {
      setRecipeNotFound(false);
      return;
    }

    // If context is still loading, wait for it
    if (contextLoading) {
      return;
    }

    // Context finished loading and recipe not found, try direct API call
    const loadRecipeDirectly = async () => {
      setLoadingDirectRecipe(true);
      setRecipeNotFound(false);
      try {
        const loadedRecipe = await ApiService.getRecipe(id);
        setDirectRecipe(loadedRecipe);
      } catch (error) {
        console.error("Error loading recipe:", error);
        setRecipeNotFound(true);
      } finally {
        setLoadingDirectRecipe(false);
      }
    };

    loadRecipeDirectly();
  }, [id, contextRecipe, directRecipe, contextLoading]);

  const fetchIngredientAlternatives = useCallback(
    async (ingredientName: string) => {
      if (!recipe) return;
      
      if (
        ingredientAlternatives[ingredientName] ||
        loadingAlternatives[ingredientName]
      ) {
        return; // Already loaded or loading
      }

      setLoadingAlternatives((prev) => ({ ...prev, [ingredientName]: true }));

      try {
        const response = await fetch(`/api/recipes/ingredients/alternatives`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ingredient: ingredientName,
            recipeId: recipe.id,
          }),
        });

        if (!response.ok) {
          throw new Error(
            `Failed to fetch alternatives: ${response.statusText}`
          );
        }

        const data = await response.json();
        setIngredientAlternatives((prev) => ({
          ...prev,
          [ingredientName]: data.alternatives,
        }));
      } catch (error) {
        console.error("Error fetching ingredient alternatives:", error);
        toast.error(
          "Failed to load ingredient alternatives. Please try again."
        );
      } finally {
        setLoadingAlternatives((prev) => ({
          ...prev,
          [ingredientName]: false,
        }));
      }
    },
    [recipe, ingredientAlternatives, loadingAlternatives]
  );

  const toggleIngredientExpansion = useCallback((ingredientName: string) => {
    setExpandedIngredients((prev) => {
      const isExpanded = prev[ingredientName];

      if (!isExpanded) {
        // Fetch alternatives when expanding
        fetchIngredientAlternatives(ingredientName);
      }

      return {
        ...prev,
        [ingredientName]: !isExpanded,
      };
    });
  }, [fetchIngredientAlternatives]);

  const handleDeleteRecipe = useCallback(async () => {
    if (!recipe) return;

    try {
      removeRecipe(recipe.id);
      toast.success("Recipe deleted successfully!");
      navigate("/");
    } catch (error) {
      toast.error("Failed to delete recipe. Please try again.");
    }
    setShowDeleteDialog(false);
  }, [recipe, removeRecipe, navigate]);

  const totalVolume = recipe ? calculateTotalVolume(recipe) : 0;

  // Show loading state
  if (contextLoading || loadingDirectRecipe) {
    return (
      <div className="flex items-center justify-center h-64">
        <SpinnerIcon className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If recipe doesn't exist, show error message
  if (id && recipeNotFound) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Recipe Not Found</h2>
        </div>

        <div className="mt-4">
          <p className="text-muted-foreground">
            The recipe you're looking for doesn't exist.
          </p>
          <Button asChild className="mt-2" variant="link">
            <Link to="/">Return to recipes</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return null;
  }

  return (
    <div className="container max-w-4xl">
      <div className="space-y-12">
        {/* Title and Description */}
        <div className="space-y-4">
          <div className="sm:flex block justify-between items-center mb-6">
            <h2 className="text-4xl">{recipe.name}</h2>

            {/* Action Buttons */}
            <div className="sm:mt-0 mt-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowBatchCalculator(true)}
                  title="Batch Calculator"
                >
                  <CalculatorIcon className="h-4 w-4" />
                  Batch
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowClarificationCalculator(true)}
                  title="Clarification Calculator"
                >
                  <FunnelIcon className="h-4 w-4" />
                  Clarify
                </Button>
                <Button asChild>
                  <Link to={`/recipes/${recipe.id}/edit`}>
                    <PencilIcon className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Description */}
          {recipe.description && (
            <div className="text-muted-foreground text-lg leading-relaxed">
              {recipe.description}
            </div>
          )}
        </div>

        {/* Ingredients */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3>Ingredients</h3>
            <Badge variant="outline">{totalVolume.toFixed(1)} oz total</Badge>
          </div>
          <div className="space-y-2">
            {recipe.ingredients.map((ingredient, index) => {
              const isExpanded = expandedIngredients[ingredient.name];
              const isLoading = loadingAlternatives[ingredient.name];
              const alternatives = ingredientAlternatives[ingredient.name];

              return (
                <div
                  key={index}
                  className="even:bg-muted rounded-lg py-3 px-4 -mx-4"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span>{ingredient.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          toggleIngredientExpansion(ingredient.name)
                        }
                        className="h-6 w-6 p-0"
                        title="Show alternatives"
                      >
                        {isExpanded ? (
                          <CaretDownIcon className="size-4" />
                        ) : (
                          <CaretRightIcon className="size-4" />
                        )}
                      </Button>
                    </div>
                    <span className="text-muted-foreground">
                      {ingredient.amount} {ingredient.unit}
                    </span>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-muted px-4 py-3 bg-muted/20">
                      <div className="text-sm font-medium text-muted-foreground mb-2">
                        Alternative ingredients:
                      </div>
                      {isLoading ? (
                        <div className="text-sm text-muted-foreground flex items-center">
                          <SpinnerIcon className="h-6 w-6 animate-spin" />{" "}
                          Loading alternatives...
                        </div>
                      ) : alternatives && alternatives.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {alternatives.map((alternative, altIndex) => (
                            <Badge
                              key={altIndex}
                              variant="outline"
                              className="text-xs"
                            >
                              {alternative}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          No alternatives found.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Instructions */}
        <div>
          <h3 className="mb-4">Instructions</h3>
          <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {recipe.instructions}
          </p>
        </div>

        {/* Glass and Garnish */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recipe.glass && (
            <div className="flex items-center space-x-3">
              <div className="text-primary w-12">
                <GlassIcon glassType={recipe.glass} />
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Glass</span>
                <p className="font-medium">{recipe.glass}</p>
              </div>
            </div>
          )}

          {recipe.garnish && (
            <div>
              <span className="text-sm text-muted-foreground">Garnish</span>
              <p className="font-medium">{recipe.garnish}</p>
            </div>
          )}
        </div>

        {/* Tags */}
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {recipe.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Metadata */}
        <footer className="py-4 border-t border-muted">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <span>Created: </span>
              {new Date(recipe.createdAt).toLocaleDateString()}
            </div>
            <div>
              <span>Updated: </span>
              {new Date(recipe.updatedAt).toLocaleDateString()}
            </div>
          </div>
        </footer>
      </div>

      <BatchCalculator
        recipe={recipe}
        open={showBatchCalculator}
        onClose={() => setShowBatchCalculator(false)}
      />

      <ClarificationCalculator
        recipe={recipe}
        open={showClarificationCalculator}
        onClose={() => setShowClarificationCalculator(false)}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recipe</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{recipe.name}"? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRecipe}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default RecipePage;
