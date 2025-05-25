import React, { useState } from 'react';
import { Recipe } from './lib/types';
import { RecipeProvider, useRecipes } from './contexts/RecipeContext';
import { exportRecipes, importRecipes } from './lib/storage';
import RecipeList from './components/RecipeList';
import RecipeForm from './components/RecipeForm';
import BatchCalculator from './components/BatchCalculator';
import ClarificationCalculator from './components/ClarificationCalculator';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, ArrowCircleUp, ArrowCircleDown } from '@phosphor-icons/react';
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
  
  const handleImportRecipes = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    importRecipes(file)
      .then(() => {
        toast.success('Recipes imported successfully!');
        // Reset the file input so the same file can be imported again if needed
        e.target.value = '';
      })
      .catch(error => {
        toast.error(`Error importing recipes: ${error.message}`);
      });
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold">Mixologist</h1>
          
          <div className="flex items-center gap-4">
            <div>
              <input
                type="file"
                id="import-recipes"
                accept=".json"
                onChange={handleImportRecipes}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('import-recipes')?.click()}
              >
                <ArrowCircleDown className="mr-2 h-4 w-4" />
                Import
              </Button>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={exportRecipes}
            >
              <ArrowCircleUp className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
        
        <p className="text-muted-foreground">
          Create, store, and scale your favorite cocktail recipes
        </p>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="recipes">Recipes</TabsTrigger>
            <TabsTrigger value="edit" disabled={!isCreating && !editingRecipeId}>
              {isCreating ? 'Create Recipe' : 'Edit Recipe'}
            </TabsTrigger>
          </TabsList>
          
          {activeTab === 'recipes' && (
            <Button onClick={handleCreateRecipe}>
              <Plus className="mr-2 h-4 w-4" />
              New Recipe
            </Button>
          )}
        </div>
        
        <TabsContent value="recipes" className="space-y-4 mt-4">
          <RecipeList
            recipes={recipes}
            onEditRecipe={handleEditRecipe}
            onDeleteRecipe={handleDeleteRecipe}
            onBatchCalculate={handleBatchCalculate}
            onClarify={handleClarify}
          />
        </TabsContent>
        
        <TabsContent value="edit" className="mt-4">
          <RecipeForm
            initialRecipe={editingRecipe}
            onSubmit={handleRecipeSubmit}
            onCancel={handleCancelEdit}
          />
        </TabsContent>
      </Tabs>
      
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