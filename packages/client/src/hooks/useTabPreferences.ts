import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";

interface TabPreferences {
  viewMode: string;
  visibleColumns: string[];
  columnOrder: string[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export function useTabPreferences(scope: string, defaults: TabPreferences) {
  const [preferences, setPreferences] = useState<TabPreferences>(defaults);
  const [isLoading, setIsLoading] = useState(true);

  // Load preferences from database
  const { data: savedPrefs } = trpc.preferences.get.useQuery({ scope });

  useEffect(() => {
    if (savedPrefs) {
      setPreferences({ ...defaults, ...savedPrefs });
    }
    setIsLoading(false);
  }, [savedPrefs]);

  // Save preferences mutation
  const saveMutation = trpc.preferences.save.useMutation();

  const updatePreferences = (updates: Partial<TabPreferences>) => {
    const newPrefs = { ...preferences, ...updates };
    setPreferences(newPrefs);
    saveMutation.mutate({ scope, preferences: newPrefs });
  };

  const resetPreferences = () => {
    setPreferences(defaults);
    saveMutation.mutate({ scope, preferences: defaults });
  };

  return {
    preferences,
    updatePreferences,
    resetPreferences,
    isLoading,
  };
}
