import React, { useState } from 'react';
import { Recipe } from './lib/types';
import { RecipeProvider, useRecipes } from './contexts/RecipeContext';
import RecipeList from './components/RecipeList';
import RecipeForm from './components/RecipeForm';
import BatchCalculator from './components/BatchCalculator';
import ClarificationCalculator from './components/ClarificationCalculator';
import { Button } from '@/components/ui/button';
import { Plus } from '@phosphor-icons/react';
import { Toaster } from 'sonner';
import { toast } from 'sonner';

const AppContent = () => {
  const { recipes, addNewRecipe, updateExistingRecipe, removeRecipe, getRecipe, isLoading } = useRecipes();
  
  const [activeTab, setActiveTab] = useState('recipes');
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [batchRecipeId, setBatchRecipeId] = useState<string | null>(null);
  const [clarifyRecipeId, setClarifyRecipeId] = useState<string | null>(null);
  
  const editingRecipe = editingRecipeId ? getRecipe(editingRecipeId) : undefined;
  const batchRecipe = batchRecipeId ? getRecipe(batchRecipeId) : undefined;
  const clarifyRecipe = clarifyRecipeId ? getRecipe(clarifyRecipeId) : undefined;
  
  const handleCreateRecipe = () => {
    setIsCreating(true);
    setActiveTab('edit');
  };
  
  const handleEditRecipe = (recipeId: string) => {
    setEditingRecipeId(recipeId);
    setActiveTab('edit');
  };
  
  const handleBatchCalculate = (recipeId: string) => {
    setBatchRecipeId(recipeId);
  };
  
  const handleClarify = (recipeId: string) => {
    setClarifyRecipeId(recipeId);
  };
  
  const handleDeleteRecipe = (recipeId: string) => {
    removeRecipe(recipeId);
    toast.success('Recipe successfully deleted.');
  };
  
  const handleRecipeSubmit = (recipe: Recipe) => {
    if (editingRecipeId) {
      updateExistingRecipe(recipe);
      setEditingRecipeId(null);
      toast.success('Recipe updated successfully!');
    } else {
      addNewRecipe(recipe);
      toast.success('Recipe created successfully!');
    }
    
    setIsCreating(false);
    setActiveTab('recipes');
  };
  
  const handleCancelEdit = () => {
    setEditingRecipeId(null);
    setIsCreating(false);
    setActiveTab('recipes');
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="text-center">
          <p>Loading recipes...</p>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <header className="mb-8">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold">Mixologist</h1>
        </div>
        
        <p className="text-muted-foreground">
          Create, store, and scale your favorite cocktail recipes
        </p>
      </header>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">
            {activeTab === 'edit' ? (isCreating ? 'Create Recipe' : 'Edit Recipe') : 'Recipes'}
          </h2>
          
          {activeTab === 'recipes' && (
            <Button
              onClick={handleCreateRecipe}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-primary text-primary-foreground shadow-xs hover:bg-primary/80 h-9 px-4 py-2 has-[>svg]:px-3">
              <Plus className="mr-1 h-4 w-4" />
              New Recipe
            </Button>
          )}
        </div>
        
        {activeTab === 'recipes' ? (
          <div className="space-y-4 mt-4">
            <RecipeList
              recipes={recipes}
              onEditRecipe={handleEditRecipe}
              onDeleteRecipe={handleDeleteRecipe}
              onBatchCalculate={handleBatchCalculate}
              onClarify={handleClarify}
            />
          </div>
        ) : (
          <div className="mt-4">
            <RecipeForm
              initialRecipe={editingRecipe}
              onSubmit={handleRecipeSubmit}
              onCancel={handleCancelEdit}
            />
          </div>
        )}
      </div>
      {batchRecipe && (
        <BatchCalculator
          recipe={batchRecipe}
          open={!!batchRecipeId}
          onClose={() => setBatchRecipeId(null)}
        />
      )}
      {clarifyRecipe && (
        <ClarificationCalculator
          recipe={clarifyRecipe}
          open={!!clarifyRecipeId}
          onClose={() => setClarifyRecipeId(null)}
        />
      )}
      <Toaster position="bottom-right" />
    </>
  );
};

function App() {
  return (
    <RecipeProvider>
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <AppContent />
      </div>
    </RecipeProvider>
  );
}

export default App;