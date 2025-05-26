import React, { useState, useMemo, useCallback } from 'react';
import { Recipe } from '../lib/types';
import { calculateBatch } from '../lib/recipe-utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from '@phosphor-icons/react';

interface BatchCalculatorProps {
  recipe: Recipe;
  open: boolean;
  onClose: () => void;
}

const BatchCalculator: React.FC<BatchCalculatorProps> = React.memo(({
  recipe,
  open,
  onClose
}) => {
  const [servings, setServings] = useState(8);
  const [dilutionPercentage, setDilutionPercentage] = useState(20);
  
  // Memoize expensive calculation
  const calculation = useMemo(() => calculateBatch(recipe, servings, dilutionPercentage), [recipe, servings, dilutionPercentage]);
  
  // Memoize event handlers
  const handleServingsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setServings(value);
    }
  }, []);
  
  const handleDilutionChange = useCallback((value: number[]) => {
    setDilutionPercentage(value[0]);
  }, []);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Batch Calculator: {recipe.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="servings">Number of Servings</Label>
                <Input
                  id="servings"
                  type="number"
                  min="1"
                  value={servings}
                  onChange={handleServingsChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dilution">
                  Water Dilution: {dilutionPercentage}%
                </Label>
                <Slider
                  id="dilution"
                  min={0}
                  max={50}
                  step={1}
                  value={[dilutionPercentage]}
                  onValueChange={handleDilutionChange}
                  className="mt-6"
                />
              </div>
            </div>
            
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-medium">Batched Ingredients:</h3>
                    <ul className="space-y-2">
                      {calculation.ingredients.map((ingredient, index) => (
                        <li key={index} className="flex justify-between">
                          <span>{ingredient.name}:</span>
                          <span className="font-medium">{ingredient.batchAmount.toFixed(2)} {ingredient.unit}</span>
                        </li>
                      ))}
                      <li className="flex justify-between border-t pt-2 mt-2">
                        <span>Water (for dilution):</span>
                        <span className="font-medium">{calculation.waterAmount.toFixed(2)} oz</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-muted p-3 rounded-md">
                    <div className="flex justify-between">
                      <span>Total Volume:</span>
                      <span className="font-bold">{calculation.totalVolume.toFixed(2)} oz</span>
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <p>This calculation adds water to account for the dilution that normally occurs during mixing/stirring.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Recipe
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

export default BatchCalculator;