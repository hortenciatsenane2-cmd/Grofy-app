import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Supabase Client on Server Side securely for Webhook updates
const serverSupabaseUrl = process.env.VITE_SUPABASE_URL || 'https://iaoruzpqqvuxblahdlle.supabase.co';
const serverSupabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_HuhshzJEy9os7Iyvv87LUg_Wib94Arf';
const supabaseServer = createClient(serverSupabaseUrl, serverSupabaseKey);

// Enable JSON parsing with 20MB limit (for base64 product images in AI registration)
app.use(express.json({ limit: "20mb" }));

// Initialize Google GenAI client lazily if key is available
let aiClient: GoogleGenAI | null = null;

function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      aiClient = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }
  return aiClient;
}

// REST API for AI-assisted Product Registration
app.post("/api/gemini/generate-product", async (req, res) => {
  try {
    const { image, nameHint, category } = req.body;
    const client = getGeminiClient();

    if (!client) {
      // Elegant simulated fallback response if GEMINI_API_KEY is not yet populated
      const categoryLabel = category || "Moda";
      const hint = nameHint || "Roupa Premium";
      
      const responseFallback = {
        name: `${hint} Elegance`,
        description: `Esta peça de ${categoryLabel.toLowerCase()} combina a essência da moda moçambicana urbana com um corte minimalista premium. Desenvolvida para quem valoriza sofisticação, conforto e acabamento impecável em cada costura. Ideal para eventos executivos ou saídas casuais à noite pelo calçadão de Maputo.`,
        price: category === "Acessórios" ? 2200 : category === "Casacos" ? 4500 : 3550,
        tags: [categoryLabel, "Premium", "Estilo Urbano", "Minimalista", "Grofy Style"],
        status: "mock"
      };
      
      return res.json({ result: responseFallback });
    }

    let contents: any[] = [];
    const promptText = `Você é um especialista em marketing de moda de luxo em Moçambique e trabalha para a marca de e-commerce premium 'Grofy'.
Sua tarefa é analisar as informações do produto e gerar detalhes premium de venda.
Por favor responda estritamente no formato JSON solicitado.
Informações fornecidas pelo usuário:
- Categoria do Produto: ${category || "Moda"}
- Nome provisório: ${nameHint || "Produto Vestuário"}

Analise estes dados para sugerir um Nome Altamente Atraente e Premium de E-commerce, uma Descrição Sedutora e de Alta Conversão inspiradora no estilo minimalista (Stripe/Apple) adaptada ao mercado em Moçambique (com termos que soem bem em português e que evoque sofisticação, calor, brisas, ou noites de Maputo) e um Preço Sugerido razoável em Meticais (MZN) que pareça premium (ex: entre 1.500 MZN e 10.000 MZN dependendo da peça).`;

    contents.push({ text: promptText });

    if (image) {
      // Analyze base64 image part
      // Image is expected in format 'data:image/png;base64,...'
      const base64Parts = image.split(",");
      const mimeType = base64Parts[0] ? base64Parts[0].match(/:(.*?);/)?.[1] || "image/png" : "image/png";
      const base64Data = base64Parts[1] || image;

      contents.push({
        inlineData: {
          mimeType: mimeType,
          data: base64Data,
        },
      });
    }

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: contents },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["name", "description", "price", "tags"],
          properties: {
            name: {
              type: Type.STRING,
              description: "A refined premium fashion product title."
            },
            description: {
              type: Type.STRING,
              description: "An elegant, copywriter-level description of the garment highlighting luxury and lifestyle."
            },
            price: {
              type: Type.NUMBER,
              description: "Suggested selling price in Meticais (MZN)."
            },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "A few (3-5) high-relevance fashion tags/categories."
            }
          }
        }
      }
    });

    const resultText = response.text;
    const resultJson = JSON.parse(resultText.trim());

    res.json({ result: { ...resultJson, status: "live" } });

  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    res.status(500).json({ error: "Erro ao gerar informações do produto. Tente de novo.", details: error.message });
  }
});

