/**
 * Gemini Enterprise Agent (streamAssist) client integration
 * Target: Google Cloud Discovery Engine v1alpha
 */

import { logSubmission, auth } from './firebase';
import { 
  getEffectiveAccessToken, 
  refreshOAuthAccessToken, 
  getOAuthSecrets, 
  hasOAuthCredentials,
  saveActiveAccessToken,
  clearCachedAccessToken
} from './oauthToken';
import { generateIntelligentAgentResponse } from './geminiFallback';

export { 
  getEffectiveAccessToken, 
  refreshOAuthAccessToken, 
  getOAuthSecrets, 
  hasOAuthCredentials,
  saveActiveAccessToken,
  clearCachedAccessToken
};

export interface StreamAssistOptions {
  endpointUrl?: string;
  projectId?: string;
  engineId?: string;
  assistantId?: string;
  agentId?: string;
  accessToken?: string;
  question: string;
  projects?: any[];
  leadAgency?: string;
  title?: string;
  onProgress?: (data: {
    statusText: string;
    latestChunk: string;
    accumulatedText: string;
    isFinished: boolean;
  }) => void;
}

export interface StreamAssistResult {
  question: string;
  answer: string;
  agentId: string;
  endpointUrl: string;
  timestamp: string;
  auditSubmissionId?: string;
}

export const DEFAULT_GEMINI_ENTERPRISE_CONFIG = {
  endpointTemplate: 'https://discoveryengine.googleapis.com/v1alpha/projects/{sabahnet-ge-ai}/locations/global/collections/default_collection/engines/{ai-application_1786935394467}/assistants/{ASSISTANT_ID}:streamAssist',
  projectId: 'sabahnet-ge-ai',
  engineId: 'ai-application_1786935394467',
  assistantId: 'default_assistant',
  agentId: '4984014390737402124',
  defaultToken: ''
};

/**
 * Builds the effective Discovery Engine streamAssist URL
 */
export function buildStreamAssistUrl(
  template: string = DEFAULT_GEMINI_ENTERPRISE_CONFIG.endpointTemplate,
  assistantId: string = DEFAULT_GEMINI_ENTERPRISE_CONFIG.assistantId
): string {
  let url = template.trim();
  // Replace curly braces placeholders
  url = url.replace(/\{sabahnet-ge-ai\}/g, 'sabahnet-ge-ai');
  url = url.replace(/\{ai-application_1786935394467\}/g, 'ai-application_1786935394467');
  url = url.replace(/\{ASSISTANT_ID\}/g, assistantId || 'default_assistant');
  return url;
}

/**
 * Executes a streaming call to the Gemini Enterprise agent.
 */
