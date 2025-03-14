const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage().ref();

let confessions = [];
let subject = "Confessions Of...";
const prompts = ["I regret...", "I secretly love...", "I’ll never admit...", "I once hid..."];
let promptIndex = 0;
let activeTopic = null;
let currentUser = null;
let lastPostTime = 0;

auth.onAuthStateChanged(async user => {
    currentUser = user;
    document.getElementById("login-btn").style.display = user ? "none" : "inline-block";
    document.getElementById("register-btn").style.display = user ? "none" : "inline-block";
    document.getElementById("logout-btn").style.display = user ? "inline-block" : "none";
    document.getElementById("profile-btn").style.display = user ? "inline-block" : "none";
    document.getElementById("confession-window").style.display = user && user.emailVerified ? "block" : "none";
    if (user) {
        const token = await user.getIdTokenResult();
        document.querySelectorAll(".admin-btn").forEach(btn => btn.style.display = token.claims.admin ? "inline-block" : "none");
    }
});

document.getElementById("login-btn").addEventListener("click", () => {
    const email = prompt("Enter your email:");
    const password = prompt("Enter your password:");
    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            if (!auth.currentUser.emailVerified) {
                auth.currentUser.sendEmailVerification();
                alert("Please verify your email to post confessions.");
            }
        })
        .catch(err => alert(err.message));
});

document.getElementById("register-btn").addEventListener("click", () => {
    const email = prompt("Enter your email:");
    const password = prompt("Enter your password:");
    auth.createUserWithEmailAndPassword(email, password)
        .then(() => auth.currentUser.sendEmailVerification())
        .then(() => alert("Registration successful! Please verify your email."))
        .catch(err => alert(err.message));
});

document.getElementById("logout-btn").addEventListener("click", () => auth.signOut());

document.getElementById("profile-btn").addEventListener("click", showProfile);

function adminSetSubject() {
    auth.currentUser.getIdTokenResult().then(token => {
        if (token.claims.admin) {
            const newSubject = prompt("Enter new subject:");
            if (newSubject) {
                subject = `Confessions Of ${newSubject}`;
                document.getElementById("subject-title").textContent = subject;
                updateBackground(newSubject.toLowerCase());
                db.collection("settings").doc("subject").set({ value: subject });
            }
        } else {
            alert("Admin access required!");
        }
    });
}

function updateBackground(subject) {
    const body = document.body;
    if (subject.includes("liar")) body.style.background = "linear-gradient(#4a5568, #2d3748)";
    else if (subject.includes("friend")) body.style.background = "linear-gradient(#f6e05e, #ed8936)";
    else body.style.background = "#f1f3f5";
}

document.querySelectorAll(".topic").forEach(topic => {
    topic.addEventListener("click", () => {
        activeTopic = activeTopic === topic.dataset.topic ? null : topic.dataset.topic;
        document.querySelectorAll(".topic").forEach(t => t.classList.remove("active"));
        if (activeTopic) topic.classList.add("active");
        renderConfessions();
    });
});

function updateParentOptions() {
    const parentSelect = document.getElementById("parent-confession");
    parentSelect.innerHTML = '<option value="">New Confession</option>';
    confessions.forEach(conf => {
        const option = document.createElement("option");
        option.value = conf.id;
        option.textContent = conf.text.substring(0, 20) + (conf.text.length > 20 ? "..." : "");
        parentSelect.appendChild(option);
    });
}

