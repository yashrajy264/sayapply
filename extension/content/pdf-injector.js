import { getResumeBase64 } from '../utils/storage';
import { base64ToFile } from '../utils/helpers';

export const injectPDFIntoFileInput = async (fileInputElement) => {
  try {
    const { base64, fileName } = await getResumeBase64();
    
    if (!base64 || !fileName) {
      console.error('No resume found in storage');
      return false;
    }
    
    const file = base64ToFile(base64, fileName, 'application/pdf');
    
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    fileInputElement.files = dataTransfer.files;
    
    fileInputElement.dispatchEvent(new Event('change', { bubbles: true }));
    fileInputElement.dispatchEvent(new Event('input', { bubbles: true }));
    
    // Wait for upload confirmation
    return new Promise((resolve) => {
      let checks = 0;
      const interval = setInterval(() => {
        checks++;
        // Look for filename in the UI near the input
        const container = fileInputElement.closest('.jobs-easy-apply-modal__content') || document.body;
        if (container.innerText.includes(fileName)) {
          clearInterval(interval);
          resolve(true);
        }
        
        if (checks > 20) { // 10 seconds timeout
          clearInterval(interval);
          resolve(false); // Proceed anyway, maybe it worked but UI didn't update exactly as expected
        }
      }, 500);
    });
  } catch (e) {
    console.error('Failed to inject PDF', e);
    return false;
  }
};
