const MAX_INPUT_CHARS = Number.parseInt(process.env.AI_MAX_INPUT_CHARS || '4000', 10);
const HUGGINGFACE_MODEL = process.env.HUGGINGFACE_MODEL || 'mistralai/Mistral-7B-Instruct-v0.2';
const HUGGINGFACE_BASE_URL = process.env.HUGGINGFACE_BASE_URL || 'https://router.huggingface.co/v1/chat/completions';
const HUGGINGFACE_TIMEOUT_MS = Number.parseInt(process.env.HUGGINGFACE_TIMEOUT_MS || '180000', 10);
const HUGGINGFACE_MAX_NEW_TOKENS = Number.parseInt(process.env.HUGGINGFACE_MAX_NEW_TOKENS || '700', 10);
const HUGGINGFACE_FALLBACK_MODELS = String(
	process.env.HUGGINGFACE_FALLBACK_MODELS
		|| 'Qwen/Qwen2.5-7B-Instruct,meta-llama/Llama-3.1-8B-Instruct,google/gemma-2-2b-it'
);

const getHuggingFaceApiKey = () => String(process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN || '').trim();
const getFallbackModels = () => HUGGINGFACE_FALLBACK_MODELS
	.split(',')
	.map((name) => name.trim())
	.filter(Boolean);

const normalizeText = (value) => String(value || '').trim();

const sanitizeRequestedCount = (value, fallback = 10) => {
	const parsed = Number.parseInt(value, 10);
	if (!Number.isFinite(parsed) || parsed <= 0) {
		return fallback;
	}

	return Math.min(parsed, 50);
};

const limitInput = (text, maxChars = MAX_INPUT_CHARS) => {
	if (!text || text.length <= maxChars) {
		return text;
	}

	return `${text.slice(0, maxChars)}\n\n[Content truncated for local model limits]`;
};

const stripCodeFence = (text) => {
	if (!text) {
		return '';
	}

	const trimmed = text.trim();
	const fencedMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
	return fencedMatch ? fencedMatch[1].trim() : trimmed;
};

const parseJsonResponse = (text, fallback) => {
	const cleaned = stripCodeFence(text);

	try {
		return JSON.parse(cleaned);
	} catch {
		const lineParsed = cleaned
			.split('\n')
			.map((line) => line.trim())
			.filter(Boolean)
			.map((line) => {
				try {
					return JSON.parse(line);
				} catch {
					return null;
				}
			})
			.filter(Boolean);

		if (lineParsed.length > 0) {
			return lineParsed;
		}

		const firstArrayStart = cleaned.indexOf('[');
		const lastArrayEnd = cleaned.lastIndexOf(']');
		if (firstArrayStart !== -1 && lastArrayEnd !== -1 && lastArrayEnd > firstArrayStart) {
			try {
				return JSON.parse(cleaned.slice(firstArrayStart, lastArrayEnd + 1));
			} catch {
				// no-op
			}
		}

		const firstObjectStart = cleaned.indexOf('{');
		const lastObjectEnd = cleaned.lastIndexOf('}');
		if (firstObjectStart !== -1 && lastObjectEnd !== -1 && lastObjectEnd > firstObjectStart) {
			try {
				return JSON.parse(cleaned.slice(firstObjectStart, lastObjectEnd + 1));
			} catch {
				// no-op
			}
		}

		return fallback;
	}
};

const createProviderError = (error, provider = 'huggingface') => {
	const isAbortError = error?.name === 'AbortError' || /aborted/i.test(String(error?.message || ''));
	const statusCode = error?.statusCode || (isAbortError ? 504 : 503);
	let message = error?.message || `Failed to generate content from ${provider}.`;

	if (isAbortError) {
		message = `${provider} request timed out. Try a smaller document or increase max input tuning.`;
	} else if (provider === 'huggingface' && /401|403|unauthorized|forbidden/i.test(String(error?.message || ''))) {
		message = 'Hugging Face request was rejected. Verify HUGGINGFACE_API_KEY (or HF_TOKEN) and model access.';
	}

	const appError = new Error(message);
	appError.statusCode = statusCode;
	appError.provider = provider;
	appError.type = 'provider_error';
	appError.code = isAbortError
		? `${provider.toUpperCase()}_TIMEOUT`
		: `${provider.toUpperCase()}_PROVIDER_ERROR`;
	return appError;
};

