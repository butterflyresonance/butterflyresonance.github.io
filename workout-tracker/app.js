// Data structures
let exercises = JSON.parse(localStorage.getItem('exercises')) || [];
let workouts = JSON.parse(localStorage.getItem('workouts')) || [];
let currentExercise = null;

// View management
function showView(viewId) {
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    document.getElementById(viewId).classList.add('active');
}

// Exercise management
function saveExercise() {
    const name = document.getElementById('exercise-name').value;
    const measurementType = document.getElementById('measurement-type').value;
    
    if (!name) {
        alert('Please enter an exercise name');
        return;
    }

    const exercise = {
        id: Date.now().toString(),
        name,
        measurementType,
        dateCreated: new Date().toISOString()
    };

    exercises.push(exercise);
    localStorage.setItem('exercises', JSON.stringify(exercises));
    
    document.getElementById('exercise-name').value = '';
    showView('exercise-list-view');
    renderExercises();
}

function deleteExercise(event, exerciseId) {
    event.stopPropagation();
    const button = event.target;
    
    if (!button.classList.contains('confirming')) {
        // First click
        button.classList.add('confirming');
        button.textContent = 'Tap to confirm';
        
        // Reset after 3 seconds
        setTimeout(() => {
            button.classList.remove('confirming');
            button.textContent = 'Delete';
        }, 3000);
    } else {
        // Second click - confirm delete
        exercises = exercises.filter(ex => ex.id !== exerciseId);
        workouts = workouts.filter(w => w.exerciseId !== exerciseId);
        localStorage.setItem('exercises', JSON.stringify(exercises));
        localStorage.setItem('workouts', JSON.stringify(workouts));
        renderExercises();
    }
}

function selectExercise(exercise) {
    currentExercise = exercise;
    document.getElementById('current-exercise-name').textContent = exercise.name;
    resetSets();
    renderWorkoutHistory(exercise.id);
    showView('exercise-detail-view');
}

// Get appropriate intensity options based on measurement type
function getIntensityOptions(measurementType) {
    if (measurementType === 'reps') {
        return `
            <option value="speed-drop">Rep Speed Slowing</option>
            <option value="form-change">Form Starting to Change</option>
            <option value="failure">Cannot Complete Rep</option>
        `;
    } else {
        return `
            <option value="stable">Position Stable</option>
            <option value="shaking">Position Shaking</option>
            <option value="failure">Cannot Hold Position</option>
        `;
    }
}

// Workout management
function addSet() {
    const setsDiv = document.getElementById('sets');
    const newSet = document.createElement('div');
    newSet.className = 'set-input';
    newSet.innerHTML = `
        <input type="number" placeholder="Amount" min="0">
        <select class="intensity-select">
            ${getIntensityOptions(currentExercise.measurementType)}
        </select>
        <button class="remove-set" onclick="removeSet(this)">×</button>
    `;
    setsDiv.appendChild(newSet);
}

function removeSet(button) {
    button.parentElement.remove();
}

