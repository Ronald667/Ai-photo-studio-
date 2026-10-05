import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

// High body limits for base64 image uploads and processing
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Lazy Google GenAI Client with Telemetry header
function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Helper: Parse and structure Gemini API errors (including quota 429 / RESOURCE_EXHAUSTED)
function parseApiError(err: any): {
  status: number;
  error: string;
  isQuotaExceeded: boolean;
  isFreeTierZero: boolean;
  message: string;
  retryAfter?: number;
} {
  const rawMsg = String(err?.message || (typeof err === "object" ? JSON.stringify(err) : err) || "");
  const is429 =
    rawMsg.includes("429") ||
    rawMsg.includes("RESOURCE_EXHAUSTED") ||
    rawMsg.includes("Quota exceeded") ||
    rawMsg.includes("rate-limits");

  const isFreeTierZero = rawMsg.includes("limit: 0") || rawMsg.includes("free_tier_requests, limit: 0");

  let retryAfter: number | undefined;
  const retryMatch = rawMsg.match(/retry in ([0-9.]+)s/i);
  if (retryMatch) {
    retryAfter = Math.ceil(parseFloat(retryMatch[1]));
  }

  if (is429) {
    let friendlyMessage = "Gemini API rate limit reached. Please retry in a few moments.";
    if (isFreeTierZero) {
      friendlyMessage =
        "Gemini image generation models (gemini-3.1-flash-image) require a Paid Tier API key with billing enabled. Free tier quota is 0.";
    } else if (retryAfter) {
      friendlyMessage = `Gemini API rate limit reached. Please retry in ${retryAfter} seconds.`;
    }

    return {
      status: 429,
      error: "QUOTA_EXCEEDED",
      isQuotaExceeded: true,
      isFreeTierZero,
      message: friendlyMessage,
      retryAfter,
    };
  }

  return {
    status: 500,
    error: "AI_ERROR",
    isQuotaExceeded: false,
    isFreeTierZero: false,
    message: rawMsg || "An unexpected error occurred during AI processing.",
  };
}

// Fallback rule-based prompt enhancer when Gemini API quota is offline
function heuristicEnhance(prompt: string, mode: string): string {
  const clean = prompt.trim();
  if (mode === "fashion") {
    return `${clean}, styled in haute couture Parisian tailoring, exquisite luxury fabrics, sculpted silhouette, dramatic editorial magazine lighting, 8k commercial quality`;
  }
  if (mode === "style") {
    return `${clean}, rendered with rich artistic textures, expressive color grading, dramatic chiaroscuro lighting, gallery masterpiece aesthetic`;
  }
  if (mode === "enhance") {
    return `${clean}, remastered with razor-sharp micro-contrast, balanced studio illumination, natural skin fidelity, pristine dynamic range`;
  }
  return `${clean}, masterpiece photography, cinematic volumetric lighting, 8k resolution, ultra detailed`;
}

// Utility: Clean Base64 data and mimeType
function parseBase64(dataString: string, fallbackMime = "image/jpeg"): { data: string; mimeType: string } {
  const match = dataString.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
  if (match) {
    return { mimeType: match[1], data: match[2] };
  }
  return { mimeType: fallbackMime, data: dataString };
}

// ---------------- API ROUTES ----------------

// Health check endpoint
app.get("/api/health", (_req: Request, res: Response) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY");
  res.json({
    status: "ok",
    aiConfigured: hasKey,
    modelsSupported: ["gemini-3.1-flash-image", "gemini-3.1-flash-lite-image", "gemini-3.8-flash"],
  });
});

