// Demo script to show parser functionality
const fs = require('fs');
const path = require('path');

// Simple parser implementation to demonstrate functionality
function parseTestFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const tests = [];
    const describeStack = [];
    
    const describePattern = /^\s*(describe|describe\.only|describe\.skip)\s*\(\s*['"`]([^'"`]+)['"`]/;
    const testPattern = /^\s*(test|it|test\.only|it\.only|test\.skip|it\.skip)\s*\(\s*['"`]([^'"`]+)['"`]/;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        const describeMatch = line.match(describePattern);
        if (describeMatch) {
            const [, keyword, name] = describeMatch;
            const fullName = [...describeStack.map(d => d.name), name].join(' › ');
            const test = {
                name,
                fullName,
                type: 'describe',
                line: i + 1,
                column: line.indexOf(keyword) + 1,
                children: []
            };
            
            if (describeStack.length > 0) {
                describeStack[describeStack.length - 1].children.push(test);
            } else {
                tests.push(test);
            }
            
            describeStack.push(test);
            continue;
        }

        const testMatch = line.match(testPattern);
        if (testMatch) {
            const [, keyword, name] = testMatch;
            const fullName = [...describeStack.map(d => d.name), name].join(' › ');
            const test = {
                name,
                fullName,
                type: keyword.startsWith('test') ? 'test' : 'it',
                line: i + 1,
                column: line.indexOf(keyword) + 1
            };
            
            if (describeStack.length > 0) {
                describeStack[describeStack.length - 1].children.push(test);
            } else {
                tests.push(test);
            }
        }

        // Simple brace matching to pop describe stack
        if (line.includes('}')) {
            const closeBraces = (line.match(/}/g) || []).length;
            for (let j = 0; j < closeBraces && describeStack.length > 0; j++) {
                describeStack.pop();
            }
        }
    }
    
    return tests;
}

// Parse the example test file
const testFile = path.join(__dirname, 'example.test.js');
const parsedTests = parseTestFile(testFile);

console.log('Parsed Jest tests from example.test.js:\n');
console.log(JSON.stringify(parsedTests, null, 2));

// Show summary
function countTests(tests) {
    let count = 0;
    for (const test of tests) {
        if (test.type !== 'describe') {
            count++;
        }
        if (test.children) {
            count += countTests(test.children);
        }
    }
    return count;
}

console.log(`\nTotal tests found: ${countTests(parsedTests)}`);
console.log('\nThe Jest Runner extension would show:');
console.log('- Inline run/debug buttons above each test and describe block');
console.log('- A test explorer tree view in the sidebar');
console.log('- Click to run individual tests or entire suites');
console.log('- Full debugging support with breakpoints');