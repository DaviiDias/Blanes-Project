(() => {
  const STORAGE_KEY = "blanes-suite.boards";
  const THEME_STORAGE_KEY = "blanes-mail-theme";
  const STORAGE_VERSION = 3;
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const KANBAN_LIST_TITLE_MAX_LENGTH = 52;
  const KANBAN_MAX_VISIBLE_CARDS = 6;
  const CALENDAR_WEEK_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
  const CALENDAR_MONTHS = [
    "Janeiro",
    "Fevereiro",
    "Marco",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  const boardPalette = [
    { name: "Azul oceano", value: "#1d4ed8" },
    { name: "Ciano energia", value: "#0e7490" },
    { name: "Verde esmeralda", value: "#047857" },
    { name: "Laranja vivo", value: "#c2410c" },
    { name: "Vermelho coral", value: "#be123c" },
    { name: "Violeta moderno", value: "#6d28d9" },
    { name: "Carvao", value: "#1f2937" },
    { name: "Indigo", value: "#3730a3" },
  ];

  const DEFAULT_WORKSPACE = {
    id: "workspace-main",
    name: "Area de trabalho Blanes",
    currentUser: "Chewie",
    collaborators: ["Chewie", "Aline", "Thiago", "Mariana"],
  };

  function nowISO() {
    return new Date().toISOString();
  }

  const seedBoards = [
    {
      id: "board-product-roadmap",
      title: "Roadmap do Produto",
      color: "#2f8f74",
      workspaceId: DEFAULT_WORKSPACE.id,
      createdAt: nowISO(),
    },
    {
      id: "board-sprint-planning",
      title: "Planejamento Sprint 24",
      color: "#2f6fe4",
      workspaceId: DEFAULT_WORKSPACE.id,
      createdAt: nowISO(),
    },
    {
      id: "board-tech-debt",
      title: "Debitos Tecnicos",
      color: "#ca7b1f",
      workspaceId: DEFAULT_WORKSPACE.id,
      createdAt: nowISO(),
    },
  ];

  const seedLists = [
    { id: "list-backlog", boardId: "board-product-roadmap", title: "Backlog", order: 0, createdAt: nowISO() },
    { id: "list-refinement", boardId: "board-product-roadmap", title: "Refinamento", order: 1, createdAt: nowISO() },
    { id: "list-doing", boardId: "board-product-roadmap", title: "Em andamento", order: 2, createdAt: nowISO() },
    { id: "list-sprint-backlog", boardId: "board-sprint-planning", title: "Sprint backlog", order: 0, createdAt: nowISO() },
    { id: "list-sprint-progress", boardId: "board-sprint-planning", title: "Executando", order: 1, createdAt: nowISO() },
    { id: "list-debt-priority", boardId: "board-tech-debt", title: "Prioridade alta", order: 0, createdAt: nowISO() },
  ];

  const seedCards = [
    {
      id: "card-prd-notifications",
      boardId: "board-product-roadmap",
      listId: "list-backlog",
      title: "Definir PRD de notificacoes de entrega",
      description: "Consolidar escopo, metricas e impactos para o fluxo de notificacoes.",
      createdBy: "Chewie",
      assignees: ["Chewie", "Aline"],
      priority: "high",
      completed: false,
      order: 0,
      startDateISO: nowISO(),
      endDateISO: new Date(Date.now() + 7 * MS_PER_DAY).toISOString(),
      createdAt: nowISO(),
    },
    {
      id: "card-api-contract",
      boardId: "board-product-roadmap",
      listId: "list-refinement",
      title: "Aprovar contrato frontend para scheduler",
      createdBy: "Aline",
      assignees: ["Aline"],
      priority: "medium",
      completed: false,
      order: 0,
      createdAt: nowISO(),
    },
    {
      id: "card-kanban-columns",
      boardId: "board-product-roadmap",
      listId: "list-doing",
      title: "Implementar fluxo de colunas dinamicas",
      createdBy: "Chewie",
      assignees: ["Chewie", "Thiago"],
      priority: "low",
      completed: true,
      order: 0,
      createdAt: nowISO(),
    },
    {
      id: "card-sprint-goal",
      boardId: "board-sprint-planning",
      listId: "list-sprint-backlog",
      title: "Definir objetivo da sprint e criterios",
      createdBy: "Thiago",
      assignees: ["Thiago"],
      priority: "high",
      completed: false,
      order: 0,
      createdAt: nowISO(),
    },
    {
      id: "card-types-cleanup",
      boardId: "board-tech-debt",
      listId: "list-debt-priority",
      title: "Padronizar tipos compartilhados do dominio",
      createdBy: "Aline",
      assignees: ["Aline", "Chewie"],
      priority: "medium",
      completed: false,
      order: 0,
      createdAt: nowISO(),
    },
  ];

  function createId(prefix) {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return `${prefix}-${window.crypto.randomUUID()}`;
    }

    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function getCardOrder(card) {
    if (typeof card.order === "number" && Number.isFinite(card.order)) {
      return card.order;
    }
    return 0;
  }

  function migrateState(raw) {
    if (!raw || typeof raw !== "object") {
      return null;
    }

    const cards = Array.isArray(raw.cards)
      ? raw.cards.map((card, index) => ({
          ...card,
          description: card.description || undefined,
          createdBy: typeof card.createdBy === "string" ? card.createdBy : undefined,
          assignees: Array.isArray(card.assignees)
            ? card.assignees.map((name) => String(name).trim()).filter(Boolean)
            : [],
          priority: card.priority || "medium",
          order: typeof card.order === "number" && Number.isFinite(card.order) ? card.order : index,
        }))
      : [];

    const workspace = {
      ...DEFAULT_WORKSPACE,
      ...(raw.workspace || {}),
      collaborators:
        Array.isArray(raw.workspace && raw.workspace.collaborators) && raw.workspace.collaborators.length
          ? Array.from(new Set(raw.workspace.collaborators.map((n) => String(n).trim()).filter(Boolean)))
          : DEFAULT_WORKSPACE.collaborators,
      currentUser:
        raw.workspace && typeof raw.workspace.currentUser === "string" && raw.workspace.currentUser.trim()
          ? raw.workspace.currentUser.trim()
          : DEFAULT_WORKSPACE.currentUser,
    };

    return {
      workspace,
      boards: Array.isArray(raw.boards) ? raw.boards : seedBoards,
      lists: Array.isArray(raw.lists) ? raw.lists : seedLists,
      cards,
    };
  }

  function loadState() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return {
          workspace: DEFAULT_WORKSPACE,
          boards: seedBoards,
          lists: seedLists,
          cards: seedCards,
        };
      }

      const parsed = JSON.parse(raw);
      const persisted = parsed && typeof parsed === "object" && parsed.state ? parsed.state : parsed;
      const migrated = migrateState(persisted);

      if (!migrated) {
        return {
          workspace: DEFAULT_WORKSPACE,
          boards: seedBoards,
          lists: seedLists,
          cards: seedCards,
        };
      }

      return migrated;
    } catch {
      return {
        workspace: DEFAULT_WORKSPACE,
        boards: seedBoards,
        lists: seedLists,
        cards: seedCards,
      };
    }
  }

  function saveState() {
    const snapshot = {
      state: {
        boards: state.boards,
        lists: state.lists,
        cards: state.cards,
      },
      version: STORAGE_VERSION,
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  }

  const state = loadState();

  const ui = {
    route: { name: "boards", boardId: "" },
    isMobileNavOpen: false,
    activeBoardListIndex: 0,
    searchQuery: "",
    isSearchOpen: false,
    isProfileMenuOpen: false,
    isCreateBoardOpen: false,
    isCreateListOpen: false,
    isGanttModalOpen: false,
    isSchedulerModalOpen: false,
    isPayloadModalOpen: false,
    payloadFeedback: "",
    draggingListId: null,
    draggingCardId: null,
    isBoardPanning: false,
    boardPanState: {
      active: false,
      pointerStartX: 0,
      startScrollLeft: 0,
      boardEl: null,
    },
    activeCardId: null,
    boardTitleEditing: false,
    draftBoardTitle: "",
    editingListId: null,
    draftListTitle: "",
    composerListId: null,
    draftCardTitle: "",
    dropTargetListId: null,
    dropListTargetId: null,
    createBoardForm: {
      title: "",
      color: boardPalette[0].value,
    },
    createListForm: {
      title: "",
    },
    cardForm: {
      title: "",
      description: "",
      selectedAssignee: "",
      priority: "medium",
      startDate: "",
      endDate: "",
    },
    datePicker: {
      openFor: null,
      visibleMonth: new Date().getMonth(),
      visibleYear: new Date().getFullYear(),
    },
    theme: "dark",
  };

  const app = document.getElementById("app");

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function resolveInitialTheme() {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === "light" || savedTheme === "dark") {
      return savedTheme;
    }
    return "dark";
  }

  function getThemeToggleElements() {
    return {
      button: document.getElementById("theme-toggle-btn"),
      icon: document.getElementById("theme-toggle-icon"),
      label: document.getElementById("theme-toggle-label"),
      chip: document.getElementById("theme-toggle-chip"),
    };
  }

  function applyTheme(theme) {
    const nextTheme = theme === "light" ? "light" : "dark";
    const isDark = nextTheme === "dark";

    ui.theme = nextTheme;
    document.body.classList.toggle("theme-dark", isDark);
    document.documentElement.style.colorScheme = isDark ? "dark" : "light";

    const elements = getThemeToggleElements();
    if (!elements.button || !elements.icon || !elements.label || !elements.chip) {
      return;
    }

    elements.button.setAttribute("aria-pressed", String(isDark));
    elements.label.textContent = isDark ? "Modo escuro" : "Modo claro";
    elements.chip.textContent = isDark ? "Escuro" : "Claro";
    elements.icon.className = isDark ? "bx bx-moon" : "bx bx-sun";
  }

  function toggleTheme() {
    const nextTheme = ui.theme === "dark" ? "light" : "dark";
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
  }

  function parseRoute() {
    const rawHash = (window.location.hash || "#/" ).replace(/^#/, "");

    if (rawHash === "/" || rawHash === "") {
      return { name: "boards", boardId: "" };
    }

    const boardMatch = rawHash.match(/^\/boards\/([^/]+)$/);
    if (boardMatch) {
      return { name: "board", boardId: decodeURIComponent(boardMatch[1]) };
    }

    return { name: "boards", boardId: "" };
  }

  function setRoute(route) {
    if (route.name === "board" && route.boardId) {
      window.location.hash = `#/boards/${encodeURIComponent(route.boardId)}`;
      return;
    }

    window.location.hash = "#/";
  }

  function getBoardById(boardId) {
    return state.boards.find((board) => board.id === boardId);
  }

  function getListsByBoardId(boardId) {
    return state.lists.filter((list) => list.boardId === boardId).sort((a, b) => a.order - b.order);
  }

  function getCardsByListId(listId) {
    return state.cards
      .filter((card) => card.listId === listId)
      .sort((a, b) => getCardOrder(a) - getCardOrder(b) || a.createdAt.localeCompare(b.createdAt));
  }

  function createBoard(input) {
    const nextBoard = {
      id: createId("board"),
      title: input.title.trim(),
      color: input.color,
      workspaceId: DEFAULT_WORKSPACE.id,
      createdAt: nowISO(),
    };

    state.boards = [nextBoard].concat(state.boards);
    saveState();
    return nextBoard;
  }

  function updateBoardTitle(boardId, title) {
    const nextTitle = title.trim();
    if (nextTitle.length < 2) {
      return;
    }

    state.boards = state.boards.map((board) =>
      board.id === boardId
        ? {
            ...board,
            title: nextTitle,
          }
        : board
    );

    saveState();
  }

  function createList(boardId, title) {
    const cleanTitle = title.trim();
    const maxOrder = state.lists
      .filter((list) => list.boardId === boardId)
      .reduce((max, list) => Math.max(max, list.order), -1);

    const nextList = {
      id: createId("list"),
      boardId,
      title: cleanTitle,
      order: maxOrder + 1,
      createdAt: nowISO(),
    };

    state.lists = state.lists.concat(nextList);
    saveState();
    return nextList;
  }

  function updateListTitle(listId, title) {
    const nextTitle = title.trim();
    if (nextTitle.length < 2) {
      return;
    }

    state.lists = state.lists.map((list) =>
      list.id === listId
        ? {
            ...list,
            title: nextTitle,
          }
        : list
    );

    saveState();
  }

  function moveListBefore(boardId, draggingListId, targetListId) {
    if (draggingListId === targetListId) {
      return;
    }

    const boardLists = getListsByBoardId(boardId);
    const draggingIndex = boardLists.findIndex((list) => list.id === draggingListId);
    const targetIndex = boardLists.findIndex((list) => list.id === targetListId);

    if (draggingIndex < 0 || targetIndex < 0) {
      return;
    }

    const reordered = boardLists.slice();
    const draggingList = reordered.splice(draggingIndex, 1)[0];
    reordered.splice(targetIndex, 0, draggingList);

    const orderMap = new Map(reordered.map((list, index) => [list.id, index]));

    state.lists = state.lists.map((list) =>
      orderMap.has(list.id)
        ? {
            ...list,
            order: orderMap.get(list.id),
          }
        : list
    );

    saveState();
  }

  function createCard(input) {
    const maxOrder = state.cards
      .filter((card) => card.listId === input.listId)
      .reduce((max, card) => Math.max(max, getCardOrder(card)), -1);

    const nextCard = {
      id: createId("card"),
      boardId: input.boardId,
      listId: input.listId,
      title: input.title.trim(),
      description: input.description ? input.description.trim() : undefined,
      createdBy: input.createdBy ? input.createdBy.trim() : state.workspace.currentUser,
      assignees: Array.isArray(input.assignees)
        ? input.assignees.map((name) => name.trim()).filter(Boolean)
        : [],
      priority: input.priority || "medium",
      completed: false,
      order: maxOrder + 1,
      startDateISO: input.startDateISO,
      endDateISO: input.endDateISO,
      createdAt: nowISO(),
    };

    state.cards = state.cards.concat(nextCard);
    saveState();
    return nextCard;
  }

  function moveCardToList(cardId, targetListId) {
    const cardToMove = state.cards.find((card) => card.id === cardId);
    if (!cardToMove || cardToMove.listId === targetListId) {
      return;
    }

    const nextOrder =
      state.cards
        .filter((card) => card.listId === targetListId)
        .reduce((max, card) => Math.max(max, getCardOrder(card)), -1) + 1;

    state.cards = state.cards.map((card) =>
      card.id === cardId
        ? {
            ...card,
            listId: targetListId,
            order: nextOrder,
          }
        : card
    );

    saveState();
  }

  function updateCard(input) {
    const cleanTitle = input.title.trim();
    const cleanDescription = input.description ? input.description.trim() : undefined;

    state.cards = state.cards.map((card) =>
      card.id === input.cardId
        ? {
            ...card,
            title: cleanTitle,
            description: cleanDescription || undefined,
            createdBy: input.createdBy ? input.createdBy.trim() : card.createdBy || state.workspace.currentUser,
            assignees: Array.isArray(input.assignees)
              ? input.assignees.map((name) => name.trim()).filter(Boolean)
              : [],
            priority: input.priority,
            startDateISO: input.startDateISO,
            endDateISO: input.endDateISO,
          }
        : card
    );

    saveState();
  }

  function toggleCardCompletion(cardId) {
    state.cards = state.cards.map((card) =>
      card.id === cardId
        ? {
            ...card,
            completed: !card.completed,
          }
        : card
    );

    saveState();
  }

  function toUtcDayValue(dateISO) {
    const parsed = new Date(dateISO);
    if (Number.isNaN(parsed.getTime())) {
      return 0;
    }

    return Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate());
  }

  function formatSchedulerDate(dateISO) {
    const parsed = new Date(dateISO);
    if (Number.isNaN(parsed.getTime())) {
      return "-";
    }

    return parsed.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  }

  function formatSchedulerTime(dateISO) {
    const parsed = new Date(dateISO);
    if (Number.isNaN(parsed.getTime())) {
      return "-";
    }

    return parsed.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getPriorityLabel(priority) {
    if (priority === "high") {
      return "Alta";
    }

    if (priority === "medium") {
      return "Media";
    }

    return "Baixa";
  }

  function getPriorityChannels(priority) {
    if (priority === "high") {
      return ["in-app", "webhook"];
    }
    return ["in-app"];
  }

  function toAssigneesLabel(assignees) {
    if (!Array.isArray(assignees) || assignees.length === 0) {
      return "Nao definido";
    }

    return assignees.join(", ");
  }

  function toFrappeDate(dateISO) {
    const parsed = new Date(dateISO);
    if (Number.isNaN(parsed.getTime())) {
      return dateISO;
    }

    const year = parsed.getUTCFullYear();
    const month = String(parsed.getUTCMonth() + 1).padStart(2, "0");
    const day = String(parsed.getUTCDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function deriveTimelineDates(card) {
    const fallbackStart = new Date(card.createdAt);

    if (Number.isNaN(fallbackStart.getTime())) {
      return null;
    }

    const orderOffset = Number.isFinite(card.order) ? card.order : 0;
    fallbackStart.setUTCDate(fallbackStart.getUTCDate() + orderOffset * 2);

    const normalizedStart = card.startDateISO || card.endDateISO || fallbackStart.toISOString();
    const parsedStart = new Date(normalizedStart);

    if (Number.isNaN(parsedStart.getTime())) {
      return null;
    }

    const startValue = toUtcDayValue(parsedStart.toISOString()) || toUtcDayValue(fallbackStart.toISOString());
    const normalizedEnd = card.endDateISO || new Date(startValue + MS_PER_DAY).toISOString();
    const parsedEnd = new Date(normalizedEnd);

    if (Number.isNaN(parsedEnd.getTime())) {
      return null;
    }

    const endValue = Math.max(toUtcDayValue(parsedEnd.toISOString()), startValue);
    const safeEndValue = endValue === startValue ? startValue + MS_PER_DAY : endValue;

    return {
      startDateISO: new Date(startValue).toISOString(),
      endDateISO: new Date(safeEndValue).toISOString(),
      reminderDateISO: new Date(Math.max(startValue, safeEndValue - MS_PER_DAY)).toISOString(),
      durationDays: Math.max(1, Math.round((safeEndValue - startValue) / MS_PER_DAY) + 1),
    };
  }

  function toGanttDate(dateISO) {
    const date = new Date(dateISO);
    if (Number.isNaN(date.getTime())) {
      return dateISO;
    }

    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    const hour = String(date.getUTCHours()).padStart(2, "0");
    const minute = String(date.getUTCMinutes()).padStart(2, "0");

    return `${year}-${month}-${day} ${hour}:${minute}`;
  }

  function toGanttDataset(cards) {
    return {
      data: cards.map((card) => ({
        id: card.id,
        text: card.title,
        description: card.description,
        created_by: card.createdBy,
        assignees: card.assignees,
        priority: card.priority,
        start_date: toGanttDate(card.startDateISO),
        end_date: toGanttDate(card.endDateISO),
        progress: card.progress || 0,
        parent: 0,
      })),
      links: [],
    };
  }

  function toDateInputValue(isoDate) {
    if (!isoDate) {
      return "";
    }

    const parsed = new Date(isoDate);
    if (Number.isNaN(parsed.getTime())) {
      return "";
    }

    const year = parsed.getUTCFullYear();
    const month = String(parsed.getUTCMonth() + 1).padStart(2, "0");
    const day = String(parsed.getUTCDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function toIsoFromDateInput(value) {
    if (!value) {
      return undefined;
    }

    const parsed = new Date(`${value}T09:00:00.000Z`);
    if (Number.isNaN(parsed.getTime())) {
      return undefined;
    }

    return parsed.toISOString();
  }

  function parseDateParts(value) {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return null;
    }

    const year = Number(value.slice(0, 4));
    const month = Number(value.slice(5, 7)) - 1;
    const day = Number(value.slice(8, 10));

    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
      return null;
    }

    const date = new Date(Date.UTC(year, month, day));
    if (
      Number.isNaN(date.getTime()) ||
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month ||
      date.getUTCDate() !== day
    ) {
      return null;
    }

    return { year, month, day };
  }

  function formatDateDisplay(value) {
    const parts = parseDateParts(value);
    if (!parts) {
      return "Selecionar data";
    }

    return `${String(parts.day).padStart(2, "0")}/${String(parts.month + 1).padStart(2, "0")}/${parts.year}`;
  }

  function toDateValue(year, month, day) {
    return `${String(year).padStart(4, "0")}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function getTodayDateValue() {
    const now = new Date();
    return toDateValue(now.getFullYear(), now.getMonth(), now.getDate());
  }

  function openDatePicker(fieldName) {
    const value = fieldName === "startDate" ? ui.cardForm.startDate : ui.cardForm.endDate;
    const parsed = parseDateParts(value);
    const now = new Date();

    ui.datePicker.openFor = fieldName;
    ui.datePicker.visibleYear = parsed ? parsed.year : now.getFullYear();
    ui.datePicker.visibleMonth = parsed ? parsed.month : now.getMonth();
  }

  function shiftDatePickerMonth(delta) {
    const current = new Date(ui.datePicker.visibleYear, ui.datePicker.visibleMonth, 1);
    current.setMonth(current.getMonth() + delta);
    ui.datePicker.visibleYear = current.getFullYear();
    ui.datePicker.visibleMonth = current.getMonth();
  }

  function closeDatePicker() {
    ui.datePicker.openFor = null;
  }

  function setDateFieldValue(fieldName, dateValue) {
    if (fieldName === "startDate") {
      ui.cardForm.startDate = dateValue;
      return;
    }

    if (fieldName === "endDate") {
      ui.cardForm.endDate = dateValue;
    }
  }

  function getCalendarCells(year, month) {
    const firstOfMonth = new Date(year, month, 1);
    const firstWeekDay = firstOfMonth.getDay();
    const startDate = new Date(year, month, 1 - firstWeekDay);
    const todayValue = getTodayDateValue();
    const selectedValue = ui.datePicker.openFor === "startDate" ? ui.cardForm.startDate : ui.cardForm.endDate;
    const selectedParsed = parseDateParts(selectedValue);
    const selectedNormalized = selectedParsed
      ? toDateValue(selectedParsed.year, selectedParsed.month, selectedParsed.day)
      : "";
    const cells = [];

    for (let index = 0; index < 42; index += 1) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + index);

      const cellYear = date.getFullYear();
      const cellMonth = date.getMonth();
      const cellDay = date.getDate();
      const cellValue = toDateValue(cellYear, cellMonth, cellDay);

      cells.push({
        value: cellValue,
        day: cellDay,
        isCurrentMonth: cellMonth === month,
        isToday: cellValue === todayValue,
        isSelected: cellValue === selectedNormalized,
      });
    }

    return cells;
  }

  function buildDatePickerField(fieldName, label, elementId, value) {
    const isOpen = ui.datePicker.openFor === fieldName;
    const monthLabel = `${CALENDAR_MONTHS[ui.datePicker.visibleMonth]} ${ui.datePicker.visibleYear}`;
    const calendarCells = isOpen ? getCalendarCells(ui.datePicker.visibleYear, ui.datePicker.visibleMonth) : [];

    return `
      <div class="field">
        <label for="${elementId}">${label}</label>
        <div class="custom-date-picker" data-date-picker="${fieldName}">
          <button
            type="button"
            id="${elementId}"
            class="custom-date-trigger${isOpen ? " is-open" : ""}"
            data-action="toggle-date-picker"
            data-date-field="${fieldName}"
            aria-expanded="${isOpen}"
            aria-controls="custom-date-panel-${fieldName}"
          >
            <span class="custom-date-trigger__value${value ? "" : " is-empty"}">${escapeHtml(formatDateDisplay(value))}</span>
            <i class="bx bx-calendar custom-date-trigger__icon" aria-hidden="true"></i>
          </button>

          ${isOpen
            ? `<div class="custom-date-panel" id="custom-date-panel-${fieldName}" data-date-popover="true">
                <div class="custom-date-panel__header">
                  <button type="button" class="custom-date-nav" data-action="prev-date-month" data-date-field="${fieldName}" aria-label="Mes anterior">
                    <i class="bx bx-chevron-left" aria-hidden="true"></i>
                  </button>
                  <strong>${escapeHtml(monthLabel)}</strong>
                  <button type="button" class="custom-date-nav" data-action="next-date-month" data-date-field="${fieldName}" aria-label="Proximo mes">
                    <i class="bx bx-chevron-right" aria-hidden="true"></i>
                  </button>
                </div>

                <div class="custom-date-weekdays">
                  ${CALENDAR_WEEK_DAYS.map((dayName) => `<span>${escapeHtml(dayName)}</span>`).join("")}
                </div>

                <div class="custom-date-grid">
                  ${calendarCells
                    .map(
                      (cell) =>
                        `<button
                          type="button"
                          class="custom-date-day${cell.isCurrentMonth ? "" : " is-outside"}${cell.isToday ? " is-today" : ""}${cell.isSelected ? " is-selected" : ""}"
                          data-action="pick-date-day"
                          data-date-field="${fieldName}"
                          data-date-value="${cell.value}"
                        >${cell.day}</button>`
                    )
                    .join("")}
                </div>

                <div class="custom-date-panel__actions">
                  <button type="button" class="custom-date-link" data-action="clear-date-day" data-date-field="${fieldName}">Limpar</button>
                  <button type="button" class="custom-date-link" data-action="set-today-date-day" data-date-field="${fieldName}">Hoje</button>
                </div>
              </div>`
            : ""}
        </div>
      </div>
    `;
  }

  function openCardDetails(cardId) {
    const card = state.cards.find((item) => item.id === cardId);
    if (!card) {
      return;
    }

    ui.activeCardId = cardId;
    ui.cardForm = {
      title: card.title,
      description: card.description || "",
      selectedAssignee: Array.isArray(card.assignees) ? card.assignees[0] || "" : "",
      priority: card.priority || "medium",
      startDate: toDateInputValue(card.startDateISO),
      endDate: toDateInputValue(card.endDateISO),
    };

    closeDatePicker();
  }

  function closeCardDetails() {
    ui.activeCardId = null;
    closeDatePicker();
  }

  function closeAllModals() {
    ui.isCreateBoardOpen = false;
    ui.isCreateListOpen = false;
    ui.isGanttModalOpen = false;
    ui.isSchedulerModalOpen = false;
    ui.isPayloadModalOpen = false;
    closeCardDetails();
  }

  function buildBoardsPage() {
    const normalizedQuery = ui.searchQuery.trim().toLowerCase();
    const boards = normalizedQuery
      ? state.boards.filter((board) => board.title.toLowerCase().includes(normalizedQuery))
      : state.boards;

    const cardsHtml = boards
      .map((board) => {
        const style = `--board-color: ${board.color}; background: linear-gradient(148deg, rgba(255, 255, 255, 0.86), ${board.color}99); border-color: ${board.color}66;`;
        return `
          <a href="#/boards/${encodeURIComponent(board.id)}" class="board-card" style="${style}" data-board-id="${escapeHtml(board.id)}">
            <div class="board-card-header">
              <h3>${escapeHtml(board.title)}</h3>
            </div>
            <p>Fluxo pronto para listas, cards e acompanhamento continuo.</p>
          </a>
        `;
      })
      .join("");

    return `
      <section class="boards-page">
        <header class="boards-header">
          <div class="boards-header__main">
            <p class="workspace-kicker">Area de trabalho</p>
            <h1>${escapeHtml(state.workspace.name)}</h1>
          </div>

          <div class="boards-header__actions">
            <button type="button" class="btn btn-primary boards-header__add-btn" data-action="open-create-board" aria-label="Criar novo quadro">+</button>
          </div>
        </header>

        <div class="boards-grid">
          ${cardsHtml}
          <button type="button" class="create-board-card" data-action="open-create-board">
            <h3 class="create-board-card-title">Criar novo quadro</h3>
            <p class="create-board-card-subtitle">Defina contexto, prioridade e fluxo de trabalho em segundos.</p>
          </button>
        </div>

        ${boards.length === 0 ? '<p class="boards-empty">Nenhum quadro encontrado para este filtro.</p>' : ""}
      </section>
    `;
  }

  function buildListColumn(list, cards) {
    const isDropTarget = ui.draggingCardId && ui.dropListTargetId === list.id;
    const isListDropTarget = ui.draggingListId && ui.dropTargetListId === list.id && ui.draggingListId !== list.id;

    const cardsHtml = cards
      .map((card) => {
        return `
          <article
            class="kanban-card${card.completed ? " is-completed" : ""}${ui.draggingCardId === card.id ? " is-dragging" : ""}"
            role="button"
            tabindex="0"
            draggable="true"
            data-card-id="${escapeHtml(card.id)}"
          >
            <div class="kanban-card-top">
              <input
                type="checkbox"
                class="kanban-card-checkbox"
                ${card.completed ? "checked" : ""}
                data-action="toggle-card"
                data-card-id="${escapeHtml(card.id)}"
                aria-label="Concluir card ${escapeHtml(card.title)}"
              />
              <span class="kanban-card-title">${escapeHtml(card.title)}</span>
            </div>
            <div class="kanban-card-meta">
              <span class="kanban-priority kanban-priority-${escapeHtml(card.priority)}">${escapeHtml(getPriorityLabel(card.priority))}</span>
              ${card.endDateISO ? `<span class="kanban-card-date">Entrega ${escapeHtml(new Date(card.endDateISO).toLocaleDateString("pt-BR"))}</span>` : ""}
            </div>
          </article>
        `;
      })
      .join("");

    const isEditingTitle = ui.editingListId === list.id;
    const isComposerOpen = ui.composerListId === list.id;

    return `
      <section
        class="kanban-list${isDropTarget ? " is-drop-target" : ""}${isListDropTarget ? " is-list-drop-target" : ""}${ui.draggingListId === list.id ? " is-list-dragging" : ""}"
        aria-label="${escapeHtml(list.title)}"
        draggable="true"
        data-list-id="${escapeHtml(list.id)}"
      >
        <header class="kanban-list-header">
          ${isEditingTitle
            ? `<input
                class="kanban-list-title-input"
                value="${escapeHtml(ui.draftListTitle)}"
                maxlength="${KANBAN_LIST_TITLE_MAX_LENGTH}"
                data-action="list-title-input"
                data-list-id="${escapeHtml(list.id)}"
                aria-label="Nome da lista"
              />`
            : `<button
                type="button"
                class="kanban-list-title-button"
                data-action="edit-list-title"
                data-list-id="${escapeHtml(list.id)}"
                title="Clique para editar o nome da lista"
              >${escapeHtml(list.title)}</button>`}
          <span>${cards.length}</span>
        </header>

        <div class="kanban-cards${cards.length > KANBAN_MAX_VISIBLE_CARDS ? " is-scrollable" : ""}">
          ${cards.length === 0 ? '<p class="kanban-empty">Nenhum card nesta lista.</p>' : cardsHtml}
        </div>

        ${isComposerOpen
          ? `<form class="kanban-composer" data-action="submit-card" data-list-id="${escapeHtml(list.id)}" autocomplete="off">
              <input
                value="${escapeHtml(ui.draftCardTitle)}"
                placeholder="Titulo do card"
                data-action="draft-card"
                data-list-id="${escapeHtml(list.id)}"
                autocomplete="off"
                autocapitalize="off"
                autocorrect="off"
                spellcheck="false"
              />
              <div class="kanban-composer-actions">
                <button type="submit" class="btn btn-primary">
                  Adicionar Cartao
                </button>
                <button type="button" class="btn btn-secondary" data-action="cancel-card-composer">Cancelar</button>
              </div>
            </form>`
          : `<button type="button" class="kanban-add-card" data-action="open-card-composer" data-list-id="${escapeHtml(list.id)}">+ Adicionar cartao</button>`}
      </section>
    `;
  }

  function buildBoardPage(board) {
    const lists = getListsByBoardId(board.id);

    const cardsByList = {};
    state.cards
      .filter((card) => card.boardId === board.id)
      .forEach((card) => {
        if (!cardsByList[card.listId]) {
          cardsByList[card.listId] = [];
        }
        cardsByList[card.listId].push(card);
      });

    Object.keys(cardsByList).forEach((listId) => {
      cardsByList[listId].sort((a, b) => getCardOrder(a) - getCardOrder(b) || a.createdAt.localeCompare(b.createdAt));
    });

    const listColumns = lists.map((list) => buildListColumn(list, cardsByList[list.id] || [])).join("");

    const isBoardTitleEditing = ui.boardTitleEditing;

    if (!isBoardTitleEditing && (!ui.draftBoardTitle || ui.draftBoardTitle === "")) {
      ui.draftBoardTitle = board.title;
    }

    const timelineCards = state.cards
      .filter((card) => card.boardId === board.id)
      .map((card) => {
        const derivedDates = deriveTimelineDates(card);
        if (!derivedDates) {
          return null;
        }

        return {
          id: card.id,
          title: card.title,
          description: card.description,
          createdBy: card.createdBy,
          assignees: card.assignees,
          priority: card.priority,
          completed: card.completed,
          startDateISO: derivedDates.startDateISO,
          endDateISO: derivedDates.endDateISO,
          progress: card.completed ? 1 : 0,
        };
      })
      .filter(Boolean);

    const ganttPreview = toGanttDataset(timelineCards);
    const payloadJson = JSON.stringify(ganttPreview, null, 2);

    const startDates = timelineCards
      .map((card) => new Date(card.startDateISO).getTime())
      .filter((value) => Number.isFinite(value));
    const endDates = timelineCards
      .map((card) => new Date(card.endDateISO).getTime())
      .filter((value) => Number.isFinite(value));

    const firstStart = startDates.length ? new Date(Math.min.apply(null, startDates)).toLocaleDateString("pt-BR") : "-";
    const lastEnd = endDates.length ? new Date(Math.max.apply(null, endDates)).toLocaleDateString("pt-BR") : "-";

    const schedulerEvents = state.cards
      .filter((card) => card.boardId === board.id)
      .map((card) => {
        const derivedDates = deriveTimelineDates(card);
        if (!derivedDates) {
          return null;
        }

        return {
          id: card.id,
          title: card.title,
          createdBy: card.createdBy,
          assignees: card.assignees,
          priority: card.priority,
          deliveryDateISO: derivedDates.endDateISO,
          reminderDateISO: derivedDates.reminderDateISO,
          channels: getPriorityChannels(card.priority),
          description: card.description,
        };
      })
      .filter(Boolean);

    const content = lists.length
      ? `
          <div class="kanban-board-shell">
            <div
              class="kanban-board${ui.isBoardPanning ? " is-drag-scrolling" : ""}"
              role="list"
              aria-label="Listas do quadro"
              data-role="kanban-board"
            >
              ${listColumns}
              <button type="button" class="kanban-add-list-tile" data-action="open-create-list">+ Adicionar outra lista</button>
            </div>
            <div class="kanban-board-dots" aria-hidden="true">
              ${lists
                .map((_, index) => `<span class="kanban-board-dot${index === ui.activeBoardListIndex ? " is-active" : ""}"></span>`)
                .join("")}
            </div>
          </div>
        `
      : `
          <article class="board-placeholder">
            <h2>Este quadro ainda nao possui listas</h2>
            <p>Crie a primeira lista para iniciar o fluxo de cards e acompanhamento da sprint.</p>
            <div class="board-placeholder-actions">
              <button type="button" class="btn btn-primary" data-action="open-create-list">Adicionar primeira lista</button>
            </div>
          </article>
        `;

    return {
      html: `
        <section class="board-page board-page--tinted" style="--board-tone: ${escapeHtml(board.color || "#1d4ed8")}">
          <header class="board-context-header" aria-label="Cabecalho do quadro">
            <div class="board-context-header__left">
              ${isBoardTitleEditing
                ? `<input class="board-title-input" value="${escapeHtml(ui.draftBoardTitle)}" data-action="board-title-input" aria-label="Nome do quadro" />`
                : `<button type="button" class="board-title-button" data-action="edit-board-title">${escapeHtml(board.title)}</button>`}
            </div>

            <div class="board-context-header__actions">
              <button type="button" class="btn btn-primary board-context-header__add-list-btn" data-action="open-create-list" aria-label="Adicionar outra lista">+</button>
              <button type="button" class="btn btn-secondary" data-action="open-gantt">Grafico de Gantt</button>
              <button type="button" class="btn btn-secondary" data-action="open-scheduler">Scheduler</button>
              ${isMobileViewport() ? "" : '<button type="button" class="btn btn-secondary" data-action="open-payload">Payload tecnico</button>'}
            </div>
          </header>

          ${content}
        </section>
      `,
      data: {
        board,
        timelineCards,
        payloadJson,
        payloadSummary: {
          cards: ganttPreview.data.length,
          links: ganttPreview.links.length,
          openCards: timelineCards.filter((card) => !card.completed).length,
          completedCards: timelineCards.filter((card) => card.completed).length,
          firstStart,
          lastEnd,
        },
        schedulerEvents,
      },
    };
  }

  function isMobileViewport() {
    return window.matchMedia("(max-width: 920px)").matches;
  }

  function shouldShowSearchSuggestions() {
    return ui.route.name !== "board" && !isMobileViewport();
  }

  function buildSearchResults() {
    if (!shouldShowSearchSuggestions()) {
      return "";
    }

    const normalizedQuery = ui.searchQuery.trim().toLowerCase();
    const recentBoards = state.boards.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    let filteredBoards;
    if (!normalizedQuery) {
      filteredBoards = recentBoards.slice(0, 6);
    } else {
      const startsWith = recentBoards.filter((board) => board.title.toLowerCase().startsWith(normalizedQuery));
      const includes = recentBoards.filter(
        (board) => !board.title.toLowerCase().startsWith(normalizedQuery) && board.title.toLowerCase().includes(normalizedQuery)
      );
      filteredBoards = startsWith.concat(includes).slice(0, 8);
    }

    if (!ui.isSearchOpen) {
      return "";
    }

    if (!filteredBoards.length) {
      return `
        <div id="header-search-results" class="header-search-results" role="listbox">
          <p class="header-search-results__title">${normalizedQuery ? "Resultados" : "Quadros recentes"}</p>
          <p class="header-search-results__empty">Nenhum quadro encontrado.</p>
        </div>
      `;
    }

    const listHtml = filteredBoards
      .map((board) => {
        return `
          <a href="#/boards/${encodeURIComponent(board.id)}" class="header-search-item" data-action="pick-search-item" data-board-id="${escapeHtml(board.id)}">
            <span class="header-search-item__preview" style="--result-color: ${escapeHtml(board.color)}" aria-hidden="true"></span>
            <span class="header-search-item__content">
              <strong class="header-search-item__title">${escapeHtml(board.title)}</strong>
              <small class="header-search-item__subtitle">${escapeHtml(state.workspace.name)}</small>
            </span>
          </a>
        `;
      })
      .join("");

    return `
      <div id="header-search-results" class="header-search-results" role="listbox">
        <p class="header-search-results__title">${normalizedQuery ? "Resultados" : "Quadros recentes"}</p>
        <div class="header-search-results__list">${listHtml}</div>
      </div>
    `;
  }

  function buildCreateBoardModal() {
    if (!ui.isCreateBoardOpen) {
      return "";
    }

    const canSubmit = ui.createBoardForm.title.trim().length >= 3;

    return `
      <div class="modal-overlay" data-action="close-create-board">
        <article class="modal" role="dialog" aria-modal="true" aria-labelledby="create-board-title" data-modal="create-board">
          <header class="modal-header">
            <div>
              <h2 id="create-board-title">Criar quadro</h2>
              <small class="workspace-kicker">${escapeHtml(state.workspace.name)}</small>
            </div>
            <button type="button" class="modal-close" aria-label="Fechar" data-action="close-create-board">x</button>
          </header>

          <form class="modal-form" data-action="submit-create-board" autocomplete="off">
            <div class="field">
              <label for="board-title">Titulo do quadro</label>
              <input id="board-title" name="board-title" value="${escapeHtml(ui.createBoardForm.title)}" placeholder="Ex.: Sprint Plataforma" data-action="draft-create-board-title" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" />
            </div>

            <div class="field">
              <label>Cor de fundo</label>
              <div class="color-grid" role="radiogroup" aria-label="Cor do quadro">
                ${boardPalette
                  .map(
                    (item) =>
                      `<button type="button" class="color-option" style="background: ${escapeHtml(item.value)}" title="${escapeHtml(item.name)}" aria-pressed="${ui.createBoardForm.color === item.value}" data-action="pick-board-color" data-color="${escapeHtml(item.value)}"></button>`
                  )
                  .join("")}
              </div>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" data-action="close-create-board">Cancelar</button>
              <button type="submit" class="btn btn-primary">Criar</button>
            </div>
          </form>
        </article>
      </div>
    `;
  }

  function buildCreateListModal() {
    if (!ui.isCreateListOpen) {
      return "";
    }

    const canSubmit = ui.createListForm.title.trim().length >= 2;

    return `
      <div class="modal-overlay" data-action="close-create-list">
        <article class="modal modal-sm" role="dialog" aria-modal="true" aria-labelledby="create-list-title" data-modal="create-list">
          <header class="modal-header">
            <h2 id="create-list-title">Adicionar lista</h2>
            <button type="button" class="modal-close" aria-label="Fechar" data-action="close-create-list">x</button>
          </header>

          <form class="modal-form" data-action="submit-create-list" autocomplete="off">
            <div class="field">
              <label for="list-title">Nome da lista</label>
              <input id="list-title" name="list-title" value="${escapeHtml(ui.createListForm.title)}" placeholder="Ex.: Em validacao" data-action="draft-create-list-title" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" />
            </div>

            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" data-action="close-create-list">Cancelar</button>
              <button type="submit" class="btn btn-primary">Adicionar</button>
            </div>
          </form>
        </article>
      </div>
    `;
  }

  function buildGanttModal(boardData) {
    if (!ui.isGanttModalOpen) {
      return "";
    }

    return `
      <div class="modal-overlay" data-action="close-gantt">
        <article class="modal modal-xl" role="dialog" aria-modal="true" data-modal="gantt">
          <header class="modal-header">
            <h2>Grafico de Gantt</h2>
            <button type="button" class="modal-close" aria-label="Fechar" data-action="close-gantt">x</button>
          </header>

          <article class="gantt-panel">
            <div class="panel-header">
              <h3>Timeline Gantt</h3>
              <span>${boardData.timelineCards.length} tasks</span>
            </div>
            <div id="frappe-gantt-host"></div>
          </article>
        </article>
      </div>
    `;
  }

  function buildSchedulerModal(boardData) {
    if (!ui.isSchedulerModalOpen) {
      return "";
    }

    const events = boardData.schedulerEvents;

    return `
      <div class="modal-overlay" data-action="close-scheduler">
        <article class="modal modal-xl" role="dialog" aria-modal="true" data-modal="scheduler">
          <header class="modal-header">
            <h2>Scheduler</h2>
            <button type="button" class="modal-close" aria-label="Fechar" data-action="close-scheduler">x</button>
          </header>

          <article class="scheduler-panel">
            <div class="panel-header">
              <h3>Fila do Scheduler</h3>
              <span>${events.length} eventos</span>
            </div>

            ${events.length
              ? `<div class="scheduler-list">${events
                  .map(
                    (event) =>
                      `<article class="scheduler-event">
                        <div class="scheduler-event-top">
                          <strong class="scheduler-event-title">${escapeHtml(event.title)}</strong>
                          <span class="scheduler-chip">Cronicle</span>
                        </div>

                        <div class="scheduler-event-meta">
                          <span>Entrega ${escapeHtml(formatSchedulerDate(event.deliveryDateISO))} ${escapeHtml(formatSchedulerTime(event.deliveryDateISO))}</span>
                          <span>Alerta ${escapeHtml(formatSchedulerDate(event.reminderDateISO))} ${escapeHtml(formatSchedulerTime(event.reminderDateISO))}</span>
                          <span>Prioridade ${escapeHtml(getPriorityLabel(event.priority))}</span>
                          <span>Criado por ${escapeHtml((event.createdBy || "").trim() || "Nao definido")}</span>
                          <span>Atuando ${escapeHtml(toAssigneesLabel(event.assignees))}</span>
                        </div>

                        <div class="scheduler-event-chips">
                          ${event.channels
                            .map((channel) => `<span class="scheduler-chip scheduler-chip-soft">${escapeHtml(channel)}</span>`)
                            .join("")}
                        </div>

                        ${event.description ? `<p class="scheduler-event-description">${escapeHtml(event.description)}</p>` : ""}
                      </article>`
                  )
                  .join("")}</div>`
              : '<p class="scheduler-empty">Nenhum evento disponivel para Scheduler.</p>'}
          </article>
        </article>
      </div>
    `;
  }

  function buildPayloadModal(boardData) {
    if (!ui.isPayloadModalOpen) {
      return "";
    }

    return `
      <div class="modal-overlay" data-action="close-payload">
        <article class="modal modal-xl" role="dialog" aria-modal="true" data-modal="payload">
          <header class="modal-header">
            <div>
              <h2>Payload tecnico</h2>
              <p class="modal-subtitle">Exportacao tecnica do dataset do quadro para integracoes e testes.</p>
            </div>
            <div class="payload-header-actions">
              <button type="button" class="btn btn-secondary" data-action="copy-payload">Copiar JSON</button>
              <button type="button" class="btn btn-secondary" data-action="download-payload">Baixar JSON</button>
              <button type="button" class="modal-close" aria-label="Fechar" data-action="close-payload">x</button>
            </div>
          </header>

          <div class="payload-summary-grid">
            <article class="payload-summary-card"><span>Tasks</span><strong>${boardData.payloadSummary.cards}</strong></article>
            <article class="payload-summary-card"><span>Links</span><strong>${boardData.payloadSummary.links}</strong></article>
            <article class="payload-summary-card"><span>Em aberto</span><strong>${boardData.payloadSummary.openCards}</strong></article>
            <article class="payload-summary-card"><span>Concluidas</span><strong>${boardData.payloadSummary.completedCards}</strong></article>
            <article class="payload-summary-card"><span>Inicio</span><strong>${escapeHtml(boardData.payloadSummary.firstStart)}</strong></article>
            <article class="payload-summary-card"><span>Entrega final</span><strong>${escapeHtml(boardData.payloadSummary.lastEnd)}</strong></article>
          </div>

          ${ui.payloadFeedback ? `<p class="payload-feedback">${escapeHtml(ui.payloadFeedback)}</p>` : ""}

          <pre class="payload-preview">${escapeHtml(boardData.payloadJson)}</pre>
        </article>
      </div>
    `;
  }

  function buildCardDetailsModal(activeCard) {
    if (!activeCard) {
      return "";
    }

    const hasValidDateRange =
      !ui.cardForm.startDate || !ui.cardForm.endDate || ui.cardForm.startDate <= ui.cardForm.endDate;

    const canSubmit = ui.cardForm.title.trim().length >= 2 && hasValidDateRange;

    return `
      <div class="modal-overlay" data-action="close-card-details">
        <article class="modal" role="dialog" aria-modal="true" aria-labelledby="card-details-title" data-modal="card-details">
          <header class="modal-header">
            <h2 id="card-details-title">Detalhes do card</h2>
            <button type="button" class="modal-close" aria-label="Fechar" data-action="close-card-details">x</button>
          </header>

          <form class="modal-form" data-action="submit-card-details" autocomplete="off">
            <div class="field">
              <label for="card-title">Titulo</label>
              <input id="card-title" value="${escapeHtml(ui.cardForm.title)}" data-action="draft-card-title" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" />
            </div>

            <div class="field">
              <label for="card-description">Descricao</label>
              <textarea id="card-description" rows="4" data-action="draft-card-description" placeholder="Detalhes tecnicos, criterio de aceite e observacoes">${escapeHtml(ui.cardForm.description)}</textarea>
            </div>

            <div class="field">
              <label for="card-assignees">Atuando</label>
              <select id="card-assignees" data-action="draft-card-assignee" autocomplete="off">
                <option value="">Selecione um colaborador</option>
                ${state.workspace.collaborators
                  .map((collaborator) => `<option value="${escapeHtml(collaborator)}" ${ui.cardForm.selectedAssignee === collaborator ? "selected" : ""}>${escapeHtml(collaborator)}</option>`)
                  .join("")}
              </select>
            </div>

            <div class="field">
              <label for="card-priority">Prioridade</label>
              <select id="card-priority" data-action="draft-card-priority" autocomplete="off">
                <option value="high" ${ui.cardForm.priority === "high" ? "selected" : ""}>Alta</option>
                <option value="medium" ${ui.cardForm.priority === "medium" ? "selected" : ""}>Media</option>
                <option value="low" ${ui.cardForm.priority === "low" ? "selected" : ""}>Baixa</option>
              </select>
            </div>

            <div class="field-row">
              ${buildDatePickerField("startDate", "Inicio", "card-start-date", ui.cardForm.startDate)}
              ${buildDatePickerField("endDate", "Entrega", "card-end-date", ui.cardForm.endDate)}
            </div>

            ${hasValidDateRange ? "" : '<p class="field-error">A data de inicio nao pode ser maior que a data de entrega.</p>'}

            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" data-action="close-card-details">Cancelar</button>
              <button type="submit" class="btn btn-primary">Salvar alteracoes</button>
            </div>
          </form>
        </article>
      </div>
    `;
  }

  function updateDatePickerPanelPlacement() {
    const panels = app.querySelectorAll(".custom-date-panel");

    panels.forEach((panel) => {
      panel.classList.remove("is-upward");

      const panelRect = panel.getBoundingClientRect();
      const viewportMargin = 12;
      const fitsBelow = panelRect.bottom <= window.innerHeight - viewportMargin;

      if (fitsBelow) {
        return;
      }

      const picker = panel.closest(".custom-date-picker");
      if (!picker) {
        return;
      }

      const pickerRect = picker.getBoundingClientRect();
      const panelHeight = panel.offsetHeight;
      const requiredSpace = panelHeight + 8;
      const spaceAbove = pickerRect.top - viewportMargin;
      const spaceBelow = window.innerHeight - pickerRect.bottom - viewportMargin;

      if (spaceAbove >= requiredSpace || spaceAbove > spaceBelow) {
        panel.classList.add("is-upward");
      }
    });
  }

  function render() {
    ui.route = parseRoute();

    const activeElement = document.activeElement;
    const shouldRestoreSearchFocus =
      activeElement && activeElement.classList && activeElement.classList.contains("header__input");
    const searchCaretStart = shouldRestoreSearchFocus && typeof activeElement.selectionStart === "number" ? activeElement.selectionStart : null;
    const searchCaretEnd = shouldRestoreSearchFocus && typeof activeElement.selectionEnd === "number" ? activeElement.selectionEnd : null;

    const isBoardRoute = ui.route.name === "board";
    const board = isBoardRoute ? getBoardById(ui.route.boardId) : null;
    let boardData = null;

    let pageContent = "";

    if (isBoardRoute && board) {
      boardData = buildBoardPage(board);
      pageContent = boardData.html;
    } else if (isBoardRoute && !board) {
      pageContent = `
        <section class="board-page">
          <div class="board-placeholder">
            <h2>Quadro nao encontrado</h2>
            <p>O quadro solicitado nao existe neste workspace. Volte para a pagina de <a href="#/" class="inline-link">Quadros</a>.</p>
          </div>
        </section>
      `;
    } else {
      pageContent = buildBoardsPage();
    }

    const appShellClass = `app-shell${isBoardRoute ? " app-shell--board-focus" : ""}`;
    const appShellStyle = isBoardRoute && board ? ` style="--board-tone: ${escapeHtml(board.color || "#1d4ed8")}"` : "";

    const html = `
      <div class="${appShellClass}"${appShellStyle}>
        <header class="header">
          <div class="header__container">
            <div class="header__brand">
              <button
                type="button"
                class="header__menu-toggle"
                data-action="toggle-mobile-nav"
                aria-label="Abrir menu"
                aria-expanded="${ui.isMobileNavOpen}"
              >
                <i class="bx bx-menu" aria-hidden="true"></i>
              </button>
              ${isBoardRoute
                ? `<div class="header__board-nav" aria-label="Atalhos de navegacao">
                    <a href="#/" class="header__board-link" aria-label="Ir para quadros">
                      <img src="public/assets/img/layers.png" alt="" class="header__board-logo" />
                    </a>
                  </div>`
                : ""}
              ${isBoardRoute
                ? ""
                : `<a href="#/" class="header__logo-link" aria-label="Pagina inicial">
                     <img src="public/assets/img/layers.png" alt="Blanes logo" class="header__logo-image" />
                   </a>`}
            </div>

            ${isBoardRoute
              ? ""
              : `<div class="header__search" role="search">
                   <input
                     type="search"
                     placeholder="Buscar quadros"
                     class="header__input"
                     value="${escapeHtml(ui.searchQuery)}"
                     aria-expanded="${shouldShowSearchSuggestions() ? ui.isSearchOpen : false}"
                     ${shouldShowSearchSuggestions() ? 'aria-controls="header-search-results"' : ""}
                     data-action="search-query"
                   />
                   <i class="bx bx-search header__icon" aria-hidden="true"></i>
                   ${buildSearchResults()}
                 </div>`}

            <div class="header__profile" aria-label="Perfil do usuario">
              <button
                type="button"
                class="header__profile-trigger${ui.isProfileMenuOpen ? " is-open" : ""}"
                aria-haspopup="menu"
                aria-expanded="${ui.isProfileMenuOpen}"
                aria-controls="header-profile-menu"
                data-action="toggle-profile-menu"
              >
                <span class="header__user-name">Chewie</span>
                <span class="header__avatar" aria-hidden="true">C</span>
                <i class="bx bx-chevron-down header__profile-arrow" aria-hidden="true"></i>
              </button>
              ${ui.isProfileMenuOpen
                ? `<div class="header__profile-menu" id="header-profile-menu" role="menu">
                    <button type="button" class="header__profile-menu-item" role="menuitem" data-action="open-profile-page">
                      <i class="bx bx-user" aria-hidden="true"></i>
                      <span>Perfil</span>
                    </button>
                    <button type="button" class="header__profile-menu-item" role="menuitem" data-action="open-settings-page">
                      <i class="bx bx-cog" aria-hidden="true"></i>
                      <span>Configuracoes</span>
                    </button>
                    <div class="header__profile-menu-separator" aria-hidden="true"></div>
                    <button
                      type="button"
                      class="header__user-item"
                      id="theme-toggle-btn"
                      role="menuitem"
                      aria-pressed="true"
                      data-action="toggle-theme"
                    >
                      <i class="bx bx-moon" id="theme-toggle-icon" aria-hidden="true"></i>
                      <span id="theme-toggle-label">Modo escuro</span>
                      <span class="header__user-chip" id="theme-toggle-chip">Ativo</span>
                    </button>
                  </div>`
                : ""}
            </div>
          </div>
        </header>

        ${isBoardRoute
          ? ""
          : `<aside class="nav${ui.isMobileNavOpen ? " is-open" : ""}" aria-label="Navegacao principal">
              <nav class="nav__container">
                <div>
                  <a href="#/" class="nav__link nav__logo" aria-label="Pagina inicial">
                    <img src="public/assets/img/layers.png" alt="Blanes logo" class="nav__logo-image" />
                    <span class="nav__logo-name">Project</span>
                  </a>
                  <div class="nav__list">
                    <div class="nav__items">
                      <h3 class="nav__subtitle">Menu</h3>
                      <a href="#/" class="nav__link active">
                        <i class="bx bx-grid-alt nav__icon" aria-hidden="true"></i>
                        <span class="nav__name">Quadros</span>
                      </a>
                    </div>
                  </div>
                </div>
                <div class="nav__footer">
                  <a href="#/" class="nav__link nav__logout">
                    <i class="bx bx-log-out nav__icon" aria-hidden="true"></i>
                    <span class="nav__name">Sair</span>
                  </a>
                  <p class="nav__version">Versao: v0.1.0</p>
                </div>
              </nav>
            </aside>
            <button type="button" class="nav-overlay${ui.isMobileNavOpen ? " is-open" : ""}" data-action="close-mobile-nav" aria-label="Fechar menu"></button>`}

        <main class="app-content" aria-live="polite">${pageContent}</main>
      </div>

      ${buildCreateBoardModal()}
      ${buildCreateListModal()}
      ${boardData ? buildGanttModal(boardData.data) : ""}
      ${boardData ? buildSchedulerModal(boardData.data) : ""}
      ${boardData ? buildPayloadModal(boardData.data) : ""}
      ${buildCardDetailsModal(ui.activeCardId ? state.cards.find((card) => card.id === ui.activeCardId) : null)}
    `;

    app.innerHTML = html;

    applyTheme(ui.theme);

    if (ui.datePicker.openFor) {
      updateDatePickerPanelPlacement();
    }

    if (ui.boardTitleEditing) {
      const input = app.querySelector(".board-title-input");
      if (input) {
        input.focus();
        input.select();
      }
    }

    if (ui.editingListId) {
      const listInput = app.querySelector(`.kanban-list-title-input[data-list-id="${ui.editingListId}"]`);
      if (listInput) {
        listInput.focus();
        listInput.select();
      }
    }

    if (ui.composerListId) {
      const cardInput = app.querySelector(`.kanban-composer input[data-list-id="${ui.composerListId}"]`);
      if (cardInput) {
        cardInput.focus();
      }
    }

    if (shouldRestoreSearchFocus && !isBoardRoute) {
      const searchInput = app.querySelector(".header__input");
      if (searchInput) {
        searchInput.focus({ preventScroll: true });
        if (searchCaretStart !== null && searchCaretEnd !== null) {
          const max = searchInput.value.length;
          const start = Math.min(searchCaretStart, max);
          const end = Math.min(searchCaretEnd, max);
          searchInput.setSelectionRange(start, end);
        }
      }
    }

    if (ui.isGanttModalOpen && boardData) {
      mountGantt(boardData.data.timelineCards);
    }

    if (isBoardRoute) {
      updateKanbanDotsFromScroll();
    }
  }

  function updateKanbanDotsFromScroll() {
    const board = app.querySelector("[data-role='kanban-board']");
    if (!board) {
      return;
    }

    const listNodes = Array.from(board.querySelectorAll(".kanban-list[data-list-id]"));
    if (!listNodes.length) {
      ui.activeBoardListIndex = 0;
      return;
    }

    const boardRect = board.getBoundingClientRect();
    const centerX = boardRect.left + boardRect.width / 2;
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    listNodes.forEach((node, index) => {
      const rect = node.getBoundingClientRect();
      const nodeCenter = rect.left + rect.width / 2;
      const distance = Math.abs(nodeCenter - centerX);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    if (ui.activeBoardListIndex !== nearestIndex) {
      ui.activeBoardListIndex = nearestIndex;
      const dots = app.querySelectorAll(".kanban-board-dot");
      dots.forEach((dot, index) => {
        dot.classList.toggle("is-active", index === nearestIndex);
      });
    }
  }

  function getInteractiveTarget(start) {
    return start.closest("button, input, textarea, select, a, label, [data-action]");
  }

  function shouldHandleOverlayClose(actionNode, target) {
    if (!actionNode || !actionNode.classList || !actionNode.classList.contains("modal-overlay")) {
      return true;
    }

    return target === actionNode;
  }

  function resolveListDropTargetId(boardEl, clientX) {
    if (!boardEl) {
      return null;
    }

    const listEls = Array.from(boardEl.querySelectorAll(".kanban-list[data-list-id]"));
    if (listEls.length === 0) {
      return null;
    }

    const centers = listEls
      .map((el) => {
        const rect = el.getBoundingClientRect();
        return {
          id: el.getAttribute("data-list-id"),
          center: rect.left + rect.width / 2,
        };
      })
      .filter((item) => Boolean(item.id));

    if (centers.length === 0) {
      return null;
    }

    let targetIndex = 0;
    for (let i = 0; i < centers.length; i += 1) {
      if (clientX > centers[i].center) {
        targetIndex = i + 1;
      }
    }

    const clampedIndex = Math.min(targetIndex, centers.length - 1);
    return centers[clampedIndex].id;
  }

  function handleClick(event) {
    const target = event.target;
    let shouldRender = false;

    if (ui.datePicker.openFor && !target.closest(".custom-date-picker")) {
      closeDatePicker();
      shouldRender = true;
    }

    if (ui.isMobileNavOpen && !target.closest(".nav") && !target.closest(".header__menu-toggle")) {
      ui.isMobileNavOpen = false;
      shouldRender = true;
    }

    if (ui.isProfileMenuOpen && !target.closest(".header__profile")) {
      ui.isProfileMenuOpen = false;
      shouldRender = true;
    }

    if (ui.isSearchOpen) {
      const inSearch = target.closest(".header__search");
      if (!inSearch) {
        ui.isSearchOpen = false;
        shouldRender = true;
      }
    }

    const actionNode = target.closest("[data-action]");
    if (!actionNode) {
      if (target.closest(".kanban-card")) {
        const cardId = target.closest(".kanban-card").getAttribute("data-card-id");
        if (cardId) {
          openCardDetails(cardId);
          render();
        }
      } else if (shouldRender) {
        render();
      }
      return;
    }

    const action = actionNode.getAttribute("data-action");

    if (
      action === "search-query" ||
      action === "board-title-input" ||
      action === "list-title-input" ||
      (typeof action === "string" && action.startsWith("submit-")) ||
      (typeof action === "string" && action.startsWith("draft-"))
    ) {
      if (shouldRender) {
        render();
      }
      return;
    }

    if (actionNode.getAttribute("data-modal") && action === null) {
      return;
    }

    switch (action) {
      case "toggle-mobile-nav":
        ui.isMobileNavOpen = !ui.isMobileNavOpen;
        break;
      case "close-mobile-nav":
        ui.isMobileNavOpen = false;
        break;
      case "toggle-profile-menu":
        ui.isProfileMenuOpen = !ui.isProfileMenuOpen;
        break;
      case "open-profile-page":
        ui.isProfileMenuOpen = false;
        break;
      case "open-settings-page":
        ui.isProfileMenuOpen = false;
        break;
      case "toggle-theme":
        toggleTheme();
        break;
      case "toggle-date-picker": {
        const fieldName = actionNode.getAttribute("data-date-field");
        if (!fieldName || (fieldName !== "startDate" && fieldName !== "endDate")) {
          break;
        }

        if (ui.datePicker.openFor === fieldName) {
          closeDatePicker();
        } else {
          openDatePicker(fieldName);
        }
        break;
      }
      case "prev-date-month":
        shiftDatePickerMonth(-1);
        break;
      case "next-date-month":
        shiftDatePickerMonth(1);
        break;
      case "pick-date-day": {
        const fieldName = actionNode.getAttribute("data-date-field");
        const dateValue = actionNode.getAttribute("data-date-value") || "";
        if (fieldName && (fieldName === "startDate" || fieldName === "endDate")) {
          setDateFieldValue(fieldName, dateValue);
          closeDatePicker();
        }
        break;
      }
      case "clear-date-day": {
        const fieldName = actionNode.getAttribute("data-date-field");
        if (fieldName && (fieldName === "startDate" || fieldName === "endDate")) {
          setDateFieldValue(fieldName, "");
          closeDatePicker();
        }
        break;
      }
      case "set-today-date-day": {
        const fieldName = actionNode.getAttribute("data-date-field");
        if (fieldName && (fieldName === "startDate" || fieldName === "endDate")) {
          setDateFieldValue(fieldName, getTodayDateValue());
          closeDatePicker();
        }
        break;
      }
      case "open-create-board":
        ui.isCreateBoardOpen = true;
        ui.createBoardForm.title = "";
        ui.createBoardForm.color = boardPalette[0].value;
        break;
      case "close-create-board":
        if (!shouldHandleOverlayClose(actionNode, target)) {
          return;
        }
        ui.isCreateBoardOpen = false;
        break;
      case "pick-board-color":
        ui.createBoardForm.color = actionNode.getAttribute("data-color") || boardPalette[0].value;
        break;
      case "open-create-list":
        ui.isCreateListOpen = true;
        ui.createListForm.title = "";
        break;
      case "close-create-list":
        if (!shouldHandleOverlayClose(actionNode, target)) {
          return;
        }
        ui.isCreateListOpen = false;
        break;
      case "open-gantt":
        ui.isGanttModalOpen = true;
        break;
      case "close-gantt":
        if (!shouldHandleOverlayClose(actionNode, target)) {
          return;
        }
        ui.isGanttModalOpen = false;
        break;
      case "open-scheduler":
        ui.isSchedulerModalOpen = true;
        break;
      case "close-scheduler":
        if (!shouldHandleOverlayClose(actionNode, target)) {
          return;
        }
        ui.isSchedulerModalOpen = false;
        break;
      case "open-payload":
        ui.isPayloadModalOpen = true;
        ui.payloadFeedback = "";
        break;
      case "close-payload":
        if (!shouldHandleOverlayClose(actionNode, target)) {
          return;
        }
        ui.isPayloadModalOpen = false;
        break;
      case "copy-payload": {
        const board = getBoardById(ui.route.boardId);
        if (!board) {
          break;
        }
        const timelineCards = state.cards
          .filter((card) => card.boardId === board.id)
          .map((card) => {
            const derivedDates = deriveTimelineDates(card);
            if (!derivedDates) {
              return null;
            }
            return {
              id: card.id,
              title: card.title,
              description: card.description,
              createdBy: card.createdBy,
              assignees: card.assignees,
              priority: card.priority,
              completed: card.completed,
              startDateISO: derivedDates.startDateISO,
              endDateISO: derivedDates.endDateISO,
              progress: card.completed ? 1 : 0,
            };
          })
          .filter(Boolean);

        const payloadJson = JSON.stringify(toGanttDataset(timelineCards), null, 2);
        navigator.clipboard
          .writeText(payloadJson)
          .then(() => {
            ui.payloadFeedback = "Payload copiado para a area de transferencia.";
            render();
          })
          .catch(() => {
            ui.payloadFeedback = "Nao foi possivel copiar automaticamente. Use a selecao manual.";
            render();
          });
        return;
      }
      case "download-payload": {
        const board = getBoardById(ui.route.boardId);
        if (!board) {
          break;
        }
        const timelineCards = state.cards
          .filter((card) => card.boardId === board.id)
          .map((card) => {
            const derivedDates = deriveTimelineDates(card);
            if (!derivedDates) {
              return null;
            }
            return {
              id: card.id,
              title: card.title,
              description: card.description,
              createdBy: card.createdBy,
              assignees: card.assignees,
              priority: card.priority,
              completed: card.completed,
              startDateISO: derivedDates.startDateISO,
              endDateISO: derivedDates.endDateISO,
              progress: card.completed ? 1 : 0,
            };
          })
          .filter(Boolean);

        const payloadJson = JSON.stringify(toGanttDataset(timelineCards), null, 2);
        const blob = new Blob([payloadJson], { type: "application/json;charset=utf-8" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `payload-tecnico-${board.id}.json`;
        link.click();
        window.URL.revokeObjectURL(url);

        ui.payloadFeedback = "Arquivo JSON baixado.";
        break;
      }
      case "edit-board-title": {
        const board = getBoardById(ui.route.boardId);
        if (board) {
          ui.boardTitleEditing = true;
          ui.draftBoardTitle = board.title;
        }
        break;
      }
      case "edit-list-title": {
        const listId = actionNode.getAttribute("data-list-id");
        if (!listId) {
          break;
        }
        const list = state.lists.find((item) => item.id === listId);
        if (!list) {
          break;
        }
        ui.editingListId = listId;
        ui.draftListTitle = list.title;
        break;
      }
      case "open-card-composer":
        ui.composerListId = actionNode.getAttribute("data-list-id");
        ui.draftCardTitle = "";
        break;
      case "cancel-card-composer":
        ui.composerListId = null;
        ui.draftCardTitle = "";
        break;
      case "toggle-card": {
        event.stopPropagation();
        const cardId = actionNode.getAttribute("data-card-id");
        if (cardId) {
          toggleCardCompletion(cardId);
        }
        break;
      }
      case "close-card-details":
        if (!shouldHandleOverlayClose(actionNode, target)) {
          return;
        }
        closeCardDetails();
        break;
      case "pick-search-item":
        ui.searchQuery = "";
        ui.isSearchOpen = false;
        break;
      default:
        break;
    }

    render();
  }

  function handleInput(event) {
    const target = event.target;
    const action = target.getAttribute("data-action");
    let shouldRender = false;

    switch (action) {
      case "search-query":
        ui.searchQuery = target.value;
        ui.isSearchOpen = shouldShowSearchSuggestions();
        shouldRender = true;
        break;
      case "draft-create-board-title":
        ui.createBoardForm.title = target.value;
        break;
      case "draft-create-list-title":
        ui.createListForm.title = target.value;
        break;
      case "board-title-input":
        ui.draftBoardTitle = target.value;
        break;
      case "list-title-input":
        ui.draftListTitle = target.value;
        break;
      case "draft-card":
        ui.draftCardTitle = target.value;
        break;
      case "draft-card-title":
        ui.cardForm.title = target.value;
        break;
      case "draft-card-description":
        ui.cardForm.description = target.value;
        break;
      case "draft-card-assignee":
        ui.cardForm.selectedAssignee = target.value;
        break;
      case "draft-card-priority":
        ui.cardForm.priority = target.value;
        break;
      case "draft-card-start-date":
        ui.cardForm.startDate = target.value;
        break;
      case "draft-card-end-date":
        ui.cardForm.endDate = target.value;
        break;
      default:
        return;
    }

    if (shouldRender) {
      render();
    }
  }

  function handleFocusIn(event) {
    const target = event.target;
    if (target.classList.contains("header__input")) {
      if (shouldShowSearchSuggestions()) {
        ui.isSearchOpen = true;
        render();
      }
    }
  }

  function commitBoardTitleIfNeeded() {
    if (!ui.boardTitleEditing) {
      return;
    }

    const board = getBoardById(ui.route.boardId);
    if (!board) {
      ui.boardTitleEditing = false;
      return;
    }

    const nextTitle = ui.draftBoardTitle.trim();

    if (nextTitle.length >= 2 && nextTitle !== board.title) {
      updateBoardTitle(board.id, nextTitle);
      ui.draftBoardTitle = nextTitle;
    } else {
      ui.draftBoardTitle = board.title;
    }

    ui.boardTitleEditing = false;
  }

  function commitListTitleIfNeeded() {
    if (!ui.editingListId) {
      return;
    }

    const list = state.lists.find((item) => item.id === ui.editingListId);
    if (!list) {
      ui.editingListId = null;
      return;
    }

    const nextTitle = ui.draftListTitle.trim();

    if (nextTitle.length >= 2 && nextTitle !== list.title) {
      updateListTitle(list.id, nextTitle);
      ui.draftListTitle = nextTitle;
    } else {
      ui.draftListTitle = list.title;
    }

    ui.editingListId = null;
  }

  function handleKeyDown(event) {
    if (event.key === "Escape") {
      if (ui.datePicker.openFor) {
        closeDatePicker();
        render();
        return;
      }

      if (ui.boardTitleEditing) {
        const board = getBoardById(ui.route.boardId);
        ui.boardTitleEditing = false;
        ui.draftBoardTitle = board ? board.title : "";
        render();
        return;
      }

      if (ui.editingListId) {
        const list = state.lists.find((item) => item.id === ui.editingListId);
        ui.draftListTitle = list ? list.title : "";
        ui.editingListId = null;
        render();
        return;
      }

      if (ui.isCreateBoardOpen || ui.isCreateListOpen || ui.isGanttModalOpen || ui.isSchedulerModalOpen || ui.isPayloadModalOpen || ui.activeCardId) {
        closeAllModals();
        render();
        return;
      }

      if (ui.isProfileMenuOpen) {
        ui.isProfileMenuOpen = false;
        render();
        return;
      }

      if (ui.isMobileNavOpen) {
        ui.isMobileNavOpen = false;
        render();
        return;
      }

      if (ui.isSearchOpen) {
        ui.isSearchOpen = false;
        render();
      }
      return;
    }

    if (event.key === "Enter") {
      const target = event.target;

      if (target.getAttribute("data-action") === "board-title-input") {
        event.preventDefault();
        commitBoardTitleIfNeeded();
        render();
        return;
      }

      if (target.getAttribute("data-action") === "list-title-input") {
        event.preventDefault();
        commitListTitleIfNeeded();
        render();
      }
    }
  }

  function handleBlur(event) {
    const target = event.target;
    const action = target.getAttribute("data-action");

    if (action === "board-title-input") {
      commitBoardTitleIfNeeded();
      render();
      return;
    }

    if (action === "list-title-input") {
      commitListTitleIfNeeded();
      render();
    }
  }

  function handleSubmit(event) {
    const form = event.target;
    const action = form.getAttribute("data-action");

    if (!action) {
      return;
    }

    event.preventDefault();

    switch (action) {
      case "submit-create-board": {
        const title = ui.createBoardForm.title.trim();
        if (title.length < 3) {
          return;
        }

        const board = createBoard({
          title,
          color: ui.createBoardForm.color,
        });

        ui.isCreateBoardOpen = false;
        ui.searchQuery = "";
        ui.isSearchOpen = false;
        setRoute({ name: "board", boardId: board.id });
        return;
      }
      case "submit-create-list": {
        const board = getBoardById(ui.route.boardId);
        if (!board) {
          return;
        }

        const title = ui.createListForm.title.trim();
        if (title.length < 2) {
          return;
        }

        createList(board.id, title);
        ui.isCreateListOpen = false;
        ui.createListForm.title = "";
        break;
      }
      case "submit-card": {
        const listId = form.getAttribute("data-list-id");
        const board = getBoardById(ui.route.boardId);

        if (!listId || !board) {
          return;
        }

        const title = ui.draftCardTitle.trim();
        if (title.length < 2) {
          return;
        }

        createCard({ boardId: board.id, listId, title });
        ui.draftCardTitle = "";
        break;
      }
      case "submit-card-details": {
        const card = state.cards.find((item) => item.id === ui.activeCardId);
        if (!card) {
          return;
        }

        const hasValidDateRange =
          !ui.cardForm.startDate || !ui.cardForm.endDate || ui.cardForm.startDate <= ui.cardForm.endDate;
        const title = ui.cardForm.title.trim();

        if (title.length < 2 || !hasValidDateRange) {
          return;
        }

        updateCard({
          cardId: card.id,
          title,
          description: ui.cardForm.description.trim() || undefined,
          createdBy: state.workspace.currentUser,
          assignees: ui.cardForm.selectedAssignee ? [ui.cardForm.selectedAssignee] : [],
          priority: ui.cardForm.priority,
          startDateISO: toIsoFromDateInput(ui.cardForm.startDate),
          endDateISO: toIsoFromDateInput(ui.cardForm.endDate),
        });

        closeCardDetails();
        break;
      }
      default:
        return;
    }

    render();
  }

  function handleDragStart(event) {
    const list = event.target.closest(".kanban-list");
    const card = event.target.closest(".kanban-card");

    if (card) {
      const cardId = card.getAttribute("data-card-id");
      if (!cardId) {
        return;
      }

      ui.draggingCardId = cardId;
      ui.draggingListId = null;
      event.dataTransfer.effectAllowed = "move";
      return;
    }

    if (list) {
      const interactive = getInteractiveTarget(event.target);
      if (interactive && !interactive.classList.contains("kanban-list-title-button")) {
        event.preventDefault();
        return;
      }

      const listId = list.getAttribute("data-list-id");
      if (!listId) {
        return;
      }

      ui.draggingListId = listId;
      ui.draggingCardId = null;
      event.dataTransfer.effectAllowed = "move";
    }
  }

  function handleDragOver(event) {
    const board = event.target.closest("[data-role='kanban-board']");

    if (ui.draggingListId && board) {
      event.preventDefault();
      ui.dropTargetListId = resolveListDropTargetId(board, event.clientX);
      render();
      return;
    }

    const list = event.target.closest(".kanban-list");
    if (!list) {
      return;
    }

    event.preventDefault();
    const listId = list.getAttribute("data-list-id");
    if (!listId) {
      return;
    }

    if (ui.draggingListId) {
      ui.dropTargetListId = listId;
    } else if (ui.draggingCardId) {
      ui.dropListTargetId = listId;
    }

    render();
  }

  function handleDrop(event) {
    const board = event.target.closest("[data-role='kanban-board']");

    if (ui.draggingListId && board) {
      event.preventDefault();

      const currentBoard = getBoardById(ui.route.boardId);
      const targetListId = resolveListDropTargetId(board, event.clientX);

      if (currentBoard && targetListId) {
        moveListBefore(currentBoard.id, ui.draggingListId, targetListId);
      }

      ui.draggingListId = null;
      ui.draggingCardId = null;
      ui.dropTargetListId = null;
      ui.dropListTargetId = null;
      render();
      return;
    }

    const list = event.target.closest(".kanban-list");
    if (!list) {
      return;
    }

    event.preventDefault();

    const targetListId = list.getAttribute("data-list-id");
    if (!targetListId) {
      return;
    }

    const currentBoard = getBoardById(ui.route.boardId);

    if (ui.draggingListId && currentBoard) {
      moveListBefore(currentBoard.id, ui.draggingListId, targetListId);
    }

    if (ui.draggingCardId) {
      moveCardToList(ui.draggingCardId, targetListId);
    }

    ui.draggingListId = null;
    ui.draggingCardId = null;
    ui.dropTargetListId = null;
    ui.dropListTargetId = null;

    render();
  }

  function handleDragEnd() {
    ui.draggingListId = null;
    ui.draggingCardId = null;
    ui.dropTargetListId = null;
    ui.dropListTargetId = null;
    render();
  }

  function mountGantt(timelineCards) {
    const host = document.getElementById("frappe-gantt-host");
    if (!host) {
      return;
    }

    if (!timelineCards.length) {
      host.innerHTML = '<p class="scheduler-empty">Sem dados suficientes para montar o grafico de Gantt.</p>';
      return;
    }

    host.innerHTML = '<div class="frappe-gantt-wrapper" aria-label="Grafico de Gantt"></div>';

    const wrapper = host.querySelector(".frappe-gantt-wrapper");
    if (!wrapper) {
      return;
    }

    if (typeof window.Gantt !== "function") {
      wrapper.innerHTML = '<p class="scheduler-empty">Biblioteca Gantt nao carregada.</p>';
      return;
    }

    const tasks = timelineCards.map((card) => ({
      id: card.id,
      name: card.title,
      start: toFrappeDate(card.startDateISO),
      end: toFrappeDate(card.endDateISO),
      progress: Math.round((card.progress || 0) * 100),
      description: card.description,
      createdBy: card.createdBy,
      assignees: card.assignees,
      priority: card.priority,
      color: card.priority === "high" ? "#d94848" : card.priority === "medium" ? "#d97706" : "#2f6fe4",
      color_progress: card.priority === "high" ? "#f5a3a3" : card.priority === "medium" ? "#f8cf8b" : "#9bc0ff",
      custom_class: card.priority ? `task-priority-${card.priority}` : undefined,
    }));

    const chart = new window.Gantt(wrapper, tasks, {
      language: "pt",
      view_mode: "Week",
      view_mode_select: true,
      today_button: true,
      container_height: 640,
      popup_on: "click",
      readonly: true,
      lines: "both",
      scroll_to: "today",
      popup: (ctx) => {
        const task = ctx.task;
        const createdBy = task.createdBy && task.createdBy.trim() ? task.createdBy : "Nao definido";
        const assignees = toAssigneesLabel(task.assignees);
        ctx.set_title(task.name);
        ctx.set_subtitle(`${task.start} - ${task.end}`);
        ctx.set_details(`Criado por: ${createdBy}<br/>Atuando: ${assignees}<br/>Progresso: ${Math.round(task.progress || 0)}%`);
        return undefined;
      },
    });

    void chart;

    window.requestAnimationFrame(() => {
      const wrappers = wrapper.querySelectorAll(".bar-wrapper");
      wrappers.forEach((barWrapper) => {
        const label = barWrapper.querySelector(".bar-label");
        const bar = barWrapper.querySelector(".bar");

        if (!label || !bar || typeof bar.getBBox !== "function") {
          return;
        }

        const barBox = bar.getBBox();
        label.classList.add("big");
        label.setAttribute("text-anchor", "start");
        label.setAttribute("x", String(barBox.x + barBox.width + 10));
      });
    });
  }

  function bindGlobalEvents() {
    document.addEventListener("click", handleClick);
    document.addEventListener("input", handleInput);
    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("focusout", handleBlur);
    document.addEventListener("submit", handleSubmit);
    document.addEventListener("dragstart", handleDragStart);
    document.addEventListener("dragover", handleDragOver);
    document.addEventListener("drop", handleDrop);
    document.addEventListener("dragend", handleDragEnd);

    document.addEventListener("mousedown", (event) => {
      const board = event.target.closest("[data-role='kanban-board']");

      if (!board || event.button !== 0) {
        return;
      }

      const interactive = event.target.closest(
        "button, input, textarea, select, a, label, .kanban-card, .kanban-list, .kanban-add-list-tile"
      );

      if (interactive) {
        return;
      }

      ui.boardPanState.active = true;
      ui.boardPanState.pointerStartX = event.clientX;
      ui.boardPanState.startScrollLeft = board.scrollLeft;
      ui.boardPanState.boardEl = board;
      ui.isBoardPanning = true;
      board.style.cursor = "grabbing";
      document.body.style.userSelect = "none";
    });

    window.addEventListener("mousemove", (event) => {
      if (!ui.boardPanState.active || !ui.boardPanState.boardEl) {
        return;
      }

      const deltaX = event.clientX - ui.boardPanState.pointerStartX;
      ui.boardPanState.boardEl.scrollLeft = ui.boardPanState.startScrollLeft - deltaX;
    });

    window.addEventListener("mouseup", () => {
      if (!ui.boardPanState.active) {
        return;
      }

      if (ui.boardPanState.boardEl) {
        ui.boardPanState.boardEl.style.cursor = "";
      }

      ui.boardPanState.active = false;
      ui.boardPanState.boardEl = null;
      ui.isBoardPanning = false;
      document.body.style.userSelect = "";
    });

    window.addEventListener("hashchange", () => {
      ui.isMobileNavOpen = false;
      ui.isSearchOpen = false;
      ui.isProfileMenuOpen = false;
      ui.searchQuery = "";
      ui.boardTitleEditing = false;
      ui.editingListId = null;
      ui.composerListId = null;
      ui.draggingListId = null;
      ui.draggingCardId = null;
      ui.dropTargetListId = null;
      ui.dropListTargetId = null;
      ui.boardPanState.active = false;
      ui.boardPanState.boardEl = null;
      closeDatePicker();
      closeAllModals();
      render();
    });

    window.addEventListener("resize", () => {
      if (ui.datePicker.openFor) {
        updateDatePickerPanelPlacement();
      }

      updateKanbanDotsFromScroll();
    });

    document.addEventListener("scroll", (event) => {
      const target = event.target;
      if (target && target.matches && target.matches("[data-role='kanban-board']")) {
        updateKanbanDotsFromScroll();
      }
    }, true);
  }

  bindGlobalEvents();

  applyTheme(resolveInitialTheme());

  if (!window.location.hash) {
    setRoute({ name: "boards", boardId: "" });
  }

  render();
})();
