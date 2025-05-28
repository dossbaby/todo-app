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

// Firebase 초기화
const app = firebase.initializeApp(firebaseConfig);
// Firestore 참조 얻기
const db = firebase.firestore();

// ✅ 사용자 이름 + 이모지 선택 (팝업 기반)
const emojis = ["🐶", "🐱", "🐰", "🦊", "🐻", "🐼", "🐨", "🐸"];
let username = localStorage.getItem("username");
let userIcon = localStorage.getItem("userIcon");

function createUserModal() {
  // 오버레이
  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position:fixed; top:0; left:0;
    width:100vw; height:100vh;
    background:rgba(0,0,0,0.3);
    z-index:9998;
  `;
  // 팝업 컨테이너
  const popup = document.createElement("div");
  popup.className = "tier-popup-content";
  popup.style.cssText = `
    background:white; padding:20px;
    border-radius:8px; width:300px;
    margin:100px auto; text-align:center;
    position:relative;
  `;

  // STEP 1: 닉네임 입력
  const nicknameStep = document.createElement("div");
  nicknameStep.innerHTML = `
    <h3 style="margin-bottom:10px;">👋 닉네임 설정</h3>
    <input id="nicknameInput" placeholder="닉네임 입력"
      style="padding:8px; width:100%; margin-bottom:12px;
             border:1px solid #ccc; border-radius:6px; font-size:14px;"
      value="${username || ""}"
    />
    <button id="nextToEmoji" style="
      background:#007aff; color:white;
      padding:6px 12px; border:none;
      border-radius:6px; cursor:pointer;
    ">다음</button>
  `;

  // STEP 2: 이모지 선택
  const emojiStep = document.createElement("div");
  emojiStep.style.display = "none";
  emojiStep.innerHTML = `
    <h3 style="margin-bottom:10px;">이모지 선택</h3>
    <div style="
      display:grid; grid-template-columns:repeat(4,1fr);
      gap:10px; margin-bottom:16px;
    ">
      ${emojis
        .map(
          (e, i) => `
        <div class="emoji-choice" data-idx="${i}"
             style="cursor:pointer; font-size:24px;
                    padding:4px; border:2px solid transparent;">
          ${e}
        </div>`
        )
        .join("")}
    </div>
    <button id="saveUserBtn" style="
      background:#007aff; color:white;
      padding:6px 12px; border:none;
      border-radius:6px; cursor:pointer;
    ">저장</button>
  `;

  // 컨테이너 조립
  const container = document.createElement("div");
  container.append(overlay, popup);
  popup.append(nicknameStep, emojiStep);
  document.body.appendChild(container);

  // STEP1: 닉네임 입력 후
  document.getElementById("nextToEmoji").addEventListener("click", () => {
    const nick = document.getElementById("nicknameInput").value.trim();
    if (!nick) return alert("닉네임을 입력해주세요");
    username = nick;
    nicknameStep.style.display = "none";
    emojiStep.style.display = "block";
  });

  // STEP2: 이모지 선택
  let selectedIdx = 0;
  emojiStep.querySelectorAll(".emoji-choice").forEach((el) => {
    el.addEventListener("click", () => {
      emojiStep
        .querySelectorAll(".emoji-choice")
        .forEach((e) => (e.style.border = "2px solid transparent"));
      el.style.border = "2px solid #007aff";
      selectedIdx = +el.dataset.idx;
    });
  });

  // STEP2: 저장
  document.getElementById("saveUserBtn").addEventListener("click", () => {
    const oldUser = localStorage.getItem("username");
    const oldIcon = localStorage.getItem("userIcon");

    // 1) 먼저 로컬 스토리지에 저장
    localStorage.setItem("username", username);
    localStorage.setItem("userIcon", userIcon);

    // 2) 기존 Firestore 문서 중 oldUser 로 저장된 것 전부 찾아서 업데이트
    db.collection("todos")
      .where("user", "==", oldUser)
      .get()
      .then((snapshot) => {
        const batch = db.batch();
        snapshot.forEach((doc) => {
          const ref = db.collection("todos").doc(doc.id);
          batch.update(ref, {
            user: username,
            userIcon: userIcon,
          });
        });
        return batch.commit();
      })
      .then(() => {
        console.log("✅ 기존 할 일들에 새 닉네임·아이콘 반영 완료");
        document.body.removeChild(container);
        renderTodos();
      })
      .catch((err) => {
        console.error("❌ 기존 할 일 업데이트 실패:", err);
        document.body.removeChild(container);
        renderTodos();
      });
  });

  // 배경 클릭 시 닫기
  overlay.addEventListener("click", () => {
    document.body.removeChild(container);
  });
}

if (!username || !userIcon) createUserModal();

// ✅ 요소 선택
const input = document.getElementById("todoInput");
const button = document.getElementById("addBtn");
const list = document.getElementById("todoList");

// Firestore에서 todos 컬렉션 구독
let todos = [];
db.collection("todos")
  .orderBy("createdAt")
  .onSnapshot(
    (snapshot) => {
      todos = snapshot.docs.map((doc) => {
        return { id: doc.id, ...doc.data() };
      });
      renderTodos();
    },
    (err) => {
      console.error("❌ Firestore 읽기 실패:", err);
    }
  );

// ✅ 티어 정보 및 메시지 (한글 이름 & 영문 백업)
const tiers = [
  {
    min: 0,
    emoji: "🐹",
    label: "쌩뉴비",
    message: "처음 걸음을 내디뎠어요!",
    name: "Newbie",
  },

  {
    min: 1,
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
  todos.forEach((todo) => {
    if (todo.streak === undefined) todo.streak = 0;
  });

  list.innerHTML = "";

  const dateHeader = document.getElementById("dateHeader");
  dateHeader.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:center;"><span>${getFormattedDate()}</span><div style="display:flex; gap:8px;"><span id="userSetting" style="cursor:pointer">🪳</span><span id="tierInfoBtn" style="cursor:pointer">🧱</span></div></div>`;

  document.getElementById("userSetting").addEventListener("click", () => {
    createUserModal();
  });

  document.getElementById("tierInfoBtn").addEventListener("click", () => {
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
    // 팝업마다 고유한 클래스 사용
    popup.className = "user-modal-content";
    popup.innerHTML = `
      <h3 style="text-align:center; font-size:18px; margin-bottom:10px;">🏆 티어 랭킹</h3>
      <table style="width:100%; border-collapse:collapse; font-size:15px; text-align:center;">
        <thead><tr><th>티어</th><th>설명</th><th>연속 기준</th></tr></thead>
        <tbody>
          ${tiers
            .map(
              (t) =>
                `<tr><td style="padding:6px 8px; white-space:nowrap;">${t.emoji} <strong>${t.label}</strong></td><td style="padding:6px 8px;">${t.message}</td><td style="padding:6px 8px;">${t.min}일</td></tr>`
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

    document.getElementById("closeTierPopup").addEventListener("click", () => {
      document.body.removeChild(container);
    });
  });

  todos.forEach((todo, index) => {
    const li = document.createElement("li");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.classList.add("todo-checkbox");
    checkbox.checked = todo.completed;

    // checkbox 클릭/변경 이벤트를 Firestore 업데이트로 대체
    checkbox.addEventListener("change", () => {
      const docRef = db.collection("todos").doc(todo.id);
      const isDone = checkbox.checked;
      const newStreak = isDone ? (todo.streak || 0) + 1 : todo.streak;
      const updates = {
        completed: isDone,
        lastCompletedDate: isDone ? getFormattedDate() : todo.lastCompletedDate,
        streak: newStreak,
      };

      docRef
        .update(updates)
        .then(() => {
          console.log("✅ Firestore 업데이트 성공");
          if (isDone) showStreakPopup(newStreak);
        })
        .catch((err) => console.error("❌ 업데이트 실패:", err));
    });

    const span = document.createElement("span");
    span.textContent = todo.text;
    if (todo.completed) li.classList.add("completed");

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "🗑️";
    deleteBtn.classList.add("delete-btn");
    deleteBtn.addEventListener("click", () => {
      showConfirmModal("정말 삭제하시겠습니까?", () => {
        db.collection("todos")
          .doc(todo.id)
          .delete()
          .then(() => console.log("🗑️ Firestore에서 삭제 완료"))
          .catch((err) => console.error("❌ 삭제 실패:", err));
      });
    });

    const userLabel = document.createElement("span");
    const icon = todo.userIcon || userIcon;
    const name = todo.user || username;
    userLabel.textContent = `${icon} ${name}`;
    userLabel.style.fontSize = "12px";
    userLabel.style.opacity = "0.6";

    li.appendChild(checkbox);
    // 오늘 날짜로 체크된 항목이면 다시 클릭 못 하게 막기
    if (todo.completed && todo.lastCompletedDate === getFormattedDate()) {
      checkbox.disabled = true;
    }

    li.appendChild(span);
    li.appendChild(userLabel);

    const tier = getTierInfo(todo.streak || 0).current;
    const tierSpan = document.createElement("span");
    tierSpan.textContent = `${tier.emoji} ${tier.label} (${
      todo.streak || 0
    }일)`;
    tierSpan.classList.add("streak-badge");
    li.appendChild(tierSpan);

    const now = new Date();
    const hour = now.getHours();
    if (todo.createdDate === getFormattedDate() && hour >= 21) {
      const deadlineIcon = document.createElement("span");
      deadlineIcon.textContent = "⏳";
      deadlineIcon.classList.add("deadline-icon", "urgent");
      li.appendChild(deadlineIcon);
    }

    li.appendChild(deleteBtn);
    list.appendChild(li);
  });
}

function showStreakPopup(streak) {
  const { current, next, toNext } = getTierInfo(streak);

  // 메인 팝업
  const box = document.createElement("div");
  box.className = "floating-streak-box";
  box.innerHTML = `<div class="floating-emoji">${current.emoji}</div>
                   <div class="floating-message">${current.message}</div>`;
  document.body.appendChild(box);

  setTimeout(() => {
    box.remove();

    // 다음 티어까지 안내 팝업
    if (next) {
      const nextBox = document.createElement("div");
      nextBox.className = "floating-streak-box";
      nextBox.innerHTML = `<div class="floating-emoji">${next.emoji}</div>
                           <div class="floating-message">${next.label}까지 ${toNext}일 남았어요! 고고!</div>`;
      document.body.appendChild(nextBox);
      setTimeout(() => nextBox.remove(), 1800);
    }
  }, 1800);
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

function saveTodos() {
  localStorage.setItem("todos", JSON.stringify(todos));
}

function addTodo() {
  console.log("▶ addTodo 실행됨"); // 여기가 찍히나 확인
  const todoText = input.value.trim();
  if (!todoText) return;

  // 1) 로컬스토리지 저장 대신 Firestore에 쓰기
  db.collection("todos")
    .add({
      text: todoText,
      completed: false,
      streak: 0,
      createdDate: getFormattedDate(),
      user: username,
      userIcon: userIcon,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    })
    .then(() => {
      console.log("✅ Firestore에 할 일 저장 완료");
      input.value = "";
    })
    .catch((err) => {
      console.error("❌ Firestore 저장 실패:", err);
    });
}

function updateTodosByDate() {
  const today = getFormattedDate();
  todos.forEach((todo) => {
    // 오늘 만든 게 아니면
    if (todo.createdDate !== today) {
      const docRef = db.collection("todos").doc(todo.id);

      if (todo.completed && todo.lastCompletedDate !== today) {
        // 어제 완료했던 건: streak +1, completed 리셋, 날짜 갱신
        const newStreak = (todo.streak || 0) + 1;
        docRef
          .update({
            streak: newStreak,
            completed: false,
            createdDate: today,
            lastCompletedDate: today,
          })
          .then(() => console.log(`✅ ${todo.text} 날짜 업데이트`))
          .catch((err) => console.error("❌ 업데이트 실패", err));
      } else {
        // 안 한 건/이미 처리된 건 지우기
        docRef
          .delete()
          .then(() => console.log(`🗑️ ${todo.text} 삭제`))
          .catch((err) => console.error("❌ 삭제 실패", err));
      }
    }
  });
}

let initialized = false;
db.collection("todos")
  .orderBy("createdAt")
  .onSnapshot(
    (snapshot) => {
      todos = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      if (!initialized) {
        updateTodosByDate();
        initialized = true;
      }

      renderTodos();
    },
    (err) => {
      console.error("❌ Firestore 읽기 실패:", err);
    }
  );

// 자정에 한 번 실행하고, 매일 자정마다 반복 호출하는 함수
function scheduleMidnightUpdate() {
  const now = new Date();
  // KST 기준으로 다음 날 자정 시각 계산
  const tomorrow = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1
  );
  const delay = tomorrow.getTime() - now.getTime();

  setTimeout(() => {
    updateTodosByDate(); // 자정에 루틴 갱신
    scheduleMidnightUpdate(); // 다시 다음 자정 스케줄
  }, delay);
}

// onSnapshot 리스너 설정 끝난 뒤 한 번만 호출
scheduleMidnightUpdate();

function showConfirmModal(message, onConfirm) {
  // 1) 오버레이
  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position:fixed; top:0; left:0;
    width:100vw; height:100vh;
    background:rgba(0,0,0,0.3);
    z-index:10000;
  `;

  // 2) 팝업
  const popup = document.createElement("div");
  popup.style.cssText = `
    position:fixed;
    top:50%; left:50%;
    transform:translate(-50%,-50%);
    background:#fff;
    padding:20px;
    border-radius:8px;
    box-shadow:0 8px 20px rgba(0,0,0,0.2);
    text-align:center;
    z-index:10001;
  `;
  popup.innerHTML = `
    <p style="margin-bottom:16px; font-size:16px;">${message}</p>
    <button id="confirmYes" style="
      background:#ff3b30; color:#fff;
      padding:8px 16px; border:none;
      border-radius:6px; margin-right:8px;
      cursor:pointer;
    ">삭제</button>
    <button id="confirmNo" style="
      background:#ccc; color:#333;
      padding:8px 16px; border:none;
      border-radius:6px; cursor:pointer;
    ">취소</button>
  `;

  const container = document.createElement("div");
  container.append(overlay, popup);
  document.body.appendChild(container);

  // 3) 클릭 이벤트
  document.getElementById("confirmYes").addEventListener("click", () => {
    onConfirm();
    document.body.removeChild(container);
  });
  document.getElementById("confirmNo").addEventListener("click", () => {
    document.body.removeChild(container);
  });

  // 오버레이 클릭해도 닫히게
  overlay.addEventListener("click", () => {
    document.body.removeChild(container);
  });
}

button.addEventListener("click", addTodo);
input.addEventListener("keydown", function (e) {
  if (e.key === "Enter") addTodo();
});
