function sidebarApp() {
    return {
        tree: [],
        openCats: {},
        async fetchTree() {
            try {
                const res = await fetch('/api/tree');
                this.tree = await res.json();
            } catch (e) {
                console.error('Failed to load tree', e);
            }
        },
        toggleCat(id) {
            this.openCats[id] = !this.openCats[id];
        }
    }
}
