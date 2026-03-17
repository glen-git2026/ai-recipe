"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Sparkles } from "lucide-react";
import clsx from "clsx";

const SUGGESTED_INGREDIENTS = [
  "Chicken",
  "Salmon",
  "Beef",
  "Tofu",
  "Eggs",
  "Rice",
  "Pasta",
  "Tomatoes",
  "Onions",
  "Garlic",
  "Bell Peppers",
  "Mushrooms",
  "Spinach",
  "Broccoli",
  "Cheese",
  "Olive Oil",
  "Lemon",
  "Ginger",
  "Soy Sauce",
  "Basil",
];

interface IngredientInputProps {
  ingredients: string[];
  setIngredients: (ingredients: string[]) => void;
  onGenerate: () => void;
  isLoading: boolean;
}

export function IngredientInput({
  ingredients,
  setIngredients,
  onGenerate,
  isLoading,
}: IngredientInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputValue.length > 0) {
      const filtered = SUGGESTED_INGREDIENTS.filter(
        (ing) =>
          ing.toLowerCase().includes(inputValue.toLowerCase()) &&
          !ingredients.includes(ing)
      );
      setSuggestions(filtered.slice(0, 5));
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }, [inputValue, ingredients]);

  const addIngredient = (ingredient: string) => {
    if (ingredient.trim() && !ingredients.includes(ingredient.trim())) {
      setIngredients([...ingredients, ingredient.trim()]);
    }
    setInputValue("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      addIngredient(inputValue);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="mb-2 text-sm font-medium uppercase tracking-widest text-primary">
            Ingredients
          </h2>
          <p className="text-muted-foreground">
            {"Add what's in your fridge, and let the AI create magic."}
          </p>
        </motion.div>
      </div>

      {/* Input Field */}
      <div className="relative mb-6">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type an ingredient..."
            className="w-full rounded-xl border border-border bg-secondary/50 px-5 py-4 text-lg text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-300"
          />
          <button
            onClick={() => addIngredient(inputValue)}
            disabled={!inputValue.trim()}
            className={clsx(
              "absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 transition-all duration-200",
              inputValue.trim()
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        {/* Auto-suggestions Dropdown */}
        <AnimatePresence>
          {showSuggestions && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 z-10 mt-2 overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
            >
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion}
                  onClick={() => addIngredient(suggestion)}
                  className="flex w-full items-center gap-3 px-5 py-3 text-left text-foreground hover:bg-secondary/50 transition-colors"
                >
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span>{suggestion}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Ingredient Tags */}
      <div className="mb-8 flex-1">
        <div className="flex flex-wrap gap-3">
          <AnimatePresence mode="popLayout">
            {ingredients.map((ingredient, index) => (
              <motion.div
                key={ingredient}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="group flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-foreground"
              >
                <span>{ingredient}</span>
                <button
                  onClick={() => removeIngredient(index)}
                  className="rounded-full p-0.5 text-muted-foreground hover:bg-primary/20 hover:text-primary transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {ingredients.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 flex flex-col items-center justify-center text-center"
          >
            <div className="mb-4 rounded-full bg-secondary/50 p-6">
              <Sparkles className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              Start adding ingredients to get personalized recipes
            </p>
          </motion.div>
        )}
      </div>

      {/* Quick Add Section */}
      <div className="mb-8">
        <p className="mb-3 text-sm text-muted-foreground">Quick add:</p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_INGREDIENTS.slice(0, 6)
            .filter((ing) => !ingredients.includes(ing))
            .map((ingredient) => (
              <button
                key={ingredient}
                onClick={() => addIngredient(ingredient)}
                className="rounded-lg border border-border bg-secondary/30 px-3 py-1.5 text-sm text-muted-foreground hover:border-primary/50 hover:bg-primary/10 hover:text-foreground transition-all duration-200"
              >
                + {ingredient}
              </button>
            ))}
        </div>
      </div>

      {/* Generate Button */}
      <motion.button
        onClick={onGenerate}
        disabled={ingredients.length === 0 || isLoading}
        whileHover={{ scale: ingredients.length > 0 && !isLoading ? 1.02 : 1 }}
        whileTap={{ scale: ingredients.length > 0 && !isLoading ? 0.98 : 1 }}
        className={clsx(
          "relative w-full overflow-hidden rounded-xl py-4 text-lg font-semibold transition-all duration-300",
          ingredients.length > 0 && !isLoading
            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30"
            : "bg-secondary text-muted-foreground cursor-not-allowed"
        )}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="h-5 w-5" />
            </motion.div>
            Cooking up ideas...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5" />
            Generate Recipe
          </span>
        )}
      </motion.button>
    </div>
  );
}
