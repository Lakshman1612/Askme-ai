import { useEffect, useState, useRef } from "react";
import "./App.css";

export default function App() {
  const [chatsList, setChatsList] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    loadChats();
  }, []);

  useEffect(() => {
    if (activeChatId) loadMessages(activeChatId);
  }, [activeChatId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadChats() {
    const res = await fetch("http://localhost:8000/chats");
    const data = await res.json();
    setChatsList(data);

    if (!activeChatId && data.length > 0) {
      setActiveChatId(data[0].id);
    }
  }

  async function loadMessages(id) {
    const res = await fetch(`http://localhost:8000/chat/${id}`);
    const data = await res.json();
    setMessages(data);
  }

  async function createNewChat() {
    const res = await fetch("http://localhost:8000/new-chat", {
      method: "POST",
    });
    const newChat = await res.json();

    setChatsList((prev) => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    setMessages([]);
  }

  async function deleteChat(id) {
    await fetch(`http://localhost:8000/chat/${id}`, { method: "DELETE" });

    const remaining = chatsList.filter((c) => c.id !== id);
    setChatsList(remaining);

    if (id === activeChatId) {
      if (remaining.length > 0) {
        setActiveChatId(remaining[0].id);
      } else {
        setActiveChatId(null);
        setMessages([]);
      }
    }
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!messageText.trim()) return;

    const userMsg = { role: "user", content: messageText };
    setMessages((prev) => [...prev, userMsg]);
    setMessageText("");
    setIsTyping(true);

    const res = await fetch(`http://localhost:8000/chat/${activeChatId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMsg.content }),
    });

    const aiMsg = await res.json();
    setMessages((prev) => [...prev, aiMsg]);
    setIsTyping(false);
    loadChats();
  }

  return (
    <div className="app-root">

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h3 className="sidebar-title">AskMe AI</h3>
          <button className="new-chat-btn" onClick={createNewChat}>
            + New Chat
          </button>
        </div>

        <div className="chat-list">
          {chatsList.length === 0 && (
            <p className="no-chat">No chats yet. Start one!</p>
          )}

          {chatsList.map((c) => (
            <div
              key={c.id}
              className={`chat-item ${c.id === activeChatId ? "active" : ""}`}
            >
              <span className="chat-title" onClick={() => setActiveChatId(c.id)}>
                Chat {c.id.slice(0, 5)}
              </span>

              <button
                className="delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteChat(c.id);
                }}
              >
                ✖
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* Chat Window */}
      <main className="chat-window">
        <div className="header-container">
          <h2 className="app-title">AskMe AI</h2>
          <p className="tagline">Your smart chat assistant.</p>
        </div>


        <div className="message-area">
          {messages.map((m, i) => (
            <div key={i} className={`msg-row ${m.role}`}>
              <div className="msg-bubble">{m.content}</div>
            </div>
          ))}

          {isTyping && <p className="typing">AI is typing...</p>}
          <div ref={chatEndRef} />
        </div>

        <form className="composer" onSubmit={sendMessage}>
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type your message..."
            className="composer-input"
          />
          <button className="composer-send">Send</button>
        </form>
      </main>
    </div>
  );
}
