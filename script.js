const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const categoryInput = document.getElementById("todo-category");
const priorityInput = document.getElementById("todo-priority");
const dueInput = document.getElementById("todo-due");
const list = document.getElementById("todo-list");
const emptyHint = document.getElementById("empty-hint");
const declinedList = document.getElementById("declined-list");
const declinedEmpty = document.getElementById("declined-empty");
const searchInput = document.getElementById("search-input");
const filterCategory = document.getElementById("filter-category");
const filterPriority = document.getElementById("filter-priority");
const sortSelect = document.getElementById("sort-select");

const ringFill = document.getElementById("ring-fill");
const dashboardPercent = document.getElementById("dashboard-percent");
const dashboardSummary = document.getElementById("dashboard-summary");
const statOpen = document.getElementById("stat-open");
const statDone = document.getElementById("stat-done");
const statOverdue = document.getElementById("stat-overdue");
const dashboardCategories = document.getElementById("dashboard-categories");

const viewTabs = document.querySelectorAll(".view-tab");
const listView = document.getElementById("list-view");
const calendarView = document.getElementById("calendar-view");
const calPrev = document.getElementById("cal-prev");
const calNext = document.getElementById("cal-next");
const calMonthLabel = document.getElementById("cal-month-label");
const calendarGrid = document.getElementById("calendar-grid");
const calendarDayDetail = document.getElementById("calendar-day-detail");
const calendarDayTitle = document.getElementById("calendar-day-title");
const calendarDayList = document.getElementById("calendar-day-list");

const reminderToggle = document.getElementById("reminder-toggle");
const reminderBanner = document.getElementById("reminder-banner");

const RING_CIRCUMFERENCE = 2 * Math.PI * 42;
const PRIORITY_ORDER = { Hoch: 0, Mittel: 1, Niedrig: 2 };
const CATEGORY_ICON = { Arbeit: "💼", Studium: "📚", Privat: "🏠" };

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

let todos = JSON.parse(localStorage.getItem("todos") || "[]").map((t) => ({
  id: t.id || makeId(),
  text: t.text,
  done: !!t.done,
  category: t.category || "Privat",
  priority: t.priority || "Mittel",
  dueDate: t.dueDate || "",
}));
let declined = JSON.parse(localStorage.getItem("declined") || "[]");
let justAddedDeclinedIndex = null;
let editingId = null;

function save() {
  localStorage.setItem("todos", JSON.stringify(todos));
}

function saveDeclined() {
  localStorage.setItem("declined", JSON.stringify(declined));
}

function formatDate(isoDate) {
  const [year, month, day] = isoDate.split("-");
  return `${day}.${month}.${year.slice(2)}`;
}

function isOverdue(todo) {
  if (!todo.dueDate || todo.done) return false;
  const today = new Date().toISOString().slice(0, 10);
  return todo.dueDate < today;
}

function getVisibleTodos() {
  const query = searchInput.value.trim().toLowerCase();
  const category = filterCategory.value;
  const priority = filterPriority.value;
  const sortBy = sortSelect.value;

  let visible = todos.filter((todo) => {
    if (query && !todo.text.toLowerCase().includes(query)) return false;
    if (category !== "all" && todo.category !== category) return false;
    if (priority !== "all" && todo.priority !== priority) return false;
    return true;
  });

  visible = visible.slice();
  if (sortBy === "priority") {
    visible.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
  } else if (sortBy === "due") {
    visible.sort((a, b) => (a.dueDate || "9999-99-99").localeCompare(b.dueDate || "9999-99-99"));
  } else if (sortBy === "alpha") {
    visible.sort((a, b) => a.text.localeCompare(b.text, "de"));
  } else {
    visible.reverse();
  }

  return visible;
}

