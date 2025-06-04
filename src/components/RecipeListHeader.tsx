import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  MagnifyingGlassIcon,
  XIcon,
  SortAscendingIcon,
  SortDescendingIcon,
  PlusIcon,
} from "@phosphor-icons/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "react-router-dom";

export function RecipeListHeader({
  searchTerm,
  setSearchTerm,
  categoryFilter,
  setCategoryFilter,
  sortField,
  sortOrder,
  uniqueCategories,
  handleSortChange,
}: {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  categoryFilter: string | null;
  setCategoryFilter: (category: string | null) => void;
  sortField: "name" | "created";
  sortOrder: "asc" | "desc";
  uniqueCategories: string[];
  handleSortChange: (field: "name" | "created") => void;
}) {
  return (
    <>
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
    </>
  );
}
