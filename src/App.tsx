import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { RecipeProvider } from "./contexts/RecipeContext";
import HomePage from "./pages/HomePage";
import NewRecipePage from "./pages/NewRecipePage";
import EditRecipePage from "./pages/EditRecipePage";
import RecipePage from "./pages/RecipePage";
import IdeatePage from "./pages/IdeatePage";
import TinderPage from "./pages/TinderPage";
import Header from "./components/Header";
import { Toaster } from "sonner";

function App() {
  return (
    <RecipeProvider>
      <Router>
        <div className="h-screen flex flex-col">
          <Header />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/recipes/new" element={<NewRecipePage />} />
            <Route path="/recipes/:id" element={<RecipePage />} />
            <Route path="/recipes/:id/edit" element={<EditRecipePage />} />
            <Route path="/ideate" element={<IdeatePage />} />
            <Route path="/tinder" element={<TinderPage />} />
          </Routes>
        </div>
        <Toaster position="bottom-right" />
      </Router>
    </RecipeProvider>
  );
}

export default App;
