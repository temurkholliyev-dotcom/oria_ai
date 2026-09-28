const API_ENDPOINT = '/api/chat';
const STORAGE_KEY = 'oria-gemini-key';
const SYSTEM_PROMPT = 'Siz Nia nomli muloyim, bilimdon va aniq AI yordamchisiz. Foydalanuvchiga o‘zbek tilida javob bering, agar u boshqa tilni so‘ramasa. Javoblarni tushunarli, foydali va samimiy saqlang.';
const QUIZ_QUESTIONS = [
  { category: 'HTML', question: 'HTML qisqartmasi nimani anglatadi?', options: ['HyperText Markup Language', 'HighText Machine Language', 'HyperTransfer Markup Logic', 'Home Tool Markup Language'], correctIndex: 0 },
  { category: 'HTML', question: 'Veb-sahifada havola yaratish uchun qaysi teg ishlatiladi?', options: ['<a>', '<link>', '<href>', '<nav>'], correctIndex: 0 },
  { category: 'HTML', question: 'Sahifaning asosiy mazmunini qaysi semantik teg bildiradi?', options: ['<main>', '<div>', '<footer>', '<meta>'], correctIndex: 0 },
  { category: 'CSS', question: 'Matn rangini o‘zgartiradigan CSS xususiyati qaysi?', options: ['color', 'font-color', 'text-style', 'foreground'], correctIndex: 0 },
  { category: 'CSS', question: 'CSS’da class selektori qaysi belgi bilan boshlanadi?', options: ['.', '#', ':', '*'], correctIndex: 0 },
  { category: 'CSS', question: 'display: flex qoidasi asosan nima uchun ishlatiladi?', options: ['Elementlarni moslashuvchan tartiblash uchun', 'Rasm sifatini oshirish uchun', 'Matnni tarjima qilish uchun', 'HTML tegini yaratish uchun'], correctIndex: 0 },
  { category: 'GitHub', question: 'GitHub asosan nima uchun xizmat qiladi?', options: ['Git loyihalarini saqlash va hamkorlikda ishlash uchun', 'Kompyuterni viruslardan tozalash uchun', 'Veb-sayt rangini tanlash uchun', 'Elektron pochta yuborish uchun'], correctIndex: 0 },
  { category: 'GitHub', question: 'Masofadagi repozitoriyani kompyuterga nusxalash buyrug‘i qaysi?', options: ['git clone', 'git paint', 'git open', 'git design'], correctIndex: 0 },
  { category: 'GitHub', question: 'Pull request nima qilishga imkon beradi?', options: ['O‘zgarishlarni asosiy loyihaga qo‘shishni taklif qilishga', 'Kompyuterni qayta ishga tushirishga', 'Rasmni siqishga', 'Yangi dasturlash tilini o‘rnatishga'], correctIndex: 0 },
  { category: 'Kompyuter', question: 'CPU kompyuterda qanday vazifani bajaradi?', options: ['Buyruqlarni bajarib, ma’lumotlarni qayta ishlaydi', 'Fayllarni qog‘ozga chiqaradi', 'Internet kabelini ulaydi', 'Ekran yorqinligini o‘lchaydi'], correctIndex: 0 },
  { category: 'Kompyuter', question: 'RAM xotirasining asosiy xususiyati qaysi?', options: ['Ishlayotgan dasturlar uchun vaqtinchalik xotira bo‘ladi', 'Kompyuter o‘chganda barcha fayllarni doimiy saqlaydi', 'Faqat tasvirni monitorga uzatadi', 'Internet tezligini oshiradi'], correctIndex: 0 },
  { category: 'Kompyuter', question: 'Operatsion tizimning vazifasi nima?', options: ['Kompyuter resurslari va dasturlar ishini boshqarish', 'Faqat veb-sahifalar chizish', 'Elektr tokini ishlab chiqarish', 'Faqat matnni tahrirlash'], correctIndex: 0 }
];

