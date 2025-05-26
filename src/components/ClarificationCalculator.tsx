import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Recipe } from '../lib/types';
import { calculateMilkClarification, calculateTotalVolume } from '../lib/recipe-utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Info } from '@phosphor-icons/react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ClarificationCalculatorProps {
  recipe: Recipe;
  open: boolean;
  onClose: () => void;
}

const ClarificationCalculator: React.FC<ClarificationCalculatorProps> = React.memo(({
  recipe,
  open,
  onClose
}) => {
  const [clarificationPercentage, setClarificationPercentage] = useState(25);
  
  // Memoize expensive calculations
  const totalVolume = useMemo(() => calculateTotalVolume(recipe), [recipe]);
  const calculation = useMemo(() => calculateMilkClarification(recipe, clarificationPercentage), [recipe, clarificationPercentage]);
  
  // Memoize event handlers
  const handleClarificationChange = useCallback((value: number[]) => {
    setClarificationPercentage(value[0]);
  }, []);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Milk Clarification: {recipe.name}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-[300px]">
                  <p>
                    Milk clarification uses the curds formed when acids meet milk 
                    proteins to filter and clarify cocktails, creating a clearer, 
                    smoother result.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="clarification">
                  Milk Percentage: {clarificationPercentage}%
                </Label>
                <span className="text-sm text-muted-foreground">
                  (15-30% recommended)
                </span>
              </div>
              <Slider
                id="clarification"
                min={5}
                max={50}
                step={1}
                value={[clarificationPercentage]}
                onValueChange={handleClarificationChange}
              />
            </div>
            
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="text-sm text-muted-foreground">Recipe Volume</h4>
                      <p className="text-lg font-medium">{totalVolume.toFixed(2)} oz</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-sm text-muted-foreground">Milk Required</h4>
                      <p className="text-lg font-medium">{calculation.milkAmount.toFixed(2)} oz</p>
                    </div>
                  </div>
                  
                  <div className="bg-muted p-3 rounded-md space-y-2">
                    <h3 className="font-medium">Clarification Process:</h3>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>Slowly add the cocktail mixture into {calculation.milkAmount.toFixed(2)} oz of cold milk while gently stirring.</li>
                      <li>Allow the mixture to curdle for at least 30 minutes.</li>
                      <li>Strain through a coffee filter or cheesecloth several times.</li>
                      <li>Store the clarified cocktail in a sealed container in the refrigerator.</li>
                    </ol>
                  </div>
                  
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>
                      <strong>Note:</strong> For best results, ensure your cocktail contains acidic ingredients 
                      (citrus juice, etc.) to properly curdle the milk. Increase the milk percentage 
                      if using less acidic ingredients.
                    </p>
                    <p>
                      The clarification process typically results in a slightly reduced volume 
                      due to liquid trapped in the curds.
                    </p>
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

export default ClarificationCalculator;