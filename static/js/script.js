/**
 * SmartChat AI — Client-side Controller
 * Modular, clean, and accessible JavaScript for chat operations,
 * session storage, Markdown rendering, themes, and voice input.
 */

(() => {
  'use strict';

  // -------------------------------------------------------------------------
  // DOM Elements
  // -------------------------------------------------------------------------
  const elements = {
    appLayout: document.getElementById('appLayout'),
    sidebar: document.getElementById('sidebar'),
    sidebarBackdrop: document.getElementById('sidebarBackdrop'),
    openSidebarBtn: document.getElementById('openSidebarBtn'),
    closeSidebarBtn: document.getElementById('closeSidebarBtn'),
    newChatBtn: document.getElementById('newChatBtn'),
    headerNewChatBtn: document.getElementById('headerNewChatBtn'),
    clearChatBtn: document.getElementById('clearChatBtn'),
    clearAllHistoryBtn: document.getElementById('clearAllHistoryBtn'),
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    modelSelector: document.getElementById('modelSelector'),
    modelInfoBtn: document.getElementById('modelInfoBtn'),
    modelInfoModal: document.getElementById('modelInfoModal'),
    closeModelInfoBtn: document.getElementById('closeModelInfoBtn'),
    modelInfoCloseBtn: document.getElementById('modelInfoCloseBtn'),
    diagPipeline: document.getElementById('diagPipeline'),
    diagIntents: document.getElementById('diagIntents'),
    diagPatterns: document.getElementById('diagPatterns'),
    diagVocab: document.getElementById('diagVocab'),
    historyList: document.getElementById('historyList'),
    historyCount: document.getElementById('historyCount'),
    historyEmpty: document.getElementById('historyEmpty'),
    chatViewport: document.getElementById('chatViewport'),
    welcomeScreen: document.getElementById('welcomeScreen'),
    suggestionsGrid: document.getElementById('suggestionsGrid'),
    chatMessages: document.getElementById('chatMessages'),
    typingIndicator: document.getElementById('typingIndicator'),
    scrollAnchor: document.getElementById('scrollAnchor'),
    chatForm: document.getElementById('chatForm'),
    messageInput: document.getElementById('messageInput'),
    sendBtn: document.getElementById('sendBtn'),
    voiceBtn: document.getElementById('voiceBtn'),
    confirmModal: document.getElementById('confirmModal'),
    modalTitle: document.getElementById('modalTitle'),
    modalMessage: document.getElementById('modalMessage'),
    modalConfirmBtn: document.getElementById('modalConfirmBtn'),
    modalCancelBtn: document.getElementById('modalCancelBtn'),
    toastNotification: document.getElementById('toastNotification'),
    toastMessage: document.getElementById('toastMessage')
  };

  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------
  const STORAGE_KEY_SESSIONS = 'smartchat_ai_sessions_v1';
  const STORAGE_KEY_CURRENT = 'smartchat_ai_current_session';
  const STORAGE_KEY_THEME = 'smartchat_ai_theme';
  const STORAGE_KEY_MODEL = 'smartchat_ai_model';

  let state = {
    sessions: [],
    currentSessionId: null,
    isGenerating: false,
    theme: 'dark',
    selectedModel: 'SmartChat-NLP',
    recognition: null,
    isRecording: false,
    pendingAction: null
  };


  // -------------------------------------------------------------------------
  // Initialization
  // -------------------------------------------------------------------------
  function init() {
    initTheme();
    initModelSelection();
    loadSessionsFromStorage();
    initSpeechRecognition();
    setupEventListeners();
    autoResizeTextarea();
  }

  // -------------------------------------------------------------------------
  // Model Selection & Diagnostics
  // -------------------------------------------------------------------------
  function initModelSelection() {
    const savedModel = localStorage.getItem(STORAGE_KEY_MODEL);
    if (savedModel && elements.modelSelector) {
      state.selectedModel = savedModel;
      elements.modelSelector.value = savedModel;
    }
  }

  function handleModelChange(e) {
    state.selectedModel = e.target.value;
    localStorage.setItem(STORAGE_KEY_MODEL, state.selectedModel);
    showToast(`Model set to: ${e.target.options[e.target.selectedIndex].text}`);
  }

  async function openModelDiagnostics() {
    if (!elements.modelInfoModal) return;
    elements.modelInfoModal.style.display = 'flex';

    try {
      const resp = await fetch('/api/model-info');
      if (resp.ok) {
        const data = await resp.json();
        const info = data.model_info || {};
        if (elements.diagPipeline) elements.diagPipeline.textContent = info.pipeline || 'TF-IDF + LogReg';
        if (elements.diagIntents) elements.diagIntents.textContent = `${info.total_intents || 14} Categories`;
        if (elements.diagPatterns) elements.diagPatterns.textContent = `${info.total_patterns || 105} Patterns`;
        if (elements.diagVocab) elements.diagVocab.textContent = `${info.vocabulary_size || 314} Tokens`;
      }
    } catch (err) {
      console.warn('Could not fetch latest model info:', err);
    }
  }

  function closeModelDiagnostics() {
    if (elements.modelInfoModal) {
      elements.modelInfoModal.style.display = 'none';
    }
  }


  // -------------------------------------------------------------------------
  // Theme Management
  // -------------------------------------------------------------------------
  function initTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEY_THEME);
    if (savedTheme) {
      state.theme = savedTheme;
    } else {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      state.theme = prefersDark ? 'dark' : 'light';
    }
    applyTheme(state.theme);
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY_THEME, theme);
    state.theme = theme;
  }

  function toggleTheme() {
    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    showToast(`Switched to ${newTheme === 'dark' ? 'Dark' : 'Light'} theme`);
  }

  // -------------------------------------------------------------------------
  // Storage & Session Management
  // -------------------------------------------------------------------------
  function loadSessionsFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SESSIONS);
      state.sessions = stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Error loading sessions from localStorage:', e);
      state.sessions = [];
    }

    const savedCurrentId = localStorage.getItem(STORAGE_KEY_CURRENT);
    const existing = state.sessions.find(s => s.id === savedCurrentId);

    if (existing) {
      switchSession(existing.id);
    } else if (state.sessions.length > 0) {
      switchSession(state.sessions[0].id);
    } else {
      createNewSession(false);
    }

    renderHistorySidebar();
  }

  function saveSessionsToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(state.sessions));
      if (state.currentSessionId) {
        localStorage.setItem(STORAGE_KEY_CURRENT, state.currentSessionId);
      }
    } catch (e) {
      console.error('Error saving sessions to localStorage:', e);
    }
  }

  function createNewSession(notify = true) {
    const newSession = {
      id: 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      title: 'New Conversation',
      createdAt: new Date().toISOString(),
      messages: []
    };

    state.sessions.unshift(newSession);
    state.currentSessionId = newSession.id;
    saveSessionsToStorage();
    renderHistorySidebar();
    renderCurrentSession();
    closeSidebarOnMobile();

    if (elements.messageInput) {
      elements.messageInput.value = '';
      elements.messageInput.style.height = 'auto';
      updateSendButtonState();
      elements.messageInput.focus();
    }

    if (notify) {
      showToast('Started new conversation');
    }
  }

  function getCurrentSession() {
    return state.sessions.find(s => s.id === state.currentSessionId) || null;
  }

  function switchSession(sessionId) {
    state.currentSessionId = sessionId;
    saveSessionsToStorage();
    renderHistorySidebar();
    renderCurrentSession();
    closeSidebarOnMobile();
  }

  function deleteSession(sessionId, event) {
    if (event) {
      event.stopPropagation();
    }

    state.sessions = state.sessions.filter(s => s.id !== sessionId);

    if (state.currentSessionId === sessionId) {
      if (state.sessions.length > 0) {
        state.currentSessionId = state.sessions[0].id;
      } else {
        createNewSession(false);
        return;
      }
    }

    saveSessionsToStorage();
    renderHistorySidebar();
    renderCurrentSession();
    showToast('Conversation deleted');
  }

  function clearAllSessions() {
    showConfirmModal(
      'Clear All Conversations?',
      'This will permanently delete all chat history. This action cannot be undone.',
      () => {
        state.sessions = [];
        state.currentSessionId = null;
        localStorage.removeItem(STORAGE_KEY_SESSIONS);
        localStorage.removeItem(STORAGE_KEY_CURRENT);
        createNewSession(false);
        showToast('All chat history cleared');
      }
    );
  }

  function clearCurrentConversation() {
    const session = getCurrentSession();
    if (!session || session.messages.length === 0) {
      showToast('Conversation is already empty');
      return;
    }

    showConfirmModal(
      'Clear Current Chat?',
      'Are you sure you want to clear messages from this conversation?',
      () => {
        session.messages = [];
        session.title = 'New Conversation';
        saveSessionsToStorage();
        renderHistorySidebar();
        renderCurrentSession();
        showToast('Chat cleared');
      }
    );
  }

  // -------------------------------------------------------------------------
  // Sidebar Rendering
  // -------------------------------------------------------------------------
  function renderHistorySidebar() {
    if (!elements.historyList) return;

    elements.historyList.innerHTML = '';
    elements.historyCount.textContent = state.sessions.length;

    if (state.sessions.length === 0) {
      elements.historyEmpty.style.display = 'flex';
      elements.historyList.appendChild(elements.historyEmpty);
      return;
    }

    elements.historyEmpty.style.display = 'none';

    state.sessions.forEach(session => {
      const item = document.createElement('div');
      item.className = `history-item ${session.id === state.currentSessionId ? 'active' : ''}`;
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');

      const titleSpan = document.createElement('span');
      titleSpan.className = 'history-item-title';
      titleSpan.textContent = session.title || 'Untitled Conversation';
      titleSpan.title = session.title;

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'history-item-delete';
      deleteBtn.title = 'Delete conversation';
      deleteBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;

      deleteBtn.addEventListener('click', (e) => deleteSession(session.id, e));
      item.addEventListener('click', () => switchSession(session.id));

      item.appendChild(titleSpan);
      item.appendChild(deleteBtn);
      elements.historyList.appendChild(item);
    });
  }

  // -------------------------------------------------------------------------
  // Chat Rendering
  // -------------------------------------------------------------------------
  function renderCurrentSession() {
    const session = getCurrentSession();
    elements.chatMessages.innerHTML = '';

    if (!session || !session.messages || session.messages.length === 0) {
      elements.welcomeScreen.style.display = 'block';
      elements.chatMessages.style.display = 'none';
      return;
    }

    elements.welcomeScreen.style.display = 'none';
    elements.chatMessages.style.display = 'flex';

    session.messages.forEach(msg => {
      appendMessageToDOM(msg.role, msg.content, msg.timestamp, false);
    });

    scrollToBottom();
  }

  function appendMessageToDOM(role, content, timestamp = null, animate = true) {
    elements.welcomeScreen.style.display = 'none';
    elements.chatMessages.style.display = 'flex';

    const formattedTime = timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isUser = role === 'user';

    const row = document.createElement('div');
    row.className = `message-row ${isUser ? 'user-row' : 'bot-row'}`;
    if (!animate) {
      row.style.animation = 'none';
    }

    if (!isUser) {
      const avatar = document.createElement('div');
      avatar.className = 'message-avatar bot-avatar';
      avatar.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10a9.96 9.96 0 0 1-4.587-1.113L2 22l1.113-5.413A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2z"></path>
          <circle cx="8" cy="12" r="1"></circle>
          <circle cx="12" cy="12" r="1"></circle>
          <circle cx="16" cy="12" r="1"></circle>
        </svg>
      `;
      row.appendChild(avatar);
    }

    const contentWrap = document.createElement('div');
    contentWrap.className = 'message-content-wrap';

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';

    if (isUser) {
      bubble.textContent = content; // Safe plain text for user messages
    } else {
      bubble.innerHTML = renderMarkdown(content); // Rendered markdown for AI response
    }

    const meta = document.createElement('div');
    meta.className = 'message-meta';
    meta.innerHTML = `<span>${formattedTime}</span>`;

    if (!isUser) {
      const copyBtn = document.createElement('button');
      copyBtn.className = 'message-copy-btn';
      copyBtn.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        <span>Copy</span>
      `;
      copyBtn.addEventListener('click', () => copyToClipboard(content, copyBtn));
      meta.appendChild(copyBtn);
    }

    contentWrap.appendChild(bubble);
    contentWrap.appendChild(meta);
    row.appendChild(contentWrap);

    elements.chatMessages.appendChild(row);

    // Attach click listeners for any copy code buttons inside this message
    attachCodeCopyListeners(bubble);

    scrollToBottom();
  }

  // -------------------------------------------------------------------------
  // Markdown & Code Renderer
  // -------------------------------------------------------------------------
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function renderMarkdown(rawText) {
    if (!rawText) return '';

    let text = rawText;

    // 1. Extract and preserve Code Blocks
    const codeBlocks = [];
    text = text.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
      const id = `__CODE_BLOCK_${codeBlocks.length}__`;
      codeBlocks.push({
        language: (lang || 'code').toLowerCase(),
        code: code.trim()
      });
      return id;
    });

    // 2. Escape HTML
    text = escapeHtml(text);

    // 3. Headers
    text = text.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    text = text.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    text = text.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // 4. Blockquotes
    text = text.replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>');

    // 5. Bold and Italic
    text = text.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // 6. Inline Code
    text = text.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

    // 7. Unordered Lists
    text = text.replace(/^\s*[\-\*]\s+(.*$)/gim, '<li>$1</li>');
    text = text.replace(/(<li>.*<\/li>)/gms, '<ul>$1</ul>');
    // Fix nested unneeded uls
    text = text.replace(/<\/ul>\s*<ul>/g, '');

    // 8. Markdown Tables
    text = text.replace(/\|(.+)\|/g, (match) => {
      const cells = match.split('|').filter((c, i, arr) => i > 0 && i < arr.length - 1);
      if (cells.every(c => /^[\s\:\-]+$/.test(c))) {
        return ''; // delimiter line
      }
      const isHeader = !text.includes('<tbody>');
      const tag = isHeader ? 'th' : 'td';
      const row = cells.map(c => `<${tag}>${c.trim()}</${tag}>`).join('');
      return `<tr>${row}</tr>`;
    });
    text = text.replace(/(<tr>.*<\/tr>)/gs, '<table>$1</table>');

    // 9. Paragraphs and Line Breaks
    const paragraphs = text.split(/\n\n+/);
    text = paragraphs.map(p => {
      p = p.trim();
      if (!p) return '';
      if (/^<(h[1-3]|ul|ol|blockquote|table|div)/i.test(p) || p.startsWith('__CODE_BLOCK_')) {
        return p;
      }
      return `<p>${p.replace(/\n/g, '<br/>')}</p>`;
    }).join('\n');

    // 10. Restore Code Blocks
    codeBlocks.forEach((block, index) => {
      const placeholder = `__CODE_BLOCK_${index}__`;
      const escapedCode = escapeHtml(block.code);
      const blockHtml = `
        <div class="code-block-wrap">
          <div class="code-header">
            <span>${block.language}</span>
            <button class="code-copy-btn" data-code="${encodeURIComponent(block.code)}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              <span>Copy</span>
            </button>
          </div>
          <pre><code>${escapedCode}</code></pre>
        </div>
      `;
      text = text.replace(placeholder, blockHtml);
    });

    return text;
  }

  function attachCodeCopyListeners(container) {
    const copyBtns = container.querySelectorAll('.code-copy-btn');
    copyBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const rawCode = decodeURIComponent(btn.getAttribute('data-code') || '');
        copyToClipboard(rawCode, btn);
      });
    });
  }

  function copyToClipboard(text, triggerElement = null) {
    if (!navigator.clipboard) {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      handleCopyFeedback(triggerElement);
      return;
    }

    navigator.clipboard.writeText(text)
      .then(() => handleCopyFeedback(triggerElement))
      .catch(err => {
        console.error('Failed to copy text:', err);
        showToast('Could not copy to clipboard');
      });
  }

  function handleCopyFeedback(triggerElement) {
    if (triggerElement) {
      const span = triggerElement.querySelector('span');
      if (span) {
        const originalText = span.textContent;
        span.textContent = 'Copied!';
        setTimeout(() => {
          span.textContent = originalText;
        }, 2000);
      }
    }
    showToast('Copied to clipboard');
  }

  // -------------------------------------------------------------------------
  // Message Submission & Backend Call
  // -------------------------------------------------------------------------
  async function handleSendMessage(customPrompt = null) {
    if (state.isGenerating) return;

    const messageText = customPrompt || (elements.messageInput ? elements.messageInput.value.trim() : '');
    if (!messageText) return;

    // Ensure session exists
    let session = getCurrentSession();
    if (!session) {
      createNewSession(false);
      session = getCurrentSession();
    }

    // Set first message as conversation title
    if (session.messages.length === 0) {
      session.title = messageText.length > 32 ? messageText.substring(0, 32) + '...' : messageText;
      renderHistorySidebar();
    }

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Add User message to state and DOM
    const userMessageObj = { role: 'user', content: messageText, timestamp };
    session.messages.push(userMessageObj);
    saveSessionsToStorage();
    appendMessageToDOM('user', messageText, timestamp, true);

    // Reset input
    if (elements.messageInput) {
      elements.messageInput.value = '';
      elements.messageInput.style.height = 'auto';
      updateSendButtonState();
    }

    // 2. Show Typing Indicator
    setGeneratingState(true);

    try {
      // Build conversation history payload (last 6 messages)
      const historyPayload = session.messages.slice(-7, -1).map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          history: historyPayload,
          model: state.selectedModel
        })
      });


      const data = await response.json();

      if (response.ok && data.status === 'success') {
        const botReply = data.reply || 'No response returned.';
        const botMessageObj = {
          role: 'assistant',
          content: botReply,
          timestamp: data.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          provider: data.provider
        };

        session.messages.push(botMessageObj);
        saveSessionsToStorage();
        appendMessageToDOM('assistant', botReply, botMessageObj.timestamp, true);
      } else {
        const errorMsg = data.error || 'Sorry, I could not process your request right now. Please try again.';
        const botErrorObj = {
          role: 'assistant',
          content: `⚠️ **Error**: ${errorMsg}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        session.messages.push(botErrorObj);
        saveSessionsToStorage();
        appendMessageToDOM('assistant', botErrorObj.content, botErrorObj.timestamp, true);
      }

    } catch (networkError) {
      console.error('Fetch error:', networkError);
      const networkErrorMessage = '⚠️ **Network Error**: Unable to connect to the backend server. Please verify your connection and ensure the Flask server is running.';
      session.messages.push({
        role: 'assistant',
        content: networkErrorMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      saveSessionsToStorage();
      appendMessageToDOM('assistant', networkErrorMessage, null, true);
    } finally {
      setGeneratingState(false);
      if (elements.messageInput) {
        elements.messageInput.focus();
      }
    }
  }

  function setGeneratingState(isGenerating) {
    state.isGenerating = isGenerating;
    if (elements.typingIndicator) {
      elements.typingIndicator.style.display = isGenerating ? 'flex' : 'none';
    }
    updateSendButtonState();
    if (isGenerating) {
      scrollToBottom();
    }
  }

  function scrollToBottom() {
    setTimeout(() => {
      if (elements.scrollAnchor) {
        elements.scrollAnchor.scrollIntoView({ behavior: 'smooth' });
      } else if (elements.chatViewport) {
        elements.chatViewport.scrollTop = elements.chatViewport.scrollHeight;
      }
    }, 50);
  }

  function updateSendButtonState() {
    if (!elements.sendBtn || !elements.messageInput) return;
    const hasText = elements.messageInput.value.trim().length > 0;
    elements.sendBtn.disabled = !hasText || state.isGenerating;
  }

  function autoResizeTextarea() {
    if (!elements.messageInput) return;
    elements.messageInput.style.height = 'auto';
    elements.messageInput.style.height = Math.min(elements.messageInput.scrollHeight, 160) + 'px';
  }

  // -------------------------------------------------------------------------
  // Speech Recognition (Voice Input)
  // -------------------------------------------------------------------------
  function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      if (elements.voiceBtn) {
        elements.voiceBtn.style.display = 'none';
      }
      return;
    }

    try {
      state.recognition = new SpeechRecognition();
      state.recognition.continuous = false;
      state.recognition.interimResults = false;
      state.recognition.lang = 'en-US';

      state.recognition.onstart = () => {
        state.isRecording = true;
        if (elements.voiceBtn) elements.voiceBtn.classList.add('recording');
        showToast('Listening... Speak now');
      };

      state.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (elements.messageInput) {
          elements.messageInput.value = (elements.messageInput.value + ' ' + transcript).trim();
          autoResizeTextarea();
          updateSendButtonState();
          elements.messageInput.focus();
        }
      };

      state.recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        stopRecording();
        if (event.error !== 'no-speech') {
          showToast('Microphone error: ' + event.error);
        }
      };

      state.recognition.onend = () => {
        stopRecording();
      };
    } catch (e) {
      console.warn('Speech Recognition could not be initialized:', e);
    }
  }

  function toggleSpeechRecognition() {
    if (!state.recognition) {
      showToast('Voice input is not supported in this browser.');
      return;
    }

    if (state.isRecording) {
      state.recognition.stop();
    } else {
      try {
        state.recognition.start();
      } catch (e) {
        console.error('Recognition start error:', e);
      }
    }
  }

  function stopRecording() {
    state.isRecording = false;
    if (elements.voiceBtn) elements.voiceBtn.classList.remove('recording');
  }

  // -------------------------------------------------------------------------
  // Modal Dialog & Toast Helpers
  // -------------------------------------------------------------------------
  function showConfirmModal(title, message, onConfirm) {
    elements.modalTitle.textContent = title;
    elements.modalMessage.textContent = message;
    state.pendingAction = onConfirm;
    elements.confirmModal.style.display = 'flex';
  }

  function hideConfirmModal() {
    elements.confirmModal.style.display = 'none';
    state.pendingAction = null;
  }

  let toastTimer = null;
  function showToast(message) {
    if (!elements.toastNotification || !elements.toastMessage) return;
    elements.toastMessage.textContent = message;
    elements.toastNotification.classList.add('show');

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      elements.toastNotification.classList.remove('show');
    }, 2800);
  }

  // -------------------------------------------------------------------------
  // Responsive Drawer Helpers
  // -------------------------------------------------------------------------
  function openSidebarOnMobile() {
    if (elements.sidebar) elements.sidebar.classList.add('open');
    if (elements.sidebarBackdrop) elements.sidebarBackdrop.classList.add('active');
  }

  function closeSidebarOnMobile() {
    if (elements.sidebar) elements.sidebar.classList.remove('open');
    if (elements.sidebarBackdrop) elements.sidebarBackdrop.classList.remove('active');
  }

  // -------------------------------------------------------------------------
  // Event Listeners
  // -------------------------------------------------------------------------
  function setupEventListeners() {
    // New Chat
    if (elements.newChatBtn) {
      elements.newChatBtn.addEventListener('click', () => createNewSession(true));
    }
    if (elements.headerNewChatBtn) {
      elements.headerNewChatBtn.addEventListener('click', () => createNewSession(true));
    }

    // Clear Chat
    if (elements.clearChatBtn) {
      elements.clearChatBtn.addEventListener('click', clearCurrentConversation);
    }
    if (elements.clearAllHistoryBtn) {
      elements.clearAllHistoryBtn.addEventListener('click', clearAllSessions);
    }

    // Theme Toggle
    if (elements.themeToggleBtn) {
      elements.themeToggleBtn.addEventListener('click', toggleTheme);
    }

    // Mobile Sidebar Drawer
    if (elements.openSidebarBtn) {
      elements.openSidebarBtn.addEventListener('click', openSidebarOnMobile);
    }
    if (elements.closeSidebarBtn) {
      elements.closeSidebarBtn.addEventListener('click', closeSidebarOnMobile);
    }
    if (elements.sidebarBackdrop) {
      elements.sidebarBackdrop.addEventListener('click', closeSidebarOnMobile);
    }

    // Textarea Input Handling
    if (elements.messageInput) {
      elements.messageInput.addEventListener('input', () => {
        autoResizeTextarea();
        updateSendButtonState();
      });

      elements.messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          if (!elements.sendBtn.disabled) {
            handleSendMessage();
          }
        }
      });
    }

    // Form Submission
    if (elements.chatForm) {
      elements.chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleSendMessage();
      });
    }

    // Voice Recognition Button
    if (elements.voiceBtn) {
      elements.voiceBtn.addEventListener('click', toggleSpeechRecognition);
    }

    // Suggestion Cards Grid
    if (elements.suggestionsGrid) {
      elements.suggestionsGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.suggestion-card');
        if (card) {
          const prompt = card.getAttribute('data-prompt');
          if (prompt) {
            handleSendMessage(prompt);
          }
        }
      });
    }

    // Modal Confirmation Handlers
    if (elements.modalConfirmBtn) {
      elements.modalConfirmBtn.addEventListener('click', () => {
        if (typeof state.pendingAction === 'function') {
          state.pendingAction();
        }
        hideConfirmModal();
      });
    }

    if (elements.modalCancelBtn) {
      elements.modalCancelBtn.addEventListener('click', hideConfirmModal);
    }

    // Model Selector Change
    if (elements.modelSelector) {
      elements.modelSelector.addEventListener('change', handleModelChange);
    }

    // Model Info & Diagnostics Modal
    if (elements.modelInfoBtn) {
      elements.modelInfoBtn.addEventListener('click', openModelDiagnostics);
    }
    if (elements.closeModelInfoBtn) {
      elements.closeModelInfoBtn.addEventListener('click', closeModelDiagnostics);
    }
    if (elements.modelInfoCloseBtn) {
      elements.modelInfoCloseBtn.addEventListener('click', closeModelDiagnostics);
    }
    if (elements.modelInfoModal) {
      elements.modelInfoModal.addEventListener('click', (e) => {
        if (e.target === elements.modelInfoModal) {
          closeModelDiagnostics();
        }
      });
    }

    // Escape key closes modal / mobile sidebar
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        hideConfirmModal();
        closeModelDiagnostics();
        closeSidebarOnMobile();
      }
    });

  }

  // Run initial setup when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
