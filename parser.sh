#!/bin/bash

echo "🚀 Phase 2: Implementing Intelligent Parser & Upload Flow..."

# 1. Robust Markdown Parser (Matches your testlog0106.txt format)
cat << 'EOF' > parser.py
import re
import json

def parse_markdown(content):
    text_blocks = []
    mcqs = []
    todos = []
    
    lines = content.split('\n')
    current_text = []
    order_idx = 0
    i = 0
    
    while i < len(lines):
        line = lines[i].strip()
        
        # Detect :::mcq block
        if line == ':::mcq':
            # Flush current text
            if current_text:
                text_blocks.append({"content": "\n".join(current_text).strip(), "order_idx": order_idx})
                current_text = []
                order_idx += 1
            
            # Parse MCQ
            i += 1
            question = ""
            options = []
            answer = ""
            explanation = ""
            difficulty = "medium"
            
            while i < len(lines) and lines[i].strip() != ':::':
                q_line = lines[i].strip()
                q_match = re.match(r'^q:\s*(.+)', q_line, re.IGNORECASE)
                opt_match = re.match(r'^([a-d])\)\s*(.+)', q_line, re.IGNORECASE)
                ans_match = re.match(r'^ans:\s*([a-d])', q_line, re.IGNORECASE)
                diff_match = re.match(r'^diff:\s*(easy|medium|hard)', q_line, re.IGNORECASE)
                exp_match = re.match(r'^explain:\s*(.+)', q_line, re.IGNORECASE)
                
                if q_match:
                    question = q_match.group(1)
                elif opt_match:
                    options.append({"key": opt_match.group(1).upper(), "text": opt_match.group(2)})
                elif ans_match:
                    answer = ans_match.group(1).upper()
                elif diff_match:
                    difficulty = diff_match.group(1).lower()
                elif exp_match:
                    explanation = exp_match.group(1)
                i += 1
            
            if question and len(options) >= 2:
                mcqs.append({
                    "question": question,
                    "options": json.dumps(options),
                    "answer": answer,
                    "explanation": explanation,
                    "difficulty": difficulty,
                    "order_idx": order_idx
                })
                order_idx += 1
            i += 1 # skip closing :::
            continue
            
        # Detect Todo
        todo_match = re.match(r'^-\s*\[\s*\]\s*(.+)', line)
        if todo_match:
            if current_text:
                text_blocks.append({"content": "\n".join(current_text).strip(), "order_idx": order_idx})
                current_text = []
                order_idx += 1
            todos.append({
                "content": todo_match.group(1),
                "is_completed": 0,
                "order_idx": order_idx
            })
            order_idx += 1
            i += 1
            continue
            
        # Otherwise, treat as text
        if line:
            current_text.append(line)
        elif current_text:
            text_blocks.append({"content": "\n".join(current_text).strip(), "order_idx": order_idx})
            current_text = []
            order_idx += 1
        i += 1
        
    if current_text:
        text_blocks.append({"content": "\n".join(current_text).strip(), "order_idx": order_idx})
        
    return {"text_blocks": text_blocks, "mcqs": mcqs, "todos": todos}
EOF

# 2. Upload Route with DB Integration
cat << 'EOF' > routes/upload.py
import os
import json
from flask import Blueprint, request, render_template, jsonify, current_app
from database import get_db
from parser import parse_markdown

bp = Blueprint('upload', __name__, url_prefix='/upload')

@bp.route('/', methods=['GET', 'POST'])
def upload_page():
    if request.method == 'POST':
        if 'file' not in request.files:
            return jsonify({"error": "No file part"}), 400
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400
            
        if file and file.filename.endswith(('.md', '.txt')):
            content = file.read().decode('utf-8')
            parsed = parse_markdown(content)
            
            db = get_db()
            cursor = db.cursor()
            cursor.execute("INSERT INTO documents (filename) VALUES (?)", (file.filename,))
            doc_id = cursor.lastrowid
            
            for tb in parsed['text_blocks']:
                cursor.execute("INSERT INTO text_blocks (document_id, content, order_idx) VALUES (?, ?, ?)",
                               (doc_id, tb['content'], tb['order_idx']))
            
            for mcq in parsed['mcqs']:
                cursor.execute("INSERT INTO mcqs (document_id, question, options, answer, explanation, difficulty, order_idx) VALUES (?, ?, ?, ?, ?, ?, ?)",
                               (doc_id, mcq['question'], mcq['options'], mcq['answer'], mcq['explanation'], mcq['difficulty'], mcq['order_idx']))
            
            for todo in parsed['todos']:
                cursor.execute("INSERT INTO todos (document_id, content, is_completed, order_idx) VALUES (?, ?, ?, ?)",
                               (doc_id, todo['content'], todo['is_completed'], todo['order_idx']))
            
            db.commit()
            return jsonify({
                "success": True, 
                "message": f"File parsed successfully! Found {len(parsed['mcqs'])} MCQs, {len(parsed['text_blocks'])} text blocks, and {len(parsed['todos'])} todos.", 
                "doc_id": doc_id
            })
            
        return jsonify({"error": "Invalid file type. Use .md or .txt"}), 400
        
    return render_template('upload.html')
