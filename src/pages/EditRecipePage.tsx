import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useRecipes } from "../contexts/RecipeContext";
import { AuthGate } from "../components/AuthGate";
import RecipeForm from "../components/RecipeForm";
import { Recipe } from "../lib/types";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CheckCircleIcon } from "@phosphor-icons/react";
import Header from "@/components/Header";

export default function EditRecipePage() {
  const { id } = useParams<{ id: string }>();
  const { updateExistingRecipe, getRecipe } = useRecipes();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedRecipe, setSubmittedRecipe] = useState<Recipe | null>(null);

  const editingRecipe = id ? getRecipe(id) : undefined;

  const handleRecipeSubmit = (recipe: Recipe) => {
    updateExistingRecipe(recipe);
    setSubmittedRecipe(recipe);
    setIsSubmitted(true);
    toast.success("Recipe updated successfully!");
  };

  return (
    <AuthGate>
      {isSubmitted && submittedRecipe ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Recipe Updated!</h2>
          </div>

          <div className="mt-4 text-center space-y-4">
            <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto" />
            <p className="text-lg">
              "{submittedRecipe.name}" has been updated successfully!
            </p>
            <div className="flex gap-4 justify-center">
              <Button asChild>
                <Link to="/">Back to Recipes</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to={`/recipes/${submittedRecipe.id}`}>View Recipe</Link>
              </Button>
            </div>
          </div>
        </div>
      ) : id && !editingRecipe ? (
        <div className="container max-w-4xl space-y-6">
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
      ) : (
        <RecipeForm
          initialRecipe={editingRecipe}
          onSubmit={handleRecipeSubmit}
          cancelLinkTo="/"
        />
      )}
    </AuthGate>
  );
}
