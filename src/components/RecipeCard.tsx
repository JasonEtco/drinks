import React from 'react';
import { Recipe } from '../lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, Calculator, Trash, GlassHalf } from '@phosphor-icons/react';
import { calculateTotalVolume } from '../lib/recipe-utils';
import { Badge } from '@/components/ui/badge';
import { GlassIcon } from '../lib/glass-icons';

interface RecipeCardProps {
  recipe: Recipe;
  onEdit: () => void;
  onDelete: () => void;
  onBatchCalculate: () => void;
  onClarify: () => void;
}

const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  onEdit,
  onDelete,
  onBatchCalculate,
  onClarify
}) => {
  const totalVolume = calculateTotalVolume(recipe);
  
  return (
    <Card className="h-full flex flex-col hover:border-primary/50 transition-colors duration-200">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl md:text-2xl">{recipe.name}</CardTitle>
          {recipe.category && (
            <Badge variant="secondary" className="ml-2">
              {recipe.category}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">Ingredients</h3>
              <Badge variant="outline" className="text-xs">
                {totalVolume.toFixed(1)} oz
              </Badge>
            </div>
            
            <ul className="space-y-1">
              {recipe.ingredients.map((ingredient) => (
                <li key={ingredient.id} className="text-sm">
                  {ingredient.amount} {ingredient.unit} {ingredient.name}
                </li>
              ))}
            </ul>
          </div>
          
          {recipe.glass && (
            <div className="flex items-center text-sm">
              <GlassIcon glassType={recipe.glass} className="mr-2 h-5 w-5 text-primary" />
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
      
      <CardFooter className="pt-2 flex justify-between flex-wrap gap-2">
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={onDelete}>
            <Trash className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onBatchCalculate}>
            <Calculator className="h-4 w-4 mr-1" />
            Batch
          </Button>
          <Button variant="outline" size="sm" onClick={onClarify}>
            <GlassHalf className="h-4 w-4 mr-1" />
            Clarify
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default RecipeCard;
