import { Link, useLocation } from "react-router-dom";
import { WakeLockToggle } from "./WakeLockToggle";
import { Button } from "@/components/ui/button";
import { BrainIcon, HouseIcon } from "@phosphor-icons/react";

export default function Header() {
  const location = useLocation();
  
  return (
    <header className="mb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl md:text-4xl font-bold">Drinks</h1>
        <div className="flex items-center gap-4">
          <nav className="flex gap-2">
            <Button 
              asChild 
              variant={location.pathname === "/" ? "default" : "ghost"}
              size="sm"
            >
              <Link to="/">
                <HouseIcon className="h-4 w-4" />
                Recipes
              </Link>
            </Button>
            <Button 
              asChild 
              variant={location.pathname === "/ideate" ? "default" : "ghost"}
              size="sm"
            >
              <Link to="/ideate">
                <BrainIcon className="h-4 w-4" />
                Ideate
              </Link>
            </Button>
          </nav>
          <WakeLockToggle />
        </div>
      </div>
    </header>
  );
}
