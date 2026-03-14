import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState, useRef, useEffect } from 'react';

// Simple markdown formatter to handle bold text, italic text, and basic lists
function formatMessageContent(content: string) {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
        let html = line
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/__(.*?)__/g, '<strong>$1</strong>')
            .replace(/_(.*?)_/g, '<em>$1</em>');
            
        if (html.trim().startsWith('- ') || html.trim().startsWith('* ')) {
            return <li key={idx} dangerouslySetInnerHTML={{ __html: html.trim().slice(2) }} className="ml-4 list-disc" />;
        }
        if (html.trim().match(/^\d+\.\s/)) {
            return <li key={idx} dangerouslySetInnerHTML={{ __html: html.replace(/^\d+\.\s/, '') }} className="ml-4 list-decimal" />;
        }
        return <span key={idx} dangerouslySetInnerHTML={{ __html: html }} className="block min-h-[1rem]" />;
    });
}

export default function ChatBarista() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    
    const { messages, sendMessage, status, error } = useChat({
        transport: new DefaultChatTransport({ api: '/api/chat' })
    });
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!input.trim() || status === 'streaming' || status === 'submitted') return;
        sendMessage({ text: input });
        setInput('');
    };

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
            {isOpen && (
                <div className="mb-4 w-80 sm:w-96 h-[500px] max-h-[80vh] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all">
                    {/* Header */}
                    <div className="bg-amber-600 text-white p-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold">Barista</h3>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-white hover:text-amber-200 transition-colors focus:outline-none">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.length === 0 && (
                            <div className="text-center text-gray-500 dark:text-gray-400 mt-10">
                                <p className="text-4xl mb-2">👋</p>
                                <p className="text-sm">Hi! I'm your AI Barista. Ask me for a recommendation or brewing tips!</p>
                            </div>
                        )}
                        {messages.map(m => (
                            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-2xl px-4 py-2 ${m.role === 'user' ? 'bg-amber-600 text-white rounded-br-none' : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-none'}`}>
                                    <div className="text-sm whitespace-pre-wrap">
                                        {formatMessageContent(
                                            m.parts 
                                                ? m.parts.map((part: any) => part.type === 'text' ? part.text : '').join('')
                                                : ((m as any).content || '')
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {(status === 'submitted' || status === 'streaming') && (
                            <div className="flex justify-start">
                                <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-none px-4 py-3 text-sm text-gray-500">
                                    Thinking...
                                </div>
                            </div>
                        )}
                        {error && (
                            <div className="flex justify-start">
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 rounded-2xl rounded-bl-none px-4 py-3 text-sm text-red-600 dark:text-red-400">
                                    Sorry, this service isn't available right now.
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleFormSubmit} className="p-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 relative">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about coffee..."
                            className="w-full pl-4 pr-12 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-shadow"
                        />
                        <button type="submit" disabled={status === 'streaming' || status === 'submitted' || !input.trim()} className="absolute right-5 top-1/2 -translate-y-1/2 p-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 focus:outline-none disabled:opacity-50 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" /></svg>
                        </button>
                    </form>
                </div>
            )}

            {/* Toggle Button */}
            {!isOpen && (
                <button onClick={() => setIsOpen(true)} className="w-14 h-14 bg-amber-600 text-white rounded-full shadow-lg hover:bg-amber-700 hover:scale-105 transition-transform flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-amber-500 focus:ring-opacity-50" aria-label="Open AI Barista">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                </button>
            )}
        </div>
    );
}