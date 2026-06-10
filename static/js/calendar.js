function calendarApp() {
    return {
        currentDate: new Date(),
        selectedDate: null,
        selectedTopicId: '',
        showModal: false,
        events: {},
        available: { topics: [] },
        
        get monthYear() {
            return this.currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        },
        
        get calendarDays() {
            const year = this.currentDate.getFullYear();
            const month = this.currentDate.getMonth();
            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const daysInPrevMonth = new Date(year, month, 0).getDate();
            
            const days = [];
            for (let i = firstDay - 1; i >= 0; i--) {
                days.push({ dayNum: daysInPrevMonth - i, isCurrentMonth: false, date: this.getDateStr(year, month - 1, daysInPrevMonth - i) });
            }
            for (let i = 1; i <= daysInMonth; i++) {
                const dateStr = this.getDateStr(year, month, i);
                days.push({ dayNum: i, isCurrentMonth: true, date: dateStr, events: this.events[dateStr] || { topics: 0 } });
            }
            const remaining = 42 - days.length;
            for (let i = 1; i <= remaining; i++) {
                days.push({ dayNum: i, isCurrentMonth: false, date: this.getDateStr(year, month + 1, i) });
            }
            return days;
        },
        
        getDateStr(year, month, day) {
            const d = new Date(year, month, day);
            return d.toISOString().split('T')[0];
        },
        
        isToday(dateStr) { return dateStr === new Date().toISOString().split('T')[0]; },
        changeMonth(offset) { this.currentDate.setMonth(this.currentDate.getMonth() + offset); },
        
        async selectDate(date) {
            this.selectedDate = date;
            this.selectedTopicId = '';
            await this.fetchAvailable();
            this.showModal = true;
        },
        
        formatDate(dateStr) { return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }); },
        
        async fetchEvents() {
            try { const res = await fetch('/calendar/events'); this.events = await res.json(); } catch (e) { console.error(e); }
        },
        async fetchAvailable() {
            try { const res = await fetch('/calendar/available'); this.available = await res.json(); } catch (e) { console.error(e); }
        },
        
        async assignTopic() {
            if (!this.selectedTopicId) { showToast('Please select a topic', 'error'); return; }
            try {
                const res = await fetch('/calendar/assign', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ topic_id: parseInt(this.selectedTopicId), date: this.selectedDate })
                });
                const data = await res.json();
                if (data.success) {
                    showToast('Topic assigned successfully!', 'success');
                    this.showModal = false;
                    this.fetchEvents();
                }
            } catch (e) { showToast('Failed to assign', 'error'); }
        },
        init() { this.fetchEvents(); }
    }
}
