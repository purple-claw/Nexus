function topicView(initialMcqs) {
    return {
        activeTab: 'reading',
        questions: initialMcqs,
        answered: {},
        selected: {},
        
        selectAnswer(qId, key) {
            if (this.answered[qId]) return;
            this.answered[qId] = true;
            this.selected[qId] = key;
            
            const q = this.questions.find(x => x.id === qId);
            const isCorrect = key === q.answer;
            fetch(`/mcq/${qId}/answer`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({is_correct: isCorrect})
            });
        },
        
        isCorrect(qId) {
            const q = this.questions.find(x => x.id === qId);
            return this.selected[qId] === q.answer;
        },
        
        getOptClass(qId, key) {
            if (!this.answered[qId]) return 'border-slate-200 hover:border-primary-300 hover:bg-primary-50 text-slate-700';
            const q = this.questions.find(x => x.id === qId);
            if (key === q.answer) return 'border-emerald-500 bg-emerald-50 text-emerald-800';
            if (key === this.selected[qId]) return 'border-rose-500 bg-rose-50 text-rose-800';
            return 'border-slate-200 opacity-50 text-slate-500';
        }
    }
}