EOF

# 3. Beautiful Split-Screen Upload Template
cat << 'EOF' > templates/upload.html
{% extends 'base.html' %}
{% block content %}
<div class="max-w-7xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
    <div class="mb-6">
        <h1 class="text-2xl font-bold text-slate-900">Upload & Parse Markdown</h1>
        <p class="text-slate-500 mt-1">Upload your notes. We'll intelligently separate text, MCQs, and todos.</p>
    </div>

    <div class="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
        <!-- Upload Area -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <div class="p-4 border-b border-slate-100 flex justify-between items-center">
                <h3 class="font-semibold text-slate-800">Source</h3>
                <label class="cursor-pointer bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                    Choose File
                    <input type="file" id="md-file-input" accept=".md,.txt" class="hidden" onchange="handleFileUpload(this)">
                </label>
            </div>
            <div class="flex-1 p-4 overflow-hidden relative">
                <textarea id="md-input" class="w-full h-full resize-none border-0 focus:ring-0 font-mono text-sm text-slate-700 p-2" placeholder="# Paste or upload your Markdown here...

:::mcq
q: What is the capital of France?
a) London
b) Paris
c) Berlin
d) Madrid
ans: b
diff: easy
explain: Paris has been the capital since 508 AD.
:::

- [ ] Review chapter 1
- [x] Complete quiz"></textarea>
                
                <!-- Drag Overlay -->
                <div id="drag-overlay" class="absolute inset-0 bg-primary-50/90 border-2 border-dashed border-primary-500 rounded-xl flex flex-col items-center justify-center hidden z-10">
                    <svg class="w-12 h-12 text-primary-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                    <p class="text-primary-700 font-medium">Drop your .md file here</p>
                </div>
            </div>
            <div class="p-4 border-t border-slate-100">
                <button onclick="parseAndSave()" id="save-btn" class="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                    Parse & Save to Database
                </button>
            </div>
        </div>

        <!-- Preview Area -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <div class="p-4 border-b border-slate-100 flex justify-between items-center">
                <h3 class="font-semibold text-slate-800">Parsed Preview</h3>
                <span id="preview-stats" class="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">Waiting for input...</span>
            </div>
            <div id="preview-area" class="flex-1 p-4 overflow-y-auto space-y-4">
                <div class="flex flex-col items-center justify-center h-full text-slate-400">
                    <svg class="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    <p>Parsed content will appear here</p>
                </div>
            </div>
        </div
EOF

# 4. Client-side Upload & Preview Logic
cat << 'EOF' > static/js/upload.js
// Drag and Drop Logic
const dropZone = document.getElementById('md-input')?.parentElement;
const overlay = document.getElementById('drag-overlay');

if (dropZone && overlay) {
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            overlay.classList.remove('hidden');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            overlay.classList.add('hidden');
        }, false);
    });

    dropZone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files.length > 0 && (files[0].name.endsWith('.md') || files[0].name.endsWith('.txt'))) {
            readFile(files[0]);
        } else {
            showToast('Please drop a valid .md or .txt file', 'error');
        }
    });
}

function handleFileUpload(input) {
    if (input.files.length > 0) {
        readFile(input.files[0]);
    }
}

function readFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('md-input').value = e.target.result;
        showToast('File loaded successfully', 'success');
        parsePreview(e.target.result);
    };
    reader.readAsText(file);
}

