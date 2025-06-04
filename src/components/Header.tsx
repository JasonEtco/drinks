import { Link, useLocation } from "react-router-dom";
import { WakeLockToggle } from "./WakeLockToggle";
import { Button } from "@/components/ui/button";
import { SparkleIcon, HouseIcon, HeartIcon } from "@phosphor-icons/react";

export default function Header() {
  const location = useLocation();

  return (
    <header className="mb-4 flex sm:flex-row flex-col items-center justify-between">
      <Link to="/" className="block sm:mb-0 mb-2 text-xl font-bold uppercase">
        Drinks
      </Link>
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
            variant={location.pathname === "/tinder" ? "default" : "ghost"}
            size="sm"
          >
            <Link to="/tinder">
              <HeartIcon className="h-4 w-4" />
              Tinder
            </Link>
          </Button>
          <Button
            asChild
            variant={location.pathname === "/ideate" ? "default" : "ghost"}
            size="sm"
          >
            <Link to="/ideate">
              <SparkleIcon className="h-4 w-4" />
              Ideate
            </Link>
          </Button>
        </nav>
        <WakeLockToggle />
      </div>
    </header>
  );
}
