import { useState } from "react";
import { Link } from "react-router-dom";
import { useRecipes } from "../contexts/RecipeContext";
import RecipeForm from "../components/RecipeForm";
import { Recipe } from "../lib/types";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CheckCircleIcon } from "@phosphor-icons/react";

const NewRecipePage = () => {
  const { addNewRecipe } = useRecipes();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedRecipe, setSubmittedRecipe] = useState<Recipe | null>(null);

  const handleRecipeSubmit = (recipe: Recipe) => {
    addNewRecipe(recipe);
    setSubmittedRecipe(recipe);
    setIsSubmitted(true);
    toast.success("Recipe created successfully!");
  };

  if (isSubmitted && submittedRecipe) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Recipe Created!</h2>
        </div>

        <div className="mt-4 text-center space-y-4">
          <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto" />
          <p className="text-lg">
            "{submittedRecipe.name}" has been created successfully!
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
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Create Recipe</h2>
      </div>

      <div className="mt-4">
        <RecipeForm onSubmit={handleRecipeSubmit} cancelLinkTo="/" />
      </div>
    </div>
  );
};

export default NewRecipePage;
