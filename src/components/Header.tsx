import { WakeLockToggle } from "./WakeLockToggle";

export default function Header() {
  return (
    <header className="mb-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl md:text-4xl font-bold">Drinks</h1>
        <WakeLockToggle />
      </div>

      <p className="text-muted-foreground">
        Create, store, and scale your favorite cocktail recipes
      </p>
    </header>
  );
}
