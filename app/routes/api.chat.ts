import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, convertToModelMessages } from 'ai';
import { getUserId } from "../lib/session.server";
import { prisma } from "../lib/db.server";
import type { Route } from "./+types/api.chat";

// Explicitly initialize the Google provider to ensure it grabs the key
const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || '',
});

export async function action({ request }: Route.ActionArgs) {
  try {
    const { messages } = await request.json();
    const userId = await getUserId(request);
    
    let userContext = "";
    if (userId) {
      const profile = await prisma.profile.findUnique({ 
        where: { userId }, 
        include: { user: true } 
      });
      
      if (profile) {
        userContext = `
          The user's name is ${profile.user.name}.
          Their favorite drink is ${profile.favoriteDrink || 'not specified'}.
          Their preferred brew method is ${profile.brewMethod || 'not specified'}.
          Their preferred milk is ${profile.milkPreference || 'not specified'}.
          Their sweetness preference level is ${profile.sweetnessLevel}/5.
          Their strength preference level is ${profile.strengthLevel}/5.
        `;
      }
    }

    // Basic RAG: Fetch some recent recipes to give the AI context of what's on the platform
    const recipes = await prisma.recipe.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { name: true, description: true, ingredients: true, brewMethod: true }
    });

    const recipeContext = recipes.map(r => 
      `- ${r.name} (${r.brewMethod}): ${r.description}. Ingredients: ${r.ingredients.join(', ')}`
    ).join('\n');

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is missing from environment variables!");
    }

    // Let the Vercel AI SDK safely parse and convert the incoming UI messages
    const coreMessages = await convertToModelMessages(messages);

    const result = streamText({
      model: google('gemini-2.5-flash'),
      system: `You are the CoffeeMixer AI Barista, a friendly, highly knowledgeable coffee expert. Your job is to recommend coffees, answer brewing questions, and act as a helpful guide.\n\n${userContext ? `Here is the user's profile:\n${userContext}` : `The user is not currently logged in.`}\n\nHere are some recipes currently on CoffeeMixer that you can recommend:\n${recipeContext}\n\nKeep your answers concise, engaging, and coffee-focused. Use markdown for formatting. You have access to Google Search, so if a user asks for coffee shops or local recommendations near them, use your search grounding to find real-world locations as close as possible to the given location. You will give search results in a markdown format with the source URL, and a brief description of the result. Always try to use Google Search for location-based queries or when the user is asking for specific product recommendations.`,
      messages: coreMessages,
      tools: {
        google_search: google.tools.googleSearch({}),
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("AI Barista Error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(errorMessage, { status: 500 });
  }
}