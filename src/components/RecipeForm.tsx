import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Recipe, Ingredient, GlassType } from '../lib/types';
import { useRecipes } from '../contexts/RecipeContext';
import { createRecipe, createIngredient } from '../lib/recipe-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Plus, X, Check } from '@phosphor-icons/react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { GlassIcon } from '../lib/glass-icons';

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
  "Other"
];

// Get all glass types from the enum
const GLASS_TYPES = Object.values(GlassType);

const RecipeForm: React.FC<RecipeFormProps> = React.memo(({ initialRecipe, onSubmit, cancelLinkTo }) => {
  const { uniqueIngredients } = useRecipes();
  const [name, setName] = useState(initialRecipe?.name || '');
  const [ingredients, setIngredients] = useState<Ingredient[]>(initialRecipe?.ingredients || []);
  const [instructions, setInstructions] = useState(initialRecipe?.instructions || '');
  const [glass, setGlass] = useState<GlassType | undefined>(initialRecipe?.glass || undefined);
  const [garnish, setGarnish] = useState(initialRecipe?.garnish || '');
  const [notes, setNotes] = useState(initialRecipe?.notes || '');
  const [category, setCategory] = useState(initialRecipe?.category || '');
  
  const [newIngredientName, setNewIngredientName] = useState('');
  const [newIngredientAmount, setNewIngredientAmount] = useState('');
  const [newIngredientUnit, setNewIngredientUnit] = useState('oz');
  
  // Memoize filtered ingredients to avoid recalculating on every render
  const filteredIngredients = useMemo(() => {
    if (!newIngredientName) return [];
    return uniqueIngredients.filter(ingredient =>
      ingredient.toLowerCase().includes(newIngredientName.toLowerCase())
    );
  }, [newIngredientName, uniqueIngredients]);
  
  const showIngredientSuggestions = filteredIngredients.length > 0 && newIngredientName.length > 0;
  
  // Memoize event handlers
  const handleAddIngredient = useCallback(() => {
    if (!newIngredientName || !newIngredientAmount) {
      toast.error('Please enter both name and amount for the ingredient');
      return;
    }
    
    const amount = parseFloat(newIngredientAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    const newIngredient = createIngredient(
      newIngredientName,
      amount,
      newIngredientUnit
    );
    
    setIngredients(prev => prev.concat(newIngredient));
    setNewIngredientName('');
    setNewIngredientAmount('');
    setNewIngredientUnit('oz');
  }, [newIngredientName, newIngredientAmount, newIngredientUnit]);
  
  const handleRemoveIngredient = useCallback((id: string) => {
    setIngredients(prev => prev.filter(i => i.id !== id));
  }, []);
  
  const handleSelectIngredient = useCallback((ingredient: string) => {
    setNewIngredientName(ingredient);
  }, []);
  
  const handleGlassChange = useCallback((value: string) => {
    setGlass(value as GlassType);
  }, []);
  
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name) {
      toast.error('Please enter a name for the recipe');
      return;
    }
    
    if (ingredients.length === 0) {
      toast.error('Please add at least one ingredient');
      return;
    }
    
    if (!instructions) {
      toast.error('Please enter instructions');
      return;
    }
    
    const recipe = initialRecipe
      ? {
          ...initialRecipe,
          name,
          ingredients,
          instructions,
          glass,
          garnish,
          notes,
          category,
          updated: new Date().toISOString()
        }
      : createRecipe(name, ingredients, instructions, glass, garnish, notes, category);
    
    onSubmit(recipe);
  }, [name, ingredients, instructions, glass, garnish, notes, category, initialRecipe, onSubmit]);
  
  return (
    <Card className="w-full max-w-3xl">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle className="text-2xl">
            {initialRecipe ? 'Edit Recipe' : 'Create New Recipe'}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Recipe Name */}
          <div className="space-y-2">
            <Label htmlFor="recipe-name">Recipe Name</Label>
            <Input
              id="recipe-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Manhattan, Negroni, etc."
            />
          </div>
          
          {/* Recipe Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Recipe Category</Label>
            <Select
              value={category || ""}
              onValueChange={setCategory}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {RECIPE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Ingredients */}
          <div className="space-y-4">
            <Label>Ingredients</Label>
            
            <div className="space-y-4">
              {ingredients.map((ingredient) => (
                <div key={ingredient.id} className="flex items-center gap-2">
                  <div className="flex-1 bg-muted p-3 rounded-md flex justify-between items-center">
                    <span>
                      {ingredient.amount} {ingredient.unit} {ingredient.name}
                    </span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveIngredient(ingredient.id)}
                    >
                      <X className="h-4 w-4" />
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
                  onChange={e => setNewIngredientName(e.target.value)}
                  placeholder="Ingredient name"
                />
                
                {/* Ingredient suggestions */}
                {showIngredientSuggestions && (
                  <div className="absolute z-10 mt-1 w-full bg-popover border border-border rounded-md shadow-md">
                    {filteredIngredients.slice(0, 5).map(ingredient => (
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
                  onChange={e => setNewIngredientAmount(e.target.value)}
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
              
              <Button
                type="button"
                onClick={handleAddIngredient}
                size="icon"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Instructions */}
          <div className="space-y-2">
            <Label htmlFor="instructions">Instructions</Label>
            <Textarea
              id="instructions"
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              placeholder="How to prepare the cocktail..."
              rows={5}
            />
          </div>
          
          {/* Additional Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="glass">Glass Type</Label>
              <Select
                value={glass || ""}
                onValueChange={handleGlassChange}
              >
                <SelectTrigger id="glass" className="w-full">
                  <SelectValue placeholder="Select a glass type">
                    {glass && (
                      <div className="flex items-center">
                        <GlassIcon glassType={glass as GlassType} className="mr-2 h-4 w-4" />
                        <span>{glass}</span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {GLASS_TYPES.map((glassType) => (
                    <SelectItem key={glassType} value={glassType}>
                      <div className="flex items-center">
                        <GlassIcon glassType={glassType as GlassType} className="mr-2 h-4 w-4" />
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
                onChange={e => setGarnish(e.target.value)}
                placeholder="Lemon twist, cherry, etc."
              />
            </div>
          </div>
          
          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes || ''}
              onChange={e => setNotes(e.target.value)}
              placeholder="Additional notes about the recipe..."
              rows={3}
            />
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button asChild type="button" variant="outline">
            <Link to={cancelLinkTo}>Cancel</Link>
          </Button>
          <Button type="submit">
            <Check className="mr-2 h-4 w-4" />
            {initialRecipe ? 'Save Changes' : 'Create Recipe'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
});

export default RecipeForm;
