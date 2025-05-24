export interface FileTypeTemplate {
  id: string;
  label: string;
  description?: string;
  extension: string;
  template?: string;
  language?: string;
}

export const FILE_TYPES: FileTypeTemplate[] = [
  { id: 'javascript', label: 'JavaScript', extension: '.js', language: 'javascript' },
  { id: 'typescript', label: 'TypeScript', extension: '.ts', language: 'typescript' },
  { id: 'python', label: 'Python', extension: '.py', language: 'python' },
  { id: 'java', label: 'Java', extension: '.java', language: 'java', template: 'public class Scratch {\n    public static void main(String[] args) {\n        \n    }\n}' },
  { id: 'csharp', label: 'C#', extension: '.cs', language: 'csharp', template: 'using System;\n\nclass Program\n{\n    static void Main()\n    {\n        \n    }\n}' },
  { id: 'cpp', label: 'C++', extension: '.cpp', language: 'cpp', template: '#include <iostream>\n\nint main() {\n    \n    return 0;\n}' },
  { id: 'c', label: 'C', extension: '.c', language: 'c', template: '#include <stdio.h>\n\nint main() {\n    \n    return 0;\n}' },
  { id: 'go', label: 'Go', extension: '.go', language: 'go', template: 'package main\n\nimport "fmt"\n\nfunc main() {\n    \n}' },
  { id: 'rust', label: 'Rust', extension: '.rs', language: 'rust', template: 'fn main() {\n    \n}' },
  { id: 'ruby', label: 'Ruby', extension: '.rb', language: 'ruby' },
  { id: 'php', label: 'PHP', extension: '.php', language: 'php', template: '<?php\n\n' },
  { id: 'swift', label: 'Swift', extension: '.swift', language: 'swift' },
  { id: 'kotlin', label: 'Kotlin', extension: '.kt', language: 'kotlin', template: 'fun main() {\n    \n}' },
  { id: 'html', label: 'HTML', extension: '.html', language: 'html', template: '<!DOCTYPE html>\n<html>\n<head>\n    <title>Scratch</title>\n</head>\n<body>\n    \n</body>\n</html>' },
  { id: 'css', label: 'CSS', extension: '.css', language: 'css' },
  { id: 'scss', label: 'SCSS', extension: '.scss', language: 'scss' },
  { id: 'json', label: 'JSON', extension: '.json', language: 'json', template: '{\n    \n}' },
  { id: 'yaml', label: 'YAML', extension: '.yaml', language: 'yaml' },
  { id: 'xml', label: 'XML', extension: '.xml', language: 'xml', template: '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n    \n</root>' },
  { id: 'markdown', label: 'Markdown', extension: '.md', language: 'markdown', template: '# Scratch\n\n' },
  { id: 'sql', label: 'SQL', extension: '.sql', language: 'sql' },
  { id: 'shell', label: 'Shell Script', extension: '.sh', language: 'shellscript', template: '#!/bin/bash\n\n' },
  { id: 'powershell', label: 'PowerShell', extension: '.ps1', language: 'powershell' },
  { id: 'dockerfile', label: 'Dockerfile', extension: '.dockerfile', language: 'dockerfile', template: 'FROM node:latest\n\n' },
  { id: 'plaintext', label: 'Plain Text', extension: '.txt', language: 'plaintext' }
];