function render() {
  list.innerHTML = "";
  const visible = getVisibleTodos();
  emptyHint.style.display = visible.length === 0 ? "block" : "none";
  emptyHint.textContent =
    todos.length === 0
      ? "Noch keine Aufgaben – leg los!"
      : "Keine Aufgaben passen zu deiner Suche/Filterung.";

  visible.forEach((todo) => {
    const li = document.createElement("li");
    li.className = todo.done ? "done" : "";

    if (todo.id === editingId) {
      li.appendChild(buildEditForm(todo));
      list.appendChild(li);
      return;
    }

    const main = document.createElement("div");
    main.className = "todo-main";

    const span = document.createElement("span");
    span.textContent = todo.text;
    span.addEventListener("click", () => {
      todo.done = !todo.done;
      save();
      render();
    });

    const actions = document.createElement("div");
    actions.className = "todo-actions";

    const editBtn = document.createElement("button");
    editBtn.textContent = "✎";
    editBtn.className = "edit-btn";
    editBtn.type = "button";
    editBtn.addEventListener("click", () => {
      editingId = todo.id;
      render();
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "✕";
    deleteBtn.className = "delete-btn";
    deleteBtn.type = "button";
    deleteBtn.addEventListener("click", () => {
      todos = todos.filter((t) => t.id !== todo.id);
      save();
      render();
    });

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    main.appendChild(span);
    main.appendChild(actions);

    const meta = document.createElement("div");
    meta.className = "todo-meta";

    const categoryBadge = document.createElement("span");
    categoryBadge.className = `badge badge-category-${todo.category}`;
    categoryBadge.textContent = `${CATEGORY_ICON[todo.category] || ""} ${todo.category}`;
    meta.appendChild(categoryBadge);

    const priorityBadge = document.createElement("span");
    priorityBadge.className = `badge badge-priority-${todo.priority}`;
    priorityBadge.textContent = todo.priority;
    meta.appendChild(priorityBadge);

    if (todo.dueDate) {
      const due = document.createElement("span");
      due.className = "due-date" + (isOverdue(todo) ? " overdue" : "");
      due.textContent = `📅 ${formatDate(todo.dueDate)}`;
      meta.appendChild(due);
    }

    li.appendChild(main);
    li.appendChild(meta);
    list.appendChild(li);
  });

  renderDashboard();
}

function buildEditForm(todo) {
  const wrap = document.createElement("div");
  wrap.className = "edit-form";

  const textInput = document.createElement("input");
  textInput.type = "text";
  textInput.value = todo.text;

  const row = document.createElement("div");
  row.className = "edit-form-row";

  const categorySelect = document.createElement("select");
  ["Arbeit", "Studium", "Privat"].forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = `${CATEGORY_ICON[cat]} ${cat}`;
    if (cat === todo.category) opt.selected = true;
    categorySelect.appendChild(opt);
  });

  const prioritySelect = document.createElement("select");
  ["Niedrig", "Mittel", "Hoch"].forEach((prio) => {
    const opt = document.createElement("option");
    opt.value = prio;
    opt.textContent = prio;
    if (prio === todo.priority) opt.selected = true;
    prioritySelect.appendChild(opt);
  });

  const dateInput = document.createElement("input");
  dateInput.type = "date";
  dateInput.value = todo.dueDate;

  row.appendChild(categorySelect);
  row.appendChild(prioritySelect);
  row.appendChild(dateInput);

  const actions = document.createElement("div");
  actions.className = "edit-form-actions";

  const saveBtn = document.createElement("button");
  saveBtn.type = "button";
  saveBtn.textContent = "Speichern";
  saveBtn.addEventListener("click", () => {
    const text = textInput.value.trim();
    if (!text) return;
    todo.text = text;
    todo.category = categorySelect.value;
    todo.priority = prioritySelect.value;
    todo.dueDate = dateInput.value;
    editingId = null;
    save();
    render();
  });

  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className = "btn-secondary";
  cancelBtn.textContent = "Abbrechen";
  cancelBtn.addEventListener("click", () => {
    editingId = null;
    render();
  });

  actions.appendChild(saveBtn);
  actions.appendChild(cancelBtn);

  wrap.appendChild(textInput);
  wrap.appendChild(row);
  wrap.appendChild(actions);
  return wrap;
}

