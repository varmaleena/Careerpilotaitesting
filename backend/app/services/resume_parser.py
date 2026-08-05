import re
from typing import Dict, Any

def parse_resume_sections(text: str) -> Dict[str, str]:
    """
    Structured Sectional Parser for Candidate Resumes.
    Splits raw plain text into distinct semantic sections:
    - experience
    - skills
    - projects
    - education
    - header / summary
    """
    if not text:
        return {
            "header": "",
            "experience": "",
            "skills": "",
            "projects": "",
            "education": ""
        }

    lines = text.split('\n')
    sections: Dict[str, list] = {
        "header": [],
        "experience": [],
        "skills": [],
        "projects": [],
        "education": []
    }

    current_section = "header"

    # Regex patterns for section headers
    exp_pattern = re.compile(r'^(work\s+experience|experience|employment\s+history|work\s+history|professional\s+experience)', re.IGNORECASE)
    skills_pattern = re.compile(r'^(technical\s+skills|skills|core\s+competencies|technologies|stack)', re.IGNORECASE)
    proj_pattern = re.compile(r'^(projects|portfolio|key\tprojects|academic\s+projects)', re.IGNORECASE)
    edu_pattern = re.compile(r'^(education|academic\s+background|qualifications|certifications)', re.IGNORECASE)

    for line in lines:
        cleaned_line = line.strip()
        if not cleaned_line:
            continue

        # Check section transitions
        if exp_pattern.search(cleaned_line):
            current_section = "experience"
            continue
        elif skills_pattern.search(cleaned_line):
            current_section = "skills"
            continue
        elif proj_pattern.search(cleaned_line):
            current_section = "projects"
            continue
        elif edu_pattern.search(cleaned_line):
            current_section = "education"
            continue

        sections[current_section].append(cleaned_line)

    # If parsing produced empty experience/skills (due to non-standard headings), fallback intelligently
    full_text = "\n".join(lines)
    experience_text = "\n".join(sections["experience"]) if sections["experience"] else full_text
    skills_text = "\n".join(sections["skills"]) if sections["skills"] else full_text
    projects_text = "\n".join(sections["projects"]) if sections["projects"] else full_text
    education_text = "\n".join(sections["education"]) if sections["education"] else full_text

    return {
        "header": "\n".join(sections["header"]),
        "experience": experience_text,
        "skills": skills_text,
        "projects": projects_text,
        "education": education_text
    }
