'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';

export default function ChatClient() {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: '¡Hola! Soy tu Asistente Jurídico conectado a Qdrant y Ollama. ¿En qué puedo ayudarte hoy respecto a los activos inmobiliarios, leyes o saneamiento?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll al final cuando hay nuevos mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { id: Date.now().toString(), role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage.content }),
      });

      const data = await res.json();
      
      if (data.error && data.error !== true) {
        throw new Error(data.error);
      }

      const botMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply,
        contextUsed: data.contextUsed
      };
      
      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Hubo un error de conexión con la IA. Verifica que los servicios de Docker (Ollama y Qdrant) estén respondiendo correctamente.',
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      
      {/* Área de Mensajes */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-700">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            
            {/* Avatar */}
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
              msg.role === 'user' 
                ? 'bg-violet-600 text-white' 
                : 'bg-slate-800 text-emerald-400 border border-emerald-500/20'
            }`}>
              {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
            </div>
            
            {/* Burbuja */}
            <div className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-5 py-4 ${
              msg.role === 'user'
                ? 'bg-violet-600/10 border border-violet-500/20 text-slate-200'
                : msg.isError 
                  ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                  : 'bg-slate-800/60 border border-slate-700/50 text-slate-300'
            }`}>
              <div className="whitespace-pre-wrap font-inter text-sm leading-relaxed">{msg.content}</div>
              
              {/* Badge si usó RAG */}
              {msg.contextUsed && (
                <div className="mt-3 text-[10px] text-emerald-500 font-medium tracking-wide flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  BASADO EN CONTEXTO QDRANT (RAG)
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-800 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shadow-lg">
              <Bot size={20} />
            </div>
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl px-5 py-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
              <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input de Chat Estilo ChatGPT */}
      <div className="p-4 bg-slate-900/80 border-t border-slate-800/80 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="relative max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Escribe tu consulta legal o de saneamiento aquí..."
            className="w-full bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-2xl pl-5 pr-14 py-4 outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all shadow-inner placeholder:text-slate-500 font-inter text-sm disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-2 p-2 rounded-xl bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-50 disabled:bg-slate-700 disabled:text-slate-500 transition-colors"
          >
            <Send size={18} />
          </button>
        </form>
        <p className="text-center text-[10px] text-slate-500 mt-2 font-inter">
          El modelo RAG IA puede cometer errores. Verifica siempre la información legal importante.
        </p>
      </div>

    </div>
  );
}
