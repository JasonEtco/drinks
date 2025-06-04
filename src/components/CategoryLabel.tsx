import { Badge } from "./ui/badge";

export function CategoryLabel({ category }: { category: string }) {
  return (
    <Badge
      variant="outline"
      className="text-muted-foreground border-muted-foreground/20 bg-muted/20"
    >
      {category}
    </Badge>
  );
}
