const fs = require('fs');
const wf = JSON.parse(fs.readFileSync('media-library-manager-workflow.json', 'utf8'));
const codeNode = wf.nodes.find(n => n.name === 'Media Lib Logic');
const code = codeNode.parameters.jsCode;

// Find the add_items case
const addItemsStart = code.indexOf("case 'add_items':");
// Find the next case or end of switch
const nextCase = code.indexOf("case 'list_items':", addItemsStart);
const addItemsCode = code.substring(addItemsStart, nextCase);

console.log('=== add_items case ===');
console.log(addItemsCode);