// --- REAL-TIME EMAIL VERIFICATION ENDPOINT ---
app.post("/api/validate-email", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ valid: false, error: "O campo de e-mail é obrigatório." });
    }

    const trimmedEmail = email.trim();
    console.log(`[Email Verification API] Validating real-world presence of: ${trimmedEmail}`);

    const EMAIL_API_KEY = process.env.EMAIL_VERIFICATION_API_KEY;

    // 1. If physical Abstract API key is configured, request external check
    if (EMAIL_API_KEY && EMAIL_API_KEY !== "") {
      try {
        const url = `https://emailvalidation.abstractapi.com/v1/?api_key=${EMAIL_API_KEY}&email=${encodeURIComponent(trimmedEmail)}`;
        const response = await fetch(url);
        const data = await response.json();
        
        console.log("[Email Verification API - Abstract API]:", JSON.stringify(data, null, 2));

        if (data && data.deliverability) {
          // Abstract API returns "DELIVERABLE", "UNDELIVERABLE", or "UNKNOWN"
          const isUndeliverable = data.deliverability === "UNDELIVERABLE";
          const isDisposable = data.is_disposable_email?.value === true;
          const isValidFormat = data.is_valid_format?.value !== false;

          if (isUndeliverable || isDisposable || !isValidFormat) {
            return res.json({
              valid: false,
              reason: isDisposable ? "disposable" : isUndeliverable ? "undeliverable" : "invalid_format",
              message: "Este e-mail não existe ou está inativo. Por favor, use um e-mail real."
            });
          }
          return res.json({ valid: true });
        }
      } catch (err: any) {
        console.error("Erro ao chamar API externa de email:", err.message);
        // Failover gracefully to local high-fidelity rules if external API is unreachable
      }
    }

    // 2. Fallback / High-Fidelity Validation Suite (reusable mock/service algorithm)
    const normalized = trimmedEmail.toLowerCase();
    const [localPart, domain] = normalized.split("@");

    if (!localPart || !domain || !domain.includes(".")) {
      return res.json({
        valid: false,
        reason: "invalid_format",
        message: "Este e-mail não existe ou está inativo. Por favor, use um e-mail real."
      });
    }

    // List of known temporary, invalid, or fake/simulation domains
    const suspiciousDomains = [
      "example.com", "test.com", "testing.com", "demo.com", "fake.com",
      "inativo.com", "tempmail.com", "mailinator.com", "trashmail.com",
      "sharklasers.com", "guerrillamail.com", "fakeinbox.com", "dispostable.com"
    ];

    // List of placeholder/unreal local part formats
    const suspiciousLocalParts = [
      "test", "teste", "asd", "asdf", "user", "usuario", "admin", "mock",
      "fake", "inativo", "sem-email", "empty", "null", "undefined"
    ];

    if (suspiciousDomains.includes(domain) || suspiciousLocalParts.includes(localPart) || localPart.length < 3) {
      console.log(`[Email Verification API] Verification REJECTED for: ${trimmedEmail} (Fictional/Flagged Pattern)`);
      return res.json({
        valid: false,
        reason: "unreal_pattern",
        message: "Este e-mail não existe ou está inativo. Por favor, use um e-mail real."
      });
    }

    console.log(`[Email Verification API] Verification APPROVED for: ${trimmedEmail}`);
    return res.json({ valid: true });

  } catch (error: any) {
    console.error("Email verification handler error:", error);
    res.status(500).json({ valid: false, error: "Erro interno de validação.", details: error.message });
  }
});

// --- RATIXPAY SYSTEM INTEGRATION ---

// Standard Credential config with graceful fallbacks
const RATIXPAY_CLIENT_ID = process.env.RATIXPAY_CLIENT_ID || "V101687";
const RATIXPAY_MERCHANT_ID = process.env.RATIXPAY_MERCHANT_ID || "6a3bd7c3-a12e-4b08-b095-ac22cb08871a";
const RATIXPAY_API_TOKEN = process.env.RATIXPAY_API_TOKEN && process.env.RATIXPAY_API_TOKEN !== "INSERIR_TOKEN_DEPOIS"
  ? process.env.RATIXPAY_API_TOKEN
  : "rtx_live_e98c8000991a569040e478a3e1b636f5c4e5ee788e25f14c";

