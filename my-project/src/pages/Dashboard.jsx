import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Dashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const chatEndRef = useRef(null);
    const hasProcessedInitial = useRef(false);
    const fileInputRef = useRef(null);
    const [message, setMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [attachedFile, setAttachedFile] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // Get logged-in user email
    const userEmail = localStorage.getItem('user_email') || 'User';
    const userInitial = userEmail.charAt(0).toUpperCase();

    // Chat history management — stored per user
    const storageKey = `chat_sessions_${userEmail}`;
    const [chatSessions, setChatSessions] = useState(() => {
        const saved = localStorage.getItem(storageKey);
        return saved ? JSON.parse(saved) : [];
    });
    const [activeSessionId, setActiveSessionId] = useState(null);
    const [chatHistory, setChatHistory] = useState([
        { role: 'assistant', text: 'Hello! I\'m your AI assistant. How can I help you today?' }
    ]);

    // Load chat history from backend on mount / user change
    useEffect(() => {
        const saved = localStorage.getItem(storageKey);
        setChatSessions(saved ? JSON.parse(saved) : []);
        setActiveSessionId(null);

        // Fetch chat history from backend
        const loadHistory = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_BASE}/chat/history?user_email=${encodeURIComponent(userEmail)}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.length > 0) {
                        setChatHistory(data.map(msg => ({ role: msg.role, text: msg.message })));
                    } else {
                        setChatHistory([
                            { role: 'assistant', text: 'Hello! I\'m your AI assistant. How can I help you today?' }
                        ]);
                    }
                }
            } catch (err) {
                setChatHistory([
                    { role: 'assistant', text: 'Hello! I\'m your AI assistant. How can I help you today?' }
                ]);
            }
        };
        loadHistory();
    }, [storageKey]);

    // Save sessions to localStorage under the user-specific key
    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(chatSessions));
    }, [chatSessions, storageKey]);

    // Smart local AI response generator
    const getLocalResponse = (msg) => {
        const lower = msg.toLowerCase();
        if (lower.match(/\b(hello|hi|hey|greetings)\b/)) return 'Hello! 👋 How can I help you today? Feel free to ask me anything!';
        if (lower.match(/\b(how are you|how's it going)\b/)) return 'I\'m doing great, thanks for asking! 😊 How can I assist you today?';
        if (lower.match(/\b(your name|who are you)\b/)) return 'I\'m ChatGPT, an AI assistant created to help you with various tasks like answering questions, writing, coding, and more!';
        if (lower.match(/\b(thank|thanks)\b/)) return 'You\'re welcome! 😊 Let me know if you need anything else.';
        if (lower.match(/\b(bye|goodbye|see you)\b/)) return 'Goodbye! Have a wonderful day! 👋';
        if (lower.match(/\b(help)\b/)) return 'I can help you with many things! Here are some ideas:\n\n• Ask me general knowledge questions\n• Get coding help\n• Write or summarize text\n• Brainstorm ideas\n• Learn about any topic\n\nJust type your question!';
        if (lower.match(/\b(weather)\b/)) return '🌤️ I don\'t have real-time weather data, but you can check weather.com or your phone\'s weather app for the latest forecast!';
        if (lower.match(/\b(time|date)\b/)) return `🕐 The current time is **${new Date().toLocaleTimeString()}** and today's date is **${new Date().toLocaleDateString()}**.`;
        if (lower.match(/\b(joke|funny)\b/)) return '😄 Here\'s one: Why do programmers prefer dark mode? Because light attracts bugs! 🐛';
        if (lower.match(/\b(python|javascript|java|code|programming|coding)\b/)) return '💻 I\'d love to help with coding! Please share:\n\n• The programming language you\'re using\n• What you\'re trying to build\n• Any error messages you\'re seeing\n\nI\'ll do my best to help!';
        if (lower.match(/\b(math|calculate|equation)\b/)) return '🔢 I can help with math! Please share the equation or problem, and I\'ll walk you through the solution.';
        if (lower.match(/\b(write|essay|story|email)\b/)) return '✍️ I\'d be happy to help you write! Please tell me:\n\n• What type of content (email, essay, story, etc.)\n• The topic or subject\n• The tone you want (formal, casual, etc.)\n• Any specific details to include';
        if (lower.match(/\b(explain|what is|what are|define)\b/)) return `Great question! 🧠\n\n"${msg}" — that's an interesting topic! I'd be happy to discuss it further. Could you be more specific about what aspect you'd like to know about? That way I can give you the best answer!`;
        if (lower.length < 5) return 'Could you tell me a bit more? I\'d love to help but need a bit more detail! 😊';
        return `Thanks for your message! 🤖\n\nYou asked: "${msg}"\n\nThat's a thoughtful question! I'm here to help. Try being more specific or ask me things like:\n\n• General knowledge questions\n• Coding help\n• Writing assistance\n• Math problems\n• Fun stuff like jokes\n\nI'm ready to assist! 😊`;
    };

    // Handle initial message from Home page
    useEffect(() => {
        if (location.state?.initialMessage && !hasProcessedInitial.current) {
            hasProcessedInitial.current = true;
            const msg = location.state.initialMessage;
            setChatHistory(prev => [...prev, { role: 'user', text: msg }]);
            setIsTyping(true);
            setTimeout(() => {
                setChatHistory(prev => [...prev, { role: 'assistant', text: getLocalResponse(msg) }]);
                setIsTyping(false);
            }, 1500);
        }
    }, []);

    // Auto-scroll to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory, isTyping]);

    // Save current chat when messages change
    useEffect(() => {
        if (activeSessionId && chatHistory.length > 1) {
            setChatSessions(prev => prev.map(s =>
                s.id === activeSessionId ? { ...s, messages: chatHistory, lastMessage: chatHistory[chatHistory.length - 1].text.slice(0, 50) } : s
            ));
        }
    }, [chatHistory]);

    // Start a new chat
    const handleNewChat = async () => {
        // Save current chat if it has messages
        if (chatHistory.length > 1 && !activeSessionId) {
            const newSession = {
                id: Date.now().toString(),
                title: chatHistory.find(m => m.role === 'user')?.text.slice(0, 30) || 'New Chat',
                messages: chatHistory,
                lastMessage: chatHistory[chatHistory.length - 1].text.slice(0, 50),
                timestamp: new Date().toLocaleString()
            };
            setChatSessions(prev => [newSession, ...prev]);
        }
        // Clear chat history in backend
        try {
            await fetch(`${import.meta.env.VITE_API_BASE}/chat/history?user_email=${encodeURIComponent(userEmail)}`, { method: 'DELETE' });
        } catch (err) { /* ignore */ }
        setActiveSessionId(null);
        setChatHistory([
            { role: 'assistant', text: 'Hello! I\'m your AI assistant. How can I help you today?' }
        ]);
    };

    // Load a saved chat
    const handleLoadChat = (session) => {
        // Save current chat first if needed
        if (chatHistory.length > 1 && !activeSessionId) {
            const newSession = {
                id: Date.now().toString(),
                title: chatHistory.find(m => m.role === 'user')?.text.slice(0, 30) || 'New Chat',
                messages: chatHistory,
                lastMessage: chatHistory[chatHistory.length - 1].text.slice(0, 50),
                timestamp: new Date().toLocaleString()
            };
            setChatSessions(prev => [newSession, ...prev]);
        }
        setActiveSessionId(session.id);
        setChatHistory(session.messages);
    };

    // Delete a chat session
    const handleDeleteChat = (e, sessionId) => {
        e.stopPropagation();
        setChatSessions(prev => prev.filter(s => s.id !== sessionId));
        if (activeSessionId === sessionId) {
            setActiveSessionId(null);
            setChatHistory([
                { role: 'assistant', text: 'Hello! I\'m your AI assistant. How can I help you today?' }
            ]);
        }
    };

    // Speech recognition
    const handleMicClick = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('Speech recognition is not supported in your browser. Please use Chrome.');
            return;
        }
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => setIsListening(false);
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setMessage(prev => prev ? prev + ' ' + transcript : transcript);
        };
        recognition.start();
    };

    // File attachment
    const handleFileAttach = () => fileInputRef.current?.click();
    const handleFileChange = (e) => { if (e.target.files[0]) setAttachedFile(e.target.files[0]); };
    const removeFile = () => { setAttachedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!message.trim() && !attachedFile) return;

        let displayText = message;
        if (attachedFile) {
            displayText = message ? `📎 ${attachedFile.name}\n${message}` : `📎 ${attachedFile.name}`;
        }

        const userMessage = { role: 'user', text: displayText };
        setChatHistory(prev => [...prev, userMessage]);
        const currentMsg = message;
        setMessage('');
        setAttachedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setIsTyping(true);

        // Auto-save as a new session if this is the first user message
        if (!activeSessionId && chatHistory.filter(m => m.role === 'user').length === 0) {
            const newId = Date.now().toString();
            setActiveSessionId(newId);
            const newSession = {
                id: newId,
                title: displayText.slice(0, 30),
                messages: [...chatHistory, userMessage],
                lastMessage: displayText.slice(0, 50),
                timestamp: new Date().toLocaleString()
            };
            setChatSessions(prev => [newSession, ...prev]);
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE}/chat?user_email=${encodeURIComponent(userEmail)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: currentMsg }),
            });
            if (response.ok) {
                const data = await response.json();
                setChatHistory(prev => [...prev, { role: 'assistant', text: data.response || 'I received your message!' }]);
            } else {
                // Fallback to local response
                setChatHistory(prev => [...prev, { role: 'assistant', text: getLocalResponse(currentMsg) }]);
            }
        } catch (err) {
            // Use smart local response when backend is not available
            setTimeout(() => {
                setChatHistory(prev => [...prev, { role: 'assistant', text: getLocalResponse(currentMsg) }]);
            }, 800);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="flex h-screen bg-white">
            {/* Sidebar */}
            <div className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 bg-gray-50 border-r border-gray-200 flex flex-col overflow-hidden`}>
                {/* New Chat button */}
                <div className="p-3">
                    <button
                        onClick={handleNewChat}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                        New Chat
                    </button>
                </div>

                {/* Chat History */}
                <div className="flex-1 overflow-y-auto px-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">Recent</p>
                    {chatSessions.length === 0 ? (
                        <p className="text-xs text-gray-400 px-2">No chat history yet</p>
                    ) : (
                        chatSessions.map(session => (
                            <div
                                key={session.id}
                                onClick={() => handleLoadChat(session)}
                                className={`flex items-center justify-between group px-3 py-2 rounded-lg cursor-pointer mb-1 transition-colors ${activeSessionId === session.id ? 'bg-gray-200' : 'hover:bg-gray-100'
                                    }`}
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-700 truncate">{session.title}</p>
                                    <p className="text-xs text-gray-400 truncate">{session.timestamp}</p>
                                </div>
                                <button
                                    onClick={(e) => handleDeleteChat(e, session.id)}
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 text-gray-400 transition-all"
                                >
                                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14" />
                                    </svg>
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* User Profile */}
                <div className="border-t border-gray-200 p-3">
                    <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-semibold">
                            {userInitial}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{userEmail}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top bar */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <span className="text-gray-800 font-semibold text-lg">ChatGPT</span>
                        <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 9l6 6 6-6" />
                        </svg>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1.5 rounded-full border border-gray-200 cursor-pointer hover:bg-gray-200 transition-colors">
                            🎁 Free offer
                        </span>
                        {/* Profile avatar in top bar */}
                        <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-semibold">
                            {userInitial}
                        </div>
                        <button
                            onClick={() => { localStorage.removeItem('access_token'); localStorage.removeItem('user_email'); navigate('/login'); }}
                            className="text-xs text-red-500 px-3 py-1.5 rounded-full border border-red-200 hover:bg-red-50 transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
                        {chatHistory.map((msg, i) => (
                            <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.role === 'assistant' && (
                                    <div className="w-8 h-8 rounded-full bg-[#19c37d] flex-shrink-0 flex items-center justify-center mt-1">
                                        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729z" />
                                        </svg>
                                    </div>
                                )}
                                <div
                                    className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user'
                                        ? 'bg-indigo-600 text-white rounded-br-sm'
                                        : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                                        }`}
                                >
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex gap-4 justify-start">
                                <div className="w-8 h-8 rounded-full bg-[#19c37d] flex-shrink-0 flex items-center justify-center mt-1">
                                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729z" />
                                    </svg>
                                </div>
                                <div className="flex items-center gap-1.5 px-4 py-3 bg-gray-100 rounded-2xl rounded-bl-sm">
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>
                </div>

                {/* Chat Input */}
                <div className="border-t border-gray-200 px-4 py-4">
                    <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto">
                        {attachedFile && (
                            <div className="flex items-center gap-2 mb-2 bg-gray-100 px-3 py-2 rounded-lg w-fit">
                                <span className="text-sm text-gray-700">📎 {attachedFile.name}</span>
                                <button type="button" onClick={removeFile} className="text-gray-400 hover:text-red-500 transition-colors">
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M18 6L6 18M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        )}
                        <div className="flex items-center gap-2 bg-gray-50 border border-gray-300 rounded-2xl px-4 py-3 focus-within:border-gray-400 focus-within:ring-2 focus-within:ring-gray-200 transition-colors">
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                            <button type="button" onClick={handleFileAttach} className="p-1 rounded-lg hover:bg-gray-200 transition-colors" title="Attach file">
                                <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 5v14M5 12h14" />
                                </svg>
                            </button>
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Message ChatGPT..."
                                className="flex-1 bg-transparent outline-none text-gray-800 placeholder-gray-400 text-sm"
                            />
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={handleMicClick}
                                    className={`p-2 rounded-full transition-colors ${isListening ? 'bg-red-100 text-red-500 animate-pulse' : 'hover:bg-gray-200 text-gray-400'}`}
                                    title={isListening ? 'Listening...' : 'Voice input'}
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                                        <line x1="12" y1="19" x2="12" y2="23" />
                                        <line x1="8" y1="23" x2="16" y2="23" />
                                    </svg>
                                </button>
                                <button
                                    type="submit"
                                    disabled={(!message.trim() && !attachedFile) || isTyping}
                                    className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M7 11l5-5 5 5M12 6v13" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </form>
                    <p className="text-xs text-gray-400 text-center mt-2">
                        ChatGPT can make mistakes. Check important info.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