const form = document.querySelector('#chat-form');
const promptInput = document.querySelector('#prompt-input');
const sendButton = document.querySelector('#send-button');
const messages = document.querySelector('#messages');
const welcomeView = document.querySelector('#welcome-view');
const modal = document.querySelector('#settings-modal');
const settingsForm = document.querySelector('#settings-form');
const apiKeyInput = document.querySelector('#api-key');
const connection = document.querySelector('#connection-indicator');
const connectionLabel = document.querySelector('#connection-label');
const historyList = document.querySelector('#history-list');
const toast = document.querySelector('#toast');
const conversationView = document.querySelector('.conversation');
const quizView = document.querySelector('#quiz-view');
const cosmosView = document.querySelector('#cosmos-view');
const natureView = document.querySelector('#nature-view');
const breathCard = document.querySelector('.breath-card');
const breathPhase = document.querySelector('#breath-phase');
const breathCount = document.querySelector('#breath-count');
const breathToggle = document.querySelector('#breath-toggle');
const composerWrap = document.querySelector('#composer-wrap');
const quizCount = document.querySelector('#quiz-count');
const quizCategory = document.querySelector('#quiz-category');
const quizProgressFill = document.querySelector('#quiz-progress-fill');
const quizQuestionArea = document.querySelector('#quiz-question-area');
const quizQuestion = document.querySelector('#quiz-question');
const quizOptions = document.querySelector('#quiz-options');
const quizFeedback = document.querySelector('#quiz-feedback');
const quizNext = document.querySelector('#quiz-next');
const quizResult = document.querySelector('#quiz-result');

let conversation = [];
let isSending = false;
let toastTimer;
let quizQuestions = [];
let quizIndex = 0;
let quizScore = 0;
let quizAnswered = false;
let breathTimer = null;
let breathElapsed = 0;

function hasApiKey() {
  return true;
}

function updateConnection() {
  const connected = true;
  connection.classList.toggle('is-connected', connected);
  connectionLabel.textContent = 'Backend tayyor';
}