function showNotification(message, type = 'info') {
    // Remove any existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create new notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Insert at the top of the sets container
    const setsContainer = document.querySelector('.sets-container');
    setsContainer.insertBefore(notification, setsContainer.firstChild);
    
    // Trigger animation
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function saveWorkout() {
    if (!currentExercise) return;

    const setInputs = document.querySelectorAll('.set-input');
    const validSets = Array.from(setInputs)
        .map(setInput => ({
            amount: parseInt(setInput.querySelector('input').value) || 0,
            intensity: setInput.querySelector('select').value
        }))
        .filter(set => set.amount > 0); // Only include sets with valid amounts

    if (validSets.length === 0) {
        showNotification('Please add at least one set with a valid amount', 'error');
        return;
    }

    const workout = {
        exerciseId: currentExercise.id,
        sets: validSets,
        date: new Date().toISOString()
    };

    workouts.unshift(workout);
    localStorage.setItem('workouts', JSON.stringify(workouts));
    
    resetSets();
    renderWorkoutHistory(currentExercise.id);
    showNotification('Workout saved successfully');
}

function resetSets() {
    const setsDiv = document.getElementById('sets');
    setsDiv.innerHTML = `
        <div class="set-input">
            <input type="number" placeholder="Amount" min="0">
            <select class="intensity-select">
                ${getIntensityOptions(currentExercise.measurementType)}
            </select>
            <button class="remove-set" onclick="removeSet(this)">×</button>
        </div>
    `;
}

function getIntensityLabel(intensity, measurementType) {
    const labels = {
        'reps': {
            'speed-drop': 'Rep Speed Slowing',
            'form-change': 'Form Starting to Change',
            'failure': 'Cannot Complete Rep'
        },
        'seconds': {
            'stable': 'Position Stable',
            'shaking': 'Position Shaking',
            'failure': 'Cannot Hold Position'
        }
    };
    return labels[measurementType][intensity] || intensity;
}

function analyzeSetDropoffs(workouts) {
    const analysis = {
        'speed-drop': { dropoffs: [], subsequentSets: [] },
        'form-change': { dropoffs: [], subsequentSets: [] },
        'failure': { dropoffs: [], subsequentSets: [] }
    };

    workouts.forEach(workout => {
        for (let i = 0; i < workout.sets.length - 1; i++) {
            const currentSet = workout.sets[i];
            const nextSet = workout.sets[i + 1];
            const dropoff = ((currentSet.amount - nextSet.amount) / currentSet.amount) * 100;
            const remainingSets = workout.sets.length - (i + 1);
            
            analysis[currentSet.intensity].dropoffs.push(dropoff);
            analysis[currentSet.intensity].subsequentSets.push(remainingSets);
        }
    });

    // Calculate averages
    const results = {};
    Object.keys(analysis).forEach(intensity => {
        const { dropoffs, subsequentSets } = analysis[intensity];
        if (dropoffs.length > 0) {
            results[intensity] = {
                avgDropoff: dropoffs.reduce((a, b) => a + b, 0) / dropoffs.length,
                avgSubsequentSets: subsequentSets.reduce((a, b) => a + b, 0) / subsequentSets.length
            };
        }
    });

    return results;
}

function renderWorkoutHistory(exerciseId) {
    const container = document.getElementById('workout-history');
    const exerciseWorkouts = workouts
        .filter(workout => workout.exerciseId === exerciseId)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    // Analyze patterns
    const analysis = analyzeSetDropoffs(exerciseWorkouts);
    
    // Create analysis HTML
    const analysisHtml = Object.keys(analysis).length ? `
        <div class="card" style="margin-bottom: 20px;">
            <h3 style="margin-bottom: 10px;">Performance Analysis</h3>
            ${Object.entries(analysis).map(([intensity, stats]) => `
                <div style="margin-bottom: 8px;">
                    <strong>${getIntensityLabel(intensity, currentExercise.measurementType)}:</strong>
                    <ul style="margin-top: 4px; padding-left: 20px;">
                        <li>Average drop in next set: ${stats.avgDropoff.toFixed(1)}%</li>
                        <li>Average remaining sets: ${stats.avgSubsequentSets.toFixed(1)}</li>
                    </ul>
                </div>
            `).join('')}
        </div>
    ` : '';

    // Render history with analysis
    container.innerHTML = analysisHtml + (exerciseWorkouts.map(workout => `
        <div class="history-item">
            <div class="history-date">
                ${new Date(workout.date).toLocaleDateString()} 
                ${new Date(workout.date).toLocaleTimeString()}
            </div>
            <div class="history-sets">
                ${workout.sets.map(set => `
                    <div class="set-display">
                        <span>${set.amount} ${currentExercise.measurementType}</span>
                        <span>(${getIntensityLabel(set.intensity, currentExercise.measurementType)})</span>
                    </div>
                `).join('')}
                <div style="margin-top: 5px">
                    Total: ${workout.sets.reduce((sum, set) => sum + set.amount, 0)} ${currentExercise.measurementType}
                </div>
            </div>
        </div>
    `).join('') || '<div class="card">No workout history yet</div>');
}

function renderExercises() {
    const container = document.getElementById('exercise-list');
    container.innerHTML = exercises.map(exercise => {
        const exerciseWorkouts = workouts.filter(w => w.exerciseId === exercise.id);
        const lastWorkout = exerciseWorkouts[0];
        
        return `
            <div class="exercise-item">
                <div class="exercise-info">
                    <div class="exercise-name">${exercise.name}</div>
                    <div class="exercise-details">
                        Measurement: ${exercise.measurementType === 'seconds' ? 'Static Hold (seconds)' : 'Reps'}<br>
                        ${lastWorkout ? 
                            `Last workout: ${new Date(lastWorkout.date).toLocaleDateString()}` : 
                            'No workouts yet'
                        }
                    </div>
                </div>
                <div class="exercise-buttons">
                    <button class="begin-button" onclick='selectExercise(${JSON.stringify(exercise).replace(/'/g, "&apos;")})'>Begin</button>
                    <button class="delete-button" onclick="deleteExercise(event, '${exercise.id}')">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

// Initial render
renderExercises();