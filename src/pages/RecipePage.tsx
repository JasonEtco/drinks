import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useRecipes } from "../contexts/RecipeContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PencilIcon, ArrowLeft } from "@phosphor-icons/react";
import { GlassIcon } from "../lib/glass-icons";
import { calculateTotalVolume } from "../lib/recipe-utils";

const RecipePage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { getRecipe } = useRecipes();

  const recipe = id ? getRecipe(id) : undefined;

  const handleEdit = () => {
    if (recipe) {
      navigate(`/recipes/${recipe.id}/edit`);
    }
  };

  const handleBack = () => {
    navigate("/");
  };

  // If recipe doesn't exist, show error message
  if (id && !recipe) {
    return (
      <>
        <header className="mb-8">
          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl font-bold">Drinks</h1>
          </div>
          <p className="text-muted-foreground">
            Create, store, and scale your favorite cocktail recipes
          </p>
        </header>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Recipe Not Found</h2>
          </div>

          <div className="mt-4">
            <p className="text-muted-foreground">
              The recipe you're looking for doesn't exist.
            </p>
            <button 
              onClick={handleBack}
              className="mt-2 text-primary hover:underline"
            >
              Return to recipes
            </button>
          </div>
        </div>
      </>
    );
  }

  if (!recipe) {
    return null;
  }

  const totalVolume = calculateTotalVolume(recipe);

  return (
    <>
      <header className="mb-8">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold">Drinks</h1>
        </div>
        <p className="text-muted-foreground">
          Create, store, and scale your favorite cocktail recipes
        </p>
      </header>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to recipes
          </Button>
          <Button onClick={handleEdit}>
            <PencilIcon className="mr-2 h-4 w-4" />
            Edit Recipe
          </Button>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <div className="space-y-6">
            {/* Title and Category */}
            <div className="flex justify-between items-start">
              <h2 className="text-3xl font-bold">{recipe.name}</h2>
              {recipe.category && (
                <Badge variant="secondary" className="ml-2">
                  {recipe.category}
                </Badge>
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

            {/* Ingredients */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Ingredients</h3>
                <Badge variant="outline">
                  {totalVolume.toFixed(1)} oz total
                </Badge>
              </div>
              <ul className="space-y-2">
                {recipe.ingredients.map((ingredient, index) => (
                  <li key={index} className="flex justify-between items-center py-2 border-b border-muted">
                    <span className="font-medium">{ingredient.name}</span>
                    <span className="text-muted-foreground">
                      {ingredient.amount} {ingredient.unit}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Instructions */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Instructions</h3>
              <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {recipe.instructions}
              </p>
            </div>

            {/* Glass and Garnish */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recipe.glass && (
                <div className="flex items-center space-x-3">
                  <GlassIcon
                    glassType={recipe.glass}
                    className="h-6 w-6 text-primary"
                  />
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

            {/* Metadata */}
            <div className="pt-4 border-t border-muted">
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
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RecipePage;