function renderDeclined() {
  declinedList.innerHTML = "";
  declinedEmpty.style.display = declined.length === 0 ? "block" : "none";

  declined.forEach((text, index) => {
    const li = document.createElement("li");
    if (index === justAddedDeclinedIndex) li.className = "just-added-left";

    const span = document.createElement("span");
    span.textContent = text;

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "✕";
    deleteBtn.className = "delete-btn";
    deleteBtn.addEventListener("click", () => {
      declined.splice(index, 1);
      saveDeclined();
      renderDeclined();
    });

    li.appendChild(span);
    li.appendChild(deleteBtn);
    declinedList.appendChild(li);
  });

  justAddedDeclinedIndex = null;
}

function renderDashboard() {
  const total = todos.length;
  const done = todos.filter((t) => t.done).length;
  const open = total - done;
  const overdue = todos.filter(isOverdue).length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  dashboardPercent.textContent = `${percent}%`;
  dashboardSummary.textContent = `${done} von ${total} Aufgaben erledigt`;
  statOpen.textContent = open;
  statDone.textContent = done;
  statOverdue.textContent = overdue;

  const offset = RING_CIRCUMFERENCE * (1 - percent / 100);
  ringFill.style.strokeDashoffset = offset;

  dashboardCategories.innerHTML = "";
  ["Arbeit", "Studium", "Privat"].forEach((cat) => {
    const count = todos.filter((t) => t.category === cat).length;
    const badge = document.createElement("span");
    badge.className = `badge badge-category-${cat}`;
    badge.textContent = `${CATEGORY_ICON[cat]} ${cat}: ${count}`;
    dashboardCategories.appendChild(badge);
  });

  checkReminders();
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toISO(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

const MONTH_NAMES = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

let calendarCursor = new Date();
calendarCursor.setDate(1);
let selectedDay = null;

function renderCalendar() {
  calendarGrid.innerHTML = "";
  const year = calendarCursor.getFullYear();
  const month = calendarCursor.getMonth();
  calMonthLabel.textContent = `${MONTH_NAMES[month]} ${year}`;

  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayISO = toISO(new Date());

  for (let i = 0; i < startOffset; i++) {
    const empty = document.createElement("div");
    empty.className = "calendar-day empty";
    calendarGrid.appendChild(empty);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateISO = `${year}-${pad2(month + 1)}-${pad2(day)}`;
    const cell = document.createElement("div");
    cell.className = "calendar-day";
    if (dateISO === todayISO) cell.classList.add("today");
    if (dateISO === selectedDay) cell.classList.add("selected");

    const num = document.createElement("span");
    num.textContent = day;
    cell.appendChild(num);

    const dayTodos = todos.filter((t) => t.dueDate === dateISO);
    if (dayTodos.length > 0) {
      const dots = document.createElement("div");
      dots.className = "calendar-day-dots";
      [...new Set(dayTodos.map((t) => t.priority))].slice(0, 3).forEach((p) => {
        const dot = document.createElement("span");
        dot.className = `dot-${p}`;
        dots.appendChild(dot);
      });
      cell.appendChild(dots);
    }

    cell.addEventListener("click", () => {
      selectedDay = dateISO;
      renderCalendar();
      renderCalendarDay();
    });

    calendarGrid.appendChild(cell);
  }
}

function renderCalendarDay() {
  if (!selectedDay) {
    calendarDayDetail.hidden = true;
    return;
  }

  const dayTodos = todos.filter((t) => t.dueDate === selectedDay);
  calendarDayDetail.hidden = false;
  const [y, m, d] = selectedDay.split("-");
  calendarDayTitle.textContent = `Aufgaben am ${d}.${m}.${y}`;
  calendarDayList.innerHTML = "";

  if (dayTodos.length === 0) {
    const li = document.createElement("li");
    li.textContent = "Keine Aufgaben an diesem Tag.";
    li.style.color = "#7d8bb0";
    calendarDayList.appendChild(li);
    return;
  }

  dayTodos.forEach((todo) => {
    const li = document.createElement("li");
    li.className = todo.done ? "done" : "";

    const main = document.createElement("div");
    main.className = "todo-main";
    const span = document.createElement("span");
    span.textContent = todo.text;
    span.addEventListener("click", () => {
      todo.done = !todo.done;
      save();
      render();
      renderCalendar();
      renderCalendarDay();
    });
    main.appendChild(span);

    const badge = document.createElement("span");
    badge.className = `badge badge-priority-${todo.priority}`;
    badge.textContent = todo.priority;

    li.appendChild(main);
    li.appendChild(badge);
    calendarDayList.appendChild(li);
  });
}

viewTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    viewTabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    const isCalendar = tab.dataset.view === "calendar";
    listView.hidden = isCalendar;
    calendarView.hidden = !isCalendar;
    if (isCalendar) {
      renderCalendar();
      renderCalendarDay();
    }
  });
});

