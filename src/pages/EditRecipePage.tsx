import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useRecipes } from "../contexts/RecipeContext";
import RecipeForm from "../components/RecipeForm";
import { Recipe } from "../lib/types";
import { toast } from "sonner";

const EditRecipePage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { updateExistingRecipe, getRecipe } = useRecipes();

  const editingRecipe = id ? getRecipe(id) : undefined;

  const handleRecipeSubmit = (recipe: Recipe) => {
    updateExistingRecipe(recipe);
    toast.success("Recipe updated successfully!");
    navigate("/");
  };

  const handleCancel = () => {
    navigate("/");
  };

  // If recipe doesn't exist, redirect to home
  if (id && !editingRecipe) {
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
              onClick={() => navigate("/")}
              className="mt-2 text-primary hover:underline"
            >
              Return to recipes
            </button>
          </div>
        </div>
      </>
    );
  }

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
          <h2 className="text-2xl font-semibold">Edit Recipe</h2>
        </div>

        <div className="mt-4">
          <RecipeForm
            initialRecipe={editingRecipe}
            onSubmit={handleRecipeSubmit}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </>
  );
};

export default EditRecipePage;