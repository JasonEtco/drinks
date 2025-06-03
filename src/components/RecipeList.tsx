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
  PlusIcon,
} from "@phosphor-icons/react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "react-router-dom";
interface RecipeListProps {
  recipes: Recipe[];
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
  ({ recipes, onBatchCalculate, onClarify }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [sortField, setSortField] = useState<SortField>("created");
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");

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

            <Button
              asChild
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-primary text-primary-foreground shadow-xs hover:bg-primary/80 h-9 px-4 py-2 has-[>svg]:px-3"
            >
              <Link to="/recipes/new">
                <PlusIcon className="h-4 w-4" />
                New Recipe
              </Link>
            </Button>
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
                onBatchCalculate={() => onBatchCalculate(recipe.id)}
                onClarify={() => onClarify(recipe.id)}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
);

export default RecipeList;
