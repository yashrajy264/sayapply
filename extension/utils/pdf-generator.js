import { jsPDF } from 'jspdf';

export const generateResumePDF = (data) => {
    try {
        const doc = new jsPDF();
        const margin = 20;
        let y = 20;

        // Name
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text(data.name || 'Your Name', margin, y);
        y += 10;

        // Contact
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(data.contact || 'email@example.com', margin, y);
        y += 15;

        // Summary
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Professional Summary', margin, y);
        y += 7;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const summaryLines = doc.splitTextToSize(data.summary, 170);
        doc.text(summaryLines, margin, y);
        y += (summaryLines.length * 5) + 12;

        // Experience
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Tailored Experience Highlights', margin, y);
        y += 7;

        if (data.experience && data.experience.length > 0) {
            data.experience.forEach(exp => {
                // Check if we need a new page
                if (y > 270) {
                    doc.addPage();
                    y = 20;
                }

                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.text(`${exp.role} at ${exp.company}`, margin, y);
                y += 6;

                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                if (exp.bullets && exp.bullets.length > 0) {
                    exp.bullets.forEach(bullet => {
                        const bulletLines = doc.splitTextToSize(`• ${bullet}`, 165);
                        doc.text(bulletLines, margin + 5, y);
                        y += (bulletLines.length * 5);
                    });
                }
                y += 6;
            });
        }

        doc.save(`SayApply_Resume_${Date.now()}.pdf`);
        return { success: true };
    } catch (error) {
        console.error("PDF Generation Error:", error);
        return { success: false, error: error.message };
    }
};
