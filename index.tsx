import React, { useState, useEffect, useRef, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import ReactMarkdown from "react-markdown";

// --- Configuration & Constants ---
const API_KEY = process.env.API_KEY;
const MODEL_CHAT = "gemini-3-flash-preview";
const MODEL_LIVE = "gemini-2.5-flash-native-audio-preview-09-2025";

// --- Icons ---
interface IconProps { size?: number; color?: string; className?: string; onClick?: () => void; }
const IconMic = ({ size = 20, color = "currentColor", ...props }: IconProps) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>;
const IconMicOff = ({ size = 20, color = "currentColor", ...props }: IconProps) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12"/><path d="M15 9.34V5a3 3 0 0 0-5.68-1.33"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12"/><path d="M15 9.34V5a3 3 0 0 0-5.68-1.33"/><line x1="12" y1="19" x2="12" y2="22"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>;
const IconSend = ({ size = 20, color = "currentColor", ...props }: IconProps) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>;
const IconImage = ({ size = 20, color = "currentColor", ...props }: IconProps) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>;
const IconSparkles = ({ size = 20, color = "currentColor", ...props }: IconProps) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M9 5H5"/><path d="M19 18v4"/><path d="M22 20h-4"/></svg>;
const IconX = ({ size = 16, color = "currentColor", ...props }: IconProps) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>;

// --- Styles ---
const styles = `
  :root {
    --bg: #0f172a;
    --surface: #1e293b;
    --primary: #3b82f6;
    --primary-hover: #2563eb;
    --text: #f8fafc;
    --text-muted: #94a3b8;
    --border: #334155;
    --accent: #8b5cf6;
  }
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background-color: var(--bg);
    color: var(--text);
    height: 100vh;
    display: flex;
    flex-direction: column;
  }
  * { box-sizing: border-box; }
  
  .container {
    max-width: 900px;
    margin: 0 auto;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 1rem;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 0;
    margin-bottom: 1rem;
    border-bottom: 1px solid var(--border);
  }
  .title {
    font-size: 1.5rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: linear-gradient(to right, #60a5fa, #c084fc);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  
  .tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
    background: var(--surface);
    padding: 0.25rem;
    border-radius: 0.75rem;
    width: fit-content;
  }
  .tab {
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
    border: none;
    background: transparent;
    color: var(--text-muted);
  }
  .tab.active {
    background: var(--primary);
    color: white;
  }
  
  .content-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: var(--surface);
    border-radius: 1rem;
    overflow: hidden;
    border: 1px solid var(--border);
    position: relative;
    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
  }

  /* Chat Styles */
  .chat-history {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  .message {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    max-width: 80%;
  }
  .message.user {
    align-self: flex-end;
    align-items: flex-end;
  }
  .message.model {
    align-self: flex-start;
    align-items: flex-start;
  }
  .bubble {
    padding: 0.75rem 1rem;
    border-radius: 1rem;
    line-height: 1.6;
    font-size: 0.95rem;
    overflow-wrap: break-word;
  }
  .bubble p { margin: 0; }
  .bubble p + p { margin-top: 0.5em; }
  .bubble code { 
    background: rgba(0,0,0,0.2); 
    padding: 0.2em 0.4em; 
    border-radius: 4px; 
    font-family: monospace; 
  }
  .bubble pre { 
    background: rgba(0,0,0,0.3); 
    padding: 1em; 
    border-radius: 8px; 
    overflow-x: auto; 
    margin: 0.5em 0;
  }
  .bubble pre code { 
    background: transparent; 
    padding: 0; 
  }
  .user .bubble {
    background: var(--primary);
    color: white;
    border-bottom-right-radius: 0.25rem;
  }
  .model .bubble {
    background: #334155;
    color: var(--text);
    border-bottom-left-radius: 0.25rem;
  }
  .message-image {
    max-width: 250px;
    border-radius: 0.75rem;
    margin-bottom: 0.5rem;
    border: 1px solid rgba(255,255,255,0.1);
  }
  
  .input-area {
    padding: 1rem;
    border-top: 1px solid var(--border);
    display: flex;
    gap: 0.75rem;
    background: var(--surface);
    align-items: flex-end;
  }
  .textarea-wrapper {
    flex: 1;
    background: var(--bg);
    border-radius: 0.75rem;
    border: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: border-color 0.2s;
  }
  .textarea-wrapper:focus-within {
    border-color: var(--primary);
  }
  .preview-image-container {
    padding: 0.5rem;
    border-bottom: 1px solid var(--border);
    display: flex;
  }
  .preview-image {
    height: 60px;
    width: auto;
    border-radius: 0.25rem;
    position: relative;
    border: 1px solid var(--border);
  }
  .remove-image {
    position: absolute;
    top: -8px;
    left: -8px;
    background: #ef4444;
    border-radius: 50%;
    color: white;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 10px;
    border: 2px solid var(--surface);
  }
  .chat-input {
    width: 100%;
    background: transparent;
    border: none;
    color: white;
    padding: 0.75rem;
    resize: none;
    outline: none;
    font-family: inherit;
    min-height: 24px;
    max-height: 120px;
  }
  .btn {
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s;
    height: 40px;
    width: 40px;
  }
  .btn-primary {
    background: var(--primary);
    color: white;
  }
  .btn-primary:hover {
    background: var(--primary-hover);
  }
  .btn-primary:disabled {
    background: #334155;
    color: var(--text-muted);
    cursor: not-allowed;
  }
  .btn-icon {
    background: transparent;
    color: var(--text-muted);
  }
  .btn-icon:hover {
    color: var(--text);
    background: rgba(255,255,255,0.05);
  }

  /* Live Styles */
  .live-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 2rem;
    text-align: center;
    position: relative;
    padding: 2rem;
  }
  .visualizer-wrapper {
    position: relative;
    width: 200px;
    height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .visualizer {
    width: 160px;
    height: 160px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(59,130,246,0.1) 0%, rgba(15,23,42,0) 70%);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    transition: all 0.3s;
    z-index: 10;
  }
  .visualizer.active {
    box-shadow: 0 0 50px rgba(59,130,246,0.2);
    background: radial-gradient(circle, rgba(59,130,246,0.2) 0%, rgba(15,23,42,0) 70%);
  }
  .visualizer-ring {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    border: 2px solid var(--primary);
    width: 100%;
    height: 100%;
    opacity: 0;
    pointer-events: none;
  }
  .visualizer-ring.animating {
    animation: pulse 1.5s infinite ease-out;
  }
  @keyframes pulse {
    0% { width: 100%; height: 100%; opacity: 0.8; border-width: 3px; }
    100% { width: 160%; height: 160%; opacity: 0; border-width: 0px; }
  }
  .live-status {
    font-size: 1.25rem;
    font-weight: 500;
    min-height: 2rem;
    color: var(--text);
  }
  .live-controls {
    display: flex;
    gap: 1rem;
  }
  .btn-live {
    padding: 0 2rem;
    width: auto;
    font-weight: 600;
    font-size: 1rem;
    height: 48px;
    border-radius: 2rem;
  }
  .btn-disconnect {
    background: #ef4444;
    color: white;
  }
  .btn-disconnect:hover {
    background: #dc2626;
  }
  
  .error-toast {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    background: #ef4444;
    color: white;
    padding: 1rem;
    border-radius: 0.5rem;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    animation: slideIn 0.3s ease;
    z-index: 100;
  }
  @keyframes slideIn {
    from { transform: translateY(100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
`;

// --- Helpers ---
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Audio Utils for Live API
function createBlob(data: Float32Array): { data: string; mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  let binary = '';
  const bytes = new Uint8Array(int16.buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return {
    data: btoa(binary),
    mimeType: 'audio/pcm;rate=16000',
  };
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// --- Components ---

// 1. Chat Component
function ChatMode({ ai }: { ai: GoogleGenAI }) {
  const [messages, setMessages] = useState<{role: 'user' | 'model', text?: string, image?: string}[]>([
    { role: 'model', text: 'Hello! I am Gemini. How can I help you today?' }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const base64 = await blobToBase64(file);
      setSelectedImage(`data:${file.type};base64,${base64}`);
      // Reset input
      e.target.value = '';
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
  };

  const handleSend = async () => {
    if ((!inputValue.trim() && !selectedImage) || isThinking) return;

    const userMessage = { 
      role: 'user' as const, 
      text: inputValue, 
      image: selectedImage || undefined 
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setSelectedImage(null);
    setIsThinking(true);

    try {
      const parts: any[] = [];
      
      if (userMessage.image) {
        const base64Data = userMessage.image.split(',')[1];
        const mimeType = userMessage.image.split(';')[0].split(':')[1];
        parts.push({
          inlineData: {
            mimeType: mimeType,
            data: base64Data
          }
        });
      }
      
      if (userMessage.text) {
        parts.push({ text: userMessage.text });
      }

      // Reconstruct history properly
      const contents = messages.map(m => {
        const msgParts: any[] = [];
        if (m.image) {
            // Extract mime type from data URL
            const mimeType = m.image.split(';')[0].split(':')[1];
            msgParts.push({ 
                inlineData: { 
                    mimeType: mimeType, 
                    data: m.image.split(',')[1] 
                } 
            });
        }
        if (m.text) {
            msgParts.push({ text: m.text });
        }
        return {
            role: m.role,
            parts: msgParts
        };
      });

      // Add current message parts
      contents.push({
        role: 'user',
        parts: parts
      });

      const responseStream = await ai.models.generateContentStream({
        model: MODEL_CHAT,
        contents: contents,
      });

      let fullResponseText = "";
      setMessages(prev => [...prev, { role: 'model', text: "" }]);

      for await (const chunk of responseStream) {
        fullResponseText += chunk.text;
        setMessages(prev => {
          const newHistory = [...prev];
          newHistory[newHistory.length - 1].text = fullResponseText;
          return newHistory;
        });
      }

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <>
      <div className="chat-history">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            {msg.image && <img src={msg.image} alt="User upload" className="message-image" />}
            {msg.text && (
                <div className="bubble">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
            )}
          </div>
        ))}
        {isThinking && (
          <div className="message model">
            <div className="bubble">Thinking...</div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="input-area">
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleImageSelect} 
          accept="image/*" 
          style={{ display: 'none' }} 
        />
        <button className="btn btn-icon" onClick={() => fileInputRef.current?.click()} title="Upload Image">
          <IconImage size={24} />
        </button>
        
        <div className="textarea-wrapper">
          {selectedImage && (
            <div className="preview-image-container">
               <div style={{position: 'relative', display: 'inline-block'}}>
                  <img src={selectedImage} className="preview-image" alt="preview" />
                  <div className="remove-image" onClick={removeImage}>
                    <IconX size={12} color="white" />
                  </div>
               </div>
            </div>
          )}
          <textarea
            className="chat-input"
            placeholder="Type a message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={1}
          />
        </div>
        
        <button 
          className="btn btn-primary" 
          onClick={handleSend}
          disabled={isThinking || (!inputValue.trim() && !selectedImage)}
        >
          <IconSend size={24} />
        </button>
      </div>
    </>
  );
}

// 2. Live Component
function LiveMode({ ai }: { ai: GoogleGenAI }) {
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState("Ready to connect");
  const [volume, setVolume] = useState(0);
  
  // Refs
  const audioContextsRef = useRef<{ input?: AudioContext; output?: AudioContext }>({});
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourceNodesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const streamRef = useRef<MediaStream | null>(null);

  const connect = async () => {
    try {
      setStatus("Requesting permissions...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      setStatus("Initializing audio...");
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextsRef.current = { input: inputCtx, output: outputCtx };

      // Input pipeline
      const source = inputCtx.createMediaStreamSource(stream);
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      
      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        // Calculate volume for visualizer
        let sum = 0;
        for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
        const rms = Math.sqrt(sum / inputData.length);
        setVolume(Math.min(rms * 8, 1)); // Sensitivity

        const pcmBlob = createBlob(inputData);
        if (sessionRef.current) {
          sessionRef.current.sendRealtimeInput({ media: pcmBlob });
        }
      };

      source.connect(processor);
      processor.connect(inputCtx.destination);

      setStatus("Connecting to Gemini...");
      
      const sessionPromise = ai.live.connect({
        model: MODEL_LIVE,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: "You are a helpful, enthusiastic, and concise AI assistant.",
        },
        callbacks: {
          onopen: () => {
            console.log("Live session opened");
            setStatus("Connected! Speak now.");
            setConnected(true);
          },
          onmessage: async (message: LiveServerMessage) => {
             const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
             if (base64Audio) {
               const ctx = audioContextsRef.current.output;
               if (!ctx) return;

               nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
               
               const audioBuffer = await decodeAudioData(
                 decode(base64Audio),
                 ctx,
                 24000,
                 1
               );

               const source = ctx.createBufferSource();
               source.buffer = audioBuffer;
               source.connect(ctx.destination);
               source.addEventListener('ended', () => {
                 sourceNodesRef.current.delete(source);
               });
               source.start(nextStartTimeRef.current);
               nextStartTimeRef.current += audioBuffer.duration;
               sourceNodesRef.current.add(source);
             }

             if (message.serverContent?.interrupted) {
               sourceNodesRef.current.forEach(node => node.stop());
               sourceNodesRef.current.clear();
               nextStartTimeRef.current = 0;
             }
          },
          onclose: () => {
            console.log("Session closed");
            setConnected(false);
            setStatus("Disconnected");
          },
          onerror: (err) => {
            console.error("Session error", err);
            setConnected(false);
            setStatus("Error: Connection lost");
          }
        }
      });

      const session = await sessionPromise;
      sessionRef.current = session;

    } catch (e) {
      console.error(e);
      setStatus("Connection failed. Check permissions.");
    }
  };

  const disconnect = () => {
    if (sessionRef.current) {
      try { sessionRef.current.close(); } catch(e) {}
      sessionRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (audioContextsRef.current.input) audioContextsRef.current.input.close();
    if (audioContextsRef.current.output) audioContextsRef.current.output.close();
    
    setConnected(false);
    setStatus("Ready to connect");
    setVolume(0);
  };

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return (
    <div className="live-container">
      <div className="visualizer-wrapper">
        <div 
            className={`visualizer-ring ${connected ? 'animating' : ''}`}
            style={{ transform: `translate(-50%, -50%) scale(${1 + volume * 0.5})` }} 
        />
        <div className={`visualizer ${connected ? 'active' : ''}`}>
            {connected ? <IconMic size={64} color="#f8fafc" /> : <IconMicOff size={64} color="#94a3b8" />}
        </div>
      </div>
      
      <div className="live-status">{status}</div>

      <div className="live-controls">
        {!connected ? (
          <button className="btn btn-primary btn-live" onClick={connect}>
            Start Live Voice
          </button>
        ) : (
          <button className="btn btn-disconnect btn-live" onClick={disconnect}>
            End Session
          </button>
        )}
      </div>
    </div>
  );
}

// 3. Main App Component
function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'live'>('chat');
  const [aiClient, setAiClient] = useState<GoogleGenAI | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!API_KEY) {
      setError("API Key is missing. Please set process.env.API_KEY.");
      return;
    }
    setAiClient(new GoogleGenAI({ apiKey: API_KEY }));
  }, []);

  return (
    <>
      <style>{styles}</style>
      <div className="container">
        <header className="header">
          <div className="title">
            <IconSparkles size={28} />
            <span>Gemini AI Playground</span>
          </div>
        </header>

        <nav className="tabs">
          <button 
            className={`tab ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            Chat
          </button>
          <button 
            className={`tab ${activeTab === 'live' ? 'active' : ''}`}
            onClick={() => setActiveTab('live')}
          >
            Live Voice
          </button>
        </nav>

        <main className="content-area">
          {error && <div className="error-toast">{error}</div>}
          
          {!aiClient ? (
            <div style={{padding: '2rem', textAlign: 'center'}}>Initializing AI...</div>
          ) : activeTab === 'chat' ? (
            <ChatMode ai={aiClient} />
          ) : (
            <LiveMode ai={aiClient} />
          )}
        </main>
      </div>
    </>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
