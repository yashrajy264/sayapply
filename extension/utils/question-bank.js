import { normalizeLabel, generateUUID } from './helpers';

export const getAllQuestions = async () => {
  const result = await chrome.storage.local.get(['questionBank']);
  return result.questionBank || [];
};

export const findAnswer = async (questionLabel) => {
  const questions = await getAllQuestions();
  const normalized = normalizeLabel(questionLabel);
  
  // Exact match
  const exactMatch = questions.find(q => q.label === questionLabel);
  if (exactMatch) return exactMatch;
  
  // Normalized match
  const normalizedMatch = questions.find(q => q.normalizedLabel === normalized);
  if (normalizedMatch) return normalizedMatch;
  
  return null;
};

export const saveAnswer = async (questionLabel, fieldType, options, answer, source) => {
  const questions = await getAllQuestions();
  const newEntry = {
    id: generateUUID(),
    label: questionLabel,
    normalizedLabel: normalizeLabel(questionLabel),
    fieldType,
    options,
    answer,
    source,
    createdAt: Date.now(),
    timesUsed: 1
  };
  
  await chrome.storage.local.set({ questionBank: [newEntry, ...questions] });
  return newEntry;
};

export const updateAnswer = async (id, newAnswer) => {
  const questions = await getAllQuestions();
  const index = questions.findIndex(q => q.id === id);
  if (index !== -1) {
    questions[index].answer = newAnswer;
    await chrome.storage.local.set({ questionBank: questions });
    return questions[index];
  }
  return null;
};

export const deleteQuestion = async (id) => {
  const questions = await getAllQuestions();
  const filtered = questions.filter(q => q.id !== id);
  await chrome.storage.local.set({ questionBank: filtered });
};

export const incrementTimesUsed = async (id) => {
  const questions = await getAllQuestions();
  const index = questions.findIndex(q => q.id === id);
  if (index !== -1) {
    questions[index].timesUsed = (questions[index].timesUsed || 0) + 1;
    await chrome.storage.local.set({ questionBank: questions });
  }
};

export const exportToJSON = async () => {
  const questions = await getAllQuestions();
  return JSON.stringify(questions, null, 2);
};

export const importFromJSON = async (jsonString) => {
  try {
    const newQuestions = JSON.parse(jsonString);
    if (!Array.isArray(newQuestions)) throw new Error('Invalid format');
    
    const currentQuestions = await getAllQuestions();
    let imported = 0;
    let skipped = 0;
    
    for (const q of newQuestions) {
      if (!currentQuestions.find(cq => cq.normalizedLabel === q.normalizedLabel)) {
        currentQuestions.push({ ...q, id: generateUUID() });
        imported++;
      } else {
        skipped++;
      }
    }
    
    await chrome.storage.local.set({ questionBank: currentQuestions });
    return { imported, skipped };
  } catch (e) {
    console.error('Import failed', e);
    return { imported: 0, skipped: 0, error: e.message };
  }
};
