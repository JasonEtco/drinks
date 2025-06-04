import { useRecipes } from "../contexts/RecipeContext";
import RecipeList from "../components/RecipeList";

export default function HomePage() {
  const { recipes, isLoading } = useRecipes();

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
    <div className="space-y-6">
      <div className="space-y-4 mt-4">
        <RecipeList recipes={recipes} />
      </div>
    </div>
  );
}
