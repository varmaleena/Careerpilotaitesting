import { jsPDF } from 'jspdf';
import { ProjectIdea, ResumeOptimizationResult, LatexResumeData } from '../types';

/**
 * Generates a PDF that mimics the LaTeX "Jake's Resume" template using jsPDF.
 */
export const downloadLatexPdf = (data: LatexResumeData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 25.4 / 2; // 0.5 inch margin (~12.7mm)
    let cursorY = margin;

    // Helper for page breaks
    const checkPageBreak = (heightNeeded: number) => {
        if (cursorY + heightNeeded > pageHeight - margin) {
            doc.addPage();
            cursorY = margin;
        }
    };

    // --- Fonts setup ---
    // jsPDF comes with standard fonts. 'times' mimics LaTeX default well.
    doc.setFont("times", "normal");

    // --- Header ---
    doc.setFontSize(24);
    doc.setFont("times", "bold");
    const name = data.personalInfo.fullName.toUpperCase();
    const nameWidth = doc.getTextWidth(name);
    doc.text(name, (pageWidth - nameWidth) / 2, cursorY);
    cursorY += 6;

    doc.setFontSize(10);
    doc.setFont("times", "normal");

    // Contact Info Line
    const contactParts = [
        data.personalInfo.phone,
        data.personalInfo.email,
        data.personalInfo.linkedin ? "LinkedIn" : null,
        data.personalInfo.location
    ].filter(Boolean);

    const contactLine = contactParts.join(" | ");
    const contactWidth = doc.getTextWidth(contactLine);
    doc.text(contactLine, (pageWidth - contactWidth) / 2, cursorY);
    cursorY += 5;

    // --- Helper: Draw Section Title ---
    const drawSectionTitle = (title: string) => {
        cursorY += 3;
        checkPageBreak(15);

        doc.setFont("times", "bold");
        doc.setFontSize(12);
        const uppercaseTitle = title.toUpperCase();
        doc.text(uppercaseTitle, margin, cursorY);

        const titleWidth = doc.getTextWidth(uppercaseTitle);
        cursorY += 2;
        doc.setLineWidth(0.5);
        doc.line(margin, cursorY, pageWidth - margin, cursorY);
        cursorY += 4;
    };

    // --- Section: Summary ---
    if (data.summary) {
        drawSectionTitle("Professional Summary");
        doc.setFont("times", "normal");
        doc.setFontSize(10);

        const maxWidth = pageWidth - (margin * 2);
        const lines = doc.splitTextToSize(data.summary, maxWidth);
        checkPageBreak(lines.length * 4);
        doc.text(lines, margin, cursorY);
        cursorY += (lines.length * 4) + 2;
    }

    // --- Section: Skills ---
    if (data.skills && (data.skills.languages?.length || data.skills.technologies?.length || data.skills.tools?.length)) {
        drawSectionTitle("Technical Skills");
        doc.setFontSize(10);

        const drawSkillRow = (label: string, items: string[]) => {
            if (!items || items.length === 0) return;
            checkPageBreak(5);

            doc.setFont("times", "bold");
            const labelText = label + ": ";
            doc.text(labelText, margin, cursorY);
            const labelWidth = doc.getTextWidth(labelText);

            doc.setFont("times", "normal");
            const itemsText = items.join(", ");
            // Wrap items if too long
            const maxItemWidth = pageWidth - margin - margin - labelWidth;
            const itemLines = doc.splitTextToSize(itemsText, maxItemWidth);

            doc.text(itemLines, margin + labelWidth, cursorY);
            cursorY += (itemLines.length * 4.5);
        };

        drawSkillRow("Languages", data.skills.languages);
        drawSkillRow("Technologies", data.skills.technologies);
        drawSkillRow("Tools", data.skills.tools);
        cursorY += 2;
    }

    // --- Section: Experience ---
    if (data.experience && data.experience.length > 0) {
        drawSectionTitle("Experience");

        data.experience.forEach(exp => {
            checkPageBreak(15); // Check for header space

            // Row 1: Title and Date
            doc.setFont("times", "bold");
            doc.setFontSize(11);
            doc.text(exp.title, margin, cursorY);

            doc.setFont("times", "normal");
            const dateWidth = doc.getTextWidth(exp.dates);
            doc.text(exp.dates, pageWidth - margin - dateWidth, cursorY);
            cursorY += 5;

            // Row 2: Company and Location
            doc.setFont("times", "italic"); // Using italic for company/location as per Jake's resume
            doc.text(exp.company, margin, cursorY);

            doc.setFont("times", "italic");
            const locWidth = doc.getTextWidth(exp.location);
            doc.text(exp.location, pageWidth - margin - locWidth, cursorY);
            cursorY += 5;

            // Bullets
            doc.setFont("times", "normal");
            doc.setFontSize(10);

            exp.bullets.forEach(bullet => {
                const bulletPrefix = "• ";
                const maxBulletWidth = pageWidth - margin - margin - 5; // Indent
                const lines = doc.splitTextToSize(bullet, maxBulletWidth);

                checkPageBreak(lines.length * 4);

                doc.text(bulletPrefix, margin + 2, cursorY); // Bullet symbol
                doc.text(lines, margin + 6, cursorY);
                cursorY += (lines.length * 4.2);
            });
            cursorY += 2; // Spacing between items
        });
    }

    // --- Section: Projects ---
    if (data.projects && data.projects.length > 0) {
        drawSectionTitle("Projects");

        data.projects.forEach(proj => {
            checkPageBreak(15);

            // Row 1: Name, Stack, Date
            doc.setFont("times", "bold");
            doc.setFontSize(11);
            const nameText = proj.name;
            doc.text(nameText, margin, cursorY);

            const nameWidth = doc.getTextWidth(nameText);

            // Stack (Italic)
            if (proj.technologies) {
                doc.setFont("times", "italic");
                doc.setFontSize(10);
                const techText = " | " + proj.technologies;
                doc.text(techText, margin + nameWidth, cursorY);
            }

            // Date (Right aligned)
            if (proj.date) {
                doc.setFont("times", "normal");
                const dateWidth = doc.getTextWidth(proj.date);
                doc.text(proj.date, pageWidth - margin - dateWidth, cursorY);
            }
            cursorY += 5;

            // Bullets
            doc.setFont("times", "normal");
            doc.setFontSize(10);

            proj.bullets.forEach(bullet => {
                const bulletPrefix = "• ";
                const maxBulletWidth = pageWidth - margin - margin - 5;
                const lines = doc.splitTextToSize(bullet, maxBulletWidth);

                checkPageBreak(lines.length * 4);

                doc.text(bulletPrefix, margin + 2, cursorY);
                doc.text(lines, margin + 6, cursorY);
                cursorY += (lines.length * 4.2);
            });
            cursorY += 2;
        });
    }

    // --- Section: Education ---
    if (data.education && data.education.length > 0) {
        drawSectionTitle("Education");

        data.education.forEach(edu => {
            checkPageBreak(10);

            // Row 1: University and Location
            doc.setFont("times", "bold");
            doc.setFontSize(11);
            doc.text(edu.university, margin, cursorY);

            doc.setFont("times", "normal");
            const locWidth = doc.getTextWidth(edu.location);
            doc.text(edu.location, pageWidth - margin - locWidth, cursorY);
            cursorY += 5;

            // Row 2: Degree and Date
            doc.setFont("times", "italic"); // Degree in italic often looks good or normal
            doc.setFontSize(10);
            doc.text(edu.degree, margin, cursorY);

            doc.setFont("times", "normal"); // Date normal
            const dateWidth = doc.getTextWidth(edu.dates);
            doc.text(edu.dates, pageWidth - margin - dateWidth, cursorY);
            cursorY += 5;

            // Row 3: GPA/CGPA (if present) - CRITICAL FOR FRESHERS
            if (edu.gpa) {
                doc.setFont("times", "normal");
                doc.setFontSize(10);
                doc.text(`CGPA: ${edu.gpa}`, margin, cursorY);
                cursorY += 5;
            }

            cursorY += 3; // Space between education entries
        });
    }

    // --- Section: Certifications ---
    if (data.certifications && data.certifications.length > 0) {
        drawSectionTitle("Certifications");
        doc.setFont("times", "normal");
        doc.setFontSize(10);

        data.certifications.forEach(cert => {
            checkPageBreak(5);
            const certText = `${cert.name} -- ${cert.issuer} (${cert.date})`;
            const bulletPrefix = "• ";
            doc.text(bulletPrefix, margin + 2, cursorY);
            doc.text(certText, margin + 6, cursorY);
            cursorY += 5;
        });
    }

    // --- Section: Achievements ---
    if (data.achievements && data.achievements.length > 0) {
        drawSectionTitle("Achievements");
        doc.setFont("times", "normal");
        doc.setFontSize(10);

        data.achievements.forEach(achievement => {
            checkPageBreak(8);
            const bulletPrefix = "• ";
            doc.text(bulletPrefix, margin + 2, cursorY);

            // Achievement title (bold)
            doc.setFont("times", "bold");
            doc.text(achievement.title, margin + 6, cursorY);
            cursorY += 5;

            // Achievement description (if present)
            if (achievement.description) {
                doc.setFont("times", "normal");
                const maxWidth = pageWidth - margin - margin - 10;
                const descLines = doc.splitTextToSize(achievement.description, maxWidth);
                checkPageBreak(descLines.length * 4);
                doc.text(descLines, margin + 6, cursorY);
                cursorY += (descLines.length * 4);
            }

            cursorY += 2;
        });
    }

    doc.save(`${data.personalInfo.fullName.replace(/\s+/g, '_')}_Resume.pdf`);
};