function showToast(text) {
  toast.textContent = text;
  toast.classList.add('is-visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 3000);
}

function openSettings() {
  apiKeyInput.value = sessionStorage.getItem(STORAGE_KEY) || '';
  modal.hidden = false;
  window.setTimeout(() => apiKeyInput.focus(), 40);
}

function closeSettings() {
  modal.hidden = true;
}

function shuffle(items) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function startQuiz() {
  quizQuestions = shuffle(QUIZ_QUESTIONS).map((item) => ({
    ...item,
    answers: shuffle(item.options.map((text, index) => ({ text, isCorrect: index === item.correctIndex })))
  }));
  quizIndex = 0;
  quizScore = 0;
  renderQuizQuestion();
}

function renderQuizQuestion() {
  const item = quizQuestions[quizIndex];
  quizAnswered = false;
  quizQuestionArea.hidden = false;
  quizResult.hidden = true;
  quizCount.textContent = `${quizIndex + 1} / ${quizQuestions.length}`;
  quizCategory.textContent = item.category;
  quizProgressFill.style.width = `${(quizIndex / quizQuestions.length) * 100}%`;
  quizQuestion.textContent = item.question;
  quizFeedback.textContent = '';
  quizFeedback.className = 'quiz-feedback';
  quizNext.disabled = true;
  quizNext.innerHTML = quizIndex === quizQuestions.length - 1
    ? 'Natijani ko‘rish <span>→</span>'
    : 'Keyingi savol <span>→</span>';
  quizOptions.replaceChildren();

  item.answers.forEach((answer, index) => {
    const option = document.createElement('button');
    option.className = 'quiz-option';
    option.type = 'button';
    const letter = document.createElement('span');
    letter.className = 'option-letter';
    letter.textContent = String.fromCharCode(65 + index);
    const text = document.createElement('span');
    text.className = 'option-text';
    text.textContent = answer.text;
    option.append(letter, text);
    option.addEventListener('click', () => chooseQuizAnswer(answer));
    quizOptions.append(option);
  });
}

function chooseQuizAnswer(selectedAnswer) {
  if (quizAnswered) return;
  quizAnswered = true;
  if (selectedAnswer.isCorrect) quizScore += 1;

  [...quizOptions.children].forEach((option, index) => {
    const answer = quizQuestions[quizIndex].answers[index];
    option.disabled = true;
    if (answer.isCorrect) option.classList.add('is-correct');
    else if (answer === selectedAnswer) option.classList.add('is-incorrect');
  });

  quizFeedback.textContent = selectedAnswer.isCorrect
    ? 'To‘g‘ri javob!'
    : `Noto‘g‘ri. To‘g‘ri javob: ${quizQuestions[quizIndex].answers.find((answer) => answer.isCorrect).text}`;
  quizFeedback.classList.add(selectedAnswer.isCorrect ? 'is-positive' : 'is-negative');
  quizProgressFill.style.width = `${((quizIndex + 1) / quizQuestions.length) * 100}%`;
  quizNext.disabled = false;
}

function finishQuiz() {
  quizQuestionArea.hidden = true;
  quizResult.hidden = false;
  quizCount.textContent = `${quizQuestions.length} / ${quizQuestions.length}`;
  quizCategory.textContent = 'TUGADI';
  quizProgressFill.style.width = '100%';
  document.querySelector('#quiz-score').textContent = quizScore;
  document.querySelector('#quiz-result-title').textContent = quizScore >= 10
    ? 'Ajoyib natija!'
    : quizScore >= 7 ? 'Yaxshi natija!' : 'Yana bir bor sinab ko‘ring';
  document.querySelector('#quiz-result-copy').textContent = `${quizQuestions.length} ta savoldan ${quizScore} tasiga to‘g‘ri javob berdingiz.`;
}

function updateBreathDisplay() {
  const cycleTime = breathElapsed % 14;
  let phase;
  let phaseSeconds;
  if (cycleTime < 4) {
    phase = 'Nafas oling';
    phaseSeconds = 4 - cycleTime;
  } else if (cycleTime < 8) {
    phase = 'Ushlab turing';
    phaseSeconds = 8 - cycleTime;
  } else {
    phase = 'Sekin chiqaring';
    phaseSeconds = 14 - cycleTime;
  }
  const remaining = 60 - breathElapsed;
  breathPhase.textContent = `${phase} · ${phaseSeconds}`;
  breathCount.textContent = `00:${String(remaining).padStart(2, '0')}`;
}

function stopBreathing(completed = false) {
  window.clearInterval(breathTimer);
  breathTimer = null;
  breathCard.classList.remove('is-running');
  breathToggle.textContent = completed ? 'Yana bir bor' : 'Qayta boshlash';
  breathPhase.textContent = completed ? 'Juda yaxshi' : 'Mashq to‘xtatildi';
  if (completed) breathCount.textContent = '00:00';
}

function toggleBreathing() {
  if (breathTimer) {
    stopBreathing();
    return;
  }

  breathElapsed = 0;
  breathCard.classList.add('is-running');
  breathToggle.textContent = 'To‘xtatish';
  updateBreathDisplay();
  breathTimer = window.setInterval(() => {
    breathElapsed += 1;
    if (breathElapsed >= 60) {
      stopBreathing(true);
      return;
    }
    updateBreathDisplay();
  }, 1000);
}

function setMode(mode) {
  conversationView.hidden = mode !== 'chat';
  quizView.hidden = mode !== 'quiz';
  cosmosView.hidden = mode !== 'cosmos';
  natureView.hidden = mode !== 'nature';
  composerWrap.hidden = mode !== 'chat';
  document.body.classList.toggle('mode-cosmos', mode === 'cosmos');
  document.body.classList.toggle('mode-quiz', mode === 'quiz');
  document.body.classList.toggle('mode-nature', mode === 'nature');
  if (mode !== 'nature' && breathTimer) stopBreathing();
  document.querySelectorAll('.mode-tab').forEach((tab) => {
    const isActive = tab.dataset.modeTarget === mode;
    tab.classList.toggle('is-active', isActive);
    tab.setAttribute('aria-pressed', String(isActive));
  });
  if (mode === 'quiz' && quizQuestions.length === 0) startQuiz();
  if (mode === 'chat') promptInput.focus();
}

function createMessage(role, text = '', state = '') {
  const article = document.createElement('article');
  article.className = `message ${role}${state ? ` ${state}` : ''}`;

  if (role === 'assistant') {
    const badge = document.createElement('div');
    badge.className = 'message-badge';
    badge.setAttribute('aria-hidden', 'true');
    badge.textContent = '✳';
    article.append(badge);
  }

  const content = document.createElement('div');
  content.className = 'message-content';
  if (role === 'assistant') {
    const label = document.createElement('div');
    label.className = 'message-label';
    label.textContent = 'Nia';
    content.append(label);
  }

  if (state === 'thinking') {
    const dots = document.createElement('div');
    dots.className = 'thinking';
    dots.setAttribute('aria-label', 'Nia javob tayyorlamoqda');
    dots.innerHTML = '<span></span><span></span><span></span>';
    content.append(dots);
  } else {
    const paragraph = document.createElement('p');
    paragraph.className = 'message-text';
    paragraph.textContent = text;
    content.append(paragraph);
  }

  article.append(content);
  messages.append(article);
  messages.scrollTop = messages.scrollHeight;
  return article;
}

function refreshHistory() {
  historyList.replaceChildren();
  const firstUserMessage = conversation.find((item) => item.role === 'user');
  if (!firstUserMessage) {
    const empty = document.createElement('span');
    empty.className = 'history-empty';
    empty.textContent = 'Suhbatlaringiz shu yerda';
    historyList.append(empty);
    return;
  }

  const item = document.createElement('div');
  item.className = 'history-empty';
  item.textContent = firstUserMessage.parts[0].text.slice(0, 38);
  historyList.append(item);
}

function beginConversation() {
  welcomeView.hidden = true;
  messages.hidden = false;
}

function resetConversation() {
  conversation = [];
  messages.replaceChildren();
  messages.hidden = true;
  welcomeView.hidden = false;
  refreshHistory();
  setMode('chat');
  promptInput.focus();
}

async function requestGemini() {
  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conversation
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data.error?.message || `So‘rov bajarilmadi (${response.status}).`;
    throw new Error(message);
  }

  const answer = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || '')
    .join('')
    .trim();
  if (!answer) throw new Error('AI javob qaytarmadi. Savolingizni boshqacha yozib ko‘ring.');
  return answer;
}

