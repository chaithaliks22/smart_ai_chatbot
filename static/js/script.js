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
    
    // Voice Assistant Elements
    voiceAutoSpeakBtn: document.getElementById('voiceAutoSpeakBtn'),
    voiceModeBadge: document.getElementById('voiceModeBadge'),
    voiceSettingsBtn: document.getElementById('voiceSettingsBtn'),
    voiceSettingsModal: document.getElementById('voiceSettingsModal'),
    closeVoiceSettingsBtn: document.getElementById('closeVoiceSettingsBtn'),
    saveVoiceSettingsBtn: document.getElementById('saveVoiceSettingsBtn'),
    voiceSelect: document.getElementById('voiceSelect'),
    voiceRateSlider: document.getElementById('voiceRateSlider'),
    voiceRateVal: document.getElementById('voiceRateVal'),
    voicePitchSlider: document.getElementById('voicePitchSlider'),
    voicePitchVal: document.getElementById('voicePitchVal'),
    autoSpeakToggle: document.getElementById('autoSpeakToggle'),
    autoSendVoiceToggle: document.getElementById('autoSendVoiceToggle'),
    testVoiceBtn: document.getElementById('testVoiceBtn'),
    
    // Voice Speaking Floating Bar
    voiceSpeakingBar: document.getElementById('voiceSpeakingBar'),
    speakingVoiceName: document.getElementById('speakingVoiceName'),
    voicePauseResumeBtn: document.getElementById('voicePauseResumeBtn'),
    voicePauseText: document.getElementById('voicePauseText'),
    voiceStopSpeechBtn: document.getElementById('voiceStopSpeechBtn'),

    // Voice Listening Overlay HUD
    voiceListeningOverlay: document.getElementById('voiceListeningOverlay'),
    voiceLiveTranscript: document.getElementById('voiceLiveTranscript'),
    voiceCancelListenBtn: document.getElementById('voiceCancelListenBtn'),
    voiceSendLiveBtn: document.getElementById('voiceSendLiveBtn'),

    // Confirmation & Toast
    confirmModal: document.getElementById('confirmModal'),
    modalTitle: document.getElementById('modalTitle'),
    modalMessage: document.getElementById('modalMessage'),
    modalConfirmBtn: document.getElementById('modalConfirmBtn'),
    modalCancelBtn: document.getElementById('modalCancelBtn'),
    toastNotification: document.getElementById('toastNotification'),
    toastMessage: document.getElementById('toastMessage'),

    // User Authentication Elements
    openAuthModalBtn: document.getElementById('openAuthModalBtn'),
    authModal: document.getElementById('authModal'),
    closeAuthModalBtn: document.getElementById('closeAuthModalBtn'),
    authModalTitle: document.getElementById('authModalTitle'),
    authTabLogin: document.getElementById('authTabLogin'),
    authTabRegister: document.getElementById('authTabRegister'),
    googleAuthBtn: document.getElementById('googleAuthBtn'),
    authAlert: document.getElementById('authAlert'),
    loginForm: document.getElementById('loginForm'),
    loginEmail: document.getElementById('loginEmail'),
    loginPassword: document.getElementById('loginPassword'),
    loginSubmitBtn: document.getElementById('loginSubmitBtn'),
    openForgotFromLoginBtn: document.getElementById('openForgotFromLoginBtn'),
    registerForm: document.getElementById('registerForm'),
    registerName: document.getElementById('registerName'),
    registerEmail: document.getElementById('registerEmail'),
    registerPassword: document.getElementById('registerPassword'),
    registerPasswordConfirm: document.getElementById('registerPasswordConfirm'),
    registerSubmitBtn: document.getElementById('registerSubmitBtn'),

    // Forgot Password Modal Elements
    forgotPasswordModal: document.getElementById('forgotPasswordModal'),
    closeForgotModalBtn: document.getElementById('closeForgotModalBtn'),
    forgotAlert: document.getElementById('forgotAlert'),
    forgotStep1Form: document.getElementById('forgotStep1Form'),
    forgotEmail: document.getElementById('forgotEmail'),
    sendResetCodeBtn: document.getElementById('sendResetCodeBtn'),
    backToLoginFromForgotBtn: document.getElementById('backToLoginFromForgotBtn'),
    forgotStep2Form: document.getElementById('forgotStep2Form'),
    resetCodeInput: document.getElementById('resetCodeInput'),
    resetNewPassword: document.getElementById('resetNewPassword'),
    resetNewPasswordConfirm: document.getElementById('resetNewPasswordConfirm'),
    submitResetPasswordBtn: document.getElementById('submitResetPasswordBtn'),

    // Google Sign-In Prompt Modal Elements
    googlePromptModal: document.getElementById('googlePromptModal'),
    closeGooglePromptBtn: document.getElementById('closeGooglePromptBtn'),
    googleDemoAccount1: document.getElementById('googleDemoAccount1'),
    googleCustomEmail: document.getElementById('googleCustomEmail'),
    googleCustomSubmitBtn: document.getElementById('googleCustomSubmitBtn'),

    // User Profile Dropdown Elements
    authHeaderWrap: document.getElementById('authHeaderWrap'),
    userProfileMenuWrap: document.getElementById('userProfileMenuWrap'),
    userAvatarBtn: document.getElementById('userAvatarBtn'),
    userAvatarImg: document.getElementById('userAvatarImg'),
    userDisplayName: document.getElementById('userDisplayName'),
    userDropdownMenu: document.getElementById('userDropdownMenu'),
    dropdownUserName: document.getElementById('dropdownUserName'),
    dropdownUserEmail: document.getElementById('dropdownUserEmail'),
    dropdownProviderBadge: document.getElementById('dropdownProviderBadge'),
    syncHistoryBtn: document.getElementById('syncHistoryBtn'),
    logoutBtn: document.getElementById('logoutBtn'),

    // Multiple Themes Picker Elements
    personaSelector: document.getElementById('personaSelector'),
    themePickerBtn: document.getElementById('themePickerBtn'),
    themePickerModal: document.getElementById('themePickerModal'),
    closeThemePickerBtn: document.getElementById('closeThemePickerBtn'),
    applyThemeBtn: document.getElementById('applyThemeBtn'),
    themeGrid: document.getElementById('themeGrid'),

    // Navigation & Hero Elements
    headerNavLinks: document.getElementById('headerNavLinks'),
    navHomeBtn: document.getElementById('navHomeBtn'),
    navNewChatBtn: document.getElementById('navNewChatBtn'),
    navHistoryBtn: document.getElementById('navHistoryBtn'),
    navAboutBtn: document.getElementById('navAboutBtn'),
    navSettingsBtn: document.getElementById('navSettingsBtn'),
    startChattingHeroBtn: document.getElementById('startChattingHeroBtn'),

    // About Modal Elements
    aboutModal: document.getElementById('aboutModal'),
    closeAboutModalBtn: document.getElementById('closeAboutModalBtn'),
    closeAboutModalActionBtn: document.getElementById('closeAboutModalActionBtn'),

    // Settings Modal Elements
    settingsModal: document.getElementById('settingsModal'),
    closeSettingsModalBtn: document.getElementById('closeSettingsModalBtn'),
    settingsThemeToggleBtn: document.getElementById('settingsThemeToggleBtn'),
    settingsOpenThemePickerBtn: document.getElementById('settingsOpenThemePickerBtn'),
    settingsPersonaSelect: document.getElementById('settingsPersonaSelect'),
    settingsVoiceConfigBtn: document.getElementById('settingsVoiceConfigBtn'),
    settingsClearChatBtn: document.getElementById('settingsClearChatBtn'),
    settingsClearAllHistoryBtn: document.getElementById('settingsClearAllHistoryBtn'),
    settingsOpenAboutBtn: document.getElementById('settingsOpenAboutBtn'),
    saveSettingsCloseBtn: document.getElementById('saveSettingsCloseBtn'),

    // Sidebar Footer Action Buttons
    sidebarSettingsBtn: document.getElementById('sidebarSettingsBtn'),
    sidebarThemeToggleBtn: document.getElementById('sidebarThemeToggleBtn'),
    sidebarAuthBtn: document.getElementById('sidebarAuthBtn'),
    sidebarAuthLabel: document.getElementById('sidebarAuthLabel')
  };

  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------
  const STORAGE_KEY_SESSIONS = 'smartchat_ai_sessions_v1';
  const STORAGE_KEY_CURRENT = 'smartchat_ai_current_session';
  const STORAGE_KEY_THEME = 'smartchat_ai_theme';
  const STORAGE_KEY_MODEL = 'smartchat_ai_model';
  const STORAGE_KEY_PERSONA = 'smartchat_ai_persona';
  const STORAGE_KEY_AUTO_SPEAK = 'smartchat_ai_auto_speak';
  const STORAGE_KEY_AUTO_SEND = 'smartchat_ai_auto_send_voice';
  const STORAGE_KEY_VOICE_URI = 'smartchat_ai_voice_uri';
  const STORAGE_KEY_VOICE_RATE = 'smartchat_ai_voice_rate';
  const STORAGE_KEY_VOICE_PITCH = 'smartchat_ai_voice_pitch';

  let state = {
    sessions: [],
    currentSessionId: null,
    isGenerating: false,
    theme: 'midnight',
    selectedModel: 'Groq',
    selectedPersona: 'standard',
    
    // User Authentication State
    currentUser: null,
    activeAuthTab: 'login',
    pendingForgotEmail: '',

    // Voice Assistant State
    recognition: null,
    isRecording: false,
    autoSpeak: false,
    autoSendVoice: false,
    voiceURI: '',
    voiceRate: 1.0,
    voicePitch: 1.0,
    availableVoices: [],
    isSpeaking: false,
    isPaused: false,
    activeSpeakingBtn: null,
    lastVoiceTranscript: '',

    pendingAction: null
  };

  // -------------------------------------------------------------------------
  // Initialization
  // -------------------------------------------------------------------------
  function init() {
    initTheme();
    initModelSelection();
    initVoiceAssistantSettings();
    checkCurrentUser();
    loadSessionsFromStorage();
    initSpeechSynthesis();
    setupEventListeners();
    autoResizeTextarea();
  }

  // -------------------------------------------------------------------------
  // Model Selection & Persona Configuration
  // -------------------------------------------------------------------------
  function initModelSelection() {
    const savedModel = localStorage.getItem(STORAGE_KEY_MODEL) || 'Groq';
    if (savedModel && elements.modelSelector) {
      state.selectedModel = savedModel;
      elements.modelSelector.value = savedModel;
    }
    const savedPersona = localStorage.getItem(STORAGE_KEY_PERSONA) || 'standard';
    if (savedPersona && elements.personaSelector) {
      state.selectedPersona = savedPersona;
      elements.personaSelector.value = savedPersona;
    }
  }

  function handleModelChange(e) {
    state.selectedModel = e.target.value;
    localStorage.setItem(STORAGE_KEY_MODEL, state.selectedModel);
    showToast(`Model set to: ${e.target.options[e.target.selectedIndex].text}`);
  }

  function handlePersonaChange(e) {
    state.selectedPersona = e.target.value;
    localStorage.setItem(STORAGE_KEY_PERSONA, state.selectedPersona);
    showToast(`Response Tone set to: ${e.target.options[e.target.selectedIndex].text}`);
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
  // Multiple Chat Themes Management (6 Custom Palettes)
  // -------------------------------------------------------------------------
  function initTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEY_THEME) || 'midnight';
    applyTheme(savedTheme);
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY_THEME, theme);
    state.theme = theme;

    // Update active highlight in theme grid
    if (elements.themeGrid) {
      const items = elements.themeGrid.querySelectorAll('.theme-card-item');
      items.forEach(item => {
        const val = item.getAttribute('data-theme-val');
        item.classList.toggle('active', val === theme || (theme === 'dark' && val === 'midnight'));
      });
    }
  }

  function toggleTheme() {
    // Quick toggle between dark and light
    const isCurrentlyDark = state.theme !== 'light' && state.theme !== 'daylight';
    const newTheme = isCurrentlyDark ? 'light' : 'midnight';
    applyTheme(newTheme);
    showToast(`Theme switched to: ${newTheme === 'light' ? 'Daylight (Light)' : 'Midnight (Dark)'}`);
  }

  function openThemePickerModal() {
    if (elements.themePickerModal) {
      elements.themePickerModal.style.display = 'flex';
    }
  }

  function closeThemePickerModal() {
    if (elements.themePickerModal) {
      elements.themePickerModal.style.display = 'none';
    }
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
      // Action Bar for AI Response
      const actionsBar = document.createElement('div');
      actionsBar.className = 'message-actions';

      // 1. Voice Assistant Speak / Read Aloud Button
      const speakBtn = document.createElement('button');
      speakBtn.className = 'msg-action-btn message-speak-btn';
      speakBtn.title = 'Read aloud';
      speakBtn.setAttribute('aria-label', 'Read response aloud');
      speakBtn.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        </svg>
        <span>Speak</span>
      `;
      speakBtn.addEventListener('click', () => toggleSpeakMessage(content, speakBtn));
      actionsBar.appendChild(speakBtn);

      // 2. Copy Text Button
      const copyBtn = document.createElement('button');
      copyBtn.className = 'msg-action-btn message-copy-btn';
      copyBtn.title = 'Copy response text';
      copyBtn.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        <span>Copy</span>
      `;
      copyBtn.addEventListener('click', () => copyToClipboard(content, copyBtn));
      actionsBar.appendChild(copyBtn);

      // 3. Regenerate Button
      const regenBtn = document.createElement('button');
      regenBtn.className = 'msg-action-btn';
      regenBtn.title = 'Regenerate response with different phrasing';
      regenBtn.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
        </svg>
        <span>Regenerate</span>
      `;
      regenBtn.addEventListener('click', () => handleRegenerateLastMessage());
      actionsBar.appendChild(regenBtn);

      // 4. Helpful (Thumbs Up) Feedback Button
      const thumbsUpBtn = document.createElement('button');
      thumbsUpBtn.className = 'msg-action-btn';
      thumbsUpBtn.title = 'Helpful response (Positive feedback)';
      thumbsUpBtn.innerHTML = `<span>👍</span>`;
      thumbsUpBtn.addEventListener('click', () => submitResponseFeedback('', content, 'helpful', thumbsUpBtn));
      actionsBar.appendChild(thumbsUpBtn);

      // 5. Unhelpful (Thumbs Down) Feedback Button
      const thumbsDownBtn = document.createElement('button');
      thumbsDownBtn.className = 'msg-action-btn';
      thumbsDownBtn.title = 'Needs improvement (Negative feedback)';
      thumbsDownBtn.innerHTML = `<span>👎</span>`;
      thumbsDownBtn.addEventListener('click', () => submitResponseFeedback('', content, 'unhelpful', thumbsDownBtn));
      actionsBar.appendChild(thumbsDownBtn);

      meta.appendChild(actionsBar);
    }

    contentWrap.appendChild(bubble);
    contentWrap.appendChild(meta);
    row.appendChild(contentWrap);

    elements.chatMessages.appendChild(row);

    // Attach click listeners for any copy code buttons inside this message
    attachCodeCopyListeners(bubble);

    scrollToBottom();
    return row;
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
    text = text.replace(/<\/ul>\s*<ul>/g, '');

    // 8. Markdown Tables
    text = text.replace(/\|(.+)\|/g, (match) => {
      const cells = match.split('|').filter((c, i, arr) => i > 0 && i < arr.length - 1);
      if (cells.every(c => /^[\s\:\-]+$/.test(c))) {
        return '';
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
  async function handleSendMessage(customPrompt = null, isVoicePrompt = false) {
    if (state.isGenerating) return;

    const messageText = customPrompt || (elements.messageInput ? elements.messageInput.value.trim() : '');
    if (!messageText) return;

    // Stop active speech playback if any
    stopSpeech();

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
          model: state.selectedModel,
          persona: state.selectedPersona
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
        const botRow = appendMessageToDOM('assistant', botReply, botMessageObj.timestamp, true);

        // Auto-Speak AI response if Auto-Speak is enabled or prompt was spoken via voice
        if (state.autoSpeak || isVoicePrompt) {
          const speakBtn = botRow ? botRow.querySelector('.message-speak-btn') : null;
          speakTextMessage(botReply, speakBtn);
        }

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
  // AI Response Feedback & Improvement Handlers
  // -------------------------------------------------------------------------
  async function submitResponseFeedback(prompt, responseText, rating, btn) {
    try {
      if (btn) {
        if (rating === 'helpful') {
          btn.classList.add('active-positive');
        } else {
          btn.classList.add('active-negative');
        }
      }
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, response: responseText, rating })
      });
      showToast(rating === 'helpful' ? '👍 Thanks for your positive feedback!' : '👎 Feedback noted. We are optimizing our AI model.');
    } catch (e) {
      console.warn('Feedback submit error:', e);
    }
  }

  function handleRegenerateLastMessage() {
    const session = getCurrentSession();
    if (!session || !session.messages || session.messages.length === 0) return;
    
    // Find the last user prompt in current session
    for (let i = session.messages.length - 1; i >= 0; i--) {
      if (session.messages[i].role === 'user') {
        const lastUserPrompt = session.messages[i].content;
        showToast('🔄 Regenerating AI response with improved creativity...');
        handleSendMessage(lastUserPrompt);
        return;
      }
    }
  }

  // =========================================================================
  // Voice Assistant: Text-to-Speech (TTS Engine)
  // =========================================================================
  function initVoiceAssistantSettings() {
    state.autoSpeak = localStorage.getItem(STORAGE_KEY_AUTO_SPEAK) === 'true';
    state.autoSendVoice = localStorage.getItem(STORAGE_KEY_AUTO_SEND) === 'true';
    state.voiceURI = localStorage.getItem(STORAGE_KEY_VOICE_URI) || '';
    state.voiceRate = parseFloat(localStorage.getItem(STORAGE_KEY_VOICE_RATE)) || 1.0;
    state.voicePitch = parseFloat(localStorage.getItem(STORAGE_KEY_VOICE_PITCH)) || 1.0;

    updateVoiceModeUI();

    if (elements.autoSpeakToggle) elements.autoSpeakToggle.checked = state.autoSpeak;
    if (elements.autoSendVoiceToggle) elements.autoSendVoiceToggle.checked = state.autoSendVoice;
    if (elements.voiceRateSlider) {
      elements.voiceRateSlider.value = state.voiceRate;
      if (elements.voiceRateVal) elements.voiceRateVal.textContent = `${state.voiceRate.toFixed(2)}x`;
    }
    if (elements.voicePitchSlider) {
      elements.voicePitchSlider.value = state.voicePitch;
      if (elements.voicePitchVal) elements.voicePitchVal.textContent = state.voicePitch.toFixed(2);
    }
  }

  function updateVoiceModeUI() {
    if (!elements.voiceAutoSpeakBtn || !elements.voiceModeBadge) return;
    if (state.autoSpeak) {
      elements.voiceAutoSpeakBtn.classList.add('active');
      elements.voiceAutoSpeakBtn.title = 'Voice Assistant Auto-Speak (Active - AI reads answers)';
      elements.voiceModeBadge.textContent = 'Voice: ON';
    } else {
      elements.voiceAutoSpeakBtn.classList.remove('active');
      elements.voiceAutoSpeakBtn.title = 'Voice Assistant Auto-Speak (Off)';
      elements.voiceModeBadge.textContent = 'Voice: Off';
    }
  }

  function toggleVoiceAutoSpeak() {
    state.autoSpeak = !state.autoSpeak;
    localStorage.setItem(STORAGE_KEY_AUTO_SPEAK, state.autoSpeak ? 'true' : 'false');
    if (elements.autoSpeakToggle) elements.autoSpeakToggle.checked = state.autoSpeak;
    updateVoiceModeUI();
    if (state.autoSpeak) {
      showToast('🔊 Voice Assistant Auto-Speak Enabled');
    } else {
      stopSpeech();
      showToast('🔇 Voice Assistant Auto-Speak Disabled');
    }
  }

  function initSpeechSynthesis() {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech Synthesis not supported in this browser.');
      return;
    }

    const loadVoices = () => {
      state.availableVoices = window.speechSynthesis.getVoices();
      populateVoiceDropdown();
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  function populateVoiceDropdown() {
    if (!elements.voiceSelect) return;
    elements.voiceSelect.innerHTML = '';

    if (!state.availableVoices || state.availableVoices.length === 0) {
      const opt = document.createElement('option');
      opt.textContent = 'Default System Voice';
      elements.voiceSelect.appendChild(opt);
      return;
    }

    // Filter English voices first, then others
    const englishVoices = state.availableVoices.filter(v => v.lang.startsWith('en'));
    const otherVoices = state.availableVoices.filter(v => !v.lang.startsWith('en'));
    const sorted = [...englishVoices, ...otherVoices];

    sorted.forEach(voice => {
      const opt = document.createElement('option');
      opt.value = voice.voiceURI;
      opt.textContent = `${voice.name} (${voice.lang})${voice.default ? ' [Default]' : ''}`;
      if (state.voiceURI === voice.voiceURI) {
        opt.selected = true;
      }
      elements.voiceSelect.appendChild(opt);
    });

    // If no URI chosen, select best default
    if (!state.voiceURI && sorted.length > 0) {
      const best = englishVoices.find(v => /natural|google|samantha|jenny|david|george|zira/i.test(v.name)) || sorted[0];
      state.voiceURI = best.voiceURI;
      elements.voiceSelect.value = best.voiceURI;
    }
  }

  function cleanTextForSpeech(rawMarkdown) {
    if (!rawMarkdown) return '';

    let text = rawMarkdown;

    // 1. Replace code blocks with spoken note
    text = text.replace(/```[a-zA-Z0-9_-]*\n([\s\S]*?)```/g, ' [Code block provided in chat response.] ');

    // 2. Remove markdown tables
    text = text.replace(/\|(.+)\|/g, ' ');

    // 3. Remove headers, quotes, formatting
    text = text.replace(/^#{1,6}\s+/gm, '');
    text = text.replace(/^\>\s+/gm, '');
    text = text.replace(/\*\*\*(.*?)\*\*\*/g, '$1');
    text = text.replace(/\*\*(.*?)\*\*/g, '$1');
    text = text.replace(/\*(.*?)\*/g, '$1');
    text = text.replace(/`([^`]+)`/g, '$1');
    text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // Links -> anchor text
    text = text.replace(/^\s*[\-\*•]\s+/gm, ' ');
    text = text.replace(/^\s*\d+\.\s+/gm, ' ');

    // 4. Clean extra spaces
    text = text.replace(/\s+/g, ' ').trim();

    return text;
  }

  function speakTextMessage(rawText, triggerBtn = null) {
    if (!('speechSynthesis' in window)) {
      showToast('Text-to-speech is not supported in this browser.');
      return;
    }

    // Stop current speech
    stopSpeech();

    const spokenText = cleanTextForSpeech(rawText);
    if (!spokenText) return;

    try {
      const utterance = new SpeechSynthesisUtterance(spokenText);
      utterance.rate = state.voiceRate || 1.0;
      utterance.pitch = state.voicePitch || 1.0;

      // Match voice
      if (state.availableVoices && state.availableVoices.length > 0) {
        const selectedVoice = state.availableVoices.find(v => v.voiceURI === state.voiceURI);
        if (selectedVoice) {
          utterance.voice = selectedVoice;
          if (elements.speakingVoiceName) {
            elements.speakingVoiceName.textContent = selectedVoice.name;
          }
        }
      }

      utterance.onstart = () => {
        state.isSpeaking = true;
        state.isPaused = false;
        state.activeSpeakingBtn = triggerBtn;

        if (elements.voiceSpeakingBar) elements.voiceSpeakingBar.style.display = 'flex';
        if (elements.voicePauseText) elements.voicePauseText.textContent = 'Pause';

        if (triggerBtn) {
          triggerBtn.classList.add('speaking');
          triggerBtn.innerHTML = `
            <div class="mini-equalizer">
              <span></span><span></span><span></span>
            </div>
            <span>Stop</span>
          `;
        }
      };

      utterance.onend = () => {
        resetSpeakingUI();
      };

      utterance.onerror = (err) => {
        console.warn('Speech synthesis error:', err);
        resetSpeakingUI();
      };

      window.speechSynthesis.speak(utterance);

    } catch (e) {
      console.error('TTS execution error:', e);
      resetSpeakingUI();
    }
  }

  function toggleSpeakMessage(content, btn) {
    if (state.isSpeaking && state.activeSpeakingBtn === btn) {
      stopSpeech();
    } else {
      speakTextMessage(content, btn);
    }
  }

  function pauseOrResumeSpeech() {
    if (!('speechSynthesis' in window) || !state.isSpeaking) return;

    if (state.isPaused) {
      window.speechSynthesis.resume();
      state.isPaused = false;
      if (elements.voicePauseText) elements.voicePauseText.textContent = 'Pause';
    } else {
      window.speechSynthesis.pause();
      state.isPaused = true;
      if (elements.voicePauseText) elements.voicePauseText.textContent = 'Resume';
    }
  }

  function stopSpeech() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    resetSpeakingUI();
  }

  function resetSpeakingUI() {
    state.isSpeaking = false;
    state.isPaused = false;

    if (elements.voiceSpeakingBar) elements.voiceSpeakingBar.style.display = 'none';

    if (state.activeSpeakingBtn) {
      state.activeSpeakingBtn.classList.remove('speaking');
      state.activeSpeakingBtn.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        </svg>
        <span>Speak</span>
      `;
      state.activeSpeakingBtn = null;
    }
  }

  // =========================================================================
  // Voice Assistant: Speech-to-Text (STT Engine)
  // =========================================================================
  function startVoiceListening() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast('Speech recognition requires Chrome, Edge, Safari, or Opera.');
      return;
    }

    // Cancel active playback so assistant doesn't hear itself
    stopSpeech();

    try {
      // Create fresh instance per listening session to prevent Chromium dead states
      state.recognition = new SpeechRecognition();
      state.recognition.continuous = false;
      state.recognition.interimResults = true;
      state.recognition.lang = 'en-US';

      state.lastVoiceTranscript = '';

      state.recognition.onstart = () => {
        state.isRecording = true;
        if (elements.voiceBtn) elements.voiceBtn.classList.add('recording');
        if (elements.voiceListeningOverlay) elements.voiceListeningOverlay.style.display = 'block';
        if (elements.voiceLiveTranscript) {
          elements.voiceLiveTranscript.textContent = 'Listening... Speak into your microphone';
        }
      };

      state.recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const displayTranscript = (finalTranscript || interimTranscript).trim();
        if (displayTranscript) {
          state.lastVoiceTranscript = displayTranscript;
          if (elements.voiceLiveTranscript) {
            elements.voiceLiveTranscript.textContent = `"${displayTranscript}"`;
          }
          if (elements.messageInput) {
            elements.messageInput.value = displayTranscript;
            autoResizeTextarea();
            updateSendButtonState();
          }
        }
      };

      state.recognition.onerror = (event) => {
        console.warn('Speech Recognition error:', event.error);
        stopVoiceListening();

        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          showToast('⚠️ Microphone access blocked. Please allow mic permission in your browser.');
        } else if (event.error === 'audio-capture') {
          showToast('⚠️ No microphone detected. Please check audio device connection.');
        } else if (event.error === 'network') {
          showToast('⚠️ Speech recognition network timeout. Please check your connection.');
        } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
          showToast(`Microphone notice: ${event.error}`);
        }
      };

      state.recognition.onend = () => {
        const spokenText = state.lastVoiceTranscript.trim();
        stopVoiceListening();

        // If Auto-Send is on and speech was recorded, submit immediately!
        if (state.autoSendVoice && spokenText) {
          handleSendMessage(spokenText, true);
        }
      };

      state.recognition.start();

    } catch (e) {
      console.error('Speech Recognition start failure:', e);
      stopVoiceListening();
      showToast('Could not access microphone.');
    }
  }

  function stopVoiceListening() {
    state.isRecording = false;
    if (state.recognition) {
      try {
        state.recognition.stop();
      } catch (e) {}
      state.recognition = null;
    }
    if (elements.voiceBtn) elements.voiceBtn.classList.remove('recording');
    if (elements.voiceListeningOverlay) elements.voiceListeningOverlay.style.display = 'none';
  }

  function toggleSpeechRecognition() {
    if (state.isRecording) {
      stopVoiceListening();
    } else {
      startVoiceListening();
    }
  }

  function sendLiveVoiceTranscript() {
    const transcript = state.lastVoiceTranscript.trim() || (elements.messageInput ? elements.messageInput.value.trim() : '');
    stopVoiceListening();
    if (transcript) {
      handleSendMessage(transcript, true);
    }
  }

  // =========================================================================
  // Voice Assistant Settings Modal Handlers
  // =========================================================================
  function openVoiceSettingsModal() {
    if (!elements.voiceSettingsModal) return;
    populateVoiceDropdown();
    elements.voiceSettingsModal.style.display = 'flex';
  }

  function closeVoiceSettingsModal() {
    if (!elements.voiceSettingsModal) return;
    elements.voiceSettingsModal.style.display = 'none';
  }

  function saveVoiceSettings() {
    if (elements.voiceSelect) {
      state.voiceURI = elements.voiceSelect.value;
      localStorage.setItem(STORAGE_KEY_VOICE_URI, state.voiceURI);
    }
    if (elements.voiceRateSlider) {
      state.voiceRate = parseFloat(elements.voiceRateSlider.value);
      localStorage.setItem(STORAGE_KEY_VOICE_RATE, state.voiceRate.toString());
    }
    if (elements.voicePitchSlider) {
      state.voicePitch = parseFloat(elements.voicePitchSlider.value);
      localStorage.setItem(STORAGE_KEY_VOICE_PITCH, state.voicePitch.toString());
    }
    if (elements.autoSpeakToggle) {
      state.autoSpeak = elements.autoSpeakToggle.checked;
      localStorage.setItem(STORAGE_KEY_AUTO_SPEAK, state.autoSpeak ? 'true' : 'false');
      updateVoiceModeUI();
    }
    if (elements.autoSendVoiceToggle) {
      state.autoSendVoice = elements.autoSendVoiceToggle.checked;
      localStorage.setItem(STORAGE_KEY_AUTO_SEND, state.autoSendVoice ? 'true' : 'false');
    }

    closeVoiceSettingsModal();
    showToast('Voice Assistant settings saved.');
  }

  function testVoicePlayback() {
    const testText = "Hello! I am SmartChat AI, your voice assistant. How can I help you today?";
    speakTextMessage(testText, null);
  }

  // =========================================================================
  // User Authentication & Account Management
  // =========================================================================
  async function checkCurrentUser() {
    try {
      const resp = await fetch('/api/auth/me');
      if (resp.ok) {
        const data = await resp.json();
        if (data.authenticated && data.user) {
          state.currentUser = data.user;
          renderUserProfile();
          // Sync cloud history on login
          syncHistoryFromServer();
        } else {
          state.currentUser = null;
          renderUserProfile();
        }
      }
    } catch (e) {
      console.warn('Could not check current user authentication status:', e);
    }
  }

  function renderUserProfile() {
    if (state.currentUser) {
      if (elements.openAuthModalBtn) elements.openAuthModalBtn.style.display = 'none';
      if (elements.userProfileMenuWrap) elements.userProfileMenuWrap.style.display = 'inline-block';

      if (elements.userAvatarImg) elements.userAvatarImg.src = state.currentUser.avatar_url;
      if (elements.userDisplayName) {
        const firstName = state.currentUser.name ? state.currentUser.name.split(' ')[0] : 'User';
        elements.userDisplayName.textContent = firstName;
      }
      if (elements.sidebarAuthLabel) {
        const firstName = state.currentUser.name ? state.currentUser.name.split(' ')[0] : 'Account';
        elements.sidebarAuthLabel.textContent = `👤 ${firstName} (Account)`;
      }
      if (elements.dropdownUserName) elements.dropdownUserName.textContent = state.currentUser.name;
      if (elements.dropdownUserEmail) elements.dropdownUserEmail.textContent = state.currentUser.email;
      if (elements.dropdownProviderBadge) {
        elements.dropdownProviderBadge.textContent = state.currentUser.provider === 'google' ? 'Google Account' : 'Email Account';
      }
    } else {
      if (elements.openAuthModalBtn) elements.openAuthModalBtn.style.display = 'inline-flex';
      if (elements.userProfileMenuWrap) elements.userProfileMenuWrap.style.display = 'none';
      if (elements.userDropdownMenu) elements.userDropdownMenu.style.display = 'none';
      if (elements.sidebarAuthLabel) elements.sidebarAuthLabel.textContent = '👤 Sign In / Register';
    }
  }

  function openAuthModal(tab = 'login') {
    hideAuthAlert();
    switchAuthTab(tab);
    if (elements.authModal) elements.authModal.style.display = 'flex';
  }

  function closeAuthModal() {
    if (elements.authModal) elements.authModal.style.display = 'none';
    hideAuthAlert();
  }

  function switchAuthTab(tab) {
    state.activeAuthTab = tab;
    hideAuthAlert();

    if (elements.authTabLogin) {
      elements.authTabLogin.classList.toggle('active', tab === 'login');
    }
    if (elements.authTabRegister) {
      elements.authTabRegister.classList.toggle('active', tab === 'register');
    }

    if (elements.loginForm) {
      elements.loginForm.style.display = tab === 'login' ? 'flex' : 'none';
    }
    if (elements.registerForm) {
      elements.registerForm.style.display = tab === 'register' ? 'flex' : 'none';
    }

    if (elements.authModalTitle) {
      elements.authModalTitle.textContent = tab === 'login' ? 'Sign In to SmartChat AI' : 'Create Free Account';
    }
  }

  function showAuthAlert(message, type = 'error') {
    if (!elements.authAlert) return;
    elements.authAlert.className = `auth-alert ${type}`;
    elements.authAlert.textContent = message;
    elements.authAlert.style.display = 'block';
  }

  function hideAuthAlert() {
    if (elements.authAlert) {
      elements.authAlert.style.display = 'none';
      elements.authAlert.textContent = '';
    }
  }

  async function handleLoginSubmit(e) {
    e.preventDefault();
    hideAuthAlert();

    const email = elements.loginEmail ? elements.loginEmail.value.trim() : '';
    const password = elements.loginPassword ? elements.loginPassword.value.trim() : '';

    if (!email || !password) {
      showAuthAlert('Please enter both email and password.');
      return;
    }

    if (elements.loginSubmitBtn) {
      elements.loginSubmitBtn.disabled = true;
      elements.loginSubmitBtn.innerHTML = '<span>Signing In...</span>';
    }

    try {
      const resp = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await resp.json();

      if (resp.ok && data.status === 'success') {
        state.currentUser = data.user;
        renderUserProfile();
        closeAuthModal();
        showToast(data.message || 'Signed in successfully!');
        if (elements.loginForm) elements.loginForm.reset();
        // Sync cloud chat sessions
        syncHistoryFromServer();
      } else {
        showAuthAlert(data.error || 'Invalid credentials. Please try again.');
      }
    } catch (err) {
      console.error('Login error:', err);
      showAuthAlert('Network error during login. Please try again.');
    } finally {
      if (elements.loginSubmitBtn) {
        elements.loginSubmitBtn.disabled = false;
        elements.loginSubmitBtn.innerHTML = '<span>Sign In</span>';
      }
    }
  }

  async function handleRegisterSubmit(e) {
    e.preventDefault();
    hideAuthAlert();

    const name = elements.registerName ? elements.registerName.value.trim() : '';
    const email = elements.registerEmail ? elements.registerEmail.value.trim() : '';
    const password = elements.registerPassword ? elements.registerPassword.value.trim() : '';
    const passwordConfirm = elements.registerPasswordConfirm ? elements.registerPasswordConfirm.value.trim() : '';

    if (!name || !email || !password) {
      showAuthAlert('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      showAuthAlert('Password must be at least 6 characters.');
      return;
    }

    if (password !== passwordConfirm) {
      showAuthAlert('Passwords do not match. Please verify.');
      return;
    }

    if (elements.registerSubmitBtn) {
      elements.registerSubmitBtn.disabled = true;
      elements.registerSubmitBtn.innerHTML = '<span>Creating Account...</span>';
    }

    try {
      const resp = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const data = await resp.json();

      if (resp.ok && data.status === 'success') {
        state.currentUser = data.user;
        renderUserProfile();
        closeAuthModal();
        showToast('Account created! Welcome to SmartChat AI.');
        if (elements.registerForm) elements.registerForm.reset();
        // Upload any initial sessions to cloud
        syncHistoryWithServer();
      } else {
        showAuthAlert(data.error || 'Failed to create account. Please try again.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      showAuthAlert('Network error during registration. Please try again.');
    } finally {
      if (elements.registerSubmitBtn) {
        elements.registerSubmitBtn.disabled = false;
        elements.registerSubmitBtn.innerHTML = '<span>Create Free Account</span>';
      }
    }
  }

  // =========================================================================
  // Forgot Password Management
  // =========================================================================
  function openForgotPasswordModal() {
    closeAuthModal();
    hideForgotAlert();
    if (elements.forgotStep1Form) elements.forgotStep1Form.style.display = 'flex';
    if (elements.forgotStep2Form) elements.forgotStep2Form.style.display = 'none';
    if (elements.forgotEmail && elements.loginEmail && elements.loginEmail.value) {
      elements.forgotEmail.value = elements.loginEmail.value;
    }
    if (elements.forgotPasswordModal) elements.forgotPasswordModal.style.display = 'flex';
  }

  function closeForgotPasswordModal() {
    if (elements.forgotPasswordModal) elements.forgotPasswordModal.style.display = 'none';
    hideForgotAlert();
  }

  function showForgotAlert(message, type = 'error') {
    if (!elements.forgotAlert) return;
    elements.forgotAlert.className = `auth-alert ${type}`;
    elements.forgotAlert.textContent = message;
    elements.forgotAlert.style.display = 'block';
  }

  function hideForgotAlert() {
    if (elements.forgotAlert) {
      elements.forgotAlert.style.display = 'none';
      elements.forgotAlert.textContent = '';
    }
  }

  async function handleForgotStep1(e) {
    e.preventDefault();
    hideForgotAlert();

    const email = elements.forgotEmail ? elements.forgotEmail.value.trim() : '';
    if (!email) {
      showForgotAlert('Please enter your email address.');
      return;
    }

    state.pendingForgotEmail = email;

    if (elements.sendResetCodeBtn) {
      elements.sendResetCodeBtn.disabled = true;
      elements.sendResetCodeBtn.innerHTML = '<span>Generating Code...</span>';
    }

    try {
      const resp = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await resp.json();

      if (resp.ok && data.status === 'success') {
        const code = data.reset_code;
        showToast(`🔑 Verification Code: ${code}`);
        
        // Switch to Step 2
        if (elements.forgotStep1Form) elements.forgotStep1Form.style.display = 'none';
        if (elements.forgotStep2Form) elements.forgotStep2Form.style.display = 'flex';
        
        // Auto-fill code in demo for quick convenience
        if (elements.resetCodeInput && code) {
          elements.resetCodeInput.value = code;
        }

        showForgotAlert(`Verification code sent! (Code: ${code}). Enter your new password below.`, 'success');
      } else {
        showForgotAlert(data.error || 'No account found with this email address.');
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      showForgotAlert('Network error. Please try again.');
    } finally {
      if (elements.sendResetCodeBtn) {
        elements.sendResetCodeBtn.disabled = false;
        elements.sendResetCodeBtn.innerHTML = '<span>Send Reset Code</span>';
      }
    }
  }

  async function handleForgotStep2(e) {
    e.preventDefault();
    hideForgotAlert();

    const email = state.pendingForgotEmail || (elements.forgotEmail ? elements.forgotEmail.value.trim() : '');
    const code = elements.resetCodeInput ? elements.resetCodeInput.value.trim() : '';
    const newPassword = elements.resetNewPassword ? elements.resetNewPassword.value.trim() : '';
    const newPasswordConfirm = elements.resetNewPasswordConfirm ? elements.resetNewPasswordConfirm.value.trim() : '';

    if (!code || !newPassword) {
      showForgotAlert('Please enter the 6-digit code and your new password.');
      return;
    }

    if (newPassword.length < 6) {
      showForgotAlert('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== newPasswordConfirm) {
      showForgotAlert('Passwords do not match. Please verify.');
      return;
    }

    if (elements.submitResetPasswordBtn) {
      elements.submitResetPasswordBtn.disabled = true;
      elements.submitResetPasswordBtn.innerHTML = '<span>Resetting Password...</span>';
    }

    try {
      const resp = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, new_password: newPassword })
      });

      const data = await resp.json();

      if (resp.ok && data.status === 'success') {
        showToast('Password reset successfully! Please sign in.');
        closeForgotPasswordModal();
        openAuthModal('login');
        if (elements.loginEmail) elements.loginEmail.value = email;
        if (elements.loginPassword) elements.loginPassword.value = '';
        showAuthAlert('Password reset successful! Enter your new password to sign in.', 'success');
      } else {
        showForgotAlert(data.error || 'Failed to reset password. Check verification code.');
      }
    } catch (err) {
      console.error('Reset password error:', err);
      showForgotAlert('Network error during password reset.');
    } finally {
      if (elements.submitResetPasswordBtn) {
        elements.submitResetPasswordBtn.disabled = false;
        elements.submitResetPasswordBtn.innerHTML = '<span>Reset Password & Sign In</span>';
      }
    }
  }

  // =========================================================================
  // Google Sign-In Prompt Handlers
  // =========================================================================
  function openGooglePromptModal() {
    if (elements.googlePromptModal) elements.googlePromptModal.style.display = 'flex';
  }

  function closeGooglePromptModal() {
    if (elements.googlePromptModal) elements.googlePromptModal.style.display = 'none';
  }

  async function handleGoogleSignIn(email, name = 'Google User') {
    closeGooglePromptModal();
    closeAuthModal();

    try {
      const resp = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          name: name,
          avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${name}&backgroundColor=4285F4`
        })
      });

      const data = await resp.json();

      if (resp.ok && data.status === 'success') {
        state.currentUser = data.user;
        renderUserProfile();
        showToast(`Signed in with Google as ${data.user.name}`);
        syncHistoryFromServer();
      } else {
        showToast(data.error || 'Google sign-in failed.');
      }
    } catch (err) {
      console.error('Google auth error:', err);
      showToast('Network error during Google sign-in.');
    }
  }

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      state.currentUser = null;
      renderUserProfile();
      showToast('Logged out successfully.');
    } catch (e) {
      console.warn('Logout error:', e);
      state.currentUser = null;
      renderUserProfile();
    }
  }

  async function syncHistoryWithServer() {
    if (!state.currentUser) return;
    try {
      await fetch('/api/auth/sync-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessions: state.sessions })
      });
      showToast('Chat history synced with cloud.');
    } catch (e) {
      console.warn('Could not sync history:', e);
    }
  }

  async function syncHistoryFromServer() {
    if (!state.currentUser) return;
    try {
      const resp = await fetch('/api/auth/sync-history');
      if (resp.ok) {
        const data = await resp.json();
        if (data.sessions && data.sessions.length > 0) {
          // Merge or load cloud sessions
          state.sessions = data.sessions;
          saveSessionsToStorage();
          renderHistorySidebar();
          renderCurrentSession();
        }
      }
    } catch (e) {
      console.warn('Could not fetch cloud history:', e);
    }
  }

  function initPasswordToggles() {
    const toggleBtns = document.querySelectorAll('.btn-toggle-pwd');
    toggleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const input = document.getElementById(targetId);
        if (input) {
          if (input.type === 'password') {
            input.type = 'text';
            btn.textContent = '🔒';
          } else {
            input.type = 'password';
            btn.textContent = '👁️';
          }
        }
      });
    });
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
    }, 3200);
  }

  // -------------------------------------------------------------------------
  // Responsive Drawer Helpers
  // -------------------------------------------------------------------------
  function openSidebarOnMobile() {
    if (elements.sidebar) {
      elements.sidebar.classList.add('open');
      elements.sidebar.classList.remove('collapsed');
    }
    if (elements.sidebarBackdrop) {
      elements.sidebarBackdrop.classList.add('active');
    }
  }

  function closeSidebarOnMobile() {
    if (elements.sidebar) {
      elements.sidebar.classList.remove('open');
    }
    if (elements.sidebarBackdrop) {
      elements.sidebarBackdrop.classList.remove('active');
    }
  }

  // -------------------------------------------------------------------------
  // Event Listeners
  // -------------------------------------------------------------------------
  function setupEventListeners() {
    // Password show/hide eye toggles
    initPasswordToggles();

    // User Authentication Event Listeners
    if (elements.openAuthModalBtn) {
      elements.openAuthModalBtn.addEventListener('click', () => openAuthModal('login'));
    }
    if (elements.closeAuthModalBtn) {
      elements.closeAuthModalBtn.addEventListener('click', closeAuthModal);
    }
    if (elements.authTabLogin) {
      elements.authTabLogin.addEventListener('click', () => switchAuthTab('login'));
    }
    if (elements.authTabRegister) {
      elements.authTabRegister.addEventListener('click', () => switchAuthTab('register'));
    }
    if (elements.loginForm) {
      elements.loginForm.addEventListener('submit', handleLoginSubmit);
    }
    if (elements.registerForm) {
      elements.registerForm.addEventListener('submit', handleRegisterSubmit);
    }
    if (elements.openForgotFromLoginBtn) {
      elements.openForgotFromLoginBtn.addEventListener('click', openForgotPasswordModal);
    }

    // Google Sign-In Buttons
    if (elements.googleAuthBtn) {
      elements.googleAuthBtn.addEventListener('click', openGooglePromptModal);
    }
    if (elements.closeGooglePromptBtn) {
      elements.closeGooglePromptBtn.addEventListener('click', closeGooglePromptModal);
    }
    if (elements.googleDemoAccount1) {
      elements.googleDemoAccount1.addEventListener('click', () => {
        handleGoogleSignIn('google.student@smartchat.ai', 'Google Student');
      });
    }
    if (elements.googleCustomSubmitBtn && elements.googleCustomEmail) {
      elements.googleCustomSubmitBtn.addEventListener('click', () => {
        const email = elements.googleCustomEmail.value.trim();
        if (email && email.includes('@')) {
          const name = email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase());
          handleGoogleSignIn(email, name);
        } else {
          showToast('Please enter a valid Google email address.');
        }
      });
    }

    // Forgot Password Event Listeners
    if (elements.closeForgotModalBtn) {
      elements.closeForgotModalBtn.addEventListener('click', closeForgotPasswordModal);
    }
    if (elements.backToLoginFromForgotBtn) {
      elements.backToLoginFromForgotBtn.addEventListener('click', () => {
        closeForgotPasswordModal();
        openAuthModal('login');
      });
    }
    if (elements.forgotStep1Form) {
      elements.forgotStep1Form.addEventListener('submit', handleForgotStep1);
    }
    if (elements.forgotStep2Form) {
      elements.forgotStep2Form.addEventListener('submit', handleForgotStep2);
    }

    // User Profile Dropdown Toggle
    if (elements.userAvatarBtn && elements.userDropdownMenu) {
      elements.userAvatarBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isVisible = elements.userDropdownMenu.style.display === 'block';
        elements.userDropdownMenu.style.display = isVisible ? 'none' : 'block';
      });
    }
    if (elements.syncHistoryBtn) {
      elements.syncHistoryBtn.addEventListener('click', () => {
        if (elements.userDropdownMenu) elements.userDropdownMenu.style.display = 'none';
        syncHistoryWithServer();
      });
    }
    if (elements.logoutBtn) {
      elements.logoutBtn.addEventListener('click', () => {
        if (elements.userDropdownMenu) elements.userDropdownMenu.style.display = 'none';
        handleLogout();
      });
    }

    // Close Dropdown Menu when clicking anywhere outside
    document.addEventListener('click', (e) => {
      if (elements.userDropdownMenu && !e.target.closest('.user-profile-menu-wrap')) {
        elements.userDropdownMenu.style.display = 'none';
      }
    });

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

    // Voice Assistant Header Controls
    if (elements.voiceAutoSpeakBtn) {
      elements.voiceAutoSpeakBtn.addEventListener('click', toggleVoiceAutoSpeak);
    }
    if (elements.voiceSettingsBtn) {
      elements.voiceSettingsBtn.addEventListener('click', openVoiceSettingsModal);
    }
    if (elements.closeVoiceSettingsBtn) {
      elements.closeVoiceSettingsBtn.addEventListener('click', closeVoiceSettingsModal);
    }
    if (elements.saveVoiceSettingsBtn) {
      elements.saveVoiceSettingsBtn.addEventListener('click', saveVoiceSettings);
    }
    if (elements.testVoiceBtn) {
      elements.testVoiceBtn.addEventListener('click', testVoicePlayback);
    }

    // Voice Settings Sliders live indicators
    if (elements.voiceRateSlider && elements.voiceRateVal) {
      elements.voiceRateSlider.addEventListener('input', (e) => {
        elements.voiceRateVal.textContent = `${parseFloat(e.target.value).toFixed(2)}x`;
      });
    }
    if (elements.voicePitchSlider && elements.voicePitchVal) {
      elements.voicePitchSlider.addEventListener('input', (e) => {
        elements.voicePitchVal.textContent = parseFloat(e.target.value).toFixed(2);
      });
    }

    // Voice Speaking Bar controls
    if (elements.voicePauseResumeBtn) {
      elements.voicePauseResumeBtn.addEventListener('click', pauseOrResumeSpeech);
    }
    if (elements.voiceStopSpeechBtn) {
      elements.voiceStopSpeechBtn.addEventListener('click', stopSpeech);
    }

    // Voice Listening HUD controls
    if (elements.voiceCancelListenBtn) {
      elements.voiceCancelListenBtn.addEventListener('click', stopVoiceListening);
    }
    if (elements.voiceSendLiveBtn) {
      elements.voiceSendLiveBtn.addEventListener('click', sendLiveVoiceTranscript);
    }

    // Sidebar Toggle (Mobile Drawer & Desktop Collapse)
    if (elements.openSidebarBtn) {
      elements.openSidebarBtn.addEventListener('click', toggleSidebar);
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

    // Voice Recognition Mic Button
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

    // Persona Selector Change
    if (elements.personaSelector) {
      elements.personaSelector.addEventListener('change', handlePersonaChange);
    }

    // Theme Picker Modal Listeners
    if (elements.themePickerBtn) {
      elements.themePickerBtn.addEventListener('click', openThemePickerModal);
    }
    if (elements.closeThemePickerBtn) {
      elements.closeThemePickerBtn.addEventListener('click', closeThemePickerModal);
    }
    if (elements.applyThemeBtn) {
      elements.applyThemeBtn.addEventListener('click', closeThemePickerModal);
    }
    if (elements.themePickerModal) {
      elements.themePickerModal.addEventListener('click', (e) => {
        if (e.target === elements.themePickerModal) {
          closeThemePickerModal();
        }
      });
    }
    if (elements.themeGrid) {
      elements.themeGrid.addEventListener('click', (e) => {
        const item = e.target.closest('.theme-card-item');
        if (item) {
          const themeVal = item.getAttribute('data-theme-val');
          if (themeVal) {
            applyTheme(themeVal);
            showToast(`Applied Theme: ${item.querySelector('.theme-card-label').textContent}`);
          }
        }
      });
    }

    // Header Nav Links Handlers
    if (elements.navHomeBtn) {
      elements.navHomeBtn.addEventListener('click', () => {
        elements.headerNavLinks.querySelectorAll('.nav-link-btn').forEach(btn => btn.classList.remove('active'));
        elements.navHomeBtn.classList.add('active');
        if (state.sessions.length > 0 && elements.welcomeScreen) {
          elements.welcomeScreen.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }

    if (elements.navNewChatBtn) {
      elements.navNewChatBtn.addEventListener('click', () => {
        handleNewChat();
        showToast('Created a new chat session!');
      });
    }

    if (elements.navHistoryBtn) {
      elements.navHistoryBtn.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          openSidebarOnMobile();
        } else {
          if (elements.sidebar) {
            elements.sidebar.classList.remove('collapsed');
          }
        }
        if (elements.historyList) {
          elements.historyList.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }

    if (elements.navAboutBtn) {
      elements.navAboutBtn.addEventListener('click', openAboutModal);
    }

    if (elements.navSettingsBtn) {
      elements.navSettingsBtn.addEventListener('click', openSettingsModal);
    }

    // Hero Start Chatting CTA Button
    if (elements.startChattingHeroBtn) {
      elements.startChattingHeroBtn.addEventListener('click', handleStartChattingHero);
    }

    // About Modal Listeners
    if (elements.closeAboutModalBtn) {
      elements.closeAboutModalBtn.addEventListener('click', closeAboutModal);
    }
    if (elements.closeAboutModalActionBtn) {
      elements.closeAboutModalActionBtn.addEventListener('click', closeAboutModal);
    }
    if (elements.aboutModal) {
      elements.aboutModal.addEventListener('click', (e) => {
        if (e.target === elements.aboutModal) {
          closeAboutModal();
        }
      });
    }

    // Settings Modal Listeners
    if (elements.closeSettingsModalBtn) {
      elements.closeSettingsModalBtn.addEventListener('click', closeSettingsModal);
    }
    if (elements.saveSettingsCloseBtn) {
      elements.saveSettingsCloseBtn.addEventListener('click', closeSettingsModal);
    }
    if (elements.settingsModal) {
      elements.settingsModal.addEventListener('click', (e) => {
        if (e.target === elements.settingsModal) {
          closeSettingsModal();
        }
      });
    }
    if (elements.settingsThemeToggleBtn) {
      elements.settingsThemeToggleBtn.addEventListener('click', toggleTheme);
    }
    if (elements.settingsOpenThemePickerBtn) {
      elements.settingsOpenThemePickerBtn.addEventListener('click', () => {
        closeSettingsModal();
        openThemePickerModal();
      });
    }
    if (elements.settingsPersonaSelect) {
      elements.settingsPersonaSelect.addEventListener('change', (e) => {
        if (elements.personaSelector) {
          elements.personaSelector.value = e.target.value;
          handlePersonaChange();
        }
      });
    }
    if (elements.settingsVoiceConfigBtn) {
      elements.settingsVoiceConfigBtn.addEventListener('click', () => {
        closeSettingsModal();
        openVoiceSettingsModal();
      });
    }
    if (elements.settingsClearChatBtn) {
      elements.settingsClearChatBtn.addEventListener('click', () => {
        closeSettingsModal();
        handleClearCurrentChat();
      });
    }
    if (elements.settingsClearAllHistoryBtn) {
      elements.settingsClearAllHistoryBtn.addEventListener('click', () => {
        closeSettingsModal();
        handleClearAllHistory();
      });
    }
    if (elements.settingsOpenAboutBtn) {
      elements.settingsOpenAboutBtn.addEventListener('click', () => {
        closeSettingsModal();
        openAboutModal();
      });
    }

    // Sidebar Footer Action Listeners
    if (elements.sidebarSettingsBtn) {
      elements.sidebarSettingsBtn.addEventListener('click', () => {
        closeSidebarOnMobile();
        openSettingsModal();
      });
    }

    if (elements.sidebarThemeToggleBtn) {
      elements.sidebarThemeToggleBtn.addEventListener('click', toggleTheme);
    }

    if (elements.sidebarAuthBtn) {
      elements.sidebarAuthBtn.addEventListener('click', () => {
        closeSidebarOnMobile();
        if (state.currentUser) {
          if (elements.userDropdownMenu) {
            elements.userDropdownMenu.style.display = elements.userDropdownMenu.style.display === 'block' ? 'none' : 'block';
          }
        } else {
          openAuthModal();
        }
      });
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

    if (elements.voiceSettingsModal) {
      elements.voiceSettingsModal.addEventListener('click', (e) => {
        if (e.target === elements.voiceSettingsModal) {
          closeVoiceSettingsModal();
        }
      });
    }

    if (elements.authModal) {
      elements.authModal.addEventListener('click', (e) => {
        if (e.target === elements.authModal) {
          closeAuthModal();
        }
      });
    }

    if (elements.forgotPasswordModal) {
      elements.forgotPasswordModal.addEventListener('click', (e) => {
        if (e.target === elements.forgotPasswordModal) {
          closeForgotPasswordModal();
        }
      });
    }

    if (elements.googlePromptModal) {
      elements.googlePromptModal.addEventListener('click', (e) => {
        if (e.target === elements.googlePromptModal) {
          closeGooglePromptModal();
        }
      });
    }

    // Escape key closes modals / mobile sidebar / stops speech
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        hideConfirmModal();
        closeModelDiagnostics();
        closeVoiceSettingsModal();
        closeThemePickerModal();
        closeAboutModal();
        closeSettingsModal();
        closeAuthModal();
        closeForgotPasswordModal();
        closeGooglePromptModal();
        closeSidebarOnMobile();
        if (state.isRecording) stopVoiceListening();
        if (state.isSpeaking) stopSpeech();
      }
    });
  }

  // -------------------------------------------------------------------------
  // Helper Modal Functions for About & Settings
  // -------------------------------------------------------------------------
  function openAboutModal() {
    if (elements.aboutModal) {
      elements.aboutModal.style.display = 'flex';
    }
  }

  function closeAboutModal() {
    if (elements.aboutModal) {
      elements.aboutModal.style.display = 'none';
    }
  }

  function openSettingsModal() {
    if (elements.settingsModal) {
      if (elements.settingsPersonaSelect) {
        elements.settingsPersonaSelect.value = state.selectedPersona || 'standard';
      }
      elements.settingsModal.style.display = 'flex';
    }
  }

  function closeSettingsModal() {
    if (elements.settingsModal) {
      elements.settingsModal.style.display = 'none';
    }
  }

  function handleStartChattingHero() {
    if (elements.messageInput) {
      elements.messageInput.focus();
      elements.messageInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      showToast('Type a prompt or tap a suggestion card below!');
    }
  }

  // -------------------------------------------------------------------------
  // Sidebar Open / Close / Toggle Functions
  // -------------------------------------------------------------------------
  function openSidebarOnMobile() {
    if (elements.sidebar) {
      elements.sidebar.classList.add('open');
      elements.sidebar.classList.remove('collapsed');
    }
    if (elements.sidebarBackdrop) {
      elements.sidebarBackdrop.classList.add('active');
    }
  }

  function closeSidebarOnMobile() {
    if (elements.sidebar) {
      elements.sidebar.classList.remove('open');
    }
    if (elements.sidebarBackdrop) {
      elements.sidebarBackdrop.classList.remove('active');
    }
  }

  function toggleSidebar() {
    if (window.innerWidth <= 768) {
      if (elements.sidebar && elements.sidebar.classList.contains('open')) {
        closeSidebarOnMobile();
      } else {
        openSidebarOnMobile();
      }
    } else {
      if (elements.sidebar) {
        elements.sidebar.classList.toggle('collapsed');
      }
    }
  }

  // Handle window resizing cleanly
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      closeSidebarOnMobile();
    }
  });

  // Run initial setup when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();


