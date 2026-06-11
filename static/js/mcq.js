function mcqPractice() {
    return {
        currentIndex: 0,
        answered: false,
        selectedAnswer: null,
        bookmarked: false,
        loading: true,
        sessionComplete: false,
        questions: [],
        score: 0,
        totalAnswered: 0,
        correctInSession: {},

        get currentQuestion() {
            return this.questions[this.currentIndex] || { options: [] };
        },

        get progressPercent() {
            if (!this.questions.length) return 0;
            return ((this.currentIndex + 1) / this.questions.length) * 100;
        },

        get isCurrentCorrect() {
            if (!this.answered || !this.currentQuestion.id) return false;
            return this.correctInSession[this.currentQuestion.id] === true;
        },

        get accuracy() {
            if (!this.totalAnswered) return 0;
            return Math.round((this.score / this.totalAnswered) * 100);
        },

        async init() {
            try {
                const req = new Request('/mcq/', { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
                const data = await fetch(req).then(r => r.json());
                this.questions = Array.isArray(data) ? this.shuffle(data) : [];
            } catch (e) {
                console.error(e);
                showToast('Failed to load questions', 'error');
            } finally {
                this.loading = false;
            }
        },

        shuffle(arr) {
            const a = [...arr];
            for (let i = a.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [a[i], a[j]] = [a[j], a[i]];
            }
            return a;
        },

        selectAnswer(key) {
            if (this.answered || !this.currentQuestion.id) return;
            this.answered = true;
            this.selectedAnswer = key;
            this.totalAnswered++;
            const isCorrect = String(key).toUpperCase() === String(this.currentQuestion.answer).toUpperCase();
            this.correctInSession[this.currentQuestion.id] = isCorrect;
            if (isCorrect) this.score++;

            fetch(`/mcq/${this.currentQuestion.id}/answer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_correct: isCorrect })
            }).catch(() => {});
        },

        nextQuestion() {
            if (this.currentIndex < this.questions.length - 1) {
                this.currentIndex++;
                this.answered = false;
                this.selectedAnswer = null;
                this.bookmarked = false;
                this.$nextTick(() => {
                    const first = document.querySelector('[id^="opt-"]');
                    if (first) first.focus();
                });
            } else {
                this.sessionComplete = true;
            }
        },

        prevQuestion() {
            if (this.currentIndex > 0) {
                this.currentIndex--;
                this.answered = this.correctInSession[this.currentQuestion.id] !== undefined;
                this.selectedAnswer = null;
                this.bookmarked = false;
            }
        },

        restartSession() {
            this.currentIndex = 0;
            this.answered = false;
            this.selectedAnswer = null;
            this.bookmarked = false;
            this.sessionComplete = false;
            this.score = 0;
            this.totalAnswered = 0;
            this.correctInSession = {};
            this.questions = this.shuffle(this.questions);
        },

        toggleBookmark() {
            this.bookmarked = !this.bookmarked;
            showToast(this.bookmarked ? 'Question bookmarked' : 'Bookmark removed', 'success');
        },

        handleKey(e) {
            if (this.loading || this.sessionComplete) return;
            if (this.answered) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.nextQuestion();
                    return;
                }
                if (e.key === 'ArrowRight' || e.key === 'n') {
                    e.preventDefault();
                    this.nextQuestion();
                    return;
                }
                if (e.key === 'ArrowLeft' || e.key === 'p') {
                    e.preventDefault();
                    if (this.currentIndex > 0) this.prevQuestion();
                    return;
                }
                return;
            }
            const keyMap = { '1': 0, '2': 1, '3': 2, '4': 3 };
            const idx = keyMap[e.key];
            if (idx !== undefined && idx < this.currentQuestion.options.length) {
                e.preventDefault();
                this.selectAnswer(this.currentQuestion.options[idx].key);
            }
        },

        optionClasses(key) {
            if (!this.answered) return 'opt-default';
            if (String(key).toUpperCase() === String(this.currentQuestion.answer).toUpperCase()) return 'opt-correct';
            if (key === this.selectedAnswer) return 'opt-incorrect';
            return 'opt-disabled';
        },

        indicatorClasses(key) {
            if (!this.answered) return 'ind-default';
            if (String(key).toUpperCase() === String(this.currentQuestion.answer).toUpperCase()) return 'ind-correct';
            if (key === this.selectedAnswer) return 'ind-incorrect';
            return 'ind-disabled';
        },

        textClasses(key) {
            if (!this.answered) return 'txt-default';
            if (String(key).toUpperCase() === String(this.currentQuestion.answer).toUpperCase()) return 'txt-correct';
            if (key === this.selectedAnswer) return 'txt-incorrect';
            return 'txt-disabled';
        }
    }
}