/**
 * Generates a clean, ATS-friendly PDF from the optimized resume markdown.
 *
 * @param resumeResult The full result containing the optimized content.
 * @param userName The name of the user for the file name.
 */
export const downloadResumeAsPdf = (resumeResult: ResumeOptimizationResult, userName: string) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20; // 20mm margin
    const lineHeight = 7;
    let cursorY = margin;

    // Use a standard font
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    // Helper to check for page break
    const checkPageBreak = (heightNeeded: number) => {
        if (cursorY + heightNeeded > pageHeight - margin) {
            doc.addPage();
            cursorY = margin;
        }
    };

    const lines = resumeResult.optimizedContent.split('\n');

    lines.forEach((line) => {
        // Basic Markdown Processing for the PDF

        // 1. Headings (H1, H2, H3)
        if (line.startsWith('# ')) {
            // H1 - Name / Title
            checkPageBreak(15);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(22);
            const text = line.replace('# ', '').toUpperCase();
            // Center the main title
            const textWidth = doc.getTextWidth(text);
            doc.text(text, (pageWidth - textWidth) / 2, cursorY);
            cursorY += 12;
        }
        else if (line.startsWith('## ')) {
            // H2 - Section Headings
            cursorY += 5; // Extra space before section
            checkPageBreak(10);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(14);
            const text = line.replace('## ', '').toUpperCase();
            doc.text(text, margin, cursorY);

            // Underline the section
            const textWidth = doc.getTextWidth(text);
            doc.setLineWidth(0.5);
            doc.line(margin, cursorY + 1, margin + textWidth, cursorY + 1);

            cursorY += 10;
        }
        else if (line.startsWith('### ')) {
            // H3 - Subsections (Roles, Universities)
            checkPageBreak(8);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(12);
            const text = line.replace('### ', '');
            doc.text(text, margin, cursorY);
            cursorY += 8;
        }
        // 2. Bullet Points
        else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
            let text = line.trim().substring(2);
            // strip bold markers
            text = text.replace(/\*\*/g, '');

            doc.setFont("helvetica", "normal");
            doc.setFontSize(11);

            // Bullet symbol
            doc.text("•", margin + 3, cursorY);

            // Handle wrapping for bullet text
            const maxWidth = pageWidth - margin * 2 - 8;
            const textLines = doc.splitTextToSize(text, maxWidth);

            checkPageBreak(textLines.length * lineHeight);
            doc.text(textLines, margin + 8, cursorY);
            cursorY += textLines.length * lineHeight * 0.8; // Tighter bullet spacing
        }
        // 3. Normal Text
        else if (line.trim().length > 0) {

            // Check for bold syntax like **Text**
            const cleanLine = line.replace(/\*\*/g, '');

            // If the line *started* with bold, we might want to bold the whole line (heuristic)
            const isHeaderLike = line.trim().startsWith('**') && line.trim().endsWith('**');

            if (isHeaderLike) {
                doc.setFont("helvetica", "bold");
            } else {
                doc.setFont("helvetica", "normal");
            }

            doc.setFontSize(11);

            const maxWidth = pageWidth - margin * 2;
            const textLines = doc.splitTextToSize(cleanLine, maxWidth);

            checkPageBreak(textLines.length * lineHeight);
            doc.text(textLines, margin, cursorY);
            cursorY += textLines.length * lineHeight;
        }
        // 4. Empty Lines (Spacing)
        else {
            cursorY += 3;
        }
    });

    // Save the file
    const fileName = `${userName.replace(/\s+/g, '_')}_Optimized_Resume.pdf`;
    doc.save(fileName);
};
