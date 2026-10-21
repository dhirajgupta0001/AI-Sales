import type { Plugin, ViteDevServer } from 'vite';
import fs from 'fs';
import path from 'path';
import {
  buildSalesEngineSystemPrompt,
  formatConversationMessages,
  detectSalesIntent,
  SalesEngineProduct,
  SalesEngineAgentConfig,
  SalesEngineCustomer,
} from './salesEngine';
import {
  buildAnalysisPrompt,
  validateAndSanitizeAnalysis,
  CallAnalyzerMetadata,
  PostCallStructuredAnalysis,
} from './callAnalyzer';

interface OllamaConfig {
  apiKey: string;
  model: string;
  baseUrl: string;
}

// In-memory sliding window rate limiter
interface RateLimitRecord {
  count: number;
  resetAt: number;
}
const rateLimitStore = new Map<string, RateLimitRecord>();

function checkRateLimit(
  ip: string,
  endpoint: string,
  maxRequests: number = 60,
  windowMs: number = 60000
): { allowed: boolean; retryAfter: number } {
  const key = `${ip}:${endpoint}`;
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }

  if (record.count >= maxRequests) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  record.count += 1;
  return { allowed: true, retryAfter: 0 };
}

// Clean up stale rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}, 300000);

// Validate and sanitize base URL against SSRF and illegal schemes
function validateBaseUrl(rawUrl: string): { valid: boolean; normalized?: string; error?: string } {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return { valid: false, error: 'Only HTTP and HTTPS URLs are permitted.' };
    }

    const hostname = parsed.hostname.toLowerCase();

    // Prevent SSRF to cloud metadata endpoints and private IP ranges
    const blockedHosts = [
      '169.254.169.254',
      'metadata.google.internal',
      'instance-data',
      '100.100.100.200',
    ];
    if (blockedHosts.includes(hostname)) {
      return { valid: false, error: 'Access to cloud instance metadata services is forbidden.' };
    }

    if (parsed.protocol === 'http:' && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return { valid: false, error: 'Remote Ollama endpoints must use HTTPS.' };
    }

    const normalized = parsed.origin + parsed.pathname.replace(/\/+$/, '');
    return { valid: true, normalized };
  } catch (err) {
    return { valid: false, error: 'Invalid URL format.' };
  }
}

function safeMask(str?: string): string {
  if (!str) return 'null';
  if (str.length <= 8) return '****';
  return `${str.substring(0, 4)}...${str.substring(str.length - 4)}`;
}

function getOllamaConfig(): OllamaConfig {
  let apiKey = process.env.OLLAMA_API_KEY?.trim() || '';
  let model = process.env.OLLAMA_MODEL?.trim() || 'llama3.3';
  let baseUrl = process.env.OLLAMA_BASE_URL?.trim() || 'https://ollama.com';

  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');

      const keyMatch = content.match(/^OLLAMA_API_KEY=(.+)$/m);
      if (keyMatch && keyMatch[1]) {
        apiKey = keyMatch[1].trim().replace(/^["']|["']$/g, '');
      }

      const modelMatch = content.match(/^OLLAMA_MODEL=(.+)$/m);
      if (modelMatch && modelMatch[1]) {
        model = modelMatch[1].trim().replace(/^["']|["']$/g, '');
      }

      const urlMatch = content.match(/^OLLAMA_BASE_URL=(.+)$/m);
      if (urlMatch && urlMatch[1]) {
        baseUrl = urlMatch[1].trim().replace(/^["']|["']$/g, '');
      }
    }
  } catch (err) {
    console.warn('[Ollama Server] Notice reading .env');
  }

  baseUrl = baseUrl.replace(/\/+$/, '');
  return { apiKey, model, baseUrl };
}

function updateEnvFile(updates: Record<string, string>): void {
  const envPath = path.resolve(process.cwd(), '.env');
  let content = '';
  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, 'utf8');
  }

  for (const [key, value] of Object.entries(updates)) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(content)) {
      content = content.replace(regex, `${key}=${value}`);
    } else {
      content = content + (content.endsWith('\n') ? '' : '\n') + `${key}=${value}\n`;
    }
    process.env[key] = value;
  }

  fs.writeFileSync(envPath, content, 'utf8');
}

/**
 * Fetch with automatic retry for transient HTTP 502/503/504 errors and socket dropouts
 */
