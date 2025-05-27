// ✅ Firebase 설정 추가
const firebaseConfig = {
  apiKey: "AIzaSyCipUm4FyEJ5qb2jJ7HEsquLPT9ZMJsGVo",
  authDomain: "todo-app-doss.firebaseapp.com",
  projectId: "todo-app-doss",
  storageBucket: "todo-app-doss.firebasestorage.app",
  messagingSenderId: "477583861361",
  appId: "1:477583861361:web:1a15bbed10c6b846eaddd0",
  measurementId: "G-9344VTECSY",
};

// ✅ Firebase App & Firestore 초기화
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ✅ 요소 선택
const input = document.getElementById("todoInput");
const button = document.getElementById("addBtn");
const list = document.getElementById("todoList");

// ✅ 사용자 이름 (간단한 데모용)
let username =
  localStorage.getItem("username") || prompt("닉네임을 입력하세요:");
localStorage.setItem("username", username);

// ✅ Firestore에서 할 일 불러오기
let todos = [];
function loadTodosFromFirestore() {
  db.collection("todos")
    .orderBy("createdDate", "desc")
    .onSnapshot((snapshot) => {
      todos = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      renderTodos();
    });
}

// ✅ 티어 정보 및 메시지
const tiers = [
  {
    min: 0,
    emoji: "🌱",
    label: "새싹",
    message: "새싹이 자라고 있어요!",
    name: "Seedling",
  },
  {
    min: 3,
    emoji: "💧",
    label: "양육자",
    message: "루틴을 정성껏 키우고 있어요!",
    name: "Nurturer",
  },
  {
    min: 7,
    emoji: "🔥",
    label: "점화자",
    message: "습관에 불이 붙었어요!",
    name: "Igniter",
  },
  {
    min: 14,
    emoji: "❤️‍🔥",
    label: "불꽃지기",
    message: "흐름 유지 천재!",
    name: "Flamekeeper",
  },
  {
    min: 21,
    emoji: "🤖",
    label: "기계인",
    message: "기계처럼 움직이고 있어요!",
    name: "Mechanite",
  },
  {
    min: 30,
    emoji: "😈",
    label: "과열자",
    message: "루틴에 미쳐버린 자 등장!",
    name: "Overburner",
  },
  {
    min: 50,
    emoji: "👹",
    label: "경계지기",
    message: "광란의 경지에 도달했어요!",
    name: "Edgewalker",
  },
  {
    min: 80,
    emoji: "👽",
    label: "초월자",
    message: "인간계를 초월했습니다!",
    name: "Transcendist",
  },
  {
    min: 100,
    emoji: "🧙‍♂️",
    label: "시간술사",
    message: "시간의 흐름을 꿰뚫고 있습니다!",
    name: "Timeweaver",
  },
];

function getTierInfo(streak) {
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (streak >= tiers[i].min) {
      const current = tiers[i];
      const next = tiers[i + 1];
      return { current, next, toNext: next ? next.min - streak : null };
    }
  }
}

function renderTodos() {
  list.innerHTML = "";

  const dateHeader = document.getElementById("dateHeader");
  dateHeader.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:center;"><span>🧱 ${getFormattedDate()}</span><span id="tierInfoBtn" style="cursor:pointer">📊</span></div>`;

  const tierBtn = document.getElementById("tierInfoBtn");
  if (tierBtn) {
    tierBtn.addEventListener("click", () => {
      const overlay = document.createElement("div");
      overlay.style.position = "fixed";
      overlay.style.top = "0";
      overlay.style.left = "0";
      overlay.style.width = "100vw";
      overlay.style.height = "100vh";
      overlay.style.background = "rgba(0, 0, 0, 0.3)";
      overlay.style.zIndex = "9998";
      overlay.addEventListener("click", () =>
        document.body.removeChild(container)
      );

      const popup = document.createElement("div");
      popup.className = "tier-popup-content";
      popup.innerHTML = `
        <h3 style="text-align:center; font-size:18px; margin-bottom:10px;">🏆 티어 랭킹</h3>
        <table style="width:100%; border-collapse:collapse; font-size:15px; text-align:center;">
          <thead><tr><th>티어</th><th>설명</th><th>연속 기준</th></tr></thead>
          <tbody>
            ${tiers
              .map(
                (t) =>
                  `<tr><td>${t.emoji} <strong>${t.label}</strong></td><td>${t.message}</td><td>${t.min}일</td></tr>`
              )
              .join("")}
          </tbody>
        </table>
        <div style="text-align:center; margin-top:12px;"><button id="closeTierPopup" style="background:#007aff; color:white; padding:6px 12px; border:none; border-radius:6px; cursor:pointer;">닫기</button></div>
      `;

      const container = document.createElement("div");
      container.appendChild(overlay);
      container.appendChild(popup);
      document.body.appendChild(container);

      document
        .getElementById("closeTierPopup")
        .addEventListener("click", () => {
          document.body.removeChild(container);
        });
    });
  }

  todos.forEach((todo) => {
    const li = document.createElement("li");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.classList.add("todo-checkbox");
    checkbox.checked = todo.completed;

    checkbox.addEventListener("change", function () {
      db.collection("todos").doc(todo.id).update({
        completed: checkbox.checked,
      });
    });

    const span = document.createElement("span");
    span.textContent = todo.text;
    if (todo.completed) li.classList.add("completed");

    const userSpan = document.createElement("span");
    userSpan.textContent = todo.username ? `👤 ${todo.username}` : "";
    userSpan.style.fontSize = "13px";
    userSpan.style.opacity = "0.6";

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "🗑️";
    deleteBtn.classList.add("delete-btn");
    deleteBtn.addEventListener("click", function () {
      db.collection("todos").doc(todo.id).delete();
    });

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(userSpan);

    const tier = getTierInfo(todo.streak || 0).current;
    const tierSpan = document.createElement("span");
    tierSpan.textContent = `${tier.emoji} ${tier.label} (${
      todo.streak || 0
    }일)`;
    tierSpan.classList.add("streak-badge");
    li.appendChild(tierSpan);

    li.appendChild(deleteBtn);
    list.appendChild(li);
  });
}

function getFormattedDate() {
  const today = new Date();
  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const day = today.getDate();
  const dayOfWeek = weekDays[today.getDay()];
  return `${year}년 ${month}월 ${day}일 (${dayOfWeek})`;
}

function addTodo() {
  const todoText = input.value.trim();
  if (todoText === "") return;

  db.collection("todos").add({
    text: todoText,
    completed: false,
    streak: 0,
    lastCompletedDate: "",
    createdDate: getFormattedDate(),
    username: username,
  });

  input.value = "";
}

button.addEventListener("click", addTodo);
input.addEventListener("keydown", function (e) {
  if (e.key === "Enter") addTodo();
});

// ✅ 최초 실행
loadTodosFromFirestore();
