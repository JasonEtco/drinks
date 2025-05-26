import React from "react";
import { useNavigate } from "react-router-dom";
import { useRecipes } from "../contexts/RecipeContext";
import RecipeForm from "../components/RecipeForm";
import { Recipe } from "../lib/types";
import { toast } from "sonner";

const NewRecipePage = () => {
  const navigate = useNavigate();
  const { addNewRecipe } = useRecipes();

  const handleRecipeSubmit = (recipe: Recipe) => {
    addNewRecipe(recipe);
    toast.success("Recipe created successfully!");
    navigate("/");
  };

  const handleCancel = () => {
    navigate("/");
  };

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
          <h2 className="text-2xl font-semibold">Create Recipe</h2>
        </div>

        <div className="mt-4">
          <RecipeForm
            onSubmit={handleRecipeSubmit}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </>
  );
};

export default NewRecipePage;