async function fetchWithRetry(url: string, options: any, maxRetries = 2): Promise<Response> {
  let lastError: any = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const resp = await fetch(url, options);
      if (resp.status >= 500 && resp.status <= 504 && attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 600 * Math.pow(2, attempt)));
        continue;
      }
      return resp;
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 600 * Math.pow(2, attempt)));
      }
    }
  }
  throw lastError || new Error('Network request failed after retries.');
}

export function ollamaServerPlugin(): Plugin {
  return {
    name: 'voicesell-ollama-server',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0];
        const clientIp =
          (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
          req.socket.remoteAddress ||
          '127.0.0.1';

        // 1. Status endpoint: GET /api/ollama-status
        if (url === '/api/ollama-status' && req.method === 'GET') {
          const config = getOllamaConfig();
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              configured: Boolean(config.apiKey),
              keyMasked: config.apiKey ? safeMask(config.apiKey) : null,
              provider: 'ollama-cloud',
              model: config.model,
              baseUrl: config.baseUrl,
              supportedLanguages: [
                { code: 'en-US', name: 'English', nativeName: 'English (US & Global)', speechCode: 'en-US' },
                { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी (Hindi)', speechCode: 'hi-IN' },
                { code: 'te-IN', name: 'Telugu', nativeName: 'తెలుగు (Telugu)', speechCode: 'te-IN' },
                { code: 'ta-IN', name: 'Tamil', nativeName: 'தமிழ் (Tamil)', speechCode: 'ta-IN' },
                { code: 'es-ES', name: 'Spanish', nativeName: 'Español', speechCode: 'es-ES' },
                { code: 'de-DE', name: 'German', nativeName: 'Deutsch', speechCode: 'de-DE' },
                { code: 'fr-FR', name: 'French', nativeName: 'Français', speechCode: 'fr-FR' },
                { code: 'kn-IN', name: 'Kannada', nativeName: 'ಕನ್ನಡ (Kannada)', speechCode: 'kn-IN' },
              ],
            })
          );
          return;
        }

        // Helper to read JSON request body with max bytes enforcement
        const readBody = async (maxBytes: number = 2 * 1024 * 1024): Promise<any> => {
          return new Promise((resolve, reject) => {
            let body = '';
            let receivedBytes = 0;

            req.on('data', (chunk) => {
              receivedBytes += chunk.length;
              if (receivedBytes > maxBytes) {
                req.destroy();
                const err: any = new Error('Request payload exceeds maximum allowed size (2MB).');
                err.statusCode = 413;
                reject(err);
                return;
              }
              body += chunk;
            });

            req.on('end', () => {
              try {
                resolve(body ? JSON.parse(body) : {});
              } catch (e) {
                const parseErr: any = new Error('Malformed JSON payload.');
                parseErr.statusCode = 400;
                reject(parseErr);
              }
            });

            req.on('error', reject);
          });
        };

        // 2. Save Ollama config endpoint: POST /api/save-ollama-config
        if (url === '/api/save-ollama-config' && req.method === 'POST') {
          const rateCheck = checkRateLimit(clientIp, 'save-config', 10, 60000);
          if (!rateCheck.allowed) {
            res.statusCode = 429;
            res.setHeader('Retry-After', String(rateCheck.retryAfter));
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                ok: false,
                code: 'RATE_LIMIT_EXCEEDED',
                error: `Too many configuration attempts. Please retry in ${rateCheck.retryAfter} seconds.`,
              })
            );
            return;
          }

          try {
            const body = await readBody(64 * 1024); // 64KB max for config
            const apiKey = typeof body.apiKey === 'string' ? body.apiKey.trim() : '';
            const model = typeof body.model === 'string' ? body.model.trim() : 'llama3.3';
            const rawBaseUrl = typeof body.baseUrl === 'string' ? body.baseUrl.trim() : 'https://ollama.com';

            if (!apiKey) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: false, error: 'OLLAMA_API_KEY cannot be empty.' }));
              return;
            }

            if (apiKey.length > 512 || /[\r\n]/.test(apiKey)) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: false, error: 'Invalid API key format.' }));
              return;
            }

            // Validate model name characters
            if (!/^[a-zA-Z0-9_.:-]+$/.test(model) || model.length > 64) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: false, error: 'Invalid model identifier.' }));
              return;
            }

            // Validate base URL against SSRF
            const urlValidation = validateBaseUrl(rawBaseUrl);
            if (!urlValidation.valid || !urlValidation.normalized) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: false, error: urlValidation.error || 'Invalid base URL.' }));
              return;
            }

            updateEnvFile({
              OLLAMA_API_KEY: apiKey,
              OLLAMA_MODEL: model,
              OLLAMA_BASE_URL: urlValidation.normalized,
            });

            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                ok: true,
                message: `Ollama Cloud credentials configured. Active model: ${model}`,
                model,
                baseUrl: urlValidation.normalized,
              })
            );
          } catch (err: any) {
            res.statusCode = err.statusCode || 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: false, error: err.message || 'Server error saving config' }));
          }
          return;
        }

        // 3. Primary AI conversation endpoint: POST /api/chat-with-sales-agent
        if (url === '/api/chat-with-sales-agent' && req.method === 'POST') {
          const rateCheck = checkRateLimit(clientIp, 'chat', 60, 60000);
          if (!rateCheck.allowed) {
            res.statusCode = 429;
            res.setHeader('Retry-After', String(rateCheck.retryAfter));
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                ok: false,
                code: 'RATE_LIMIT_EXCEEDED',
                error: `Conversation rate limit exceeded. Please wait ${rateCheck.retryAfter} seconds before speaking.`,
              })
            );
            return;
          }

          const config = getOllamaConfig();

          if (!config.apiKey) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                ok: false,
                code: 'OLLAMA_KEY_MISSING',
                error: 'OLLAMA_API_KEY is not configured on the backend server.',
                instructions:
                  'Please configure OLLAMA_API_KEY in your .env file or through Settings > AI Model Provider. You can obtain an API key from https://ollama.com',
              })
            );
            return;
          }

          try {
            const body = await readBody();
            const {
              messages = [],
              product = {},
              customer = {},
              language = 'English',
              agentSettings = {},
              model: requestedModel,
              actionConfirmed,
            } = body;

            // Validate messages payload structure and length
            if (!Array.isArray(messages)) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: false, error: 'Messages payload must be an array.' }));
              return;
            }

            if (messages.length > 200) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: false, error: 'Conversation exceeds maximum allowed turns.' }));
              return;
            }

            const activeModel =
              typeof requestedModel === 'string' && /^[a-zA-Z0-9_.:-]+$/.test(requestedModel.trim())
                ? requestedModel.trim()
                : config.model || 'llama3.3';

            // Detect sales intent from the latest customer utterance
            const lastCustomerMsg = [...messages].reverse().find(
              (m: any) => m.speaker === 'customer' || m.role === 'user'
            );
            const detectedIntent = lastCustomerMsg
              ? detectSalesIntent(String(lastCustomerMsg.text || lastCustomerMsg.content || '').slice(0, 1000))
              : null;

            // Build reusable, product-independent sales engine system prompt
            const systemPrompt = buildSalesEngineSystemPrompt({
              product: product as SalesEngineProduct,
              agentConfig: agentSettings as SalesEngineAgentConfig,
              customer: customer as SalesEngineCustomer,
              language,
              actionConfirmed,
            });

            // Format and sanitize messages, wrapping customer speech in safety tags
            const formattedMessages = formatConversationMessages(systemPrompt, messages);

            // Call official Ollama Cloud API with retry
            const targetUrl = `${config.baseUrl}/api/chat`;
            const ollamaResp = await fetchWithRetry(targetUrl, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: activeModel,
                messages: formattedMessages,
                stream: false,
              }),
            });

            if (!ollamaResp.ok) {
              const errText = await ollamaResp.text().catch(() => '');
              let errJson: any = null;
              try {
                errJson = JSON.parse(errText);
              } catch (_) {}

              console.error('[Ollama Server] API Error:', ollamaResp.status);

              res.statusCode = ollamaResp.status;
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  ok: false,
                  code: ollamaResp.status === 401 ? 'OLLAMA_AUTH_ERROR' : 'OLLAMA_API_ERROR',
                  error:
                    errJson?.error ||
                    `Ollama Cloud API error (HTTP ${ollamaResp.status}): ${errText || 'Request failed'}`,
                  model: activeModel,
                })
              );
              return;
            }

            const data = await ollamaResp.json();
            let responseText = data?.message?.content?.trim() || '';

            // Clean any stray markdown formatting for spoken audio output
            responseText = responseText
              .replace(/[*#`_~]/g, '')
              .replace(/^[-•]\s*/gm, '')
              .replace(/\n{2,}/g, ' ')
              .trim();

            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                ok: true,
                message: {
                  role: 'assistant',
                  content: responseText,
                },
                model: data?.model || activeModel,
                intent: detectedIntent,
              })
            );
          } catch (err: any) {
            console.error('[Ollama Server] chat-with-sales-agent notice:', err.message || 'Exception');
            res.statusCode = err.statusCode || 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                ok: false,
                code: 'SERVER_EXCEPTION',
                error: err.message || 'Internal server error while connecting to Ollama Cloud.',
              })
            );
          }
          return;
        }

        // 4. Post-call summary & disposition endpoint: POST /api/summarize-call
        if (url === '/api/summarize-call' && req.method === 'POST') {
          const rateCheck = checkRateLimit(clientIp, 'summarize', 60, 60000);
          if (!rateCheck.allowed) {
            res.statusCode = 429;
            res.setHeader('Retry-After', String(rateCheck.retryAfter));
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                ok: false,
                code: 'RATE_LIMIT_EXCEEDED',
                error: `Summary generation rate limit exceeded. Please retry in ${rateCheck.retryAfter} seconds.`,
              })
            );
            return;
          }

          const config = getOllamaConfig();

          try {
            const body = await readBody();
            const {
              transcript = [],
              productName = 'SaaS Platform',
              customerName = 'Customer',
              customerCompany = 'Unknown',
              customerEmail = '',
              customerPhone = '',
              language = 'English',
              durationSeconds = 0,
              confirmedActions = [],
            } = body;

            if (!Array.isArray(transcript)) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: false, error: 'Transcript must be an array.' }));
              return;
            }

            const metadata: CallAnalyzerMetadata = {
              productName: String(productName).slice(0, 100),
              customerName: String(customerName).slice(0, 100),
              customerCompany: String(customerCompany).slice(0, 100),
              customerEmail: String(customerEmail).slice(0, 100),
              customerPhone: String(customerPhone).slice(0, 50),
              language: String(language).slice(0, 50),
              durationSeconds: typeof durationSeconds === 'number' && durationSeconds >= 0 ? durationSeconds : 0,
              confirmedActions: Array.isArray(confirmedActions) ? confirmedActions.slice(0, 20) : [],
            };

            // If no transcript turns, return immediately with sanitized analysis (No Response)
            if (transcript.length === 0) {
              const sanitized = validateAndSanitizeAnalysis('{}', [], metadata);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true, analysis: sanitized, ...sanitized }));
              return;
            }

            let rawLlmOutput = '{}';

            // If Ollama key is available, call Ollama Cloud API with JSON format and retry
            if (config.apiKey) {
              try {
                const prompts = buildAnalysisPrompt(transcript, metadata);
                const activeModel = config.model || 'llama3.3';

                const targetUrl = `${config.baseUrl}/api/chat`;
                const ollamaResp = await fetchWithRetry(targetUrl, {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${config.apiKey}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    model: activeModel,
                    messages: [
                      { role: 'system', content: prompts.system },
                      { role: 'user', content: prompts.user },
                    ],
                    stream: false,
                    format: 'json',
                  }),
                });

                if (ollamaResp.ok) {
                  const data = await ollamaResp.json();
                  rawLlmOutput = data?.message?.content?.trim() || '{}';
                } else {
                  console.warn('[Ollama Server] Summarize API returned non-200, applying deterministic precedence policy');
                }
              } catch (ollamaErr) {
                console.warn('[Ollama Server] Ollama API error during summary, applying deterministic precedence policy');
              }
            }

            // Always validate and sanitize according to documented precedence policies & schema
            const validated = validateAndSanitizeAnalysis(rawLlmOutput, transcript, metadata);

            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                ok: true,
                analysis: validated,
                // Top-level mirrors for backward compatibility
                summary: validated.summary,
                status: validated.sales_status,
                objections: validated.objections,
                requirements: validated.customer_requirements,
                nextSteps: validated.next_steps,
                score: validated.confidence,
                followUpDate: validated.follow_up_date,
                evidenceQuotes: validated.evidence_quotes,
              })
            );
          } catch (err: any) {
            console.error('[Ollama Server] Summarize exception notice:', err.message || 'Error');
            res.statusCode = err.statusCode || 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                ok: false,
                error: err.message || 'Failed to generate AI summary',
              })
            );
          }
          return;
        }

        next();
      });
    },
  };
}
