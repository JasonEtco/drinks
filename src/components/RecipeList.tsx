import React, { useState, useMemo, useCallback } from "react";
import { Recipe } from "../lib/types";
import RecipeCard from "./RecipeCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  MagnifyingGlassIcon,
  XIcon,
  SortAscendingIcon,
  SortDescendingIcon,
} from "@phosphor-icons/react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface RecipeListProps {
  recipes: Recipe[];
  onDeleteRecipe: (recipeId: string) => void;
  onBatchCalculate: (recipeId: string) => void;
  onClarify: (recipeId: string) => void;
}

type SortField = "name" | "created";
type SortOrder = "asc" | "desc";

// Get unique categories from recipes - memoized version
const getUniqueCategories = (recipes: Recipe[]): string[] => {
  const categories = new Set<string>();

  recipes.forEach((recipe) => {
    if (recipe.category) {
      categories.add(recipe.category);
    }
  });

  return Array.from(categories).sort();
};

const RecipeList: React.FC<RecipeListProps> = React.memo(
  ({ recipes, onDeleteRecipe, onBatchCalculate, onClarify }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [sortField, setSortField] = useState<SortField>("name");
    const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [recipeToDelete, setRecipeToDelete] = useState<Recipe | null>(null);

    // Memoize expensive calculations
    const uniqueCategories = useMemo(
      () => getUniqueCategories(recipes),
      [recipes]
    );

    // Memoize event handlers
    const handleSortChange = useCallback(
      (field: SortField) => {
        if (sortField === field) {
          setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
          setSortField(field);
          setSortOrder("asc");
        }
      },
      [sortField, sortOrder]
    );

    const handleDeleteClick = useCallback((recipe: Recipe) => {
      setRecipeToDelete(recipe);
    }, []);

    const confirmDelete = useCallback(() => {
      if (recipeToDelete) {
        onDeleteRecipe(recipeToDelete.id);
        setRecipeToDelete(null);
      }
    }, [recipeToDelete, onDeleteRecipe]);

    const cancelDelete = useCallback(() => {
      setRecipeToDelete(null);
    }, []);

    // Memoize filtered and sorted recipes
    const sortedRecipes = useMemo(() => {
      const filteredRecipes = recipes.filter((recipe) => {
        const lowerSearchTerm = searchTerm.toLowerCase();

        // Apply category filter first
        if (
          categoryFilter &&
          categoryFilter !== "all" &&
          recipe.category !== categoryFilter
        ) {
          return false;
        }

        // Search in recipe name
        if (recipe.name.toLowerCase().includes(lowerSearchTerm)) {
          return true;
        }

        // Search in ingredients
        if (
          recipe.ingredients.some((ing) =>
            ing.name.toLowerCase().includes(lowerSearchTerm)
          )
        ) {
          return true;
        }

        // Search in glass type
        if (
          recipe.glass &&
          recipe.glass.toLowerCase().includes(lowerSearchTerm)
        ) {
          return true;
        }

        return false;
      });

      return filteredRecipes.sort((a, b) => {
        if (sortField === "name") {
          return sortOrder === "asc"
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        } else {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
        }
      });
    }, [recipes, searchTerm, categoryFilter, sortField, sortOrder]);

    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="search">Search Recipes</Label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, ingredient, or glass..."
                  className="pl-9"
                />
              </div>
            </div>

            {uniqueCategories.length > 0 && (
              <div className="w-40 space-y-2">
                <Label htmlFor="category-filter">Filter by Category</Label>
                <Select
                  value={categoryFilter || "all"}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger id="category-filter" className="w-full">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {uniqueCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSortChange("name")}
                className={sortField === "name" ? "border-primary" : ""}
              >
                Name
                {sortField === "name" &&
                  (sortOrder === "asc" ? (
                    <SortAscendingIcon className="ml-1 h-4 w-4" />
                  ) : (
                    <SortDescendingIcon className="ml-1 h-4 w-4" />
                  ))}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSortChange("created")}
                className={sortField === "created" ? "border-primary" : ""}
              >
                Date
                {sortField === "created" &&
                  (sortOrder === "asc" ? (
                    <SortAscendingIcon className="ml-1 h-4 w-4" />
                  ) : (
                    <SortDescendingIcon className="ml-1 h-4 w-4" />
                  ))}
              </Button>
            </div>
          </div>
        </div>

        {categoryFilter && categoryFilter !== "all" && (
          <div className="flex items-center">
            <span className="text-sm">Filtering by: </span>
            <Button
              variant="secondary"
              size="sm"
              className="ml-2 gap-1"
              onClick={() => setCategoryFilter("all")}
            >
              {categoryFilter}
              <XIcon className="h-3 w-3" />
            </Button>
          </div>
        )}

        {sortedRecipes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {searchTerm || (categoryFilter && categoryFilter !== "all")
                ? "No recipes found matching your search."
                : "No recipes available. Create your first recipe!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onDelete={() => handleDeleteClick(recipe)}
                onBatchCalculate={() => onBatchCalculate(recipe.id)}
                onClarify={() => onClarify(recipe.id)}
              />
            ))}
          </div>
        )}

        <AlertDialog open={!!recipeToDelete} onOpenChange={cancelDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Recipe</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{recipeToDelete?.name}"? This
                action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }
);

export default RecipeList;