// Enhance Prompt using Gemini text model
app.post("/api/ai/enhance-prompt", async (req: Request, res: Response) => {
  try {
    const { prompt, mode = "general" } = req.body;
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const ai = getAiClient();
    if (!ai) {
      return res.status(503).json({
        error: "Gemini API key is not configured.",
        enhancedPrompt: prompt,
      });
    }

    let systemInstruction = "You are a master creative director and AI prompt engineer for high-end photography and photo retouching.";
    if (mode === "fashion") {
      systemInstruction += " Focus on exquisite haute couture tailoring, fabrics, silhouettes, accessories, styling details, lighting, and editorial fashion magazine quality.";
    } else if (mode === "style") {
      systemInstruction += " Focus on artistic style transformation, color grading, brushstrokes or photographic film characteristics, atmosphere, and visual aesthetic.";
    } else if (mode === "enhance") {
      systemInstruction += " Focus on photorealistic lighting, dynamic range, crisp textures, micro-contrast, studio rim lights, and high-definition clarity.";
    }

    const promptText = `Rewrite and expand the following user idea into a concise, vivid prompt (1-2 sentences) for an image generator or editor:\nIdea: "${prompt}"\nReturn ONLY the enhanced prompt text, without quotes or commentary.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: promptText,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const enhanced = response.text?.trim() || prompt;
    return res.json({ enhancedPrompt: enhanced });
  } catch (err: any) {
    console.warn("Gemini prompt enhancer unavailable, applying creative heuristic enhancer:", err?.message || err);
    const fallbackPrompt = heuristicEnhance(req.body.prompt || "", req.body.mode || "general");
    return res.json({
      enhancedPrompt: fallbackPrompt,
      isFallback: true,
    });
  }
});

// Edit existing image using prompt, style, fashion, or enhancement
app.post("/api/ai/edit", async (req: Request, res: Response) => {
  try {
    const {
      imageBase64,
      prompt,
      editType = "custom",
      stylePreset,
      fashionPreset,
      enhancePreset,
      aspectRatio = "1:1",
      imageSize = "1K",
    } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "Image data is required for photo editing" });
    }

    const ai = getAiClient();
    if (!ai) {
      return res.status(503).json({
        error: "NO_API_KEY",
        message: "Gemini API key is not configured in Settings > Secrets.",
      });
    }

    const { data: cleanData, mimeType } = parseBase64(imageBase64);

    // Build targeted editing instruction
    let fullEditPrompt = prompt || "";
    if (editType === "style" && stylePreset) {
      fullEditPrompt = `Transform the artistic and visual style of this image to: ${stylePreset}. Maintain the subject's pose and composition while recreating textures, colors, lighting, and rendering in this exact aesthetic. ${prompt ? `Additional detail: ${prompt}` : ""}`;
    } else if (editType === "fashion" && fashionPreset) {
      fullEditPrompt = `Restyle the fashion and clothing of the person in this image into: ${fashionPreset}. Keep the facial identity and pose intact while realistically replacing their outfit, accessories, and styling. ${prompt ? `Additional detail: ${prompt}` : ""}`;
    } else if (editType === "enhance" && enhancePreset) {
      fullEditPrompt = `Enhance and remaster this photo with: ${enhancePreset}. Optimize lighting, skin tones, sharp micro-contrast, studio clarity, and color balance while keeping the scene realistic and true to the original. ${prompt ? `Additional detail: ${prompt}` : ""}`;
    } else if (!fullEditPrompt) {
      fullEditPrompt = "Enhance the quality, lighting, and details of this image while keeping it natural and realistic.";
    }

    const imagePart = {
      inlineData: {
        data: cleanData,
        mimeType: mimeType || "image/jpeg",
      },
    };

    const textPart = {
      text: fullEditPrompt,
    };

    // Attempt generation with gemini-3.1-flash-image, fallback to gemini-3.1-flash-lite-image
    let response;
    let usedModel = "gemini-3.1-flash-image";
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.1-flash-image",
        contents: {
          parts: [imagePart, textPart],
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio as any,
            imageSize: imageSize as any,
          },
        },
      });
    } catch (primaryErr: any) {
      console.warn("Primary image edit model failed, trying fallback:", primaryErr?.message);
      usedModel = "gemini-3.1-flash-lite-image";
      response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-image",
        contents: {
          parts: [imagePart, textPart],
        },
      });
    }

    // Locate the returned image part
    const candidateParts = response.candidates?.[0]?.content?.parts || [];
    let resultImageUrl: string | null = null;
    let resultTextDescription: string | null = null;

    for (const part of candidateParts) {
      if (part.inlineData?.data) {
        const outMime = part.inlineData.mimeType || "image/png";
        resultImageUrl = `data:${outMime};base64,${part.inlineData.data}`;
      } else if (part.text) {
        resultTextDescription = part.text;
      }
    }

    if (!resultImageUrl) {
      return res.status(502).json({
        error: "NO_IMAGE_RETURNED",
        message: "AI model did not return an edited image part.",
        details: resultTextDescription || "No image generated.",
      });
    }

    return res.json({
      success: true,
      imageUrl: resultImageUrl,
      description: resultTextDescription,
      modelUsed: usedModel,
      appliedPrompt: fullEditPrompt,
    });
  } catch (err: any) {
    const parsed = parseApiError(err);
    console.error("AI Edit error handled:", parsed.error, parsed.message);
    return res.status(parsed.status).json(parsed);
  }
});

