body {
    font-family: "Montserrat", Arial, sans-serif;
    background-color: #f1f3f5;
    margin: 0;
    padding: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    transition: background 0.5s;
}

.page-container {
    position: relative;
    text-align: center;
    width: 100%;
    height: 100vh;
}

.logo {
    width: 300px;
    height: auto;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 0;
    opacity: 0.1;
}

.confession-window {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 400px;
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    padding: 20px;
    z-index: 1;
    border: 1px solid #e0e0e0;
    transition: opacity 0.3s ease;
}

.confession-window.hidden {
    opacity: 0;
    pointer-events: none;
}

h1 {
    color: #1A2A44;
    font-size: 24px;
    font-weight: 700;
    margin: 0 0 10px;
}

input, textarea, select {
    width: 100%;
    padding: 10px;
    margin: 8px 0;
    border: 1px solid #dcdcdc;
    border-radius: 6px;
    box-sizing: border-box;
    font-size: 14px;
    background: #fafafa;
}

textarea {
    resize: none;
    height: 80px;
}

button {
    background-color: #1A2A44;
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    transition: background 0.3s;
}

button:hover {
    background-color: #D4A017;
}

#prompt {
    font-family: "Dancing Script", cursive;
    font-size: 16px;
    color: #666;
    margin: 10px 0;
}

.confession {
    position: absolute;
    background: rgba(255, 255, 255, 0.9);
    padding: 12px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    font-size: 14px;
    max-width: 200px;
    text-align: center;
    z-index: 2;
    animation: circleLogo 10s linear infinite;
}

.confession.exit {
    animation: poofOut 0.5s forwards;
}

.confession button {
    margin: 0 5px;
    padding: 5px 10px;
    font-size: 12px;
}

.like-btn.clicked { animation: heartBurst 0.3s; }
.dislike-btn.clicked { animation: cloudPuff 0.3s; }

progress {
    width: 100%;
    height: 8px;
    margin-top: 5px;
    appearance: none;
}
progress::-webkit-progress-bar { 
    background: #e0e0e0; 
    border-radius: 4px; 
}
progress::-webkit-progress-value { 
    background: linear-gradient(to right, #28a745, #dc3545); 
    border-radius: 4px; 
}
.urgent { 
    border: 1px solid #dc3545; 
}
.urgent::-webkit-progress-value { 
    background: #dc3545; 
}
.urgent-text { 
    color: #dc3545; 
    font-weight: bold; 
    font-size: 12px; 
}

.survived {
    position: absolute;
    top: 5px;
    right: 5px;
    background: #D4A017;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    animation: flash 1s infinite;
}

.admin-btn {
    background-color: #666;
    padding: 5px 10px;
    font-size: 12px;
    margin-bottom: 10px;
    display: none;
}
.admin-btn:hover {
    background-color: #999;
}

.reply-input {
    width: 70%;
    padding: 5px;
    margin: 5px 0;
    border: 1px solid #dcdcdc;
    border-radius: 4px;
    font-size: 12px;
}
.reply-btn {
    padding: 5px 10px;
    background-color: #666;
}
.reply-btn:hover {
    background-color: #999;
}
.replies {
    font-size: 12px;
    color: #444;
    margin-top: 5px;
}
.share-btn {
    background-color: #28a745;
    padding: 5px 10px;
    font-size: 12px;
}
.share-btn:hover {
    background-color: #218838;
}

@keyframes circleLogo {
    0% { transform: translate(-50%, -50%) translate(200px, 0) rotate(0deg); }
    25% { transform: translate(-50%, -50%) translate(0, -200px) rotate(90deg); }
    50% { transform: translate(-50%, -50%) translate(-200px, 0) rotate(180deg); }
    75% { transform: translate(-50%, -50%) translate(0, 200px) rotate(270deg); }
    100% { transform: translate(-50%, -50%) translate(200px, 0) rotate(360deg); }
}

@keyframes poofOut {
    0% { opacity: 1; transform: scale(1); }
    100% { opacity: 0; transform: scale(0.8); filter: blur(2px); }
}
@keyframes heartBurst {
    0% { transform: scale(1); }
    50% { transform: scale(1.3); color: #D4A017; }
    100% { transform: scale(1); }
}
@keyframes cloudPuff {
    0% { transform: scale(1); }
    50% { transform: scale(1.2); color: #666; }
    100% { transform: scale(1); }
}
@keyframes flash {
    50% { opacity: 0.5; }
}

@media (max-width: 600px) {
    .confession-window { width: 90%; }
    .logo { width: 200px; }
    .reply-input { width: 60%; }
    .confession { max-width: 150px; font-size: 12px; }
}
