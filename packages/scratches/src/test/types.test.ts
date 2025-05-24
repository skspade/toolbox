import * as assert from 'assert';
import { FILE_TYPES, FileTypeTemplate } from '../types';

suite('File Types Test Suite', () => {
    test('All file types should have required properties', () => {
        FILE_TYPES.forEach(fileType => {
            assert.ok(fileType.id, `File type should have an id`);
            assert.ok(fileType.label, `File type ${fileType.id} should have a label`);
            assert.ok(fileType.extension, `File type ${fileType.id} should have an extension`);
            assert.ok(fileType.extension.startsWith('.'), `File type ${fileType.id} extension should start with a dot`);
        });
    });

    test('File type IDs should be unique', () => {
        const ids = FILE_TYPES.map(ft => ft.id);
        const uniqueIds = new Set(ids);
        assert.strictEqual(ids.length, uniqueIds.size, 'All file type IDs should be unique');
    });

    test('File type labels should be unique', () => {
        const labels = FILE_TYPES.map(ft => ft.label);
        const uniqueLabels = new Set(labels);
        assert.strictEqual(labels.length, uniqueLabels.size, 'All file type labels should be unique');
    });

    test('Templates should be valid for their language', () => {
        const templatedFileTypes = FILE_TYPES.filter(ft => ft.template);
        
        templatedFileTypes.forEach(fileType => {
            assert.ok(fileType.template!.length > 0, `Template for ${fileType.id} should not be empty`);
            
            // Check specific language templates
            switch (fileType.id) {
                case 'java':
                    assert.ok(fileType.template!.includes('public class'), 'Java template should include class definition');
                    assert.ok(fileType.template!.includes('main'), 'Java template should include main method');
                    break;
                case 'csharp':
                    assert.ok(fileType.template!.includes('class'), 'C# template should include class');
                    assert.ok(fileType.template!.includes('Main'), 'C# template should include Main method');
                    break;
                case 'cpp':
                case 'c':
                    assert.ok(fileType.template!.includes('#include'), 'C/C++ template should include headers');
                    assert.ok(fileType.template!.includes('main'), 'C/C++ template should include main function');
                    break;
                case 'go':
                    assert.ok(fileType.template!.includes('package main'), 'Go template should include package declaration');
                    assert.ok(fileType.template!.includes('func main'), 'Go template should include main function');
                    break;
                case 'rust':
                    assert.ok(fileType.template!.includes('fn main'), 'Rust template should include main function');
                    break;
                case 'php':
                    assert.ok(fileType.template!.includes('<?php'), 'PHP template should include opening tag');
                    break;
                case 'html':
                    assert.ok(fileType.template!.includes('<!DOCTYPE'), 'HTML template should include DOCTYPE');
                    assert.ok(fileType.template!.includes('<html'), 'HTML template should include html tag');
                    break;
                case 'xml':
                    assert.ok(fileType.template!.includes('<?xml'), 'XML template should include XML declaration');
                    break;
                case 'shell':
                    assert.ok(fileType.template!.includes('#!/bin/bash'), 'Shell template should include shebang');
                    break;
            }
        });
    });

    test('Language identifiers should be valid', () => {
        const fileTypesWithLanguage = FILE_TYPES.filter(ft => ft.language);
        
        // Common VS Code language identifiers
        const validLanguages = [
            'javascript', 'typescript', 'python', 'java', 'csharp', 'cpp', 'c',
            'go', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'html', 'css',
            'scss', 'json', 'yaml', 'xml', 'markdown', 'sql', 'shellscript',
            'powershell', 'dockerfile', 'plaintext'
        ];
        
        fileTypesWithLanguage.forEach(fileType => {
            assert.ok(
                validLanguages.includes(fileType.language!),
                `Language '${fileType.language}' for ${fileType.id} should be a valid VS Code language identifier`
            );
        });
    });

    test('Should have common programming languages', () => {
        const commonLanguages = ['javascript', 'typescript', 'python', 'java', 'csharp', 'go'];
        
        commonLanguages.forEach(lang => {
            const found = FILE_TYPES.find(ft => ft.id === lang);
            assert.ok(found, `Common language ${lang} should be included`);
        });
    });

    test('Should have web development file types', () => {
        const webTypes = ['html', 'css', 'javascript', 'typescript', 'json'];
        
        webTypes.forEach(type => {
            const found = FILE_TYPES.find(ft => ft.id === type);
            assert.ok(found, `Web development file type ${type} should be included`);
        });
    });

    test('Extensions should match language conventions', () => {
        const extensionMap: { [key: string]: string } = {
            'javascript': '.js',
            'typescript': '.ts',
            'python': '.py',
            'java': '.java',
            'csharp': '.cs',
            'cpp': '.cpp',
            'c': '.c',
            'go': '.go',
            'rust': '.rs',
            'ruby': '.rb',
            'php': '.php',
            'swift': '.swift',
            'kotlin': '.kt',
            'html': '.html',
            'css': '.css',
            'json': '.json',
            'yaml': '.yaml',
            'xml': '.xml',
            'markdown': '.md',
            'sql': '.sql',
            'shell': '.sh',
            'powershell': '.ps1'
        };
        
        Object.entries(extensionMap).forEach(([id, expectedExt]) => {
            const fileType = FILE_TYPES.find(ft => ft.id === id);
            if (fileType) {
                assert.strictEqual(
                    fileType.extension,
                    expectedExt,
                    `${id} should have extension ${expectedExt}`
                );
            }
        });
    });
});