const extractHuggingFaceText = (payload, prompt) => {
	if (Array.isArray(payload?.choices) && payload.choices.length > 0) {
		const firstChoice = payload.choices[0];
		const messageText = String(firstChoice?.message?.content || '').trim();
		if (messageText) {
			return messageText;
		}

		const text = String(firstChoice?.text || '').trim();
		if (text) {
			return text;
		}
	}

	if (Array.isArray(payload) && payload.length > 0) {
		const first = payload[0];
		if (typeof first?.generated_text === 'string') {
			const generated = first.generated_text.trim();
			if (generated.startsWith(prompt)) {
				return generated.slice(prompt.length).trim();
			}
			return generated;
		}
	}

	if (typeof payload?.generated_text === 'string') {
		const generated = payload.generated_text.trim();
		if (generated.startsWith(prompt)) {
			return generated.slice(prompt.length).trim();
		}
		return generated;
	}

	if (typeof payload?.summary_text === 'string') {
		return payload.summary_text.trim();
	}

	return '';
};

const generateWithHuggingFace = async (prompt, options = {}) => {
	const huggingFaceApiKey = getHuggingFaceApiKey();
	if (!huggingFaceApiKey) {
		const err = new Error('Hugging Face token is missing. Set HUGGINGFACE_API_KEY or HF_TOKEN in Backend/.env and restart the backend server.');
		err.statusCode = 500;
		throw err;
	}

	const controller = new AbortController();
	const timeoutMs = Number.parseInt(options.timeoutMs || HUGGINGFACE_TIMEOUT_MS, 10);
	const timeout = setTimeout(() => controller.abort(), timeoutMs);

	try {
		const primaryModel = String(options.model || HUGGINGFACE_MODEL || '').trim();
		const modelCandidates = [
			primaryModel,
			...getFallbackModels(),
		].filter(Boolean);

		const uniqueModels = [...new Set(modelCandidates)];
		let lastError = null;

		for (const model of uniqueModels) {
			const response = await fetch(HUGGINGFACE_BASE_URL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${huggingFaceApiKey}`,
				},
				signal: controller.signal,
				body: JSON.stringify({
					model,
					messages: [
						{ role: 'user', content: prompt },
					],
					temperature: options.temperature ?? 0.3,
					max_tokens: options.maxNewTokens ?? options.numPredict ?? HUGGINGFACE_MAX_NEW_TOKENS,
				}),
			});

			if (response.ok) {
				const data = await response.json();
				const text = extractHuggingFaceText(data, prompt);
				if (!text) {
					const err = new Error('Hugging Face returned an unexpected response format.');
					err.statusCode = 502;
					throw err;
				}

				return text;
			}

			const rawText = await response.text();
			let parsed;
			try {
				parsed = JSON.parse(rawText);
			} catch {
				parsed = null;
			}

			const serialized = typeof rawText === 'string' ? rawText : JSON.stringify(parsed || {});
			const errorCode = String(parsed?.error?.code || '').toLowerCase();
			const unsupportedModel = response.status === 400
				&& (errorCode === 'model_not_supported' || /not supported by any provider/i.test(serialized));

			if (unsupportedModel) {
				lastError = new Error(`Model '${model}' is not supported by your enabled Hugging Face providers.`);
				lastError.statusCode = response.status;
				continue;
			}

			const err = new Error(`Hugging Face request failed (${response.status}): ${serialized || response.statusText}`);
			err.statusCode = response.status;
			throw err;
		}

		const err = lastError || new Error('No compatible Hugging Face model could be used with your enabled providers.');
		err.statusCode = err.statusCode || 400;
		throw err;
	} finally {
		clearTimeout(timeout);
	}
};

const generate = async (prompt, options = {}) => {
	const provider = 'huggingface';
	try {
		return await generateWithHuggingFace(prompt, options);
	} catch (error) {
		throw createProviderError(error, provider);
	}
};

const normalizeFlashcard = (item) => {
	if (Array.isArray(item)) {
		const [question, answer, difficulty] = item;
		return {
			question: String(question || '').trim(),
			answer: String(answer || '').trim(),
			difficulty: ['easy', 'medium', 'hard'].includes(String(difficulty || '').toLowerCase())
				? String(difficulty).toLowerCase()
				: 'medium',
		};
	}

	return {
		question: String(item?.question || '').trim(),
		answer: String(item?.answer || '').trim(),
		difficulty: ['easy', 'medium', 'hard'].includes(String(item?.difficulty || '').toLowerCase())
			? String(item.difficulty).toLowerCase()
			: 'medium',
	};
};

const normalizeQuizItem = (item) => {
	const question = String(item?.question || item?.prompt || '').trim();

	let options = [];
	if (Array.isArray(item?.options)) {
		options = item.options
			.map((opt) => {
				if (typeof opt === 'string') {
					return opt.trim();
				}

				if (typeof opt === 'object' && opt !== null) {
					return String(opt.text || opt.option || opt.value || '').trim();
				}

				return '';
			})
			.filter(Boolean);
	} else if (item?.options && typeof item.options === 'object') {
		options = Object.values(item.options)
			.map((value) => String(value || '').trim())
			.filter(Boolean);
	} else if (Array.isArray(item?.choices)) {
		options = item.choices.map((choice) => String(choice || '').trim()).filter(Boolean);
	}

	if (options.length > 4) {
		options = options.slice(0, 4);
	}

	const rawAnswer = String(item?.correctAnswer || item?.answer || item?.correct_option || '').trim();
	let correctAnswer = rawAnswer;
	if (rawAnswer && !options.includes(rawAnswer)) {
		const match = rawAnswer.match(/^[A-Da-d]$/);
		if (match && options.length === 4) {
			const idx = match[0].toUpperCase().charCodeAt(0) - 65;
			correctAnswer = options[idx] || options[0];
		}
	}

	if (!correctAnswer && options.length > 0) {
		correctAnswer = options[0];
	}

	return {
		question,
		options,
		correctAnswer,
		explanation: String(item?.explanation || item?.reason || '').trim(),
	};
};

const requestFlashcardBatch = async ({
	sourceText,
	batchCount,
	existingCards = [],
	temperature = 0.2,
	numPredict,
	timeoutMs,
}) => {
	const existingQuestions = existingCards.slice(0, 40).map((card) => `- ${card.question}`).join('\n');
	const uniquenessHint = existingQuestions
		? [
			'Do not repeat any of these existing questions:',
			existingQuestions,
			'',
		].join('\n')
		: '';

	const prompt = [
		'Create study flashcards from the text below.',
		`Return ONLY JSON as an array with EXACTLY ${batchCount} items.`,
		'Each item must have: question (string), answer (string), difficulty (easy|medium|hard).',
		'Use concise, distinct questions and answers. No markdown, no explanation.',
		uniquenessHint,
		'Source text:',
		sourceText,
	].join('\n');

	const raw = await generate(prompt, {
		responseMimeType: 'application/json',
		temperature,
		numPredict,
		timeoutMs,
	});

	const parsed = parseJsonResponse(raw, []);
	if (!Array.isArray(parsed)) {
		return [];
	}

	return parsed.map(normalizeFlashcard).filter((item) => item.question && item.answer);
};

export const generateFlashcards = async (text, count = 10) => {
	const requestedCount = sanitizeRequestedCount(count, 10);
	const baseText = normalizeText(text);
	let sourceText = limitInput(baseText);
	if (!sourceText) {
		return [];
	}

	let cards = [];
	try {
		cards = await requestFlashcardBatch({
			sourceText,
			batchCount: requestedCount,
			temperature: 0.2,
			numPredict: Math.min(2200, Math.max(700, requestedCount * 120)),
		});
	} catch (error) {
		if (!String(error?.code || '').endsWith('_TIMEOUT')) {
			throw error;
		}

		const reducedMaxChars = Math.max(1200, Math.floor(MAX_INPUT_CHARS * 0.6));
		sourceText = limitInput(baseText, reducedMaxChars);
		cards = await requestFlashcardBatch({
			sourceText,
			batchCount: requestedCount,
			temperature: 0.1,
			numPredict: Math.min(2000, Math.max(650, requestedCount * 110)),
			timeoutMs: Math.max(HUGGINGFACE_TIMEOUT_MS, 210000),
		});
	}

	const deduped = [];
	const seen = new Set();
	for (const card of cards) {
		const key = `${card.question.toLowerCase()}|${card.answer.toLowerCase()}`;
		if (!seen.has(key)) {
			seen.add(key);
			deduped.push(card);
		}
	}

	let attempts = 0;
	while (deduped.length < requestedCount && attempts < 2) {
		const missingCount = requestedCount - deduped.length;
		const topUpBatch = await requestFlashcardBatch({
			sourceText,
			batchCount: missingCount,
			existingCards: deduped,
			temperature: 0.15,
			numPredict: Math.min(1600, Math.max(500, missingCount * 120)),
			timeoutMs: Math.max(HUGGINGFACE_TIMEOUT_MS, 210000),
		});

		for (const card of topUpBatch) {
			const key = `${card.question.toLowerCase()}|${card.answer.toLowerCase()}`;
			if (!seen.has(key)) {
				seen.add(key);
				deduped.push(card);
			}
		}

		attempts += 1;
	}

	return deduped.slice(0, requestedCount);
};

export const generateQuiz = async (text, count = 10) => {
	const requestedCount = sanitizeRequestedCount(count, 10);
	const sourceText = limitInput(normalizeText(text));
	if (!sourceText) {
		return [];
	}

	const prompt = [
		'Create multiple-choice quiz questions from the text below.',
		`Return ONLY JSON as an array with EXACTLY ${requestedCount} items.`,
		'Each item must have:',
		'- question (string)',
		'- options (array of exactly 4 strings)',
		'- correctAnswer (must be one of the options)',
		'- explanation (string)',
		'No markdown, no explanation outside JSON.',
		'',
		sourceText,
	].join('\n');

	const raw = await generate(prompt, {
		responseMimeType: 'application/json',
		temperature: 0.2,
		numPredict: Math.min(2600, Math.max(900, requestedCount * 150)),
	});
	const parsed = parseJsonResponse(raw, []);

	const candidates = Array.isArray(parsed)
		? parsed
		: Array.isArray(parsed?.questions)
			? parsed.questions
			: [];

	return candidates
		.map(normalizeQuizItem)
		.filter((item) => item.question && item.options.length === 4)
		.slice(0, requestedCount);
};

export const generateSummary = async (text, maxWords = 180) => {
	const sourceText = limitInput(normalizeText(text));
	if (!sourceText) {
		return '';
	}

	const prompt = [
		`Summarize this material in under ${maxWords} words for a student.`,
		'Use short paragraphs and keep the key ideas and definitions.',
		'',
		sourceText,
	].join('\n');

	const raw = await generate(prompt, { temperature: 0.4 });
	return raw.trim();
};

export const chatWithDocument = async ({ question, context, history = [] }) => {
	const cleanQuestion = normalizeText(question);
	const cleanContext = normalizeText(context);
	if (!cleanQuestion) {
		throw new Error('Question is required.');
	}

	const historyText = history
		.slice(-8)
		.map((msg) => `${msg.role || 'user'}: ${String(msg.content || '')}`)
		.join('\n');

	const prompt = [
		'You are a learning assistant. Answer from the provided context.',
		'If context is insufficient, clearly say what is missing.',
		'',
		'Context:',
		cleanContext,
		'',
		'Recent chat history:',
		historyText || '(none)',
		'',
		`Question: ${cleanQuestion}`,
	].join('\n');

	const answer = await generate(prompt, { temperature: 0.5 });
	return answer.trim();
};

export const explainConcept = async ({ concept, context }) => {
	const cleanConcept = normalizeText(concept);
	const cleanContext = normalizeText(context);

	if (!cleanConcept) {
		throw new Error('Concept is required.');
	}

	const prompt = [
		`Explain this concept in simple terms: ${cleanConcept}`,
		'Keep it accurate and student-friendly, with one short example.',
		'',
		'Reference material:',
		cleanContext || '(no extra context provided)',
	].join('\n');

	const explanation = await generate(prompt, { temperature: 0.4 });
	return explanation.trim();
};

export default {
	generateFlashcards,
	generateQuiz,
	generateSummary,
	chatWithDocument,
	explainConcept,
};
