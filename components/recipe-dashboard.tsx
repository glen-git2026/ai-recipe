"use client";

import { useState } from "react";
import { IngredientInput } from "./ingredient-input";
import { RecipeCanvas, Recipe } from "./recipe-canvas";
import { ChefTipBubble } from "./chef-tip-bubble";
import { ChefHat, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

type ViewState = "idle" | "loading" | "result";

export function RecipeDashboard() {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [viewState, setViewState] = useState<ViewState>("idle");
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [showChefTip, setShowChefTip] = useState(false);
  const [chefTipMessage, setChefTipMessage] = useState("");

  const generateRecipe = async () => {
    if (ingredients.length === 0) return;

    setViewState("loading");
    setShowChefTip(false);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ingredients }),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        const errorMessage =
          typeof errorPayload?.error === "string"
            ? errorPayload.error
            : "Recipe API request failed";
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (data.status === "redirect") {
        setChefTipMessage(
          "I only speak Chef! Tell me what's in your fridge."
        );
        setShowChefTip(true);
        setViewState("idle");
        return;
      }

      setRecipe(data.recipe);
      setViewState("result");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to generate a response right now.";
      setChefTipMessage(message);
      setShowChefTip(true);
      setViewState("idle");
    }
  };

  const resetDashboard = () => {
    setViewState("idle");
    setRecipe(null);
    setIngredients([]);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <ChefHat className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-foreground">{"Chef's Lab"}</h1>
              <p className="text-xs text-muted-foreground">AI Recipe Generator</p>
            </div>
          </div>
          
          {viewState === "result" && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={resetDashboard}
              className="flex items-center gap-2 rounded-xl bg-secondary px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              New Recipe
            </motion.button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid min-h-[calc(100vh-8rem)] gap-8 lg:grid-cols-2">
          {/* Left Side - Ingredient Input */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl border border-border bg-card p-8"
          >
            <IngredientInput
              ingredients={ingredients}
              setIngredients={setIngredients}
              onGenerate={generateRecipe}
              isLoading={viewState === "loading"}
            />
          </motion.div>

          {/* Right Side - Recipe Canvas */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-2xl border border-border bg-card p-8"
          >
            <RecipeCanvas recipe={recipe} viewState={viewState} />
          </motion.div>
        </div>
      </main>

      {/* Chef Tip Bubble */}
      <ChefTipBubble
        show={showChefTip}
        message={chefTipMessage}
        onClose={() => setShowChefTip(false)}
      />
    </div>
  );
}
