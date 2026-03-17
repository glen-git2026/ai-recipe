"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ChefHat, AlertCircle } from "lucide-react";

interface ChefTipBubbleProps {
  show: boolean;
  message: string;
  onClose: () => void;
}

export function ChefTipBubble({ show, message, onClose }: ChefTipBubbleProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
        >
          <div className="relative flex items-start gap-4 rounded-2xl border border-primary/30 bg-card px-6 py-5 shadow-2xl shadow-primary/10 max-w-md">
            {/* Chef Icon */}
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
              <ChefHat className="h-6 w-6 text-primary" />
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="mb-1 flex items-center gap-2">
                <span className="font-semibold text-foreground">
                  {"Chef's Note"}
                </span>
                <AlertCircle className="h-4 w-4 text-primary" />
              </div>
              <p className="text-muted-foreground leading-relaxed">{message}</p>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Decorative triangle */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-4 w-4 rotate-45 bg-card border-r border-b border-primary/30" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
