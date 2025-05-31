import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Recipe } from "../lib/types";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalculatorIcon, FunnelIcon } from "@phosphor-icons/react";
import { calculateTotalVolume } from "../lib/recipe-utils";
import { Badge } from "@/components/ui/badge";
import { GlassIcon } from "../lib/glass-icons";
import { CategoryLabel } from "./CategoryLabel";

interface RecipeCardProps {
  recipe: Recipe;
  onBatchCalculate: () => void;
  onClarify: () => void;
}

const RecipeCard: React.FC<RecipeCardProps> = React.memo(
  ({ recipe, onBatchCalculate, onClarify }) => {
    // Memoize expensive calculation
    const totalVolume = useMemo(() => calculateTotalVolume(recipe), [recipe]);

    return (
      <Link to={`/recipes/${recipe.id}`} className="block h-full">
        <Card className="h-full flex flex-col hover:border-primary/50 transition-colors duration-200 cursor-pointer">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-xl md:text-2xl">
                {recipe.name}
              </CardTitle>
              {recipe.category && <CategoryLabel category={recipe.category} />}
            </div>
          </CardHeader>

          <CardContent className="flex-1">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Ingredients
                  </h3>
                  <Badge variant="outline" className="text-xs">
                    {totalVolume.toFixed(1)} oz
                  </Badge>
                </div>

                <ul className="space-y-1">
                  {recipe.ingredients.map((ingredient) => (
                    <li key={ingredient.name} className="text-sm">
                      {ingredient.amount} {ingredient.unit} {ingredient.name}
                    </li>
                  ))}
                </ul>
              </div>

              {recipe.glass && (
                <div className="flex items-center text-sm">
                  <GlassIcon
                    glassType={recipe.glass}
                    className="mr-2 h-5 w-5 text-primary"
                  />
                  <span className="text-muted-foreground">Glass: </span>
                  <span className="ml-1">{recipe.glass}</span>
                </div>
              )}

              {recipe.garnish && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Garnish: </span>
                  {recipe.garnish}
                </div>
              )}
            </div>
          </CardContent>

          <CardFooter className="pt-2 flex justify-center flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onBatchCalculate();
              }}
            >
              <CalculatorIcon className="h-4 w-4" />
              Batch
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClarify();
              }}
            >
              <FunnelIcon className="h-4 w-4" />
              Clarify
            </Button>
          </CardFooter>
        </Card>
      </Link>
    );
  }
);

export default RecipeCard;
