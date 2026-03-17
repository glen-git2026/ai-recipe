"use client";

import { motion } from "framer-motion";
import { Clock, Users, ChefHat, Flame, Utensils } from "lucide-react";
import clsx from "clsx";

export interface Recipe {
  title: string;
  description: string;
  prepTime: string;
  cookTime: string;
  servings: number;
  difficulty: "Easy" | "Medium" | "Hard";
  ingredients: { item: string; amount: string }[];
  instructions: string[];
  tips: string;
}

interface RecipeCanvasProps {
  recipe: Recipe | null;
  viewState: "idle" | "loading" | "result";
}

export function RecipeCanvas({ recipe, viewState }: RecipeCanvasProps) {
  const difficultyColor = {
    Easy: "text-primary",
    Medium: "text-yellow-500",
    Hard: "text-red-500",
  };

  if (viewState === "idle") {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-md"
        >
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-secondary/50">
            <ChefHat className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="mb-3 text-2xl font-semibold text-foreground">
            Your Recipe Canvas
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Add your ingredients on the left and watch as our AI chef creates a
            delicious recipe tailored just for you.
          </p>
        </motion.div>
      </div>
    );
  }

  if (viewState === "loading") {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="mx-auto mb-8 flex h-32 w-32 items-center justify-center rounded-full bg-primary/10 border border-primary/20"
          >
            <ChefHat className="h-16 w-16 text-primary" />
          </motion.div>

          <h2 className="mb-3 text-2xl font-semibold text-foreground">
            Chef is cooking...
          </h2>
          <p className="text-muted-foreground">
            Analyzing ingredients and crafting the perfect recipe
          </p>

          {/* Loading Progress Bars */}
          <div className="mt-8 flex justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="h-2 w-12 rounded-full bg-primary"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  if (!recipe) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="h-full overflow-y-auto pr-2"
    >
      {/* Recipe Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <h1 className="mb-3 text-3xl font-bold text-foreground text-balance">
          {recipe.title}
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          {recipe.description}
        </p>
      </motion.div>

      {/* Recipe Meta */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        <div className="rounded-xl border border-border bg-secondary/30 p-4">
          <div className="mb-2 flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="text-sm">Prep Time</span>
          </div>
          <p className="font-semibold text-foreground">{recipe.prepTime}</p>
        </div>
        <div className="rounded-xl border border-border bg-secondary/30 p-4">
          <div className="mb-2 flex items-center gap-2 text-muted-foreground">
            <Flame className="h-4 w-4" />
            <span className="text-sm">Cook Time</span>
          </div>
          <p className="font-semibold text-foreground">{recipe.cookTime}</p>
        </div>
        <div className="rounded-xl border border-border bg-secondary/30 p-4">
          <div className="mb-2 flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span className="text-sm">Servings</span>
          </div>
          <p className="font-semibold text-foreground">{recipe.servings}</p>
        </div>
        <div className="rounded-xl border border-border bg-secondary/30 p-4">
          <div className="mb-2 flex items-center gap-2 text-muted-foreground">
            <Utensils className="h-4 w-4" />
            <span className="text-sm">Difficulty</span>
          </div>
          <p className={clsx("font-semibold", difficultyColor[recipe.difficulty])}>
            {recipe.difficulty}
          </p>
        </div>
      </motion.div>

      {/* Ingredients Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-8"
      >
        <h3 className="mb-4 text-xl font-semibold text-foreground">
          Ingredients
        </h3>
        <div className="rounded-xl border border-border bg-secondary/30 p-6">
          <ul className="grid gap-3 md:grid-cols-2">
            {recipe.ingredients.map((ing, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.05 }}
                className="flex items-center gap-3"
              >
                <span className="h-2 w-2 rounded-full bg-primary" />
                <span className="text-muted-foreground">{ing.amount}</span>
                <span className="text-foreground">{ing.item}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      </motion.div>

      {/* Instructions Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-8"
      >
        <h3 className="mb-4 text-xl font-semibold text-foreground">
          Instructions
        </h3>
        <div className="space-y-4">
          {recipe.instructions.map((instruction, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="flex gap-4 rounded-xl border border-border bg-secondary/30 p-5"
            >
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                {index + 1}
              </div>
              <p className="text-foreground leading-relaxed pt-1">
                {instruction}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Chef's Tip */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="rounded-xl border border-primary/30 bg-primary/10 p-6"
      >
        <div className="mb-3 flex items-center gap-2">
          <ChefHat className="h-5 w-5 text-primary" />
          <h4 className="font-semibold text-primary">{"Chef's Tip"}</h4>
        </div>
        <p className="text-foreground leading-relaxed">{recipe.tips}</p>
      </motion.div>
    </motion.div>
  );
}
