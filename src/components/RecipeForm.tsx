import React, { useState, useEffect } from 'react';
import { Recipe, Ingredient } from '../lib/types';
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

interface RecipeFormProps {
  initialRecipe?: Recipe;
  onSubmit: (recipe: Recipe) => void;
  onCancel: () => void;
}

const RecipeForm: React.FC<RecipeFormProps> = ({ initialRecipe, onSubmit, onCancel }) => {
  const { uniqueIngredients } = useRecipes();
  const [name, setName] = useState(initialRecipe?.name || '');
  const [ingredients, setIngredients] = useState<Ingredient[]>(initialRecipe?.ingredients || []);
  const [instructions, setInstructions] = useState(initialRecipe?.instructions || '');
  const [glass, setGlass] = useState(initialRecipe?.glass || '');
  const [garnish, setGarnish] = useState(initialRecipe?.garnish || '');
  const [notes, setNotes] = useState(initialRecipe?.notes || '');
  
  const [newIngredientName, setNewIngredientName] = useState('');
  const [newIngredientAmount, setNewIngredientAmount] = useState('');
  const [newIngredientUnit, setNewIngredientUnit] = useState('oz');
  const [filteredIngredients, setFilteredIngredients] = useState<string[]>([]);
  const [showIngredientSuggestions, setShowIngredientSuggestions] = useState(false);
  
  useEffect(() => {
    if (newIngredientName) {
      const filtered = uniqueIngredients.filter(ingredient =>
        ingredient.toLowerCase().includes(newIngredientName.toLowerCase())
      );
      setFilteredIngredients(filtered);
      setShowIngredientSuggestions(filtered.length > 0);
    } else {
      setFilteredIngredients([]);
      setShowIngredientSuggestions(false);
    }
  }, [newIngredientName, uniqueIngredients]);
  
  const handleAddIngredient = () => {
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
    
    setIngredients([...ingredients, newIngredient]);
    setNewIngredientName('');
    setNewIngredientAmount('');
    setNewIngredientUnit('oz');
  };
  
  const handleRemoveIngredient = (id: string) => {
    setIngredients(ingredients.filter(i => i.id !== id));
  };
  
  const handleSelectIngredient = (ingredient: string) => {
    setNewIngredientName(ingredient);
    setShowIngredientSuggestions(false);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
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
          updated: new Date().toISOString()
        }
      : createRecipe(name, ingredients, instructions, glass, garnish, notes);
    
    onSubmit(recipe);
  };
  
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
              <Input
                id="glass"
                value={glass}
                onChange={e => setGlass(e.target.value)}
                placeholder="Coupe, rocks, etc."
              />
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
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            <Check className="mr-2 h-4 w-4" />
            {initialRecipe ? 'Save Changes' : 'Create Recipe'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default RecipeForm;