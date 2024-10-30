const fs = require('fs');
const path = require('path');

const MEMORY_FILE = 'src/memories.json';

// Load memories
function loadMemories() {
    try {
        if (fs.existsSync(MEMORY_FILE)) {
            const data = fs.readFileSync(MEMORY_FILE, 'utf8');
            return JSON.parse(data);
        }
        return {};
    } catch (error) {
        console.error('Error loading memories:', error);
        return {};
    }
}

// Save memories
function saveMemories(memories) {
    try {
        fs.writeFileSync(MEMORY_FILE, JSON.stringify(memories, null, 2));
        console.log('Memories saved to file');
    } catch (error) {
        console.error('Error saving memories:', error);
    }
}

// Add new memory
function addMemory(userId, interaction) {
    const memories = loadMemories();
    if (!memories[userId]) {
        memories[userId] = [];
    }
    
    const memory = {
        timestamp: Date.now(),
        content: interaction
    };
    
    memories[userId].push(memory);
    
    // Keep only last 10 memories per user
    if (memories[userId].length > 10) {
        memories[userId].shift();
    }
    
    saveMemories(memories);
    return memory;
}

// Get user memories
function getUserMemories(userId) {
    const memories = loadMemories();
    return memories[userId] || [];
}

module.exports = {
    addMemory,
    getUserMemories,
    loadMemories,
    saveMemories
}; 