import React, { useState, useMemo, useCallback } from "react";
import type { Recipe } from "../lib/types";
import { MenuRecipeItem } from "./RecipeListItem";
import { RecipeListHeader } from "./RecipeListHeader";

interface RecipeListProps {
  recipes: Recipe[];
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

function RecipeList({ recipes }: RecipeListProps) {
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
      <RecipeListHeader
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        sortField={sortField}
        sortOrder={sortOrder}
        uniqueCategories={uniqueCategories}
        handleSortChange={handleSortChange}
      />

      {sortedRecipes.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            {searchTerm || (categoryFilter && categoryFilter !== "all")
              ? "No recipes found matching your search."
              : "No recipes available. Create your first recipe!"}
          </p>
        </div>
      ) : (
        <ul className="space-y-1 bg-card rounded-lg border shadow-sm">
          {sortedRecipes.map((recipe, index) => (
            <li key={recipe.id}>
              <MenuRecipeItem
                recipe={recipe}
                isLast={index === sortedRecipes.length - 1}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default RecipeList;