// 1. Route to generate standard Subscription Charge (M-Pesa or e-Mola)
app.post("/api/ratixpay/charge", async (req, res) => {
  try {
    const { phone, email, amount, planName, storeSlug, method } = req.body;

    if (!phone || !amount || !planName || !storeSlug) {
      return res.status(400).json({ error: "Parâmetros obrigatórios ausentes: phone, amount, planName, storeSlug" });
    }

    const carrierMethod = method === "emola" ? "e-Mola" : "M-Pesa";

    // Reference to trace back the transaction when webhook hits
    const reference = `grofy_sub_${storeSlug}_${planName.replace(/\s+/g, "_")}`;

    console.log(`[RatixPay Charge Request] Generating charge for Store: ${storeSlug}, Plan: ${planName}, Amount: ${amount} MT on Phone: ${phone} via ${carrierMethod}`);

    // If api token is placeholder or missing, trigger a high-fidelity interactive sandbox response
    if (!RATIXPAY_API_TOKEN || RATIXPAY_API_TOKEN === "INSERIR_TOKEN_DEPOIS") {
      return res.json({
        status: "success",
        message: "Cobrança iniciada em Modo de Demonstração (Sandbox)!",
        reference: reference,
        transactionId: `sandbox_trx_${Math.random().toString(36).substring(2, 9)}`,
        isSandbox: true,
        credentials: {
          clientId: RATIXPAY_CLIENT_ID,
          merchantId: RATIXPAY_MERCHANT_ID
        },
        payload: {
          client_id: RATIXPAY_CLIENT_ID,
          merchant_id: RATIXPAY_MERCHANT_ID,
          phone: phone,
          email: email || "usuario@grofy.co.mz",
          amount: amount,
          reference: reference,
          currency: "MZN"
        },
        instruction: `Siga as instruções na tela para simular a confirmação do pagamento pelo ${carrierMethod} e ativar a sua loja instantaneamente.`
      });
    }

    // REAL production external post to RatixPay API
    // Typically, RatixPay M-Pesa push API endpoint is POST https://api.ratixpay.com/v1/payments/request
    const ratixApiUrl = "https://api.ratixpay.com/v1/payments/request";

    const response = await fetch(ratixApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RATIXPAY_API_TOKEN}`
      },
      body: JSON.stringify({
        client_id: RATIXPAY_CLIENT_ID,
        merchant_id: RATIXPAY_MERCHANT_ID,
        phone: phone,
        email: email || "comercial@grofy.co.mz",
        amount: amount,
        reference: reference,
        currency: "MZN",
        description: `Assinatura Mensal Grofy - Plano ${planName}`
      })
    });

    const data = await response.json();
    return res.json({
      status: "success",
      message: "Cobrança gerada com sucesso via RatixPay real!",
      isSandbox: false,
      data: data
    });

  } catch (error: any) {
    console.error("RatixPay Charge Error:", error);
    res.status(500).json({ error: "Erro interno ao tentar faturar com RatixPay.", details: error.message });
  }
});

// 2. Webhook Endpoint to Receive Confirmation from RatixPay
app.post("/api/ratixpay/webhook", async (req, res) => {
  try {
    const payload = req.body;
    console.log("[RatixPay Webhook Received]:", JSON.stringify(payload, null, 2));

    const status = payload.status;
    const reference = payload.reference || "";
    
    // Check if payment is successful
    const isPaid = status === "SUCCESSFUL" || status === "PAID" || status === "CONFIRMED" || status === "confirmed"  || status === "success";

    if (!isPaid) {
      console.log(`[RatixPay Webhook Alert]: Payment status not active/paid. Received: ${status}`);
      return res.status(200).json({ status: "ignored", message: "Transaction not paid" });
    }

    if (!reference.startsWith("grofy_sub_")) {
      console.log(`[RatixPay Webhook Alert]: Ignored transaction reference: ${reference}`);
      return res.status(200).json({ status: "ignored", message: "Not a valid Grofy subscription format" });
    }

    const parts = reference.replace("grofy_sub_", "").split("_");
    if (parts.length < 2) {
      return res.status(400).json({ error: "Invalid reference parameters format." });
    }

    const storeSlug = parts[0];
    const planName = parts[1].replace(/_/g, " "); // Standard or Grofy Premium

    // Calculate expiry date: 30 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    const expiresAtIso = expiresAt.toISOString();

    console.log(`[RatixPay Webhook Success] Activating Store: ${storeSlug} for 30 Days under plan: ${planName}`);

    // Update inside Supabase table 'grofy_stores'
    const { error: dbError } = await supabaseServer
      .from("grofy_stores")
      .update({
        subscription_plan: planName,
        subscription_status: "active",
        subscription_expires_at: expiresAtIso
      })
      .eq("slug", storeSlug);

    if (dbError) {
      console.error("[RatixPay Webhook Database Error]:", dbError);
      return res.json({ 
        status: "partial_success", 
        message: "Payment parsed but Supabase table update failed", 
        error: dbError 
      });
    }

    return res.status(200).json({ 
      status: "success", 
      message: `Store ${storeSlug} successfully activated for 30 days!` 
    });

  } catch (error: any) {
    console.error("RatixPay Webhook Processing Failure:", error);
    res.status(500).json({ error: "Erro ao processar Webhook.", details: error.message });
  }
});

// 3. Sandboxed simulation endpoint triggered from premium user view
app.post("/api/ratixpay/simulate-webhook", async (req, res) => {
  try {
    const { storeSlug, planName } = req.body;
    if (!storeSlug || !planName) {
      return res.status(400).json({ error: "Store slug and plan name are required." });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    const expiresAtIso = expiresAt.toISOString();

    const { error: dbError } = await supabaseServer
      .from("grofy_stores")
      .update({
        subscription_plan: planName,
        subscription_status: "active",
        subscription_expires_at: expiresAtIso
      })
      .eq("slug", storeSlug);

    if (dbError) {
      console.log("[Simulation database fallback warning]:", dbError);
    }

    return res.json({
      status: "success",
      message: `Simulação concluída! A loja "${storeSlug}" foi configurada com sucesso para o plano "${planName}" por 30 dias (status: ativo).`,
      expiresAt: expiresAtIso
    });
  } catch (error: any) {
    res.status(500).json({ error: "Internal crash during simulation", details: error.message });
  }
});

// Configure Vite middleware in development or express static in production
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Grofy Server running on http://localhost:${PORT}`);
  });
}

start();
