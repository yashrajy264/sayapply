export const sleep = (min, max) => {
  const ms = Math.floor(Math.random() * (max - min + 1) + min);
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const humanLikeSleep = () => {
  // Random delay between 500ms and 2000ms for natural feeling
  // Occasional longer pauses to simulate reading/thinking
  const isThinking = Math.random() < 0.2; // 20% chance of "thinking"
  const min = isThinking ? 1500 : 500;
  const max = isThinking ? 4000 : 1500;
  return sleep(min, max);
};

export const normalizeLabel = (str) => {
  if (!str) return '';
  return str.toLowerCase().replace(/[^\w\s]/g, '').trim();
};

export const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const base64ToFile = (base64, fileName, mimeType) => {
  const byteString = atob(base64.split(',')[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new File([ab], fileName, { type: mimeType });
};

export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};

export const truncate = (str, maxLength) => {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
};

export const buildGeminiPrompt = (type, profile, fieldLabel, fieldType, options, jobDescription) => {
  const profileJson = JSON.stringify(profile, null, 2);
  const context = jobDescription ? `\nJob Description:\n${jobDescription.slice(0, 3000)}...` : ''; // Truncate JD to avoid token limits

  if (type === 'fill_text_field') {
    return `User Profile:\n${profileJson}${context}\n\nForm Field Label: "${fieldLabel}"\nField Type: ${fieldType}\n\nTask: Provide the best answer for this field based on the user's profile and the job description. If the field asks for a cover letter or specific reason for applying, write a short, relevant response connecting the profile to the job description.\n\nReturn ONLY the answer text.`;
  }

  if (type === 'fill_textarea_field') {
    return `User Profile:\n${profileJson}${context}\n\nTextarea Question: "${fieldLabel}"\n\nTask: Write a human-like, specific answer. Connect the user's skills to the job requirements found in the description. Keep it concise unless asked otherwise.\n\nAnswer:`;
  }

  if (type === 'fill_select_or_radio') {
    const optionsList = options ? options.join('\n') : '';
    return `User Profile:\n${profileJson}${context}\n\nForm Field Label: "${fieldLabel}"\nAvailable Options:\n${optionsList}\n\nTask: Select the best option. If the question is about years of experience, calculate it from the profile or estimate conservatively.\n\nReturn ONLY the exact option text.`;
  }

  if (type === 'check_if_answerable') {
    return `User Profile:\n${profileJson}\n\nForm Field Label: "${fieldLabel}"\nField Type: ${fieldType}\n\nCan the profile data answer this question? YES or NO.`;
  }

  if (type === 'batch_mapping') {
    return `User Profile:\n${profileJson}${context}\n\nForm Fields Array:\n${JSON.stringify(fieldLabel, null, 2)}\n\nTask: Map the user's profile to the provided form fields. For 'file' types, specify the filename if a resume exists in the profile, or null. For 'checkbox', 'radio', and 'select' types, provide the exact match from the available options. If a field cannot be definitively answered from the profile, return an empty string "" for that field's answer.\n\nReturn a valid JSON object ONLY, where the keys are the field \`id\`s and the values are the generated answers. Example: { "sayapply_field_0": "John", "sayapply_field_1": "yes" }`;
  }

  return '';
};