document.getElementById("confession-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentUser || !currentUser.emailVerified) return alert("Please verify your email to post.");
    const now = Date.now();
    if (now - lastPostTime < 60000) return alert("Please wait 1 minute between posts."); // Rate limit: 1 post/min
    lastPostTime = now;

    const text = sanitizeInput(document.getElementById("confession-input").value.trim());
    const mood = document.getElementById("mood").value;
    const category = document.getElementById("category").value;
    const parentId = document.getElementById("parent-confession").value;
    const fileInput = document.getElementById("media-input");
    const link = document.getElementById("link-input").value.trim();
    let mediaUrl = null;
    let mediaType = null;

    if (fileInput.files[0]) {
        const file = fileInput.files[0];
        if (file.size > 5 * 1024 * 1024) return alert("File size must be under 5MB.");
        const uploadTask = await storage.child(`media/${Date.now()}_${file.name}`).put(file);
        mediaUrl = await uploadTask.ref.getDownloadURL();
        mediaType = file.type.startsWith("video") ? "video" : "image";
    }

    if (category && (text || mediaUrl || link)) {
        await db.collection("confessions").add({
            text,
            mood,
            topic: category,
            parentId: parentId || null,
            media: mediaUrl,
            mediaType,
            link,
            userId: currentUser.uid,
            likes: 0,
            dislikes: 0,
            views: 0,
            timeLeft: 0,
            survived: false,
            replies: [],
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        document.getElementById("confession-form").reset();
        document.getElementById("confession-window").classList.add("hidden");
    }
});

db.collection("confessions").orderBy("timestamp", "desc").onSnapshot((snapshot) => {
    confessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderConfessions();
    updateParentOptions();
});

db.collection("settings").doc("subject").onSnapshot((doc) => {
    if (doc.exists) {
        subject = doc.data().value;
        document.getElementById("subject-title").textContent = subject;
        updateBackground(subject.split(" ").pop().toLowerCase());
    }
});

function renderConfessions() {
    const list = document.getElementById("confessions-list");
    const svg = document.getElementById("web-lines");
    list.innerHTML = "";
    svg.innerHTML = "";
    const filteredConfessions = activeTopic ? confessions.filter(c => c.topic === activeTopic || confessions.some(p => p.id === c.parentId && p.topic === activeTopic)) : confessions;

    filteredConfessions.forEach((confession, index) => {
        db.collection("confessions").doc(confession.id).update({ views: confession.views + 1 });
        const logoRect = document.getElementById("logo").getBoundingClientRect();
        let x, y;
        if (!confession.parentId) {
            const topicElement = document.querySelector(`.topic[data-topic="${confession.topic}"]`);
            const angle = parseFloat(topicElement.style.getPropertyValue("--angle")) * Math.PI / 180;
            const radius = 350;
            x = logoRect.left + logoRect.width / 2 + radius * Math.cos(angle) - 100;
            y = logoRect.top + logoRect.height / 2 + radius * Math.sin(angle) - 50;
        } else {
            const parent = confessions.find(c => c.id === confession.parentId);
            const parentEl = document.querySelector(`.confession[data-id="${parent.id}"]`);
            if (parentEl) {
                const parentRect = parentEl.getBoundingClientRect();
                x = parentRect.left + parentRect.width + 20;
                y = parentRect.top + (index % 3) * 60 - 50;
            } else {
                x = logoRect.left + 200;
                y = logoRect.top + index * 60;
            }
        }

        const div = document.createElement("div");
        div.className = "confession" + (confession.survived ? " survived" : "");
        div.dataset.id = confession.id;
        div.style.left = `${x}px`;
        div.style.top = `${y}px`;
        div.innerHTML = `
            <p>${confession.mood ? confession.mood + " " : ""}${confession.text}</p>
            ${confession.media ? (confession.mediaType === "video" ? `<video src="${confession.media}" controls></video>` : `<img src="${confession.media}">`) : ""}
            ${confession.link ? `<a href="${confession.link}" target="_blank">${confession.link}</a>` : ""}
            <button onclick="vote('${confession.id}', 'like')">Like (${confession.likes})</button>
            <button onclick="vote('${confession.id}', 'dislike')">Dislike (${confession.dislikes})</button>
            <progress class="${confession.timeLeft < 60 ? 'urgent' : ''}" value="${confession.timeLeft || 0}" max="600"></progress>
            ${confession.timeLeft < 60 ? '<span class="urgent-text">Save It!</span>' : ''}
            ${confession.survived ? '<span class="survived">Survived!</span>' : ''}
            <div class="replies">${confession.replies.slice(0, 3).map(r => `<p>${r}</p>`).join("")}</div>
            <input class="reply-input" id="reply-${confession.id}" placeholder="Add a reply (max 100)" maxlength="100">
            <button class="reply-btn" onclick="addReply('${confession.id}')">Reply</button>
            <button class="share-btn" onclick="shareConfession('${confession.id}')">Share</button>
        `;
        list.appendChild(div);

        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        if (!confession.parentId) {
            line.setAttribute("x1", logoRect.left + logoRect.width / 2);
            line.setAttribute("y1", logoRect.top + logoRect.height / 2);
        } else {
            const parentEl = document.querySelector(`.confession[data-id="${confession.parentId}"]`);
            const parentRect = parentEl.getBoundingClientRect();
            line.setAttribute("x1", parentRect.left + parentRect.width / 2);
            line.setAttribute("y1", parentRect.top + parentRect.height / 2);
        }
        line.setAttribute("x2", x + 100);
        line.setAttribute("y2", y + 50);
        line.setAttribute("stroke", "#1A2A44");
        line.setAttribute("stroke-width", "1");
        svg.appendChild(line);
    });
}

async function vote(id, type) {
    const confessionRef = db.collection("confessions").doc(id);
    const confession = (await confessionRef.get()).data();
    if (type === "like") {
        await confessionRef.update({ likes: confession.likes + 1 });
        if (confession.timeLeft === 0) {
            await confessionRef.update({ timeLeft: 600 });
            startTimer(id);
        } else if (confession.timeLeft < 1800) {
            await confessionRef.update({ timeLeft: confession.timeLeft + 300 });
        }
    } else {
        await confessionRef.update({ dislikes: confession.dislikes + 1 });
    }
}

async function startTimer(id) {
    const confessionRef = db.collection("confessions").doc(id);
    let interval = setInterval(async () => {
        const confession = (await confessionRef.get()).data();
        if (confession.timeLeft > 0 && confession.likes - confession.dislikes >= -5) {
            await confessionRef.update({ timeLeft: confession.timeLeft - 1 });
        } else {
            clearInterval(interval);
            if (confession.timeLeft <= 0) {
                await confessionRef.update({ survived: true });
                setTimeout(() => confessionRef.delete(), 2000);
            } else {
                confessionRef.delete();
            }
        }
    }, 1000);
}

async function addReply(id) {
    const reply = sanitizeInput(document.getElementById(`reply-${id}`).value.trim());
    if (reply) {
        const confessionRef = db.collection("confessions").doc(id);
        const confession = (await confessionRef.get()).data();
        await confessionRef.update({
            replies: [...confession.replies, reply]
        });
        document.getElementById(`reply-${id}`).value = "";
    }
}

async function shareConfession(id) {
    const confession = (await db.collection("confessions").doc(id).get()).data();
    const shareUrl = `${window.location.origin}?confession=${id}`;
    if (navigator.share) {
        navigator.share({
            title: `${confession.mood || ""} ${confession.text}`,
            text: "Check out this confession!",
            url: shareUrl
        });
    } else {
        prompt("Copy this link to share:", shareUrl);
    }
}

function showProfile() {
    const modal = document.getElementById("profile-modal");
    const profileDiv = document.getElementById("profile-confessions");
    profileDiv.innerHTML = "";
    const userConfessions = confessions.filter(c => c.userId === currentUser.uid);
    userConfessions.forEach(conf => {
        const div = document.createElement("div");
        div.innerHTML = `
            <p>${conf.text} (Likes: ${conf.likes}, Dislikes: ${conf.dislikes}, Views: ${conf.views}, ${conf.survived ? "Survived" : "Active"})</p>
        `;
        profileDiv.appendChild(div);
    });
    modal.style.display = "block";
}

function closeProfile() {
    document.getElementById("profile-modal").style.display = "none";
}

function showAdminArea() {
    auth.currentUser.getIdTokenResult().then(token => {
        if (token.claims.admin) {
            const modal = document.getElementById("admin-modal");
            const adminDiv = document.getElementById("admin-confessions");
            adminDiv.innerHTML = "";
            confessions.forEach(conf => {
                const div = document.createElement("div");
                div.innerHTML = `
                    <p>${conf.text} (Views: ${conf.views}, Likes: ${conf.likes}, Dislikes: ${conf.dislikes})</p>
                    <button onclick="deleteConfession('${conf.id}')">Delete</button>
                `;
                adminDiv.appendChild(div);
            });
            modal.style.display = "block";
        } else {
            alert("Admin access required!");
        }
    });
}

function closeAdminArea() {
    document.getElementById("admin-modal").style.display = "none";
}

async function deleteConfession(id) {
    await db.collection("confessions").doc(id).delete();
    closeAdminArea();
}

function sanitizeInput(input) {
    const div = document.createElement("div");
    div.textContent = input;
    return div.innerHTML; // Escapes HTML characters
}

function updatePrompt() {
    document.getElementById("prompt").textContent = prompts[promptIndex];
    promptIndex = (promptIndex + 1) % prompts.length;
}
setInterval(updatePrompt, 10000);
updatePrompt();
