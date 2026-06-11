function uploadApp() {
    return {
        xmlContent: '',
        isSaving: false,
        parseError: null,
        preview: {
            metadata: { title: '', category: '', subcategory: '', description: '' },
            reading: [],
            formulas: [],
            mcqs: [],
            notes: [],
            todos: []
        },
        debounceTimer: null,

        debouncedParse() {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => this.parseXml(), 300);
        },

        parseXml() {
            if (!this.xmlContent.trim()) {
                this.parseError = null;
                this.preview = { metadata: { title: '', category: '', subcategory: '', description: '' }, reading: [], formulas: [], mcqs: [], notes: [], todos: [] };
                return;
            }

            try {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(this.xmlContent, "text/xml");
                
                // Check for parsing errors
                const parseError = xmlDoc.querySelector("parsererror");
                if (parseError) {
                    this.parseError = "Invalid XML syntax";
                    return;
                }
                this.parseError = null;

                // Extract Metadata
                const meta = xmlDoc.querySelector("metadata");
                if (meta) {
                    this.preview.metadata = {
                        title: meta.querySelector("title")?.textContent || 'Untitled',
                        category: meta.querySelector("category")?.textContent || 'General',
                        subcategory: meta.querySelector("subcategory")?.textContent || '',
                        description: meta.querySelector("description")?.textContent || ''
                    };
                }

                // Extract Reading
                this.preview.reading = Array.from(xmlDoc.querySelectorAll("reading > section")).map(s => ({
                    title: s.getAttribute("title") || "Section",
                    content: s.textContent.trim()
                }));

                // Extract Formulas
                this.preview.formulas = Array.from(xmlDoc.querySelectorAll("formulas > item")).map(i => ({
                    title: i.getAttribute("title") || "Formula",
                    content: i.textContent.trim()
                }));

                // Extract MCQs (Options only, no answers!)
                this.preview.mcqs = Array.from(xmlDoc.querySelectorAll("mcq")).map(m => {
                    const options = Array.from(m.querySelectorAll("option")).map(o => ({
                        key: o.getAttribute("key") || "?",
                        text: o.textContent.trim()
                    }));
                    return {
                        question: m.querySelector("question")?.textContent.trim() || "",
                        options: options,
                        difficulty: m.querySelector("difficulty")?.textContent.trim() || "medium"
                    };
                });

                // Extract Notes
                this.preview.notes = Array.from(xmlDoc.querySelectorAll("notes > item")).map(i => ({
                    content: i.textContent.trim()
                }));

                // Extract Todos
                this.preview.todos = Array.from(xmlDoc.querySelectorAll("todo > item")).map(i => ({
                    content: i.textContent.trim()
                }));

            } catch (e) {
                this.parseError = e.message;
            }
        },

        handleFileUpload(event) {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                this.xmlContent = e.target.result;
                this.parseXml();
                showToast('File loaded successfully', 'success');
            };
            reader.readAsText(file);
        },

        loadSample() {
            this.xmlContent = `<document>
  <metadata>
    <title>Introduction to Kinematics</title>
    <category>Physics</category>
    <subcategory>Mechanics</subcategory>
    <description>Core concepts of motion without considering forces.</description>
  </metadata>
  <reading>
    <section title="What is Kinematics?">Kinematics is the branch of mechanics that describes the motion of points, bodies, and systems of bodies without considering the forces that cause them to move.</section>
  </reading>
  <formulas>
    <item title="Velocity-Time Equation">v = u + at</item>
    <item title="Displacement-Time Equation">s = ut + 0.5 * a * t^2</item>
  </formulas>
  <mcq>
    <question>A car accelerates from rest at 2 m/s^2 for 5 seconds. What is its final velocity?</question>
    <option key="a">5 m/s</option>
    <option key="b">10 m/s</option>
    <option key="c">15 m/s</option>
    <option key="d">25 m/s</option>
    <answer>b</answer>
    <difficulty>easy</difficulty>
    <explanation>Using v = u + at, with u=0, a=2, t=5, we get v = 10 m/s.</explanation>
  </mcq>
  <notes>
    <item>Remember that these equations only apply when acceleration is CONSTANT.</item>
  </notes>
  <todo>
    <item>Solve 5 practice problems on kinematics</item>
    <item>Review the derivation of the third equation of motion</item>
  </todo>
</document>`;
            this.parseXml();
            showToast('Sample XML loaded', 'success');
        },

        async saveToDatabase() {
            if (!this.xmlContent.trim()) return;
            
            this.isSaving = true;
            const formData = new FormData();
            formData.append('xml_content', this.xmlContent);

            try {
                const response = await fetch('/upload/', {
                    method: 'POST',
                    headers: { 'X-Requested-With': 'XMLHttpRequest' },
                    body: formData
                });
                const data = await response.json();
                
                if (response.ok && data.success) {
                    showToast(data.message, 'success');
                    this.xmlContent = '';
                    this.parseXml();
                } else {
                    showToast(data.error || 'Failed to save', 'error');
                }
            } catch (err) {
                showToast('Network error occurred', 'error');
            } finally {
                this.isSaving = false;
            }
        },

        init() {
            // Ready to go!
        }
    }
}