async function sendMessage(text) {
  const prompt = text.trim();
  if (!prompt || isSending) return;
  beginConversation();
  createMessage('user', prompt);
  conversation.push({ role: 'user', parts: [{ text: prompt }] });
  refreshHistory();
  promptInput.value = '';
  promptInput.style.height = 'auto';
  isSending = true;
  sendButton.disabled = true;
  const loadingMessage = createMessage('assistant', '', 'thinking');

  try {
    const answer = await requestGemini();
    conversation.push({ role: 'model', parts: [{ text: answer }] });
    const paragraph = document.createElement('p');
    paragraph.className = 'message-text';
    paragraph.textContent = answer;
    const content = loadingMessage.querySelector('.message-content');
    content.querySelector('.thinking').replaceWith(paragraph);
    messages.scrollTop = messages.scrollHeight;
  } catch (error) {
    loadingMessage.classList.add('error');
    const paragraph = document.createElement('p');
    paragraph.className = 'message-text';
    paragraph.textContent = `Javob olishda xatolik: ${error.message}`;
    loadingMessage.querySelector('.thinking').replaceWith(paragraph);
    showToast(error.message || 'Gemini bilan ulanishda xatolik yuz berdi.');
  } finally {
    isSending = false;
    sendButton.disabled = !promptInput.value.trim();
    promptInput.focus();
  }
}

document.querySelector('#open-settings').addEventListener('click', openSettings);
document.querySelector('#mobile-settings').addEventListener('click', openSettings);
document.querySelector('#close-settings').addEventListener('click', closeSettings);
document.querySelector('#new-chat').addEventListener('click', resetConversation);
document.querySelector('#reveal-key').addEventListener('click', () => {
  apiKeyInput.type = apiKeyInput.type === 'password' ? 'text' : 'password';
});

modal.addEventListener('click', (event) => {
  if (event.target === modal) closeSettings();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !modal.hidden) closeSettings();
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    resetConversation();
  }
});

settingsForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const key = apiKeyInput.value.trim();
  if (!key) {
    apiKeyInput.focus();
    showToast('Avval Gemini API kalitini kiriting.');
    return;
  }
  sessionStorage.setItem(STORAGE_KEY, key);
  updateConnection();
  closeSettings();
  showToast('Gemini muvaffaqiyatli ulandi.');
  promptInput.focus();
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  void sendMessage(promptInput.value);
});

promptInput.addEventListener('input', () => {
  promptInput.style.height = 'auto';
  promptInput.style.height = `${Math.min(promptInput.scrollHeight, 130)}px`;
  sendButton.disabled = !promptInput.value.trim() || isSending;
});

promptInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    form.requestSubmit();
  }
});

document.querySelectorAll('.suggestion').forEach((button) => {
  button.addEventListener('click', () => {
    const prompt = button.dataset.prompt;
    promptInput.value = prompt;
    promptInput.dispatchEvent(new Event('input'));
    void sendMessage(prompt);
  });
});

document.querySelectorAll('[data-mode-target]').forEach((button) => {
  button.addEventListener('click', () => setMode(button.dataset.modeTarget));
});

quizNext.addEventListener('click', () => {
  if (quizIndex === quizQuestions.length - 1) {
    finishQuiz();
    return;
  }
  quizIndex += 1;
  renderQuizQuestion();
});

breathToggle.addEventListener('click', toggleBreathing);

document.querySelector('#orbit-button').addEventListener('click', () => {
  document.querySelector('.black-hole-stage').classList.toggle('is-approaching');
});

document.querySelector('#restart-quiz').addEventListener('click', startQuiz);

updateConnection();
