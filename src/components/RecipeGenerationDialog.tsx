import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ApiService } from "@/lib/api";
import { Recipe } from "@/lib/types";
import { createRecipe } from "@/lib/recipe-utils";
import { MagicWandIcon, CheckIcon, PlusIcon } from "@phosphor-icons/react";
import { toast } from "sonner";

interface RecipeGenerationDialogProps {
  messages: Array<{role: "user" | "assistant"; content: string}>;
  onRecipeSaved?: (recipe: Recipe) => void;
}

interface GeneratedRecipe {
  name: string;
  ingredients: Array<{name: string; amount: number; unit: string}>;
  instructions: string;
  glass?: string;
  garnish?: string;
  category?: string;
}

export default function RecipeGenerationDialog({ 
  messages, 
  onRecipeSaved 
}: RecipeGenerationDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRecipes, setGeneratedRecipes] = useState<GeneratedRecipe[]>([]);
  const [reasoning, setReasoning] = useState<string>("");
  const [savedRecipes, setSavedRecipes] = useState<Set<string>>(new Set());

  const handleGenerateRecipes = async () => {
    setIsGenerating(true);
    try {
      const result = await ApiService.generateRecipesFromChat(messages);
      setGeneratedRecipes(result.recipes);
      setReasoning(result.reasoning);
    } catch (error) {
      console.error("Error generating recipes:", error);
      toast.error("Failed to generate recipes. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveRecipe = async (generatedRecipe: GeneratedRecipe) => {
    try {
      // Convert generated recipe to our Recipe format
      const ingredients = generatedRecipe.ingredients.map(ing => ({
        id: Math.random().toString(36).substring(7),
        name: ing.name,
        amount: ing.amount,
        unit: ing.unit
      }));

      const recipe = createRecipe(
        generatedRecipe.name,
        ingredients,
        generatedRecipe.instructions,
        generatedRecipe.glass as any, // Type assertion for glass
        generatedRecipe.garnish,
        generatedRecipe.category
      );

      const savedRecipe = await ApiService.createRecipe({
        name: recipe.name,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        glass: recipe.glass,
        garnish: recipe.garnish,
        category: recipe.category,
        tags: recipe.tags
      });

      setSavedRecipes(prev => new Set(prev).add(generatedRecipe.name));
      onRecipeSaved?.(savedRecipe);
      toast.success(`"${generatedRecipe.name}" saved to your recipes!`);
    } catch (error) {
      console.error("Error saving recipe:", error);
      toast.error("Failed to save recipe. Please try again.");
    }
  };

  const calculateTotalVolume = (ingredients: GeneratedRecipe['ingredients']) => {
    return ingredients
      .filter(ing => ing.unit === 'oz' || ing.unit === 'ml')
      .reduce((total, ing) => {
        if (ing.unit === 'oz') return total + ing.amount;
        if (ing.unit === 'ml') return total + (ing.amount * 0.033814); // Convert ml to oz
        return total;
      }, 0);
  };

  const hasValidMessages = messages.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          disabled={!hasValidMessages}
          className="gap-2"
        >
          <MagicWandIcon className="h-4 w-4" />
          Generate Recipe
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Recipes from Conversation</DialogTitle>
          <DialogDescription>
            Extract cocktail recipes from your chat conversation using AI.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {generatedRecipes.length === 0 ? (
            <div className="text-center py-8">
              <MagicWandIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground mb-4">
                Click below to analyze your conversation and generate recipes.
              </p>
              <Button 
                onClick={handleGenerateRecipes} 
                disabled={isGenerating}
                className="gap-2"
              >
                <MagicWandIcon className="h-4 w-4" />
                {isGenerating ? "Generating..." : "Generate Recipes"}
              </Button>
            </div>
          ) : (
            <>
              {reasoning && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{reasoning}</p>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-4">
                {generatedRecipes.map((recipe, index) => {
                  const totalVolume = calculateTotalVolume(recipe.ingredients);
                  const isSaved = savedRecipes.has(recipe.name);

                  return (
                    <Card key={index}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-xl">{recipe.name}</CardTitle>
                            {recipe.category && (
                              <Badge variant="outline" className="mt-2">
                                {recipe.category}
                              </Badge>
                            )}
                          </div>
                          <Button
                            onClick={() => handleSaveRecipe(recipe)}
                            disabled={isSaved}
                            variant={isSaved ? "outline" : "default"}
                            size="sm"
                            className="gap-2"
                          >
                            {isSaved ? (
                              <>
                                <CheckIcon className="h-4 w-4" />
                                Saved
                              </>
                            ) : (
                              <>
                                <PlusIcon className="h-4 w-4" />
                                Save Recipe
                              </>
                            )}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold text-sm">Ingredients</h4>
                            {totalVolume > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {totalVolume.toFixed(1)} oz
                              </Badge>
                            )}
                          </div>
                          <ul className="space-y-1">
                            {recipe.ingredients.map((ingredient, idx) => (
                              <li key={idx} className="text-sm">
                                {ingredient.amount} {ingredient.unit} {ingredient.name}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-semibold text-sm mb-2">Instructions</h4>
                          <p className="text-sm text-muted-foreground">
                            {recipe.instructions}
                          </p>
                        </div>

                        {(recipe.glass || recipe.garnish) && (
                          <div className="flex gap-4 text-sm">
                            {recipe.glass && (
                              <span>
                                <strong>Glass:</strong> {recipe.glass}
                              </span>
                            )}
                            {recipe.garnish && (
                              <span>
                                <strong>Garnish:</strong> {recipe.garnish}
                              </span>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="flex justify-center pt-4">
                <Button 
                  onClick={handleGenerateRecipes} 
                  disabled={isGenerating}
                  variant="outline"
                  className="gap-2"
                >
                  <MagicWandIcon className="h-4 w-4" />
                  Generate Again
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}