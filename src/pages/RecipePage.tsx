import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useRecipes } from "../contexts/RecipeContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PencilIcon, ArrowLeftIcon, TrashIcon } from "@phosphor-icons/react";
import { GlassIcon } from "../lib/glass-icons";
import { calculateTotalVolume } from "../lib/recipe-utils";
import { CategoryLabel } from "@/components/CategoryLabel";
import Header from "@/components/Header";
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

const RecipePage = () => {
  const { id } = useParams<{ id: string }>();
  const { getRecipe, removeRecipe } = useRecipes();
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const recipe = id ? getRecipe(id) : undefined;

  // If recipe doesn't exist, show error message
  if (id && !recipe) {
    return (
      <>
        <Header />
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
      </>
    );
  }

  if (!recipe) {
    return null;
  }

  const totalVolume = calculateTotalVolume(recipe);

  const handleDeleteRecipe = async () => {
    if (!recipe) return;

    try {
      await removeRecipe(recipe.id);
      toast.success("Recipe deleted successfully!");
      navigate("/");
    } catch (error) {
      toast.error("Failed to delete recipe. Please try again.");
    }
    setShowDeleteDialog(false);
  };

  return (
    <>
      <Header />
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Button
            asChild
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
          >
            <Link to="/">
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back to recipes
            </Link>
          </Button>
          <div className="flex gap-2">
            <Button asChild>
              <Link to={`/recipes/${recipe.id}/edit`}>
                <PencilIcon className="h-4 w-4" />
                Edit Recipe
              </Link>
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <TrashIcon className="h-4 w-4" />
              Delete Recipe
            </Button>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <div className="space-y-6">
            {/* Title and Category */}
            <div className="flex justify-between items-start">
              <h2 className="text-3xl font-bold">{recipe.name}</h2>
              {recipe.category && <CategoryLabel category={recipe.category} />}
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
                  <li
                    key={index}
                    className="flex justify-between items-center py-2 border-b border-muted"
                  >
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
    </>
  );
};

export default RecipePage;
