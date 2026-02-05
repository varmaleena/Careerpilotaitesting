import { LatexResumeData } from '../types';

/**
 * LaTeX Character Escaping Function
 * Escapes special characters for safe LaTeX rendering
 */
export const escapeLatex = (text: string): string => {
    if (!text) return '';
    return text
        .replace(/\\/g, '\\textbackslash{}')
        .replace(/[&%$#_{}]/g, '\\$&')
        .replace(/~/g, '\\textasciitilde{}')
        .replace(/\^/g, '\\textasciicircum{}');
};

/**
 * Convert Structured Resume Data to LaTeX Format
 * Generates a complete LaTeX document from structured resume data
 */
export const generateLatexDocument = (data: LatexResumeData): string => {
    const { personalInfo, summary, skills, experience, education, projects, certifications, achievements } = data;

    // Header
    const header = `
\\begin{center}
    \\textbf{\\Huge \\scshape ${escapeLatex(personalInfo.fullName)}} \\\\ \\vspace{1pt}
    \\small ${personalInfo.phone ? escapeLatex(personalInfo.phone) + " $|$ " : ""}${personalInfo.email ? `\\href{mailto:${personalInfo.email}}{\\underline{${escapeLatex(personalInfo.email)}}}` + " $|$ " : ""}${personalInfo.linkedin ? escapeLatex(personalInfo.linkedin) + " $|$ " : ""}${personalInfo.website ? escapeLatex(personalInfo.website) : ""}
\\end{center}
`;

    // Summary
    const summarySection = summary ? `
%-----------SUMMARY-----------
\\section{Professional Summary}
  \\small{${escapeLatex(summary)}}
` : "";

    // Skills
    let skillsContent = "";
    if (skills.languages?.length || skills.technologies?.length || skills.tools?.length) {
        const langs = skills.languages?.length ? `\\textbf{Languages}{: ${escapeLatex(skills.languages.join(", "))}} \\\\` : "";
        const techs = skills.technologies?.length ? `\\textbf{Technologies}{: ${escapeLatex(skills.technologies.join(", "))}} \\\\` : "";
        const tools = skills.tools?.length ? `\\textbf{Tools}{: ${escapeLatex(skills.tools.join(", "))}}` : "";

        skillsContent = `
%-----------SKILLS-----------
\\section{Technical Skills}
 \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
     ${langs}
     ${techs}
     ${tools}
    }}
 \\end{itemize}
`;
    }

    // Experience
    let experienceSection = "";
    if (experience?.length) {
        const items = experience.map(exp => {
            const bullets = (exp.bullets || []).map(b => `        \\resumeItem{${escapeLatex(b)}}`).join("\n");
            return `    \\resumeSubheading
      {${escapeLatex(exp.title)}}{${escapeLatex(exp.dates)}}
      {${escapeLatex(exp.company)}}{${escapeLatex(exp.location || "")}}
      \\resumeItemListStart
${bullets}
      \\resumeItemListEnd`;
        }).join("\n");

        experienceSection = `
%-----------EXPERIENCE-----------
\\section{Experience}
  \\resumeSubHeadingListStart
${items}
  \\resumeSubHeadingListEnd
`;
    }

    // Education
    let educationSection = "";
    if (education?.length) {
        const items = education.map(edu => {
            // Put CGPA on the same line as dates
            const datesWithGPA = edu.gpa ? `${edu.dates} | CGPA: ${edu.gpa}` : edu.dates;
            return `    \\resumeSubheading
      {${escapeLatex(edu.degree)}}{${escapeLatex(datesWithGPA)}}
      {${escapeLatex(edu.university)}}{${escapeLatex(edu.location || "")}}`;
        }).join("\n");

        educationSection = `
%-----------EDUCATION-----------
\\section{Education}
  \\resumeSubHeadingListStart
${items}
  \\resumeSubHeadingListEnd
`;
    }

    // Projects
    let projectsSection = "";
    if (projects?.length) {
        const items = projects.map(proj => {
            const bullets = (proj.bullets || []).map(b => `        \\resumeItem{${escapeLatex(b)}}`).join("\n");
            return `    \\resumeProjectHeading
          {\\textbf{${escapeLatex(proj.name)}} $|$ \\emph{${escapeLatex(proj.technologies)}}}{${escapeLatex(proj.date || "")}}
          \\resumeItemListStart
${bullets}
          \\resumeItemListEnd`;
        }).join("\n");

        projectsSection = `
%-----------PROJECTS-----------
\\section{Projects}
    \\resumeSubHeadingListStart
${items}
    \\resumeSubHeadingListEnd
`;
    }

    // Certifications (Optional)
    let certificationsSection = "";
    if (certifications?.length) {
        const items = certifications.map(cert => {
            const dateText = cert.date && cert.date.trim() ? ` -- ${escapeLatex(cert.date)}` : '';
            return `\\item
          \\textbf{${escapeLatex(cert.name)}}{: ${escapeLatex(cert.issuer)}${dateText}}`;
        }).join("\n");

        certificationsSection = `
%-----------CERTIFICATIONS-----------
\\section{Certifications}
 \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{
${items}
    }
 \\end{itemize}
`;
    }

    // Achievements (Optional)
    let achievementsSection = "";
    if (achievements?.length) {
        const items = achievements.map(ach => {
            return `\\item
          \\textbf{${escapeLatex(ach.title)}}${ach.description ? `: ${escapeLatex(ach.description)}` : ""}`;
        }).join("\n");

        achievementsSection = `
%-----------ACHIEVEMENTS-----------
\\section{Achievements}
 \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{
${items}
    }
 \\end{itemize}
`;
    }

    return `\\documentclass[letterpaper,11pt]{article}
\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}
\\input{glyphtounicode}

\\pagestyle{fancy}
\\fancyhf{}
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

% Adjust margins
\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-.5in}
\\addtolength{\\textheight}{1.0in}

\\urlstyle{same}
\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

% Sections formatting
\\titleformat{\\section}{
  \\vspace{-4pt}\\scshape\\raggedright\\large
}{}{0em}{}[\\color{black}\\titlerule \\vspace{-5pt}]

\\pdfgentounicode=1

% Custom commands
\\newcommand{\\resumeItem}[1]{
  \\item\\small{
    {#1 \\vspace{-2pt}}
  }
}

\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-2pt}\\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & #2 \\\\
      \\textit{\\small#3} & \\textit{\\small #4} \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeProjectHeading}[2]{
    \\item
    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\small#1 & #2 \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeSubItem}[1]{\\resumeItem{#1}\\vspace{-4pt}}

\\renewcommand\\labelitemii{$\\vcenter{\\hbox{\\tiny$\\bullet$}}$}

\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}

%-------------------------------------------
%%%%%%  RESUME STARTS HERE  %%%%%%%%%%%%%%%%%%%%%%%%%%%%

\\begin{document}

${header}

${summarySection}

${skillsContent}

${experienceSection}

${projectsSection}

${educationSection}

${certificationsSection}

${achievementsSection}

\\end{document}`;
};

/**
 * Load external script dynamically
 */
export const loadScript = (src: string): Promise<boolean> => {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => {
            resolve(true);
        };
        script.onerror = () => {
            resolve(false);
        };
        document.body.appendChild(script);
    });
};
