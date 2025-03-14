let confessions = [];
let subject = "Confessions Of...";
const adminPassword = "yourSecretPassword"; // Change this
const prompts = ["I regret...", "I secretly love...", "I’ll never admit...", "I once hid..."];
let promptIndex = 0;

function adminSetSubject() {
    const password = prompt("Enter admin password:");
    if (password === adminPassword) {
        const newSubject = prompt("Enter new subject:");
        if (newSubject) {
            subject = `Confessions Of ${newSubject}`;
            document.getElementById("subject-title").textContent = subject;
            updateBackground(newSubject.toLowerCase());
        }
    } else {
        alert("Incorrect password!");
    }
}

function updateBackground(subject) {
    const body = document.body;
    if (subject.includes("liar")) body.style.background = "linear-gradient(#4a5568, #2d3748)";
    else if (subject.includes("friend")) body.style.background = "linear-gradient(#f6e05e, #ed8936)";
    else body.style.background = "#f4f4f4";
}

document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "a") {
        document.querySelector(".admin-btn").style.display = "inline-block";
    }
});

document.getElementById("confession-form").addEventListener("submit", function(e) {
    e.preventDefault();
    const text = document.getElementById("confession-input").value.trim();
    const mood = document.getElementById("mood").value;
    if (text) {
        const confession = {
            id: Date.now(),
            text,
            mood,
            likes: 0,
            dislikes: 0,
            timer: null,
            timeLeft: 0,
            survived: false,
            replies: []
        };
        confessions.push(confession);
        document.getElementById("confession-input").value = "";
        document.getElementById("mood").value = "";
        renderConfessions();
    }
});

function renderConfessions() {
    const list = document.getElementById("confessions-list");
    list.innerHTML = "";
    confessions = confessions.filter(c => c.likes - c.dislikes > -5 || !c.timer);
    confessions.forEach(confession => {
        const div = document.createElement("div");
        div.className = "confession" + (confession.survived ? " survived" : "");
        div.innerHTML = `
            <p>${confession.mood ? confession.mood + " " : ""}${confession.text}</p>
            <button onclick="vote(${confession.id}, 'like')">Like (${confession.likes})</button>
            <button onclick="vote(${confession.id}, 'dislike')">Dislike (${confession.dislikes})</button>
            <progress class="${confession.timeLeft < 60 ? 'urgent' : ''}" value="${confession.timeLeft || 0}" max="600"></progress>
            ${confession.timeLeft < 60 ? '<span class="urgent-text">Save It!</span>' : ''}
            ${confession.survived ? '<span class="survived">Survived!</span>' : ''}
            <div class="replies">${confession.replies.slice(0, 3).map(r => `<p>${r}</p>`).join("")}</div>
            <input class="reply-input" id="reply-${confession.id}" placeholder="Add a reply (max 100)" maxlength="100">
            <button class="reply-btn" onclick="addReply(${confession.id})">Reply</button>
            ${confession.survived ? `<button class="share-btn" onclick="shareReel(${confession.id})">Share Reel</button>` : ""}
        `;
        list.appendChild(div);
    });
}

function vote(id, type) {
    const confession = confessions.find(c => c.id === id);
    const btn = document.querySelector(`[onclick="vote(${id}, '${type}')"]`);
    if (type === "like") {
        confession.likes++;
        if (!confession.timer) {
            confession.timeLeft = 600;
            startTimer(confession);
        } else if (confession.timeLeft < 1800) {
            confession.timeLeft += 300;
        }
        btn.classList.add("like-btn", "clicked");
    } else {
        confession.dislikes++;
        btn.classList.add("dislike-btn", "clicked");
    }
    setTimeout(() => btn.classList.remove("clicked"), 300);
    renderConfessions();
}

function startTimer(confession) {
    confession.timer = setInterval(() => {
        confession.timeLeft--;
        if (confession.timeLeft <= 0 || confession.likes - confession.dislikes < -5) {
            clearInterval(confession.timer);
            if (confession.timeLeft <= 0) {
                confession.survived = true;
                renderConfessions();
                setTimeout(() => confessions = confessions.filter(c => c.id !== confession.id), 2000);
            } else {
                const index = confessions.findIndex(c => c.id === confession.id);
                document.querySelectorAll(".confession")[index].classList.add("exit");
                setTimeout(() => confessions = confessions.filter(c => c.id !== confession.id), 500);
            }
        }
        renderConfessions();
    }, 1000);
}

function addReply(id) {
    const confession = confessions.find(c => c.id === id);
    const reply = document.getElementById(`reply-${id}`).value.trim();
    if (reply) {
        confession.replies.push(reply);
        document.getElementById(`reply-${id}`).value = "";
        renderConfessions();
    }
}

function shareReel(id) {
    const confession = confessions.find(c => c.id === id);
    const canvas = document.getElementById("reelCanvas");
    const ctx = canvas.getContext("2d");

    // Draw Reel
    ctx.fillStyle = "#1A2A44";
    ctx.fillRect(0, 0, 400, 600);
    ctx.fillStyle = "white";
    ctx.font = "bold 24px Montserrat";
    ctx.textAlign = "center";
    ctx.fillText(subject, 200, 50);
    ctx.font = "18px Arial";
    ctx.fillText(`${confession.mood || ""} ${confession.text}`, 200, 100);
    ctx.fillStyle = "#D4A017";
    ctx.font = "16px Arial";
    confession.replies.slice(0, 3).forEach((reply, i) => {
        ctx.fillText(reply, 200, 150 + i * 30);
    });
    ctx.fillStyle = "white";
    ctx.font = "12px Arial";
    ctx.fillText(`Likes: ${confession.likes} | Survived 10m`, 200, 550);

    // Convert to image and share
    const dataUrl = canvas.toDataURL("image/png");
    if (navigator.share) {
        fetch(dataUrl)
            .then(res => res.blob())
            .then(blob => {
                const file = new File([blob], "confession-reel.png", { type: "image/png" });
                navigator.share({
                    files: [file],
                    title: subject,
                    text: "Check out this confession reel!"
                });
            });
    } else {
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = "confession-reel.png";
        link.click();
    }
}

function updatePrompt() {
    document.getElementById("prompt").textContent = prompts[promptIndex];
    promptIndex = (promptIndex + 1) % prompts.length;
}
setInterval(updatePrompt, 10000);
updatePrompt();

renderConfessions();
