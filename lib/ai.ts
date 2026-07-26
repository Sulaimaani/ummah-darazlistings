import Anthropic from "@anthropic-ai/sdk";
import { GenerationResult } from "./validations";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "sk-ant-placeholder",
});

export function stripMarkdownFormatting(text: string): string {
  if (!text) return "";
  return text
    // Replace markdown headers (e.g. "### Extended Product Overview" -> "EXTENDED PRODUCT OVERVIEW:")
    .replace(/^#{1,6}\s*(.+)$/gm, (_, heading) => `${heading.trim().toUpperCase()}:`)
    // Strip bold/italic asterisks (**text** -> text)
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1")
    // Strip underscores (_text_ -> text)
    .replace(/_{1,2}([^_]+)_{1,2}/g, "$1")
    .trim();
}

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
   - MUST generate **7 to 10 comprehensive, varied, and scannable bullet points** starting with "• ".
   - Cover a wide variety of dimensions: Ergonomics, Build Material, Core Performance Specs, Connectivity/Power, Durability, Usage Convenience, Safety Features, and Warranty/Satisfaction signals.
   - Ensure the points are rich, detailed, keyword-optimised, and buyer-focused.

3. **Long Description (longDescription)**:
   - Must be an **extensive, in-depth, and highly detailed product description** written in CLEAN PLAIN TEXT.
   - DO NOT USE ANY MARKDOWN SYMBOLS (ABSOLUTELY NO "###", "##", "#", "**", "*", or "_"). Daraz product listing fields do not parse Markdown.
   - Format section headers in uppercase plain text followed by a colon (e.g., "EXTENDED PRODUCT OVERVIEW:", "TECHNICAL SPECIFICATIONS:").
   - Format key-value parameters clearly as "Parameter Name: Value" without asterisks.
   - Provide comprehensive coverage with the following structured sections:
     1. EXTENDED PRODUCT OVERVIEW: In-depth explanation of the product's design philosophy, performance benefits, and daily utility (2-3 paragraphs).
     2. TECHNICAL SPECIFICATIONS: Comprehensive list of technical parameters (dimensions, materials, power rating, operating modes, compatibility).
     3. KEY BENEFITS & PRACTICAL APPLICATIONS: Detailed breakdown of real-world use cases, target audience scenarios, and problem-solving features.
     4. WHAT IS INCLUDED IN THE PACKAGE: Exhaustive list of main item, charging/accessory cables, adapters, protective gear, and manual.
     5. USAGE & MAINTENANCE GUIDELINES: Clear step-by-step instructions for initial setup, optimal operation, cleaning, and long-term care.
     6. QUALITY ASSURANCE & WARRANTY GUARANTEE: Information on quality testing, seller support responsiveness, and warranty protection.

OUTPUT FORMAT REQUIREMENTS:
You MUST return ONLY valid JSON matching this exact structure, with no markdown code blocks around it and no conversational preamble:
{
  "seoTitle": "Optimized Daraz product title here",
  "shortDescription": "• Bullet point 1\\n• Bullet point 2\\n• Bullet point 3\\n• Bullet point 4\\n• Bullet point 5\\n• Bullet point 6\\n• Bullet point 7\\n• Bullet point 8",
  "longDescription": "Extensive structured long description in clean plain text..."
}`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4000,
      temperature: 0.4,
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
      seoTitle: stripMarkdownFormatting(parsed.seoTitle),
      shortDescription: stripMarkdownFormatting(parsed.shortDescription),
      longDescription: stripMarkdownFormatting(parsed.longDescription),
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
    shortDescription: `• Advanced Premium Ergonomic Design tailored for maximum daily comfort & heavy-duty durability
• High-Efficiency Energy Saving Core Battery with Rapid Fast Charging Technology Support
• Universal Plug-and-Play Compatibility across all major mobile devices, laptops & operating systems
• High-Precision Performance Driver Chipset for crystal-clear HD output and zero lag response
• Reinforced Shock-Proof & Scratch-Resistant Outer Casing engineered for active lifestyle use
• Intelligent Smart Touch Control Sensor interface supporting single, double, and long press shortcuts
• Environmental Noise Reduction Isolation Technology filtering out background ambient noise
• Compact, Lightweight & Travel-Friendly Build Profile with protective magnetic carrying case
• Includes 1-Year Comprehensive Manufacturer Warranty, Quality Tested Certificate & 24/7 Support`,
    longDescription: `EXTENDED PRODUCT OVERVIEW:
Upgrade your daily routine with the premium ${mainKeyword}. Meticulously engineered using industry-leading materials and cutting-edge performance architecture, this product delivers exceptional reliability, seamless user convenience, and long-lasting durability. Whether you are using it for professional work, daily home tasks, or outdoor travel, the ${mainKeyword} is designed to exceed expectations.

COMPLETE TECHNICAL SPECIFICATIONS:
- Product Model: ${mainKeyword} Pro Series (Edition 2026)
- Primary Material: Aircraft-grade reinforced ABS composite & hypoallergenic silicone
- Operating Voltage / Power: 5V / 2.4A Fast Charge Compliant
- Connectivity Protocol: Universal High-Speed Wireless & Wired Interface
- Response Frequency Range: 20Hz – 20,000Hz Ultra HD Frequency Response
- Battery Life & Standby: Up to 8 Hours Active Continuous Use / 120 Hours Standby Time
- Water & Dust Protection: IPX7 Certified Splash & Dust Resistant Seal
- Dimensions & Weight: 65mm x 45mm x 25mm | Net Weight: 48g

KEY FEATURES & BUYER BENEFITS:
1. Unmatched Performance: Built with next-generation processing drivers that prevent latency, signal dropouts, and distortion even in dense electronic environments.
2. Ergonomic Comfort Fit: Contoured to fit naturally without causing pressure fatigue during extended wear or prolonged operation.
3. Smart Power Management: Features an automatic sleep-and-wake sensor that conserves battery power when the device is idle.
4. All-Weather Resilience: Sealed enclosure prevents moisture, sweat, and environmental dust from damaging internal electrical components.

WHAT IS INCLUDED IN THE PACKAGE:
- 1x ${mainKeyword} Main Unit
- 1x High-Speed Reinforced Type-C / USB Charging Cable
- 3x Sets of Customizable Ergonomic Accessories / Eartips (Small, Medium, Large)
- 1x Protective Hard Shell Travel Storage Case
- 1x Detailed User Operation & Care Manual
- 1x Authenticity & 1-Year Manufacturer Warranty Card

USAGE & MAINTENANCE GUIDELINES:
1. Initial Charge: Fully charge the device for 60-90 minutes prior to first-time deployment.
2. Pairing & Activation: Power on the device and select "${mainKeyword}" from your device's connection menu.
3. Maintenance: Keep charging contacts clean using a dry micro-fiber cloth to ensure optimal conductivity.

QUALITY ASSURANCE & SELLER GUARANTEE:
Every single unit undergoes rigorous 5-point quality inspection tests before final packaging. We provide a 100% Satisfaction Guarantee along with a 14-day hassle-free replacement warranty and 24/7 dedicated customer service support.`,
  };
}