calPrev.addEventListener("click", () => {
  calendarCursor.setMonth(calendarCursor.getMonth() - 1);
  renderCalendar();
});

calNext.addEventListener("click", () => {
  calendarCursor.setMonth(calendarCursor.getMonth() + 1);
  renderCalendar();
});

let remindersEnabled = localStorage.getItem("remindersEnabled") === "true";
const notifiedIds = new Set();

function updateReminderButton() {
  const active = remindersEnabled && "Notification" in window && Notification.permission === "granted";
  reminderToggle.textContent = active ? "🔔 Erinnerungen aktiv" : "🔔 Erinnerungen aktivieren";
}

reminderToggle.addEventListener("click", async () => {
  if (!("Notification" in window)) {
    alert("Dein Browser unterstützt keine Benachrichtigungen.");
    return;
  }
  const permission = await Notification.requestPermission();
  if (permission === "granted") {
    remindersEnabled = true;
    localStorage.setItem("remindersEnabled", "true");
    new Notification("Erinnerungen aktiviert 🔔", {
      body: "Du wirst ab jetzt an fällige Aufgaben erinnert.",
    });
  }
  updateReminderButton();
  checkReminders();
});

function checkReminders() {
  const todayISO = toISO(new Date());
  const due = todos.filter((t) => !t.done && t.dueDate && t.dueDate <= todayISO);

  if (due.length > 0) {
    reminderBanner.hidden = false;
    reminderBanner.textContent = `⏰ ${due.length} Aufgabe${due.length > 1 ? "n" : ""} ${due.length > 1 ? "sind" : "ist"} fällig oder überfällig!`;
  } else {
    reminderBanner.hidden = true;
  }

  if (remindersEnabled && "Notification" in window && Notification.permission === "granted") {
    due.forEach((t) => {
      if (!notifiedIds.has(t.id)) {
        notifiedIds.add(t.id);
        new Notification("Aufgabe fällig ⏰", { body: t.text });
      }
    });
  }
}

function addTodo(text, options = {}) {
  const todo = {
    id: makeId(),
    text,
    done: options.done || false,
    category: options.category || "Privat",
    priority: options.priority || "Mittel",
    dueDate: options.dueDate || "",
  };
  todos.push(todo);
  save();
  render();
}

function addDeclined(text) {
  declined.push(text);
  justAddedDeclinedIndex = declined.length - 1;
  saveDeclined();
  renderDeclined();
}

document.querySelectorAll(".suggestion").forEach((btn) => {
  btn.addEventListener("click", () => {
    addTodo(btn.dataset.text);
  });
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const raw = input.value.trim();
  if (!raw) return;

  const noMatch = raw.match(/^no\s+(.+)/i);
  if (noMatch) {
    addDeclined(noMatch[1].trim());
  } else {
    addTodo(raw, {
      category: categoryInput.value,
      priority: priorityInput.value,
      dueDate: dueInput.value,
    });
  }

  input.value = "";
  dueInput.value = "";
  input.focus();
});

[searchInput, filterCategory, filterPriority, sortSelect].forEach((el) => {
  el.addEventListener("input", render);
  el.addEventListener("change", render);
});

updateReminderButton();
render();
renderDeclined();
setInterval(checkReminders, 5 * 60 * 1000);
