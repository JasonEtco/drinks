import { useMemo } from "react";
import type { Recipe } from "../lib/types";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { calculateTotalVolume } from "../lib/recipe-utils";
import { CategoryLabel } from "./CategoryLabel";
import { GlassIcon } from "./GlassIcon";

interface MenuRecipeItemProps {
  recipe: Recipe;
  isLast: boolean;
}

export function MenuRecipeItem({ recipe, isLast }: MenuRecipeItemProps) {
  const totalVolume = useMemo(() => calculateTotalVolume(recipe), [recipe]);

  return (
    <div
      className={`group hover:bg-muted/50 transition-colors ${
        !isLast ? "border-b" : ""
      }`}
    >
      <div className="flex items-center p-4 gap-4">
        {/* Glass Icon */}
        <div className="flex-shrink-0">
          <GlassIcon glassType={recipe.glass} className="h-8 w-8" />
        </div>

        {/* Recipe Info */}
        <div className="flex-1 min-w-0">
          <Link
            to={`/recipes/${recipe.id}`}
            className="block hover:no-underline"
          >
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-lg leading-6 truncate group-hover:text-primary transition-colors">
                  {recipe.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  {recipe.glass && (
                    <span className="text-sm text-muted-foreground">
                      {recipe.glass}
                    </span>
                  )}
                  {recipe.glass && totalVolume > 0 && (
                    <span className="text-muted-foreground">•</span>
                  )}
                  {totalVolume > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {totalVolume.toFixed(1)} oz
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {recipe.category && (
                    <CategoryLabel category={recipe.category} />
                  )}
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
              </div>

              {/* Price-like display for ingredients count */}
              <div className="text-right ml-4 flex-shrink-0">
                <div className="text-lg font-semibold">
                  {recipe.ingredients.length}
                </div>
                <div className="text-xs text-muted-foreground">ingredients</div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
