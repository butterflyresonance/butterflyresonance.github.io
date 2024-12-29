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
    const requiresWeight = document.getElementById('requires-weight').checked;
    
    if (!name) {
        alert('Please enter an exercise name');
        return;
    }

    const exercise = {
        id: Date.now().toString(),
        name,
        measurementType,
        requiresWeight,
        dateCreated: new Date().toISOString()
    };

    exercises.push(exercise);
    localStorage.setItem('exercises', JSON.stringify(exercises));
    
    document.getElementById('exercise-name').value = '';
    document.getElementById('requires-weight').checked = false;
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
            <option value="difficult">Getting Difficult</option>
            <option value="approaching-failure">Approaching Failure</option>
            <option value="failure">Achieved Failure</option>
        `;
    } else {
        return `
            <option value="stable">Position Stable</option>
            <option value="shaking">Position Shaking</option>
            <option value="failure">Cannot Hold Position</option>
        `;
    }
}

function addSet() {
    const setsDiv = document.getElementById('sets');
    const newSet = document.createElement('div');
    newSet.className = 'set-input';
    
    let weightInput = '';
    if (currentExercise.requiresWeight) {
        weightInput = `
            <div class="weight-input-group">
                <input type="number" class="weight-amount" placeholder="Weight" min="0" step="0.5">
                <button class="bodyweight-toggle" onclick="toggleBodyweight(this)">BW</button>
            </div>
        `;
    }
    
    newSet.innerHTML = `
        ${weightInput}
        <input type="number" placeholder="Amount" min="0">
        <select class="intensity-select">
            ${getIntensityOptions(currentExercise.measurementType)}
        </select>
        <button class="remove-set" onclick="removeSet(this)">×</button>
    `;
    setsDiv.appendChild(newSet);
}

function toggleBodyweight(button) {
    const weightInput = button.previousElementSibling;
    if (button.classList.contains('active')) {
        // Switch back to weight input
        button.classList.remove('active');
        weightInput.removeAttribute('disabled');
        weightInput.value = '';
    } else {
        // Switch to bodyweight
        button.classList.add('active');
        weightInput.setAttribute('disabled', 'disabled');
        weightInput.value = 'BW';
    }
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
        .map(setInput => {
            const set = {
                amount: parseInt(setInput.querySelector('input[placeholder="Amount"]').value) || 0,
                intensity: setInput.querySelector('select').value
            };

            if (currentExercise.requiresWeight) {
                const weightInput = setInput.querySelector('.weight-amount');
                const bodyweightButton = setInput.querySelector('.bodyweight-toggle');
                set.weight = bodyweightButton.classList.contains('active') ? 'BW' : 
                    (parseFloat(weightInput.value) || 0);
            }

            return set;
        })
        .filter(set => set.amount > 0 && (!currentExercise.requiresWeight || set.weight === 'BW' || set.weight > 0));

    if (validSets.length === 0) {
        showNotification('Please add at least one set with valid amounts', 'error');
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
    let weightInput = '';
    if (currentExercise.requiresWeight) {
        weightInput = `
            <div class="weight-input-group">
                <input type="number" class="weight-amount" placeholder="Weight" min="0" step="0.5">
                <button class="bodyweight-toggle" onclick="toggleBodyweight(this)">BW</button>
            </div>
        `;
    }
    
    setsDiv.innerHTML = `
        <div class="set-input">
            ${weightInput}
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
            'difficult': 'Getting Difficult',
            'approaching-failure': 'Approaching Failure',
            'failure': 'Achieved Failure'
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
        'difficult': { dropoffs: [], subsequentSets: [] },
        'approaching-failure': { dropoffs: [], subsequentSets: [] },
        'failure': { dropoffs: [], subsequentSets: [] },
        'stable': { dropoffs: [], subsequentSets: [] },
        'shaking': { dropoffs: [], subsequentSets: [] }
    };

    workouts.forEach(workout => {
        for (let i = 0; i < workout.sets.length - 1; i++) {
            const currentSet = workout.sets[i];
            const nextSet = workout.sets[i + 1];
            const dropoff = ((currentSet.amount - nextSet.amount) / currentSet.amount) * 100;
            const remainingSets = workout.sets.length - (i + 1);
            
            if (analysis[currentSet.intensity]) {
                analysis[currentSet.intensity].dropoffs.push(dropoff);
                analysis[currentSet.intensity].subsequentSets.push(remainingSets);
            }
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

function calculateVolume(sets) {
    return sets.reduce((total, set) => {
        const weight = set.weight === 'BW' ? 0 : set.weight; // You might want to add actual bodyweight here
        return total + (weight * set.amount);
    }, 0);
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
        <div class="card">
            <h3>Performance Analysis</h3>
            ${Object.entries(analysis).map(([intensity, stats]) => `
                <div class="analysis-item">
                    <strong>${getIntensityLabel(intensity, currentExercise.measurementType)}:</strong>
                    <ul>
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
                        ${currentExercise.requiresWeight ? 
                            `<span>${set.weight === 'BW' ? 'Bodyweight' : set.weight + ' kg'}</span>` : 
                            ''
                        }
                        <span>${set.amount} ${currentExercise.measurementType}</span>
                        <span>(${getIntensityLabel(set.intensity, currentExercise.measurementType)})</span>
                    </div>
                `).join('')}
                <div class="total-stats">
                    Total: ${workout.sets.reduce((sum, set) => sum + set.amount, 0)} ${currentExercise.measurementType}
                    ${currentExercise.requiresWeight ? 
                        `| Volume: ${calculateVolume(workout.sets)} kg` : 
                        ''}
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
                        ${exercise.requiresWeight ? 'Tracks weight<br>' : ''}
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