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
    if (confirm('Are you sure you want to delete this exercise?')) {
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
            <option value="speed-drop">Bar Speed Slowing</option>
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

function saveWorkout() {
    if (!currentExercise) return;

    const setInputs = document.querySelectorAll('.set-input');
    const sets = Array.from(setInputs).map(setInput => ({
        amount: parseInt(setInput.querySelector('input').value) || 0,
        intensity: setInput.querySelector('select').value
    }));
    
    if (sets.some(set => set.amount <= 0)) {
        alert('Please enter valid numbers for all sets');
        return;
    }

    const workout = {
        exerciseId: currentExercise.id,
        sets,
        date: new Date().toISOString()
    };

    workouts.unshift(workout);
    localStorage.setItem('workouts', JSON.stringify(workouts));
    
    resetSets();
    renderWorkoutHistory(currentExercise.id);
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
            'speed-drop': 'Bar Speed Slowing',
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

function renderWorkoutHistory(exerciseId) {
    const container = document.getElementById('workout-history');
    const exerciseWorkouts = workouts
        .filter(workout => workout.exerciseId === exerciseId)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    container.innerHTML = exerciseWorkouts.map(workout => `
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
    `).join('') || '<div class="card">No workout history yet</div>';
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