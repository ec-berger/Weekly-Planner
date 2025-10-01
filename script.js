// Calendar Application JavaScript

class WeeklyPlanner {
    constructor() {
        this.entries = [];
        this.currentEntry = null;
        this.isEditing = false;
        this.usedPresetBlocks = new Set(); // Track which preset blocks have been used
        
        // Preset blocks configuration organized by category
        this.presetCategories = {
            'Running': [
                { id: 'run-easy', type: 'activity', subcategory: 'run (easy)', duration: 60, distance: null, title: 'Easy Run', colorClass: 'activity-run-easy' },
                { id: 'run-interval', type: 'activity', subcategory: 'run (interval)', duration: 60, distance: null, title: 'Interval Run', colorClass: 'activity-run-interval' },
                { id: 'run-long', type: 'activity', subcategory: 'run (long)', duration: 120, distance: null, title: 'Long Run', colorClass: 'activity-run-long' }
            ],
            'Swimming': [
                { id: 'swim', type: 'activity', subcategory: 'swim', duration: 90, distance: null, title: 'Swimming', colorClass: 'activity-swim' },
                { id: 'swim-ZHS', type: 'activity', subcategory: 'swim (ZHS)', duration: 90, distance: null, title: 'Swimming (ZHS)', colorClass: 'activity-swim-ZHS' }
            ],
            'Gym': [
                { id: 'gym-1', type: 'activity', subcategory: 'gym', duration: 90, distance: null, title: 'Gym Session A', colorClass: 'activity-gym' },
                { id: 'gym-2', type: 'activity', subcategory: 'gym', duration: 90, distance: null, title: 'Gym Session B', colorClass: 'activity-gym' }
            ],
            'Handball': [
                { id: 'handball-1', type: 'activity', subcategory: 'handball', duration: 90, distance: null, title: 'Handball (Training)', colorClass: 'activity-handball' },
                { id: 'handball-2', type: 'activity', subcategory: 'handball', duration: 90, distance: null, title: 'Handball (Freies Spiel)', colorClass: 'activity-handball' }
            ],
            'Cycling': [
                { id: 'work-ZHS', type: 'travel', subcategory: 'bike', duration: 60, distance: 16, title: 'Work → ZHS', colorClass: 'travel-bike' },
                { id: 'home-work', type: 'travel', subcategory: 'bike', duration: 25, distance: 10, title: 'Home → Work', colorClass: 'travel-bike' },
                { id: 'work-home', type: 'travel', subcategory: 'bike', duration: 25, distance: 10, title: 'Work → Home', colorClass: 'travel-bike' },
                { id: 'ZHS-home', type: 'travel', subcategory: 'bike', duration: 45, distance: 15, title: 'ZHS → Home', colorClass: 'travel-bike' },
                { id: 'home-ZHS', type: 'travel', subcategory: 'bike', duration: 45, distance: 15, title: 'Home → ZHS', colorClass: 'travel-bike' }
            ],
            'Work & University': [
                { id: 'work-1', type: 'activity', subcategory: 'work', duration: 510, distance: null, title: 'Work Day 1', colorClass: 'activity-work' },
                { id: 'work-2', type: 'activity', subcategory: 'work', duration: 510, distance: null, title: 'Work Day 2', colorClass: 'activity-work' },
                { id: 'uni-1', type: 'activity', subcategory: 'uni', duration: 480, distance: null, title: 'Uni Day 1', colorClass: 'activity-uni' },
                { id: 'uni-2', type: 'activity', subcategory: 'uni', duration: 480, distance: null, title: 'Uni Day 2', colorClass: 'activity-uni' },
                { id: 'uni-3', type: 'activity', subcategory: 'uni', duration: 480, distance: null, title: 'Uni Day 3', colorClass: 'activity-uni' }
            ]
        };
        
        // Category configurations
        this.categories = {
            travel: {
                subcategories: ['bike', 'run', 'public transport'],
                colors: {
                    'bike': 'travel-bike',
                    'run': 'travel-run',
                    'public transport': 'travel-public'
                }
            },
            activity: {
                subcategories: ['run (easy)', 'run (interval)', 'run (long)', 'handball', 'swim (ZHS)', 'swim', 'work', 'uni', 'gym'],
                colors: {
                    'run (easy)': 'activity-run-easy',
                    'run (interval)': 'activity-run-interval',
                    'run (long)': 'activity-run-long',
                    'handball': 'activity-handball',
                    'swim (ZHS)': 'activity-swim-ZHS',
                    'swim': 'activity-swim',
                    'work': 'activity-work',
                    'uni': 'activity-uni',
                    'gym': 'activity-gym'
                }
            }
        };

        this.days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        
        // Load custom categories from localStorage
        this.loadCustomCategories();
        
        this.init();
    }

