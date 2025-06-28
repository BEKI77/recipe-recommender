"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AuthButton } from "@/components/auth/auth-button"
import { ChefHat, Clock, Users, Search, Eye, Heart, Share2 } from "lucide-react"
import Link from "next/link"

interface SharedRecipeWithDetails {
  id: string
  recipe_id: string
  shared_by: string
  title: string
  description: string | null
  is_active: boolean
  view_count: number
  created_at: string
  recipe_name: string
  recipe_description: string | null
  recipe_ingredients: string[]
  recipe_instructions: string[]
  recipe_cooking_time: string
  recipe_servings: number
  recipe_difficulty: "Easy" | "Medium" | "Hard"
  profile_full_name: string | null
  profile_email: string | null
}

export default function DiscoverPage() {
  const [user, setUser] = useState<any>(null)
  const [sharedRecipes, setSharedRecipes] = useState<SharedRecipeWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
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

  useEffect(() => {
    fetchSharedRecipes()
  }, [])

  const fetchSharedRecipes = async () => {
    try {
      // First, let's try a simpler approach by fetching shared recipes and then recipes separately
      const { data: sharedData, error: sharedError } = await supabase
        .from("shared_recipes")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })

      if (sharedError) throw sharedError

      if (!sharedData || sharedData.length === 0) {
        setSharedRecipes([])
        setLoading(false)
        return
      }

      // Get recipe IDs
      const recipeIds = sharedData.map((item: { recipe_id: any }) => item.recipe_id)

      // Fetch recipes
      const { data: recipesData, error: recipesError } = await supabase.from("recipes").select("*").in("id", recipeIds)

      if (recipesError) throw recipesError

      // Get user IDs for profiles
      const userIds = sharedData.map((item: { shared_by: any }) => item.shared_by)

      // Fetch profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds)

      if (profilesError) throw profilesError

      // Combine the data
      const combinedData: SharedRecipeWithDetails[] = sharedData
        .map((shared: { recipe_id: any; shared_by: any }) => {
          const recipe = recipesData?.find((r: { id: any }) => r.id === shared.recipe_id)
          const profile = profilesData?.find((p: { id: any }) => p.id === shared.shared_by)

          return {
            ...shared,
            recipe_name: recipe?.name || "Unknown Recipe",
            recipe_description: recipe?.description || null,
            recipe_ingredients: recipe?.ingredients || [],
            recipe_instructions: recipe?.instructions || [],
            recipe_cooking_time: recipe?.cooking_time || "Unknown",
            recipe_servings: recipe?.servings || 0,
            recipe_difficulty: recipe?.difficulty || "Easy",
            profile_full_name: profile?.full_name || null,
            profile_email: profile?.email || null,
          }
        })
        .filter((item: { recipe_name: string }) => item.recipe_name !== "Unknown Recipe") // Filter out items without valid recipes

      setSharedRecipes(combinedData)
    } catch (error) {
      console.error("Error fetching shared recipes:", error)
    } finally {
      setLoading(false)
    }
  }

  const incrementViewCount = async (recipeId: string) => {
    try {
      await supabase.rpc("increment_view_count", { recipe_id: recipeId })

      // Update local state to reflect the change
      setSharedRecipes((prev) =>
        prev.map((item) => (item.recipe_id === recipeId ? { ...item, view_count: item.view_count + 1 } : item)),
      )
    } catch (error) {
      console.error("Error incrementing view count:", error)
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

  const filteredRecipes = sharedRecipes.filter(
    (item) =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.recipe_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.recipe_ingredients.some((ingredient) => ingredient.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950">
      <div className="absolute inset-0 bg-[url('/placeholder.svg?height=1080&width=1920')] opacity-5"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5"></div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/" className="text-purple-400 hover:text-purple-300 mb-2 inline-block">
              ← Back to Recipe Generator
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full glass">
                <Share2 className="h-6 w-6 text-purple-300" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Discover Recipes</h1>
                <p className="text-gray-300">Explore recipes shared by the community</p>
              </div>
            </div>
          </div>
          <AuthButton user={user} />
        </div>

        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search recipes, ingredients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-950/50 border-gray-700/50 text-white placeholder:text-gray-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-purple-400 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-300">Loading shared recipes...</p>
          </div>
        ) : filteredRecipes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map((item) => (
              <Card key={item.id} className="glass glass-hover shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-white text-xl">{item.title}</CardTitle>
                  <CardDescription className="text-gray-300">
                    {item.description || item.recipe_description}
                  </CardDescription>
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span>by {item.profile_full_name || item.profile_email}</span>
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {item.view_count}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1 text-sm text-gray-300">
                      <Clock className="h-4 w-4" />
                      {item.recipe_cooking_time}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-300">
                      <Users className="h-4 w-4" />
                      {item.recipe_servings} servings
                    </div>
                    <Badge className={`text-xs ${getDifficultyColor(item.recipe_difficulty)}`}>
                      {item.recipe_difficulty}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-white mb-2">Ingredients:</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      {item.recipe_ingredients.slice(0, 5).map((ingredient, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-purple-400 mt-1">•</span>
                          {ingredient}
                        </li>
                      ))}
                      {item.recipe_ingredients.length > 5 && (
                        <li className="text-gray-400 text-xs">
                          +{item.recipe_ingredients.length - 5} more ingredients
                        </li>
                      )}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">Instructions:</h4>
                    <ol className="text-sm text-gray-300 space-y-2">
                      {item.recipe_instructions.slice(0, 3).map((instruction, idx) => (
                        <li key={idx} className="flex gap-3">
                          <span className="bg-purple-500/20 text-purple-300 rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          {instruction.length > 100 ? `${instruction.substring(0, 100)}...` : instruction}
                        </li>
                      ))}
                      {item.recipe_instructions.length > 3 && (
                        <li className="text-gray-400 text-xs ml-9">
                          +{item.recipe_instructions.length - 3} more steps
                        </li>
                      )}
                    </ol>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => incrementViewCount(item.recipe_id)}
                      className="flex-1 glass text-white border-white/20 bg-transparent"
                    >
                      <Heart className="h-4 w-4 mr-1" />
                      View Recipe
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="p-4 rounded-full glass w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <ChefHat className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              {searchTerm ? "No recipes found" : "No shared recipes yet"}
            </h3>
            <p className="text-gray-400">
              {searchTerm ? "Try adjusting your search terms" : "Be the first to share a recipe with the community!"}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
