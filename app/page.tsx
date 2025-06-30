"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChefHat, Plus, X, Sparkles, Clock, Users, BookOpen, Heart, Share2 } from "lucide-react"
import { generateRecipes } from "./actions/generate-recipes"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { useCollections } from "./contexts/collections-context"
import { AuthButton } from "@/components/auth/auth-button"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

interface Recipe {
  name: string
  description: string
  ingredients: string[]
  instructions: string[]
  cookingTime: string
  servings: number
  difficulty: "Easy" | "Medium" | "Hard"
  id?: string
}

export default function HomePage() {
  const [user, setUser] = useState<any>(null)
  const [ingredients, setIngredients] = useState<string[]>([])
  const [currentIngredient, setCurrentIngredient] = useState("")
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const { collections, addRecipeToCollection, removeRecipeFromCollection, isRecipeInCollection } = useCollections()
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [selectedCollections, setSelectedCollections] = useState<string[]>([])

  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
    }

    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: any, session: { user: any }) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const addIngredient = () => {
    if (currentIngredient.trim() && !ingredients.includes(currentIngredient.trim())) {
      setIngredients([...ingredients, currentIngredient.trim()])
      setCurrentIngredient("")
    }
  }

  const removeIngredient = (ingredient: string) => {
    setIngredients(ingredients.filter((i) => i !== ingredient))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addIngredient()
    }
  }

  const generateRecipeRecommendations = async () => {
    if (ingredients.length === 0) return

    setIsLoading(true)
    try {
      const generatedRecipes = await generateRecipes(ingredients)
      setRecipes(generatedRecipes)
    } catch (error) {
      console.error("Error generating recipes:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const openSaveDialog = (recipe: Recipe) => {
    if (!user) {
      alert("Please sign in to save recipes")
      return
    }

    const recipeWithId = { ...recipe, id: recipe.name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now() }
    setSelectedRecipe(recipeWithId)
    const currentCollections = collections.filter((c) => isRecipeInCollection(c.id, recipeWithId.id)).map((c) => c.id)
    setSelectedCollections(currentCollections)
    setSaveDialogOpen(true)
  }

  const handleSaveRecipe = async () => {
    if (!selectedRecipe || !user) return

    try {
      // Remove from collections that are no longer selected
      for (const collection of collections) {
        if (selectedRecipe.id && isRecipeInCollection(collection.id, selectedRecipe.id) && !selectedCollections.includes(collection.id)) {
          await removeRecipeFromCollection(collection.id, selectedRecipe.id)
        }
      }

      // Add to newly selected collections
      for (const collectionId of selectedCollections) {
        if (selectedRecipe.id && !isRecipeInCollection(collectionId, selectedRecipe.id)) {
          await addRecipeToCollection(collectionId, {
            name: selectedRecipe.name,
            description: selectedRecipe.description,
            ingredients: selectedRecipe.ingredients,
            instructions: selectedRecipe.instructions,
            cooking_time: selectedRecipe.cookingTime,
            servings: selectedRecipe.servings,
            difficulty: selectedRecipe.difficulty,
            source_ingredients: ingredients,
          })
        }
      }

      setSaveDialogOpen(false)
      setSelectedRecipe(null)
      setSelectedCollections([])
    } catch (error) {
      console.error("Error saving recipe:", error)
      alert("Failed to save recipe")
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-500/20 text-green-300 border-green-500/30"
      case "Medium":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
      case "Hard":
        return "bg-red-500/20 text-red-300 border-red-500/30"
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30"
    }
  }


  return (
    <div className="h-full w-full bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5"></div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 rounded-full glass">
              <ChefHat className="h-8 w-8 text-purple-300" />
            </div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent mb-4">
            AI Recipe Recommender
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Enter your available ingredients and let AI create personalized recipes just for you
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mt-6">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
              <Link href="/collections">
                <Button
                  variant="outline"
                  className="glass glass-hover text-white border-white/20 bg-transparent text-sm sm:text-base"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">My Collections</span>
                  <span className="sm:hidden">Collections</span> ({collections.length})
                </Button>
              </Link>
              <Link href="/discover">
                <Button
                  variant="outline"
                  className="glass glass-hover text-white border-white/20 bg-transparent text-sm sm:text-base"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Discover Recipes</span>
                  <span className="sm:hidden">Discover</span>
                </Button>
              </Link>
            </div>
            <div className="mt-2 sm:mt-0">
              <AuthButton user={user} />
            </div>
          </div>
        </div>

        <Card className="mb-8 glass glass-hover shadow-2xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-400" />
              Available Ingredients
            </CardTitle>
            <CardDescription className="text-gray-300">
              Add ingredients you have available to generate recipe recommendations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter an ingredient (e.g., chicken, tomatoes, rice)"
                value={currentIngredient}
                onChange={(e) => setCurrentIngredient(e.target.value)}
                onKeyPress={handleKeyPress}
                className="bg-gray-950/50 border-gray-700/50 text-white placeholder:text-gray-500 focus:border-purple-400/50 focus:ring-purple-400/20"
              />
              <Button
                onClick={addIngredient}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {ingredients.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {ingredients.map((ingredient, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-gray-800/50 text-gray-200 border-gray-700/50 hover:bg-gray-700/50 transition-colors"
                  >
                    {ingredient}
                    <button
                      onClick={() => removeIngredient(ingredient)}
                      className="ml-2 hover:text-red-300 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            <Button
              onClick={generateRecipeRecommendations}
              disabled={ingredients.length === 0 || isLoading}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-0 py-3 text-base sm:text-lg font-semibold disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Generating Recipes...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Generate Recipe Recommendations
                </div>
              )}
            </Button>
          </CardContent>
        </Card>

        {recipes.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white text-center mb-8">Your Personalized Recipes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recipes.map((recipe, index) => (
                <Card key={index} className="glass glass-hover shadow-2xl hover:scale-105 transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="text-white text-xl">{recipe.name}</CardTitle>
                    <CardDescription className="text-gray-300">{recipe.description}</CardDescription>
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openSaveDialog(recipe)}
                        className="text-purple-300 hover:text-purple-200 hover:bg-purple-500/10"
                      >
                        <Heart className="h-4 w-4 mr-1" />
                        Save Recipe
                      </Button>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1 text-sm text-gray-300">
                        <Clock className="h-4 w-4" />
                        {recipe.cookingTime}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-300">
                        <Users className="h-4 w-4" />
                        {recipe.servings} servings
                      </div>
                      <Badge className={`text-xs ${getDifficultyColor(recipe.difficulty)}`}>{recipe.difficulty}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-white mb-2">Ingredients:</h4>
                      <ul className="text-sm text-gray-300 space-y-1">
                        {recipe.ingredients.map((ingredient, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-purple-400 mt-1">•</span>
                            {ingredient}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-2">Instructions:</h4>
                      <ol className="text-sm text-gray-300 space-y-2">
                        {recipe.instructions.map((instruction, idx) => (
                          <li key={idx} className="flex gap-3">
                            <span className="bg-purple-500/20 text-purple-300 rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            {instruction}
                          </li>
                        ))}
                      </ol>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {recipes.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <div className="p-4 rounded-full glass w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <ChefHat className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">Ready to Cook?</h3>
            <p className="text-gray-400">
              Add some ingredients above to get started with AI-powered recipe recommendations
            </p>
          </div>
        )}

        <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
          <DialogContent className="glass border-gray-800/50 text-white">
            <DialogHeader>
              <DialogTitle>Save Recipe to Collections</DialogTitle>
              <DialogDescription className="text-gray-300">
                Choose which collections to save "{selectedRecipe?.name}" to
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {collections.length > 0 ? (
                <div className="space-y-3">
                  {collections.map((collection) => (
                    <div key={collection.id} className="flex items-center space-x-3">
                      <Checkbox
                        id={collection.id}
                        checked={selectedCollections.includes(collection.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedCollections([...selectedCollections, collection.id])
                          } else {
                            setSelectedCollections(selectedCollections.filter((id) => id !== collection.id))
                          }
                        }}
                        className="border-white/20 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                      />
                      <label htmlFor={collection.id} className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded bg-gradient-to-r ${collection.color}`}></div>
                          <div>
                            <p className="font-medium text-white">{collection.name}</p>
                          </div>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <BookOpen className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-400 mb-4">No collections yet</p>
                  <Link href="/collections">
                    <Button className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600">
                      Create Your First Collection
                    </Button>
                  </Link>
                </div>
              )}
            </div>
            {collections.length > 0 && (
              <div className="flex justify-between">
                <Link href="/collections">
                  <Button variant="outline" className="glass text-white border-white/20 bg-transparent">
                    Manage Collections
                  </Button>
                </Link>
                <Button
                  onClick={handleSaveRecipe}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                >
                  Save Recipe
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
