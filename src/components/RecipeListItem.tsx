import { useMemo } from "react";
import type { Recipe } from "../lib/types";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { calculateTotalVolume } from "../lib/recipe-utils";
import { GlassIcon } from "./GlassIcon";

interface RecipeListItemProps {
  recipe: Recipe;
  isLast: boolean;
}

export function RecipeListItem({ recipe, isLast }: RecipeListItemProps) {
  const totalVolume = useMemo(() => calculateTotalVolume(recipe), [recipe]);

  return (
    <Link
      to={`/recipes/${recipe.id}`}
      className={`block sm:p-6 py-6 sm:gap-6 gap-4 hover:no-underline hover:bg-muted/50 transition-colors border-muted-foreground/50 ${
        !isLast ? "border-b" : ""
      }`}
    >
      <div className="flex w-full sm:items-center items-start">
        {/* Glass Icon */}
        <div className="sm:w-8 w-6 mr-4 flex-shrink-0 mt-1 sm:mt-0 text-primary">
          <GlassIcon glassType={recipe.glass} />
        </div>

        {/* Recipe Info */}
        <div className="min-w-0 flex-1 flex flex-col">
          <h2 className="text-lg">{recipe.name}</h2>

          <p className="lowercase text-sm text-muted-foreground max-w-140">
            {recipe.ingredients.map((ing) => ing.name).join(", ")}
          </p>
        </div>

        {/* Price-like display for ingredients count */}
        {totalVolume > 0 && (
          <div className="text-right ml-4 flex-shrink-0 text-sm text-muted-foreground">
            {totalVolume.toFixed(1)} oz
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mt-4 sm:pl-12 pl-10 ">
        {recipe.tags.slice(0, 3).map((tag) => (
          <Badge key={tag} variant="outline" className="text-xs">
            {tag}
          </Badge>
        ))}
        {recipe.tags.length > 3 && (
          <Badge variant="outline" className="text-xs">
            +{recipe.tags.length - 3}
          </Badge>
        )}
      </div>
    </Link>
  );
}
