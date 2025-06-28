"use server"
import { config } from 'dotenv';
config({path:".env"});

const SPOON_API_KEY = process.env.SPOON_API_KEY!

const BASE_URL = "https://api.spoonacular.com/recipes"

type Recipe = {
  name: string
  description: string
  ingredients: string[]
  instructions: string[]
  cookingTime: string
  servings: number
  difficulty: "Easy" | "Medium" | "Hard"
}

function estimateDifficulty(time: number): "Easy" | "Medium" | "Hard" {
  if (time <= 20) return "Easy"
  if (time <= 45) return "Medium"
  return "Hard"
}

export async function generateRecipes(ingredients: string[]): Promise<Recipe[]> {
  try {
    const query = ingredients.join(",")
    const findRes = await fetch(`${BASE_URL}/findByIngredients?ingredients=${query}&number=3&ranking=1&apiKey=${SPOON_API_KEY}`)
    const baseRecipes = await findRes.json()

    const detailedPromises = baseRecipes.map(async (r: any) => {
      const detailRes = await fetch(`${BASE_URL}/${r.id}/information?includeNutrition=false&apiKey=${SPOON_API_KEY}`)
      const data = await detailRes.json()

      return {
        name: data.title,
        description: data.summary?.replace(/<[^>]+>/g, "") || "A delicious recipe.",
        ingredients: data.extendedIngredients?.map((i: any) => i.original) || [],
        instructions: data.analyzedInstructions?.[0]?.steps?.map((s: any) => s.step) || [],
        cookingTime: `${data.readyInMinutes} minutes`,
        servings: data.servings,
        difficulty: estimateDifficulty(data.readyInMinutes),
      }
    })

    const recipes = await Promise.all(detailedPromises)
    return recipes
  } catch (err) {
    console.error("Spoonacular error:", err)
    throw new Error("Failed to fetch recipes from Spoonacular")
  }
}