    init() {
        this.generateTimeSlots();
        this.generatePresetBlocks();
        this.setupEventListeners();
        this.updateDaySummaries();
    }

    generateTimeSlots() {
        const timeColumn = document.querySelector('.time-slots');
        const daySlots = document.querySelectorAll('.day-slots');

        // Generate time slots from 8:00 to 23:30 in 30-minute intervals
        for (let hour = 8; hour <= 23; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                // Add time label (only for full hours to avoid clutter)
                if (minute === 0) {
                    const timeSlot = document.createElement('div');
                    timeSlot.className = 'time-slot';
                    timeSlot.textContent = `${hour.toString().padStart(2, '0')}:00`;
                    timeColumn.appendChild(timeSlot);
                } else {
                    const timeSlot = document.createElement('div');
                    timeSlot.className = 'time-slot time-slot-half';
                    timeSlot.textContent = ''; // Empty for half hours
                    timeColumn.appendChild(timeSlot);
                }

                // Add corresponding slots for each day
                daySlots.forEach(daySlot => {
                    const slot = document.createElement('div');
                    slot.className = 'day-slot';
                    slot.dataset.hour = hour;
                    slot.dataset.minute = minute;
                    slot.dataset.timeValue = hour + (minute / 60); // Decimal time for calculations
                    slot.dataset.day = daySlot.dataset.day;
                    daySlot.appendChild(slot);
                });
            }
        }
    }

    generatePresetBlocks() {
        const presetContainer = document.getElementById('presetCategories');
        presetContainer.innerHTML = ''; // Clear existing content to prevent duplicates
        
        Object.keys(this.presetCategories).forEach(categoryName => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'preset-category';
            
            const categoryTitle = document.createElement('h4');
            categoryTitle.textContent = categoryName;
            categoryDiv.appendChild(categoryTitle);
            
            const blocksContainer = document.createElement('div');
            blocksContainer.className = 'preset-blocks';
            
            this.presetCategories[categoryName].forEach(preset => {
                const blockElement = document.createElement('div');
                
                // Check if this block has been used (excluding cycling blocks)
                const isUsed = this.usedPresetBlocks.has(preset.id) && categoryName !== 'Cycling';
                
                if (isUsed) {
                    // Create placeholder for used block
                    blockElement.className = `preset-block-placeholder ${preset.colorClass}`;
                    blockElement.innerHTML = `
                        <div class="preset-block-title">${preset.title}</div>
                        <div class="preset-block-details">Used</div>
                    `;
                } else {
                    // Normal preset block
                    blockElement.className = `preset-block ${preset.colorClass}`;
                    blockElement.dataset.presetId = preset.id;
                    blockElement.draggable = true;

                    const details = [];
                    if (preset.distance) {
                        details.push(`${preset.distance}km`);
                    }
                    details.push(`${preset.duration}min`);

                    blockElement.innerHTML = `
                        <div class="preset-block-title">${preset.title}</div>
                        <div class="preset-block-details">${details.join(' • ')}</div>
                    `;

                    // Add click event for testing
                    blockElement.addEventListener('click', () => {
                        console.log('Clicked preset block:', preset.title);
                    });
                }

                blocksContainer.appendChild(blockElement);
            });
            
            // Add '+' button to category
            const addButton = document.createElement('div');
            addButton.className = `preset-block-add ${this.getCategoryColorClass(categoryName)}`;
            addButton.innerHTML = `+`;
            addButton.addEventListener('click', () => {
                this.openBlockModalForCategory(categoryName);
            });
            
            blocksContainer.appendChild(addButton);
            categoryDiv.appendChild(blocksContainer);
            presetContainer.appendChild(categoryDiv);
        });
    }

    setupEventListeners() {
        // Modal elements
        const modal = document.getElementById('entryModal');
        const closeBtn = document.querySelector('.close');
        const cancelBtn = document.getElementById('cancelBtn');
        const deleteBtn = document.getElementById('deleteBtn');
        const entryForm = document.getElementById('entryForm');
        const entryType = document.getElementById('entryType');
        const entrySubcategory = document.getElementById('entrySubcategory');

        // Day slot click events
        document.querySelectorAll('.day-slot').forEach(slot => {
            slot.addEventListener('click', (e) => {
                if (e.target === slot) { // Only if clicking the slot itself, not an entry
                    this.openModal(slot);
                }
            });
        });

        // Modal events
        closeBtn.addEventListener('click', () => this.closeModal());
        cancelBtn.addEventListener('click', () => this.closeModal());
        deleteBtn.addEventListener('click', () => this.deleteEntry());
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });

        // Form submission
        entryForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEntry();
        });

        // Type change event
        entryType.addEventListener('change', () => {
            this.updateSubcategories();
        });

        // Subcategory change event
        entrySubcategory.addEventListener('change', () => {
            this.updateDistanceField();
        });

        // Transport destination change events
        const entryFrom = document.getElementById('entryFrom');
        const entryTo = document.getElementById('entryTo');
        entryFrom.addEventListener('change', () => this.updateDistanceField());
        entryTo.addEventListener('change', () => this.updateDistanceField());

        // Reset button
        const resetBtn = document.getElementById('resetBtn');
        resetBtn.addEventListener('click', () => this.resetUnlockedEntries());

        // Save/Load buttons
        const saveBtn = document.getElementById('saveBtn');
        const loadBtn = document.getElementById('loadBtn');
        const loadFileInput = document.getElementById('loadFileInput');
        
        saveBtn.addEventListener('click', () => this.saveConfiguration());
        loadBtn.addEventListener('click', () => loadFileInput.click());
        loadFileInput.addEventListener('change', (e) => this.loadConfiguration(e));

        // Add category/block buttons
        const addCategoryBtn = document.getElementById('addCategoryBtn');
        const addBlockBtn = document.getElementById('addBlockBtn');
        addCategoryBtn.addEventListener('click', () => this.openCategoryModal());
        addBlockBtn.addEventListener('click', () => this.openBlockModal());

        // Category modal events
        const categoryModal = document.getElementById('categoryModal');
        const closeCategoryModal = document.getElementById('closeCategoryModal');
        const cancelCategoryBtn = document.getElementById('cancelCategoryBtn');
        const categoryForm = document.getElementById('categoryForm');
        
        closeCategoryModal.addEventListener('click', () => this.closeCategoryModal());
        cancelCategoryBtn.addEventListener('click', () => this.closeCategoryModal());
        categoryForm.addEventListener('submit', (e) => this.handleCategorySubmit(e));

        // Block modal events
        const blockModal = document.getElementById('blockModal');
        const closeBlockModal = document.getElementById('closeBlockModal');
        const cancelBlockBtn = document.getElementById('cancelBlockBtn');
        const blockForm = document.getElementById('blockForm');
        const blockType = document.getElementById('blockType');
        
        closeBlockModal.addEventListener('click', () => this.closeBlockModal());
        cancelBlockBtn.addEventListener('click', () => this.closeBlockModal());
        blockForm.addEventListener('submit', (e) => this.handleBlockSubmit(e));
        blockType.addEventListener('change', () => this.updateBlockSubcategories());

        // Setup drag and drop
        this.setupDragAndDrop();
    }

    updateSubcategories() {
        const entryType = document.getElementById('entryType');
        const entrySubcategory = document.getElementById('entrySubcategory');
        const transportDestinationGroup = document.getElementById('transportDestinationGroup');
        
        entrySubcategory.innerHTML = '<option value="">Select subcategory...</option>';
        
        if (entryType.value && this.categories[entryType.value]) {
            this.categories[entryType.value].subcategories.forEach(sub => {
                const option = document.createElement('option');
                option.value = sub;
                option.textContent = sub;
                entrySubcategory.appendChild(option);
            });
        }
        
        // Show/hide transport destination fields
        if (entryType.value === 'travel') {
            transportDestinationGroup.classList.remove('hidden');
        } else {
            transportDestinationGroup.classList.add('hidden');
        }
        
        this.updateDistanceField();
    }

    updateDistanceField() {
        const entryType = document.getElementById('entryType').value;
        const entrySubcategory = document.getElementById('entrySubcategory').value;
        const distanceGroup = document.getElementById('distanceGroup');
        const transportDestinationGroup = document.getElementById('transportDestinationGroup');

        // Show distance field for bike and run entries
        const needsDistance = (entryType === 'travel' && ['bike', 'run'].includes(entrySubcategory)) ||
                             (entryType === 'activity' && entrySubcategory.includes('run'));

        distanceGroup.classList.toggle('hidden', !needsDistance);
        
        // Show destination fields for public transport
        const needsDestination = (entryType === 'travel' && entrySubcategory === 'public transport');
        transportDestinationGroup.classList.toggle('hidden', !needsDestination);
    }

    openModal(slot = null, entry = null) {
        const modal = document.getElementById('entryModal');
        const modalTitle = document.getElementById('modalTitle');
        const deleteBtn = document.getElementById('deleteBtn');
        const form = document.getElementById('entryForm');

        this.currentSlot = slot;
        this.currentEntry = entry;
        this.isEditing = !!entry;

        if (this.isEditing) {
            modalTitle.textContent = 'Edit Entry';
            deleteBtn.classList.remove('hidden');
            this.populateForm(entry);
        } else {
            modalTitle.textContent = 'Add Entry';
            deleteBtn.classList.add('hidden');
            form.reset();
            this.updateSubcategories();
        }

        modal.style.display = 'block';
    }

    populateForm(entry) {
        document.getElementById('entryType').value = entry.type;
        this.updateSubcategories();
        document.getElementById('entrySubcategory').value = entry.subcategory;
        document.getElementById('entryDuration').value = entry.duration;
        document.getElementById('entryDistance').value = entry.distance || '';
        
        // Populate transport destinations if they exist
        if (entry.from && entry.to) {
            document.getElementById('entryFrom').value = entry.from;
            document.getElementById('entryTo').value = entry.to;
        }
        
        this.updateDistanceField();
    }

    closeModal() {
        const modal = document.getElementById('entryModal');
        modal.style.display = 'none';
        this.currentSlot = null;
        this.currentEntry = null;
        this.isEditing = false;
    }

    saveEntry() {
        const type = document.getElementById('entryType').value;
        const subcategory = document.getElementById('entrySubcategory').value;
        const duration = parseInt(document.getElementById('entryDuration').value);
        const distance = parseFloat(document.getElementById('entryDistance').value) || null;
        
        // Handle public transport destinations
        let from = null;
        let to = null;
        let title = null;
        
        if (type === 'travel' && subcategory === 'public transport') {
            from = document.getElementById('entryFrom').value;
            to = document.getElementById('entryTo').value;
            
            // Validate that both from and to are selected
            if (!from || !to) {
                alert('Please select both starting point and destination for public transport.');
                return;
            }
            
            if (from === to) {
                alert('Starting point and destination cannot be the same.');
                return;
            }
            
            // Generate title like preset blocks (capitalize first letter)
            const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
            title = `${capitalize(from)} → ${capitalize(to)}`;
        }

        const entry = {
            id: this.isEditing ? this.currentEntry.id : Date.now(),
            type,
            subcategory,
            duration,
            distance,
            from,
            to,
            title,
            day: this.isEditing ? this.currentEntry.day : this.currentSlot.dataset.day,
            hour: this.isEditing ? this.currentEntry.hour : parseInt(this.currentSlot.dataset.hour),
            minute: this.isEditing ? this.currentEntry.minute : parseInt(this.currentSlot.dataset.minute),
            colorClass: this.categories[type].colors[subcategory],
            locked: this.isEditing ? this.currentEntry.locked : false
        };

        if (this.isEditing) {
            const index = this.entries.findIndex(e => e.id === this.currentEntry.id);
            if (index !== -1) {
                this.entries[index] = entry;
            }
        } else {
            this.entries.push(entry);
        }

        this.renderEntries();
        this.updateDaySummaries();
        this.closeModal();
    }

    deleteEntry() {
        if (this.currentEntry) {
            // Check if this entry was from a preset block
            const entryToDelete = this.currentEntry;
            const presetId = this.findPresetIdByEntry(entryToDelete);
            
            this.entries = this.entries.filter(e => e.id !== this.currentEntry.id);
            
            // If it was a preset entry (excluding cycling), mark as available again
            if (presetId) {
                const presetCategory = this.getPresetCategory(presetId);
                if (presetCategory !== 'Cycling') {
                    this.usedPresetBlocks.delete(presetId);
                    this.generatePresetBlocks(); // Refresh preset blocks display
                }
            }
            
            this.renderEntries();
            this.updateDaySummaries();
            this.closeModal();
        }
    }

    renderEntries() {
        // Clear existing entries
        document.querySelectorAll('.entry').forEach(entry => entry.remove());

        // Render all entries
        this.entries.forEach(entry => {
            this.renderEntry(entry);
        });
    }

    renderEntry(entry) {
        // Find slot by day, hour, and minute (default to 0 if not specified)
        const minute = entry.minute || 0;
        const slot = document.querySelector(`[data-day="${entry.day}"][data-hour="${entry.hour}"][data-minute="${minute}"]`);
        if (!slot) return;

        const entryElement = document.createElement('div');
        entryElement.className = `entry ${entry.colorClass}`;
        entryElement.dataset.entryId = entry.id;
        entryElement.draggable = true;

        // Calculate height based on duration (30min = 30px height)
        const durationHours = entry.duration / 60;
        const height = durationHours * 60; // 30px per half-hour slot
        entryElement.style.height = `${height}px`;
        entryElement.style.zIndex = '20';

        const title = entry.title || entry.subcategory;
        const details = [];
        
        if (entry.distance) {
            details.push(`${entry.distance}km`);
        }
        
        // Show duration in hours and minutes for better readability
        if (entry.duration >= 60) {
            const hours = Math.floor(entry.duration / 60);
            const minutes = entry.duration % 60;
            if (minutes > 0) {
                details.push(`${hours}h ${minutes}min`);
            } else {
                details.push(`${hours}h`);
            }
        } else {
            details.push(`${entry.duration}min`);
        }

        entryElement.innerHTML = `
            <div class="entry-title">${title}</div>
            <div class="entry-details">${details.join(' • ')}</div>
            <div class="lock-icon ${entry.locked ? 'locked' : 'unlocked'}" title="${entry.locked ? 'Unlock' : 'Lock'}">
                🔒
            </div>
        `;

        if (entry.locked) {
            entryElement.classList.add('locked');
        }

        // Add click event for editing
        entryElement.addEventListener('click', (e) => {
            e.stopPropagation();
            if (e.target.classList.contains('lock-icon')) {
                this.toggleLock(entry.id);
            } else {
                this.openModal(null, entry);
            }
        });

        slot.appendChild(entryElement);
    }

    setupDragAndDrop() {
        const self = this; // Store reference to the class instance
        let draggedEntry = null;
        let draggedPreset = null;

        // Handle drag start
        document.addEventListener('dragstart', (e) => {
            console.log('Drag start on:', e.target.className, e.target.dataset);
            
            if (e.target.classList.contains('entry')) {
                draggedEntry = e.target;
                e.target.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                console.log('Started dragging entry:', draggedEntry.dataset.entryId);
                console.log('draggedEntry element:', draggedEntry);
            } else if (e.target.classList.contains('preset-block')) {
                draggedPreset = e.target;
                e.target.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'copy';
                e.dataTransfer.setData('text/plain', ''); // Required for some browsers
                console.log('Started dragging preset:', draggedPreset.dataset.presetId);
            }
        });

        // Handle drag end
        document.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('entry') || e.target.classList.contains('preset-block')) {
                e.target.classList.remove('dragging');
                document.querySelectorAll('.drop-target, .drag-invalid').forEach(slot => {
                    slot.classList.remove('drop-target', 'drag-invalid');
                });
            }
            draggedEntry = null;
            draggedPreset = null;
        });

        // Handle drag over
        document.addEventListener('dragover', (e) => {
            e.preventDefault();
            
            // Find the day-slot element (might be nested)
            let targetSlot = e.target;
            while (targetSlot && !targetSlot.classList.contains('day-slot')) {
                targetSlot = targetSlot.parentElement;
            }
            
            if (targetSlot && targetSlot.classList.contains('day-slot')) {
                // Clear previous highlights
                document.querySelectorAll('.drop-target, .drag-invalid').forEach(el => {
                    el.classList.remove('drop-target', 'drag-invalid');
                });
                
                e.dataTransfer.dropEffect = 'copy';
                targetSlot.classList.add('drop-target');
            }
        });

        // Handle drag leave
        document.addEventListener('dragleave', (e) => {
            // Only remove highlights if we're leaving the calendar area
            if (!e.relatedTarget || !e.relatedTarget.closest('.days-container')) {
                document.querySelectorAll('.drop-target, .drag-invalid').forEach(el => {
                    el.classList.remove('drop-target', 'drag-invalid');
                });
            }
        });

        // Handle drop
        document.addEventListener('drop', (e) => {
            e.preventDefault();
            console.log('Drop event fired, draggedEntry:', draggedEntry, 'draggedPreset:', draggedPreset);
            
            // Find the day-slot element (might be nested)
            let targetSlot = e.target;
            while (targetSlot && !targetSlot.classList.contains('day-slot')) {
                targetSlot = targetSlot.parentElement;
            }
            
            if (targetSlot && targetSlot.classList.contains('day-slot')) {
                console.log('Drop detected on slot:', targetSlot.dataset.day, targetSlot.dataset.hour);
                
                if (draggedEntry) {
                    console.log('Processing entry drop...');
                    const entryId = parseInt(draggedEntry.dataset.entryId);
                    const newDay = targetSlot.dataset.day;
                    const newHour = parseInt(targetSlot.dataset.hour);
                    const newMinute = parseInt(targetSlot.dataset.minute);
                    const newTime = parseFloat(targetSlot.dataset.timeValue);
                    
                    console.log('Entry ID:', entryId, 'New position:', newDay, newTime);
                    console.log('All entries:', self.entries.map(e => ({ id: e.id, day: e.day, hour: e.hour })));

                    // Update entry data
                    const entry = self.entries.find(e => e.id === entryId);
                    console.log('Found entry:', entry);
                    if (entry) {
                        // Temporarily remove the entry to check placement
                        const originalDay = entry.day;
                        const originalHour = entry.hour;
                        const originalMinute = entry.minute;
                        const entryIndex = self.entries.indexOf(entry);
                        self.entries.splice(entryIndex, 1);
                        
                        if (self.canPlaceEntry(newDay, newTime, entry.duration)) {
                            entry.day = newDay;
                            entry.hour = newHour;
                            entry.minute = newMinute;
                            self.entries.splice(entryIndex, 0, entry);
                            
                            self.renderEntries();
                            self.updateDaySummaries();
                            console.log('Entry moved successfully');
                        } else {
                            // Restore original position
                            entry.day = originalDay;
                            entry.hour = originalHour;
                            entry.minute = originalMinute;
                            self.entries.splice(entryIndex, 0, entry);
                            
                            // Visual feedback for failed drop
                            targetSlot.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
                            setTimeout(() => {
                                targetSlot.style.backgroundColor = '';
                            }, 500);
                            console.log('Entry move failed - overlap detected');
                        }
                    }

                    draggedEntry = null;
                } else if (draggedPreset) {
                    console.log('Dropping preset:', draggedPreset.dataset.presetId);
                    const presetId = draggedPreset.dataset.presetId;
                    let preset = null;
                    
                    // Find preset in categories
                    for (let category of Object.values(self.presetCategories)) {
                        preset = category.find(p => p.id === presetId);
                        if (preset) break;
                    }
                    
                    if (preset) {
                        const targetDay = targetSlot.dataset.day;
                        const targetHour = parseInt(targetSlot.dataset.hour);
                        const targetMinute = parseInt(targetSlot.dataset.minute);
                        const targetTime = parseFloat(targetSlot.dataset.timeValue);
                        
                        console.log('Checking placement for preset:', preset.title, 'at', targetDay, targetTime);
                        
                        // Check if there's enough space and no overlaps
                        if (self.canPlaceEntry(targetDay, targetTime, preset.duration)) {
                            const newEntry = {
                                id: Date.now() + Math.random(), // Ensure unique ID
                                type: preset.type,
                                subcategory: preset.subcategory,
                                duration: preset.duration,
                                distance: preset.distance,
                                day: targetDay,
                                hour: targetHour,
                                minute: targetMinute,
                                colorClass: preset.colorClass,
                                locked: false,
                                title: preset.title // Keep the preset title
                            };

                            console.log('Adding new entry:', newEntry);
                            self.entries.push(newEntry);
                            
                            // Mark preset as used (excluding cycling blocks)
                            const presetCategory = self.getPresetCategory(preset.id);
                            if (presetCategory !== 'Cycling') {
                                self.usedPresetBlocks.add(preset.id);
                                self.generatePresetBlocks(); // Refresh preset blocks display
                            }
                            
                            self.renderEntries();
                            self.updateDaySummaries();
                        } else {
                            // Visual feedback for failed drop
                            targetSlot.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
                            setTimeout(() => {
                                targetSlot.style.backgroundColor = '';
                            }, 500);
                            console.log('Preset drop failed - no space available');
                        }
                    }

                    draggedPreset = null;
                }

                // Clean up visual feedback
                document.querySelectorAll('.drop-target, .drag-invalid').forEach(el => {
                    el.classList.remove('drop-target', 'drag-invalid');
                });
            }
        });
    }



    updateDaySummaries() {
        this.days.forEach(day => {
            const dayEntries = this.entries.filter(entry => entry.day === day);
            
            let runDistance = 0;
            let bikeDistance = 0;
            let otherDuration = 0;

            dayEntries.forEach(entry => {
                if (entry.distance && (entry.subcategory === 'run' || entry.subcategory.includes('run'))) {
                    runDistance += entry.distance;
                } else if (entry.distance && entry.subcategory === 'bike') {
                    bikeDistance += entry.distance;
                } else if (entry.subcategory !== 'public transport') {
                    otherDuration += entry.duration;
                }
            });

            const summaryElement = document.getElementById(`${day}Summary`);
            if (summaryElement) {
                summaryElement.innerHTML = `
                    <div class="run-distance">Run: ${runDistance.toFixed(1)}km</div>
                    <div class="bike-distance">Bike: ${bikeDistance.toFixed(1)}km</div>
                    <div class="other-duration">Other: ${Math.round(otherDuration / 60 * 10) / 10}h</div>
                `;
            }
        });
    }



    toggleLock(entryId) {
        const entry = this.entries.find(e => e.id === entryId);
        if (entry) {
            entry.locked = !entry.locked;
            this.renderEntries();
        }
    }

    canPlaceEntry(day, startTime, duration) {
        const durationHours = duration / 60;
        const endTime = startTime + durationHours;
        
        console.log(`Checking placement: ${day} ${startTime}-${endTime} (${duration}min)`);
        
        // Check if it goes beyond the available time slots (24:00)
        if (endTime > 24) {
            console.log('Failed: extends beyond 24:00');
            return false;
        }
        
        // Temporarily allow all placements for debugging
        console.log('Placement OK (validation simplified)');
        return true;
    }



    loadCustomCategories() {
        const saved = localStorage.getItem('customPresetCategories');
        if (saved) {
            const customCategories = JSON.parse(saved);
            Object.assign(this.presetCategories, customCategories);
        }
    }

    saveCustomCategories() {
        // Save only custom categories (exclude defaults)
        const defaultKeys = ['Running', 'Swimming', 'Gym', 'Handball', 'Cycling', 'Work & University'];
        const customCategories = {};
        
        Object.keys(this.presetCategories).forEach(key => {
            if (!defaultKeys.includes(key)) {
                customCategories[key] = this.presetCategories[key];
            }
        });
        
        localStorage.setItem('customPresetCategories', JSON.stringify(customCategories));
    }

    openCategoryModal() {
        document.getElementById('categoryModal').style.display = 'block';
    }

    closeCategoryModal() {
        document.getElementById('categoryModal').style.display = 'none';
        document.getElementById('categoryForm').reset();
    }

    openBlockModal() {
        this.populateBlockCategoryOptions();
        document.getElementById('blockModal').style.display = 'block';
    }

    openBlockModalForCategory(categoryName) {
        this.populateBlockCategoryOptions();
        document.getElementById('blockCategory').value = categoryName;
        document.getElementById('blockModal').style.display = 'block';
    }

    getCategoryColorClass(categoryName) {
        // Get the first block's color class from the category, or default
        if (this.presetCategories[categoryName] && this.presetCategories[categoryName].length > 0) {
            return this.presetCategories[categoryName][0].colorClass;
        }
        // Default color classes for categories
        const categoryColors = {
            'Running': 'activity-run-easy',
            'Swimming': 'activity-swim',
            'Gym': 'activity-gym',
            'Handball': 'activity-handball',
            'Cycling': 'travel-bike',
            'Work & University': 'activity-work'
        };
        return categoryColors[categoryName] || 'activity-work';
    }

    getPresetCategory(presetId) {
        for (const [categoryName, presets] of Object.entries(this.presetCategories)) {
            if (presets.some(preset => preset.id === presetId)) {
                return categoryName;
            }
        }
        return null;
    }

    findPresetIdByEntry(entry) {
        // Look for a preset that matches this entry's properties
        for (const [categoryName, presets] of Object.entries(this.presetCategories)) {
            for (const preset of presets) {
                if (preset.title === entry.title && 
                    preset.type === entry.type && 
                    preset.subcategory === entry.subcategory && 
                    preset.duration === entry.duration && 
                    preset.distance === entry.distance) {
                    return preset.id;
                }
            }
        }
        return null;
    }

    closeBlockModal() {
        document.getElementById('blockModal').style.display = 'none';
        document.getElementById('blockForm').reset();
    }

    populateBlockCategoryOptions() {
        const select = document.getElementById('blockCategory');
        select.innerHTML = '<option value="">Select category...</option>';
        
        Object.keys(this.presetCategories).forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            select.appendChild(option);
        });
    }

    updateBlockSubcategories() {
        const blockType = document.getElementById('blockType').value;
        const blockSubcategory = document.getElementById('blockSubcategory');
        const distanceGroup = document.getElementById('blockDistanceGroup');
        
        blockSubcategory.innerHTML = '<option value="">Select subcategory...</option>';
        
        if (blockType && this.categories[blockType]) {
            this.categories[blockType].subcategories.forEach(sub => {
                const option = document.createElement('option');
                option.value = sub;
                option.textContent = sub;
                blockSubcategory.appendChild(option);
            });
        }

        // Show/hide distance field
        blockSubcategory.addEventListener('change', () => {
            const subcategory = blockSubcategory.value;
            const needsDistance = (blockType === 'travel' && ['bike', 'run'].includes(subcategory)) ||
                                 (blockType === 'activity' && subcategory.includes('run'));
            distanceGroup.classList.toggle('hidden', !needsDistance);
        });
    }

    handleCategorySubmit(e) {
        e.preventDefault();
        const categoryName = document.getElementById('categoryName').value.trim();
        
        if (categoryName && !this.presetCategories[categoryName]) {
            this.presetCategories[categoryName] = [];
            this.saveCustomCategories();
            this.regeneratePresetBlocks();
            this.closeCategoryModal();
        } else {
            alert('Category name already exists or is empty.');
        }
    }

    handleBlockSubmit(e) {
        e.preventDefault();
        
        const category = document.getElementById('blockCategory').value;
        const title = document.getElementById('blockTitle').value.trim();
        const type = document.getElementById('blockType').value;
        const subcategory = document.getElementById('blockSubcategory').value;
        const duration = parseInt(document.getElementById('blockDuration').value);
        const distance = parseFloat(document.getElementById('blockDistance').value) || null;
        
        if (category && title && type && subcategory && duration) {
            const newBlock = {
                id: `custom-${Date.now()}`,
                type,
                subcategory,
                duration,
                distance,
                title,
                colorClass: this.categories[type].colors[subcategory]
            };
            
            this.presetCategories[category].push(newBlock);
            this.saveCustomCategories();
            this.regeneratePresetBlocks();
            this.closeBlockModal();
        } else {
            alert('Please fill in all required fields.');
        }
    }

    regeneratePresetBlocks() {
        // Clear existing blocks
        document.getElementById('presetCategories').innerHTML = '';
        // Regenerate with new data
        this.generatePresetBlocks();
    }

    resetUnlockedEntries() {
        if (confirm('Are you sure you want to reset all unlocked entries? This action cannot be undone.')) {
            this.entries = this.entries.filter(entry => entry.locked);
            
            // Reset used preset blocks (clear all used blocks)
            this.usedPresetBlocks.clear();
            
            // Refresh all displays
            this.generatePresetBlocks(); // Regenerate preset blocks to show all as available
            this.renderEntries();
            this.updateDaySummaries();
        }
    }

    saveConfiguration() {
        const configuration = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            entries: this.entries,
            usedPresetBlocks: Array.from(this.usedPresetBlocks),
            customCategories: this.loadCustomCategories(),
            presetCategories: this.presetCategories
        };

        const dataStr = JSON.stringify(configuration, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `weekly-planner-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        console.log('Configuration saved successfully');
    }

    loadConfiguration(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const configuration = JSON.parse(e.target.result);
                
                // Validate configuration format
                if (!configuration.version || !configuration.entries) {
                    throw new Error('Invalid configuration file format');
                }

                // Clear current state
                this.entries = [];
                this.usedPresetBlocks = new Set();

                // Load entries
                this.entries = configuration.entries || [];
                
                // Load used preset blocks
                if (configuration.usedPresetBlocks) {
                    this.usedPresetBlocks = new Set(configuration.usedPresetBlocks);
                }

                // Load custom categories if they exist
                if (configuration.customCategories) {
                    localStorage.setItem('customCategories', JSON.stringify(configuration.customCategories));
                }

                // Load custom preset categories if they exist
                if (configuration.presetCategories) {
                    // Merge custom preset categories with default ones
                    this.presetCategories = { ...this.presetCategories, ...configuration.presetCategories };
                }

                // Refresh the display
                this.generateTimeSlots();
                this.generatePresetBlocks();
                this.renderEntries();
                this.updateDaySummaries();

                console.log('Configuration loaded successfully');
                alert('Configuration loaded successfully!');
                
            } catch (error) {
                console.error('Error loading configuration:', error);
                alert('Error loading configuration file. Please check the file format.');
            }
        };
        
        reader.readAsText(file);
        // Reset the input so the same file can be loaded again
        event.target.value = '';
    }

    loadCustomCategories() {
        const stored = localStorage.getItem('customCategories');
        return stored ? JSON.parse(stored) : {};
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WeeklyPlanner();
});