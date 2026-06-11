function topicView(initialMcqs, defaultTab = 'reading') {
    return {
        activeTab: defaultTab,
        questions: Array.isArray(initialMcqs) ? initialMcqs : [],
        answered: {},
        selected: {},
        
        selectAnswer(qId, key) {
            if (this.answered[qId]) return;
            this.answered[qId] = true;
            this.selected[qId] = key;
            
            const q = this.questions.find(x => x.id === qId);
            if (!q) return;
            const isCorrect = String(key).toUpperCase() === String(q.answer).toUpperCase();
            fetch(`/mcq/${qId}/answer`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({is_correct: isCorrect})
            });
        },
        
        isCorrect(qId) {
            const q = this.questions.find(x => x.id === qId);
            if (!q) return false;
            return String(this.selected[qId]).toUpperCase() === String(q.answer).toUpperCase();
        },
        
        getOptClass(qId, key) {
            if (!this.answered[qId]) return 'border-slate-200 hover:border-primary-300 hover:bg-primary-50 text-slate-700';
            const q = this.questions.find(x => x.id === qId);
            if (!q) return 'border-slate-200 text-slate-500';
            if (String(key).toUpperCase() === String(q.answer).toUpperCase()) return 'border-emerald-500 bg-emerald-50 text-emerald-800';
            if (key === this.selected[qId]) return 'border-rose-500 bg-rose-50 text-rose-800';
            return 'border-slate-200 opacity-50 text-slate-500';
        }
    }
}
