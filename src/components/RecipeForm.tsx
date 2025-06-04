import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { Recipe, Ingredient, GlassType } from "../lib/types";
import { useRecipes } from "../contexts/RecipeContext";
import { createRecipe, createIngredient } from "../lib/recipe-utils";
import { ApiService } from "../lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PlusIcon, XIcon, CheckIcon, SparkleIcon } from "@phosphor-icons/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { GlassIcon } from "@/components/GlassIcon";

interface RecipeFormProps {
  initialRecipe?: Recipe;
  onSubmit: (recipe: Recipe) => void;
  cancelLinkTo: string;
}

// Predefined categories for cocktails
const RECIPE_CATEGORIES = [
  "Stirred",
  "Shaken",
  "Highball",
  "Sour",
  "Tiki",
  "Martini",
  "Old Fashioned",
  "Punch",
  "Fizz",
  "Other",
];

// Get all glass types from the enum
const GLASS_TYPES = Object.values(GlassType);

const RecipeForm: React.FC<RecipeFormProps> = React.memo(
  ({ initialRecipe, onSubmit, cancelLinkTo }) => {
    const { uniqueIngredients } = useRecipes();
    const [name, setName] = useState(initialRecipe?.name || "");
    const [description, setDescription] = useState(
      initialRecipe?.description || ""
    );
    const [ingredients, setIngredients] = useState<Ingredient[]>(
      initialRecipe?.ingredients || []
    );
    const [instructions, setInstructions] = useState(
      initialRecipe?.instructions || ""
    );
    const [glass, setGlass] = useState<GlassType | undefined>(
      initialRecipe?.glass || undefined
    );
    const [garnish, setGarnish] = useState(initialRecipe?.garnish || "");

    const [category, setCategory] = useState(initialRecipe?.category || "");
    const [isGeneratingDescription, setIsGeneratingDescription] =
      useState(false);

    const [newIngredientName, setNewIngredientName] = useState("");
    const [newIngredientAmount, setNewIngredientAmount] = useState("");
    const [newIngredientUnit, setNewIngredientUnit] = useState("oz");

    // Memoize filtered ingredients to avoid recalculating on every render
    const filteredIngredients = useMemo(() => {
      if (!newIngredientName) return [];
      return uniqueIngredients.filter((ingredient) =>
        ingredient.toLowerCase().includes(newIngredientName.toLowerCase())
      );
    }, [newIngredientName, uniqueIngredients]);

    const showIngredientSuggestions =
      filteredIngredients.length > 0 && newIngredientName.length > 0;

    // Memoize event handlers
    const handleAddIngredient = useCallback(() => {
      if (!newIngredientName || !newIngredientAmount) {
        toast.error("Please enter both name and amount for the ingredient");
        return;
      }

      const amount = parseFloat(newIngredientAmount);
      if (isNaN(amount) || amount <= 0) {
        toast.error("Please enter a valid amount");
        return;
      }

      const newIngredient = createIngredient(
        newIngredientName,
        amount,
        newIngredientUnit
      );

      setIngredients((prev) => prev.concat(newIngredient));
      setNewIngredientName("");
      setNewIngredientAmount("");
      setNewIngredientUnit("oz");
    }, [newIngredientName, newIngredientAmount, newIngredientUnit]);

    const handleRemoveIngredient = useCallback((id: string) => {
      setIngredients((prev) => prev.filter((i) => i.name !== name));
    }, []);

    const handleSelectIngredient = useCallback((ingredient: string) => {
      setNewIngredientName(ingredient);
    }, []);

    const handleGlassChange = useCallback((value: string) => {
      setGlass(value as GlassType);
    }, []);

    const handleGenerateDescription = useCallback(async () => {
      if (ingredients.length === 0) {
        toast.error("Please add ingredients before generating a description");
        return;
      }

      setIsGeneratingDescription(true);
      try {
        const result = await ApiService.generateDescription(
          ingredients.map((ing) => ({
            name: ing.name,
            amount: ing.amount,
            unit: ing.unit,
          })),
          name || undefined,
          category || undefined
        );
        setDescription(result.description);
        toast.success("Description generated successfully!");
      } catch (error) {
        console.error("Error generating description:", error);
        toast.error("Failed to generate description. Please try again.");
      } finally {
        setIsGeneratingDescription(false);
      }
    }, [ingredients, name, category]);

    const handleSubmit = useCallback(
      (e: React.FormEvent) => {
        e.preventDefault();

        if (!name) {
          toast.error("Please enter a name for the recipe");
          return;
        }

        if (ingredients.length === 0) {
          toast.error("Please add at least one ingredient");
          return;
        }

        if (!instructions) {
          toast.error("Please enter instructions");
          return;
        }

        const recipe = initialRecipe
          ? {
              ...initialRecipe,
              name,
              description,
              ingredients,
              instructions,
              glass,
              garnish,
              category,
              updated: new Date().toISOString(),
            }
          : createRecipe(
              name,
              ingredients,
              instructions,
              glass,
              garnish,
              category,
              description
            );

        onSubmit(recipe);
      },
      [
        name,
        description,
        ingredients,
        instructions,
        glass,
        garnish,
        category,
        initialRecipe,
        onSubmit,
      ]
    );

    return (
      <form
        onSubmit={handleSubmit}
        className="max-w-[768px] w-full px-6 mx-auto"
      >
        <h2 className="text-2xl font-semibold mb-6">
          {initialRecipe ? "Edit" : "Create"} Recipe
        </h2>
        <div className="space-y-6">
          {/* Recipe Name */}
          <div className="space-y-2">
            <Label htmlFor="recipe-name">Recipe Name</Label>
            <Input
              id="recipe-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Manhattan, Negroni, etc."
            />
          </div>

          {/* Recipe Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="recipe-description">Description (Optional)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateDescription}
                disabled={isGeneratingDescription || ingredients.length === 0}
                className="flex items-center gap-2"
              >
                <SparkleIcon className="h-4 w-4" />
                {isGeneratingDescription
                  ? "Generating..."
                  : "Generate Description"}
              </Button>
            </div>
            <Textarea
              id="recipe-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief description of the cocktail..."
              rows={2}
            />
          </div>

          {/* Recipe Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Recipe Category</Label>
            <Select value={category || ""} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {RECIPE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Ingredients */}
          <div className="space-y-4">
            <Label>Ingredients</Label>

            <div className="space-y-4">
              {ingredients.map((ingredient) => (
                <div key={ingredient.name} className="flex items-center gap-2">
                  <div className="flex-1 bg-muted p-3 rounded-md flex justify-between items-center">
                    <span>
                      {ingredient.amount} {ingredient.unit} {ingredient.name}
                    </span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveIngredient(ingredient.name)}
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Ingredient Row */}
            <div className="flex flex-wrap gap-2">
              <div className="flex-1 relative">
                <Input
                  value={newIngredientName}
                  onChange={(e) => setNewIngredientName(e.target.value)}
                  placeholder="Ingredient name"
                />

                {/* Ingredient suggestions */}
                {showIngredientSuggestions && (
                  <div className="absolute z-10 mt-1 w-full bg-popover border border-border rounded-md shadow-md">
                    {filteredIngredients.slice(0, 5).map((ingredient) => (
                      <div
                        key={ingredient}
                        className="p-2 hover:bg-muted cursor-pointer"
                        onClick={() => handleSelectIngredient(ingredient)}
                      >
                        {ingredient}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="w-24">
                <Input
                  type="number"
                  min="0"
                  step="0.25"
                  value={newIngredientAmount}
                  onChange={(e) => setNewIngredientAmount(e.target.value)}
                  placeholder="Amount"
                />
              </div>

              <div className="w-20">
                <Select
                  value={newIngredientUnit}
                  onValueChange={setNewIngredientUnit}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="oz">oz</SelectItem>
                    <SelectItem value="ml">ml</SelectItem>
                    <SelectItem value="dash">dash</SelectItem>
                    <SelectItem value="barspoon">barspoon</SelectItem>
                    <SelectItem value="each">each</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="button" onClick={handleAddIngredient} size="icon">
                <PlusIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-2">
            <Label htmlFor="instructions">Instructions</Label>
            <Textarea
              id="instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="How to prepare the cocktail..."
              rows={5}
            />
          </div>

          {/* Additional Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="glass">Glass Type</Label>
              <Select value={glass || ""} onValueChange={handleGlassChange}>
                <SelectTrigger id="glass" className="w-full">
                  <SelectValue placeholder="Select a glass type">
                    {glass && (
                      <div className="flex items-center">
                        <div className="mr-4 w-2">
                          <GlassIcon glassType={glass} />
                        </div>
                        <span>{glass}</span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {GLASS_TYPES.map((glassType) => (
                    <SelectItem key={glassType} value={glassType}>
                      <div className="flex items-center">
                        <div className="mr-2 w-4">
                          <GlassIcon glassType={glassType as GlassType} />
                        </div>
                        <span>{glassType}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="garnish">Garnish</Label>
              <Input
                id="garnish"
                value={garnish}
                onChange={(e) => setGarnish(e.target.value)}
                placeholder="Lemon twist, cherry, etc."
              />
            </div>
          </div>
        </div>

        <footer className="flex justify-between">
          <Button asChild type="button" variant="outline">
            <Link to={cancelLinkTo}>Cancel</Link>
          </Button>
          <Button type="submit">
            <CheckIcon className="h-4 w-4" />
            {initialRecipe ? "Save Changes" : "Create Recipe"}
          </Button>
        </footer>
      </form>
    );
  }
);

export default RecipeForm;
