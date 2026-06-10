function mcqPractice() {
    return {
        currentIndex: 0,
        answered: false,
        selectedAnswer: null,
        bookmarked: false,
        questions: [],
        
        get currentQuestion() {
            return this.questions[this.currentIndex] || {};
        },
        
        async init() {
            try {
                const req = new Request('/mcq/', { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
                const data = await fetch(req).then(r => r.json());
                this.questions = data;
            } catch (e) {
                console.error(e);
                showToast('Failed to load questions', 'error');
            }
        },
        
        selectAnswer(key) {
            if (this.answered) return;
            this.answered = true;
            this.selectedAnswer = key;
            const isCorrect = key === this.currentQuestion.answer;
            
            fetch(`/mcq/${this.currentQuestion.id}/answer`, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_correct: isCorrect }) 
            });
        },
        
        nextQuestion() {
            if (this.currentIndex < this.questions.length - 1) {
                this.currentIndex++;
                this.answered = false;
                this.selectedAnswer = null;
                this.bookmarked = false;
            } else {
                showToast('Practice session complete! Great job.', 'success');
                setTimeout(() => window.location.href = '/mcq/', 1500);
            }
        },
        
        toggleBookmark() {
            this.bookmarked = !this.bookmarked;
            showToast(this.bookmarked ? 'Question bookmarked' : 'Bookmark removed', 'success');
        }
    }
}