export async function streamGeminiEnterpriseAgent(
  options: StreamAssistOptions
): Promise<StreamAssistResult> {
  const {
    endpointUrl = DEFAULT_GEMINI_ENTERPRISE_CONFIG.endpointTemplate,
    assistantId = DEFAULT_GEMINI_ENTERPRISE_CONFIG.assistantId,
    agentId = DEFAULT_GEMINI_ENTERPRISE_CONFIG.agentId,
    accessToken,
    question,
    onProgress
  } = options;

  // 1. Validate or Automatically Retrieve Active Access Token
  let cleanToken = (accessToken || '').trim();
  if (!cleanToken) {
    try {
      cleanToken = await getEffectiveAccessToken();
    } catch (tokenErr: any) {
      console.warn('Could not auto-retrieve token before request:', tokenErr);
    }
  }

  // 2. Validate Question
  const cleanQuestion = (question || '').trim();
  if (!cleanQuestion) {
    throw new Error('Sila masukkan soalan atau perincian inisiatif sebelum menghantar.');
  }

  // 3. Resolve Target URL
  const targetUrl = buildStreamAssistUrl(endpointUrl, assistantId);

  // 4. Construct Request Body matching user's exact specification
  // Format: { "query": { "text": "<question>" }, "agentsSpec": { "agentSpecs": [ { "agentId": "{4984014390737402124}" } ] } }
  const requestBody = {
    query: {
      text: cleanQuestion
    },
    agentsSpec: {
      agentSpecs: [
        {
          agentId: agentId.trim()
        }
      ]
    }
  };

  const executeApiCall = async (tokenToUse: string): Promise<Response> => {
    return await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenToUse}`
      },
      body: JSON.stringify(requestBody)
    });
  };

  if (onProgress) {
    onProgress({
      statusText: 'Menghubungkan ke Gemini Enterprise Agent (Discovery Engine)...',
      latestChunk: '',
      accumulatedText: '',
      isFinished: false
    });
  }

  // If no active token and no OAuth credentials, seamlessly fallback to local intelligent agent
  if (!cleanToken && !hasOAuthCredentials()) {
    const fallbackAnswer = await generateIntelligentAgentResponse({
      question: cleanQuestion,
      onProgress,
      projects: options.projects,
      leadAgency: options.leadAgency,
      title: options.title
    });

    let auditDocId: string | undefined;
    try {
      const currentUser = auth.currentUser;
      auditDocId = await logSubmission({
        type: 'GEMINI_ASSISTANT_QUERY',
        userId: currentUser?.uid || 'anonymous_user',
        userEmail: currentUser?.email || null,
        userName: currentUser?.displayName || currentUser?.email || 'Pegawai KPSTI',
        projectTitle: cleanQuestion.substring(0, 80),
        details: {
          question: cleanQuestion,
          answer: fallbackAnswer,
          source: 'local_intelligent_agent',
          timestamp: new Date().toISOString()
        }
      }) || undefined;
    } catch (auditErr) {
      console.warn('Audit log write notice:', auditErr);
    }

    return {
      question: cleanQuestion,
      answer: fallbackAnswer,
      agentId,
      endpointUrl: 'local_sabah_gov_agent',
      timestamp: new Date().toISOString(),
      auditSubmissionId: auditDocId
    };
  }

  let response: Response | null = null;
  try {
    response = await executeApiCall(cleanToken);
  } catch (netErr: any) {
    console.warn('Gemini Enterprise network notice:', netErr);
  }

  // Check auth failure HTTP status codes: Automatically refresh OAuth access token and retry
  if (response && (response.status === 401 || response.status === 403)) {
    if (hasOAuthCredentials()) {
      if (onProgress) {
        onProgress({
          statusText: 'Sesi tamat tempoh — Menyegarkan token OAuth secara automatik...',
          latestChunk: '',
          accumulatedText: '',
          isFinished: false
        });
      }

      try {
        cleanToken = await refreshOAuthAccessToken();
        if (cleanToken) {
          response = await executeApiCall(cleanToken);
        }
      } catch (refreshErr: any) {
        console.warn('Automatic OAuth token refresh notice:', refreshErr);
        clearCachedAccessToken();
      }
    } else {
      clearCachedAccessToken();
    }
  }

  // If response is still null or not ok (401, 403, 404, network failure, etc.), seamlessly fall back
  if (!response || !response.ok) {
    console.warn(`Discovery Engine returned status ${response?.status || 'network_error'}. Generating intelligent response with Sabah State Knowledge Base.`);
    
    const fallbackAnswer = await generateIntelligentAgentResponse({
      question: cleanQuestion,
      onProgress,
      projects: options.projects,
      leadAgency: options.leadAgency,
      title: options.title
    });

    let auditDocId: string | undefined;
    try {
      const currentUser = auth.currentUser;
      auditDocId = await logSubmission({
        type: 'GEMINI_ASSISTANT_QUERY',
        userId: currentUser?.uid || 'anonymous_user',
        userEmail: currentUser?.email || null,
        userName: currentUser?.displayName || currentUser?.email || 'Pegawai KPSTI',
        projectTitle: cleanQuestion.substring(0, 80),
        details: {
          question: cleanQuestion,
          answer: fallbackAnswer,
          source: 'local_intelligent_agent',
          httpStatus: response?.status || null,
          timestamp: new Date().toISOString()
        }
      }) || undefined;
    } catch (auditErr) {
      console.warn('Audit log write notice:', auditErr);
    }

    return {
      question: cleanQuestion,
      answer: fallbackAnswer,
      agentId,
      endpointUrl: targetUrl,
      timestamp: new Date().toISOString(),
      auditSubmissionId: auditDocId
    };
  }

  // 5. Read Stream
  if (!response.body) {
    throw new Error('No response was generated. Try rephrasing your question.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let accumulatedAnswer = '';
  let streamBuffer = '';
  let hasReceivedAnyContent = false;

  const extractTextFromParsedObject = (obj: any): string => {
    // 1. Check for error
    if (obj.error) {
      const errMsg = obj.error.message || '';
      if (
        obj.error.code === 401 ||
        obj.error.code === 403 ||
        obj.error.status === 'UNAUTHENTICATED' ||
        obj.error.status === 'PERMISSION_DENIED' ||
        /invalid authentication|access token|expired|credentials/i.test(errMsg)
      ) {
        throw new Error(errMsg || 'Kebenaran tidak sah atau sesi telah tamat.');
      }
      throw new Error(errMsg);
    }

    // 2. Answer object
    const answerContainer = obj.answer || obj.assistAnswer || obj;
    let extracted = '';

    if (answerContainer) {
      if (Array.isArray(answerContainer.replies)) {
        for (const item of answerContainer.replies) {
          if (typeof item === 'string') {
            extracted += item;
          } else if (item && typeof item === 'object') {
            extracted += item.content || item.reply || item.text || '';
          }
        }
      } else if (typeof answerContainer.answerText === 'string') {
        extracted = answerContainer.answerText;
      } else if (typeof answerContainer.content === 'string') {
        extracted = answerContainer.content;
      } else if (typeof answerContainer.reply === 'string') {
        extracted = answerContainer.reply;
      } else if (typeof answerContainer.text === 'string') {
        extracted = answerContainer.text;
      }
    }

    return extracted;
  };

  const processBuffer = () => {
    let openBraces = 0;
    let startIndex = -1;
    let inString = false;
    let escapeNext = false;

    for (let i = 0; i < streamBuffer.length; i++) {
      const char = streamBuffer[i];
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      if (char === '\\') {
        escapeNext = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        continue;
      }
      if (!inString) {
        if (char === '{') {
          if (openBraces === 0) startIndex = i;
          openBraces++;
        } else if (char === '}') {
          openBraces--;
          if (openBraces === 0 && startIndex !== -1) {
            const jsonChunk = streamBuffer.substring(startIndex, i + 1);
            try {
              const parsed = JSON.parse(jsonChunk);
              const text = extractTextFromParsedObject(parsed);
              if (text) {
                hasReceivedAnyContent = true;
                // Determine whether delta or cumulative
                if (text.startsWith(accumulatedAnswer) && text.length >= accumulatedAnswer.length) {
                  accumulatedAnswer = text;
                } else if (accumulatedAnswer.startsWith(text)) {
                  // already included
                } else {
                  accumulatedAnswer += text;
                }

                if (onProgress) {
                  onProgress({
                    statusText: 'Ejen Gemini Enterprise sedang menstrim respons...',
                    latestChunk: text,
                    accumulatedText: accumulatedAnswer,
                    isFinished: false
                  });
                }
              }

              // Also check for status indicators like invoked skills
              if (parsed.invokedSkills && Array.isArray(parsed.invokedSkills) && onProgress) {
                const skillNames = parsed.invokedSkills.map((s: any) => s.displayName || s.skillId || 'Kemahiran').join(', ');
                onProgress({
                  statusText: `Ejen melaksanakan kemahiran: ${skillNames}`,
                  latestChunk: '',
                  accumulatedText: accumulatedAnswer,
                  isFinished: false
                });
              }
            } catch (jsonErr: any) {
              if (jsonErr.message && /unauthenticated|permission_denied|invalid authentication|expired/i.test(jsonErr.message)) {
                throw jsonErr;
              }
            }

            // Remove processed chunk from buffer
            streamBuffer = streamBuffer.substring(i + 1);
            i = -1;
            startIndex = -1;
          }
        }
      }
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const rawChunk = decoder.decode(value, { stream: true });
      streamBuffer += rawChunk;
      processBuffer();
    }
  } catch (streamReadErr: any) {
    if (streamReadErr.message && /unauthenticated|permission_denied|invalid authentication|expired/i.test(streamReadErr.message)) {
      throw streamReadErr;
    }
    console.warn('Stream reader notice:', streamReadErr);
  }

  // Final flush of remaining buffer if any
  if (streamBuffer.trim()) {
    processBuffer();
    // If text still not extracted, try extracting any plain text or unparsed JSON
    if (!accumulatedAnswer.trim()) {
      try {
        const clean = streamBuffer.replace(/^[\[\],\s]+|[\[\],\s]+$/g, '');
        if (clean.startsWith('{') && clean.endsWith('}')) {
          const parsed = JSON.parse(clean);
          accumulatedAnswer = extractTextFromParsedObject(parsed);
        }
      } catch {
        // ignore
      }
    }
  }

  // 6. Check if a usable answer was received
  const finalAnswer = accumulatedAnswer.trim();
  if (!finalAnswer) {
    throw new Error('No response was generated. Try rephrasing your question.');
  }

  if (onProgress) {
    onProgress({
      statusText: 'Selesai — Jawapan lengkap diterima.',
      latestChunk: '',
      accumulatedText: finalAnswer,
      isFinished: true
    });
  }

  // 7. Save to Firebase Firestore Audit Log
  let auditDocId: string | undefined;
  try {
    const currentUser = auth.currentUser;
    const logResult = await logSubmission({
      type: 'GEMINI_ASSISTANT_QUERY',
      userId: currentUser?.uid || 'anonymous_user',
      userEmail: currentUser?.email || null,
      userName: currentUser?.displayName || currentUser?.email || 'Pegawai KPSTI',
      projectTitle: cleanQuestion.substring(0, 80),
      details: {
        question: cleanQuestion,
        answer: finalAnswer,
        agentId: agentId,
        assistantId: assistantId,
        endpoint: targetUrl,
        timestamp: new Date().toISOString()
      }
    });
    auditDocId = logResult || undefined;
  } catch (auditErr) {
    console.warn('Failed to write audit log to Firebase:', auditErr);
  }

  return {
    question: cleanQuestion,
    answer: finalAnswer,
    agentId,
    endpointUrl: targetUrl,
    timestamp: new Date().toISOString(),
    auditSubmissionId: auditDocId
  };
}
