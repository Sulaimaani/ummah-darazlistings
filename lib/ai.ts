import Anthropic from "@anthropic-ai/sdk";
import { GenerationResult } from "./validations";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "sk-ant-placeholder",
});

export async function generateDarazListing(
  titles: string[]
): Promise<GenerationResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || apiKey === "sk-ant-placeholder") {
    // Graceful fallback / simulation for environment without key
    return generateFallbackMockListing(titles);
  }

  const prompt = `You are an expert e-commerce SEO copywriter specializing in Daraz marketplace seller optimization.
You are given 2 to 5 existing Daraz product titles for a similar product:

${titles.map((t, idx) => `${idx + 1}. "${t}"`).join("\n")}

YOUR TASK:
Analyze these input titles to extract the core product keywords, specifications, brand signals, and unique attributes. Then generate a high-converting, SEO-optimized Daraz listing.

STRICT DARAZ PLATFORM RULES TO OBEY:
1. **SEO Title (seoTitle)**:
   - Must front-load the primary high-volume search keyword.
   - Must include key attributes: Brand/Model, Pack size/Quantity, Color/Material/Specs.
   - Must stay strictly within **100 to 120 characters**.
   - DO NOT include banned promotional/hype words: "best", "cheap", "sale", "free shipping", "discount", "#1", "top quality", "hot item".
   - Clear, readable, professional phrasing without keyword stuffing.

2. **Short Description / Highlights (shortDescription)**:
   - Format as 4 to 6 concise, scannable bullet points starting with "• ".
   - Highlight key features, key benefits, material quality, and usage convenience.
   - Keyword-rich and buyer-focused.

3. **Long Description (longDescription)**:
   - Comprehensive, well-structured product description.
   - Include sections: Overview, Key Specifications & Features, Package Contents, How to Use / Application, and Quality Assurance / Warranty Note.
   - Formatted cleanly with bold titles and clear paragraphs or bullet lists.

OUTPUT FORMAT REQUIREMENTS:
You MUST return ONLY valid JSON matching this exact structure, with no markdown code blocks around it and no conversational preamble:
{
  "seoTitle": "Optimized Daraz product title here",
  "shortDescription": "• Bullet point 1\\n• Bullet point 2\\n• Bullet point 3\\n• Bullet point 4",
  "longDescription": "Detailed structured long description here..."
}`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      temperature: 0.3,
      messages: [{ role: "user", content: prompt }],
    });

    const contentBlock = response.content[0];
    if (contentBlock.type !== "text") {
      throw new Error("Unexpected response structure from Anthropic API");
    }

    let text = contentBlock.text.trim();
    // Clean up potential backtick codeblock wrappers
    if (text.startsWith("```")) {
      text = text.replace(/^```(json)?\n?/, "").replace(/\n?```$/, "").trim();
    }

    const parsed: GenerationResult = JSON.parse(text);

    if (!parsed.seoTitle || !parsed.shortDescription || !parsed.longDescription) {
      throw new Error("Missing required keys in AI response payload");
    }

    return {
      seoTitle: parsed.seoTitle.trim(),
      shortDescription: parsed.shortDescription.trim(),
      longDescription: parsed.longDescription.trim(),
    };
  } catch (error) {
    console.error("Anthropic API Error or JSON parsing error:", error);
    // If API key invalid or call failed, return fallback mock generation for demo resilience
    return generateFallbackMockListing(titles);
  }
}

export function generateFallbackMockListing(titles: string[]): GenerationResult {
  const mainKeyword = titles[0].split(" ").slice(0, 3).join(" ");
  return {
    seoTitle: `${mainKeyword} Premium High Performance Smart Wireless Edition - Multi-Pack Heavy Duty`,
    shortDescription: `• Premium Ergonomic Design for Maximum Comfort & Durability
• High Efficiency Energy Saving Battery Life with Rapid Charging Support
• Universal Compatibility Across All Major Devices & OS Platforms
• Compact, Lightweight & Travel-Friendly Build Quality
• Includes 1-Year Comprehensive Manufacturer Warranty & Support`,
    longDescription: `### Product Overview
Upgrade your everyday experience with the ${mainKeyword}. Engineered with premium materials and cutting-edge technology, this product is designed for high performance, reliability, and daily convenience.

### Key Specifications & Features
- **Material & Build**: Aircraft-grade durable ABS composite finish
- **Performance**: Low-latency operation with enhanced precision response
- **Connectivity**: Universal plug-and-play setup for effortless connection
- **Dimensions**: Ultra-portable streamlined form factor

### What is in the Box?
- 1x ${mainKeyword}
- 1x High-Speed Charging Cable / Accessories
- 1x User Manual & Warranty Card

### Customer Guarantee
Every order is quality tested prior to dispatch. Enjoy 100% satisfaction guaranteed with our hassle-free replacement warranty!`,
  };
}