function parsePreview(text) {
    const previewArea = document.getElementById('preview-area');
    previewArea.innerHTML = ''; // Clear existing

    let mcqCount = 0, textCount = 0, todoCount = 0;
    const lines = text.split('\n');
    let currentBlock = [];
    let isMcq = false;

    lines.forEach(line => {
        if (line.trim() === ':::mcq') {
            if (currentBlock.length > 0 && !isMcq) {
                previewArea.innerHTML += `<div class="p-4 bg-slate-50 rounded-lg border border-slate-200 text-sm text-slate-700 mb-3"><span class="font-semibold text-blue-600 block mb-1">📖 Text Block</span>${currentBlock.join('<br>')}</div>`;
                currentBlock = [];
                textCount++;
            }
            isMcq = true;
            currentBlock.push(line);
        } else if (line.trim() === ':::') {
            if (isMcq) {
                renderMcqPreview(currentBlock, previewArea);
                mcqCount++;
            }
            currentBlock = [];
            isMcq = false;
        } else if (line.match(/^-\s*\[\s*\]\s/)) {
            if (currentBlock.length > 0 && !isMcq) {
                previewArea.innerHTML += `<div class="p-4 bg-slate-50 rounded-lg border border-slate-200 text-sm text-slate-700 mb-3"><span class="font-semibold text-blue-600 block mb-1">📖 Text Block</span>${currentBlock.join('<br>')}</div>`;
                currentBlock = [];
                textCount++;
            }
            previewArea.innerHTML += `<div class="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-sm text-emerald-800 mb-3 flex items-center gap-2">✅ <span>${line.replace(/^-\s*\[\s*\]\s/, '')}</span></div>`;
            todoCount++;
        } else {
            currentBlock.push(line);
        }
    });

    // Flush remaining
    if (currentBlock.length > 0) {
        if (isMcq) {
            renderMcqPreview(currentBlock, previewArea);
            mcqCount++;
        } else {
            previewArea.innerHTML += `<div class="p-4 bg-slate-50 rounded-lg border border-slate-200 text-sm text-slate-700 mb-3"><span class="font-semibold text-blue-600 block mb-1">📖 Text Block</span>${currentBlock.join('<br>')}</div>`;
            textCount++;
        }
    }

    document.getElementById('preview-stats').textContent = `${mcqCount} MCQs · ${textCount} Text Blocks · ${todoCount} Todos`;
}

function renderMcqPreview(lines, container) {
    const q = lines.find(l => l.match(/^q:\s*/i))?.replace(/^q:\s*/i, '') || 'Unknown Question';
    const opts = lines.filter(l => l.match(/^[a-d]\)\s*/i));
    const ans = lines.find(l => l.match(/^ans:\s*/i))?.replace(/^ans:\s*/i, '').toUpperCase() || '?';
    const diff = lines.find(l => l.match(/^diff:\s*/i))?.replace(/^diff:\s*/i, '').toUpperCase() || 'MED';
    
    let html = `<div class="p-4 bg-amber-50 rounded-lg border border-amber-200 mb-3">
        <div class="flex justify-between items-center mb-2">
            <span class="font-semibold text-amber-700 text-sm">❓ MCQ Detected</span>
            <span class="text-[10px] font-bold bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">${diff}</span>
        </div>
        <p class="text-sm font-medium text-slate-800 mb-3">${q}</p>
        <div class="space-y-2">`;
    
    opts.forEach(opt => {
        const key = opt.charAt(0).toUpperCase();
        const isCorrect = key === ans;
        html += `<div class="text-xs p-2 rounded flex items-center gap-2 ${isCorrect ? 'bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200' : 'bg-white text-slate-600 border border-slate-200'}">
            <span class="w-5 h-5 flex items-center justify-center rounded-full ${isCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'} text-[10px] font-bold">${key}</span>
            ${opt.substring(2)}
        </div>`;
    });
    
    html += `</div></div>`;
    container.innerHTML += html;
}

async function parseAndSave() {
    const content = document.getElementById('md-input').value;
    if (!content.trim()) {
        showToast('Please enter or upload some markdown content', 'error');
        return;
    }
    
    const btn = document.getElementById('save-btn');
    btn.disabled = true;
    btn.innerHTML = `<svg class="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Saving...`;
    
    const formData = new FormData();
    const blob = new Blob([content], { type: 'text/markdown' });
    formData.append('file', blob, 'upload.md');

    try {
        const response = await fetch('/upload/', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        
        if (data.success) {
            showToast(data.message, 'success');
            document.getElementById('md-input').value = '';
            document.getElementById('preview-area').innerHTML = '<div class="flex flex-col items-center justify-center h-full text-slate-400"><svg class="w-16 h-16 mb-4 opacity-50 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 13l4 4L19 7"></path></svg><p class="text-emerald-600 font-medium">Saved to Database!</p></div>';
            document.getElementById('preview-stats').textContent = 'Ready for next upload';
        } else {
            showToast(data.error || 'Failed to save', 'error');
        }
    } catch (err) {
        showToast('Network error occurred', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg> Parse & Save to Database`;
    }
}
EOF

echo "✅ Phase 2 Complete: Intelligent Parser & Upload Flow implemented!"
echo ""
echo "🚀 Next Steps:"
echo "1. Ensure your Flask server is running (python main.py)"
echo "2. Go to http://localhost:5000/upload/"
echo "3. Paste the sample markdown from the textarea placeholder or upload a .md file"
echo "4. Watch the live preview categorize your content, then click 'Parse & Save'"
echo ""
echo "Reply with 'Phase 2 works' or let me know if you see any parsing issues, and we will move to Phase 3: Calendar & Daily Views!"