// AI Style Transfer endpoint (Content Image + Style Image)
app.post("/api/ai/style-transfer", async (req: Request, res: Response) => {
  try {
    const {
      contentImageBase64,
      styleImageBase64,
      styleIntensity = 0.8,
      prompt = "",
      aspectRatio = "1:1",
      imageSize = "1K",
    } = req.body;

    if (!contentImageBase64 || !styleImageBase64) {
      return res.status(400).json({ error: "Both content image and style image are required for AI style transfer" });
    }

    const ai = getAiClient();
    if (!ai) {
      return res.status(503).json({
        error: "NO_API_KEY",
        message: "Gemini API key is not configured in Settings > Secrets.",
      });
    }

    const contentParsed = parseBase64(contentImageBase64);
    const styleParsed = parseBase64(styleImageBase64);

    const intensityDesc = styleIntensity > 0.75 ? "strong and rich artistic style transfer" : styleIntensity > 0.4 ? "balanced artistic style transfer" : "subtle artistic style blending";

    const transferPrompt = `Perform an advanced AI style transfer. Take the visual artistic texture, color palette, brushstrokes, and lighting aesthetic of the second image (the style reference) and apply it to the content, subject, and composition of the first image (the content photo). Intensity: ${intensityDesc} (${Math.round(styleIntensity * 100)}% style strength). ${prompt ? `Additional instructions: ${prompt}` : ""}`;

    const contentPart = {
      inlineData: { data: contentParsed.data, mimeType: contentParsed.mimeType },
    };
    const stylePart = {
      inlineData: { data: styleParsed.data, mimeType: styleParsed.mimeType },
    };
    const textPart = { text: transferPrompt };

    let response;
    let usedModel = "gemini-3.1-flash-image";
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.1-flash-image",
        contents: {
          parts: [contentPart, stylePart, textPart],
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio as any,
            imageSize: imageSize as any,
          },
        },
      });
    } catch (primaryErr: any) {
      console.warn("Primary style transfer model failed, trying lite model:", primaryErr?.message);
      usedModel = "gemini-3.1-flash-lite-image";
      response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-image",
        contents: {
          parts: [contentPart, stylePart, textPart],
        },
      });
    }

    const candidateParts = response.candidates?.[0]?.content?.parts || [];
    let resultImageUrl: string | null = null;
    let resultText: string | null = null;

    for (const part of candidateParts) {
      if (part.inlineData?.data) {
        const outMime = part.inlineData.mimeType || "image/png";
        resultImageUrl = `data:${outMime};base64,${part.inlineData.data}`;
      } else if (part.text) {
        resultText = part.text;
      }
    }

    if (!resultImageUrl) {
      return res.status(502).json({
        error: "NO_IMAGE_RETURNED",
        message: "AI model did not return a styled image part.",
        details: resultText,
      });
    }

    return res.json({
      success: true,
      imageUrl: resultImageUrl,
      description: resultText,
      modelUsed: usedModel,
    });
  } catch (err: any) {
    const parsed = parseApiError(err);
    console.error("AI Style Transfer error handled:", parsed.error, parsed.message);
    return res.status(parsed.status).json(parsed);
  }
});

// Generate brand new image from prompt (Text-to-Image)
app.post("/api/ai/generate", async (req: Request, res: Response) => {
  try {
    const {
      prompt,
      aspectRatio = "1:1",
      imageSize = "1K",
      stylePreset,
    } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Text prompt is required" });
    }

    const ai = getAiClient();
    if (!ai) {
      return res.status(503).json({
        error: "NO_API_KEY",
        message: "Gemini API key is not configured in Settings > Secrets.",
      });
    }

    let fullPrompt = prompt;
    if (stylePreset) {
      fullPrompt = `${prompt}, styled as ${stylePreset}, masterpiece, highly detailed, professional photography`;
    }

    let response;
    let usedModel = "gemini-3.1-flash-image";
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.1-flash-image",
        contents: {
          parts: [{ text: fullPrompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio as any,
            imageSize: imageSize as any,
          },
        },
      });
    } catch (primaryErr: any) {
      console.warn("Primary image generate failed, trying lite model:", primaryErr?.message);
      usedModel = "gemini-3.1-flash-lite-image";
      response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-image",
        contents: {
          parts: [{ text: fullPrompt }],
        },
      });
    }

    const candidateParts = response.candidates?.[0]?.content?.parts || [];
    let resultImageUrl: string | null = null;
    let resultText: string | null = null;

    for (const part of candidateParts) {
      if (part.inlineData?.data) {
        const outMime = part.inlineData.mimeType || "image/png";
        resultImageUrl = `data:${outMime};base64,${part.inlineData.data}`;
      } else if (part.text) {
        resultText = part.text;
      }
    }

    if (!resultImageUrl) {
      return res.status(502).json({
        error: "NO_IMAGE_RETURNED",
        message: "AI model did not return an image part.",
        details: resultText,
      });
    }

    return res.json({
      success: true,
      imageUrl: resultImageUrl,
      description: resultText,
      modelUsed: usedModel,
    });
  } catch (err: any) {
    const parsed = parseApiError(err);
    console.error("AI Generate error handled:", parsed.error, parsed.message);
    return res.status(parsed.status).json(parsed);
  }
});

// ---------------- VITE & STATIC SERVING ----------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Photo Studio server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Server startup failed:", err);
  process.exit(1);
});
