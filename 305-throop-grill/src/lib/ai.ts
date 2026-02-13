import OpenAI from "openai";

let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

const SYSTEM_PROMPT = `You are a helpful assistant for 305 Throop Grill restaurant. You help customers with:
- Menu questions (ingredients, allergens, recommendations)
- Order customization help
- Restaurant information (hours: 11am-10pm daily, pickup only, pay at counter)
- Order status inquiries

Be friendly, concise, and helpful. If you don't know something specific about the menu, suggest the customer ask staff.
Keep responses brief - 2-3 sentences max unless more detail is needed.`;

export async function getChatResponse(
  messages: { role: "user" | "assistant"; content: string }[],
  menuContext?: string
): Promise<string> {
  try {
    const openai = getOpenAI();
    const systemMessage = menuContext
      ? `${SYSTEM_PROMPT}\n\nCurrent Menu Information:\n${menuContext}`
      : SYSTEM_PROMPT;

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: systemMessage },
        ...messages,
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || "I'm sorry, I couldn't process that. Please try again.";
  } catch (error) {
    console.error("OpenAI API error:", error);
    return "I'm having trouble connecting right now. Please ask our staff for help.";
  }
}

export async function getRecommendations(
  customerHistory: string[],
  currentMenu: { name: string; description: string; category: string }[]
): Promise<string[]> {
  try {
    const openai = getOpenAI();
    const prompt = `Based on a customer's order history: ${customerHistory.join(", ")}
    
And our current menu items: ${currentMenu.map(m => `${m.name} (${m.category})`).join(", ")}

Suggest 3 items they might enjoy. Return only item names, one per line.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: "You are a restaurant recommendation system. Be concise." },
        { role: "user", content: prompt },
      ],
      max_tokens: 100,
      temperature: 0.8,
    });

    const content = response.choices[0]?.message?.content || "";
    return content.split("\n").filter(line => line.trim()).slice(0, 3);
  } catch (error) {
    console.error("OpenAI API error:", error);
    return [];
  }
}

export async function getPopularPairings(
  itemName: string,
  menuItems: string[]
): Promise<string[]> {
  try {
    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You suggest food pairings. Return only item names, one per line, max 3 items.",
        },
        {
          role: "user",
          content: `Customer ordered: ${itemName}. Suggest complementary items from: ${menuItems.join(", ")}`,
        },
      ],
      max_tokens: 100,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content || "";
    return content.split("\n").filter(line => line.trim()).slice(0, 3);
  } catch (error) {
    console.error("OpenAI API error:", error);
    return [];
  }
}
