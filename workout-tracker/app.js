// KEEP: Data structures - These should be at the top of the file
let exercises = JSON.parse(localStorage.getItem('exercises')) || [];
let workouts = JSON.parse(localStorage.getItem('workouts')) || [];
let currentExercise = null;

// KEEP: Constants
const MAX_RELIABLE_REPS = 12;
const MIN_GRADIENT_SAMPLES = 3;

// KEEP: 1RM Estimation Formulas
function brzycki1RM(weight, reps) {
    return weight * (36 / (37 - reps));
}

function epley1RM(weight, reps) {
    return weight * (1 + 0.0333 * reps);
}

function lombardi1RM(weight, reps) {
    return weight * Math.pow(reps, 0.1);
}

// KEEP: Core strength analysis functions
function estimate1RM(weight, reps) {
    if (reps > MAX_RELIABLE_REPS) return null;
    if (reps <= 1) return weight;
    
    const estimates = [
        brzycki1RM(weight, reps),
        epley1RM(weight, reps),
        lombardi1RM(weight, reps)
    ];
    
    return estimates.reduce((sum, est) => sum + est, 0) / estimates.length;
}

function parseWeight(weightStr, bodyweight) {
    if (typeof weightStr === 'number') return weightStr;
    if (weightStr === 'BW') return bodyweight;
    
    const bwPlusMatch = String(weightStr).match(/^BW\+(\d+(\.\d+)?)$/);
    if (bwPlusMatch) {
        return bodyweight + parseFloat(bwPlusMatch[1]);
    }
    
    return parseFloat(weightStr) || 0;
}

function calculateGradient(point1, point2) {
    const weightDiff = point2.weight - point1.weight;
    const estimateDiff = point2.estimate - point1.estimate;
    return weightDiff !== 0 ? estimateDiff / weightDiff : 0;
}

function findLocalMaxima(points) {
    return points.filter((point, i) => {
        const prev = points[i - 1];
        const next = points[i + 1];
        return (!prev || point.estimate >= prev.estimate) && 
               (!next || point.estimate >= next.estimate);
    });
}

// KEEP: View management
function showView(viewId) {
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    document.getElementById(viewId).classList.add('active');
    
    if (viewId === 'exercise-form-view') {
        document.querySelector('.bodyweight-input').style.display = 
            document.getElementById('requires-weight').checked ? 'block' : 'none';
    }
}

// KEEP: Exercise management
function saveExercise() {
    const name = document.getElementById('exercise-name').value;
    const measurementType = document.getElementById('measurement-type').value;
    const requiresWeight = document.getElementById('requires-weight').checked;
    const bodyweight = requiresWeight ? 
        parseFloat(document.getElementById('bodyweight').value) || 70 : null;
    
    if (!name) {
        alert('Please enter an exercise name');
        return;
    }

    const exercise = {
        id: Date.now().toString(),
        name,
        measurementType,
        requiresWeight,
        bodyweight,
        dateCreated: new Date().toISOString()
    };

    exercises.push(exercise);
    localStorage.setItem('exercises', JSON.stringify(exercises));
    
    document.getElementById('exercise-name').value = '';
    document.getElementById('requires-weight').checked = false;
    document.getElementById('bodyweight').value = '';
    document.querySelector('.bodyweight-input').style.display = 'none';
    
    showView('exercise-list-view');
    renderExercises();
}

function deleteExercise(event, exerciseId) {
    event.stopPropagation();
    const button = event.target;
    
    if (!button.classList.contains('confirming')) {
        button.classList.add('confirming');
        button.textContent = 'Tap to confirm';
        
        setTimeout(() => {
            button.classList.remove('confirming');
            button.textContent = 'Delete';
        }, 3000);
    } else {
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

// KEEP: UI Interaction Functions
function addSet() {
    const setsDiv = document.getElementById('sets');
    const template = document.getElementById('set-input-template');
    const newSet = template.content.cloneNode(true);
    
    const weightInputGroup = newSet.querySelector('.weight-input-group');
    if (!currentExercise.requiresWeight) {
        weightInputGroup.remove();
    }
    
    setsDiv.appendChild(newSet);
    initializeWeightInputs();
}

function toggleBodyweight(button) {
    const weightInput = button.previousElementSibling;
    
    // Cycle through states: normal -> BW -> BW+ -> normal
    if (button.classList.contains('plus')) {
        // Reset to normal
        button.classList.remove('active', 'plus');
        weightInput.removeAttribute('disabled');
        weightInput.value = '';
    } else if (button.classList.contains('active')) {
        // Switch to BW+
        button.classList.add('plus');
        weightInput.removeAttribute('disabled');
        weightInput.value = 'BW+';
        weightInput.focus();
    } else {
        // Switch to BW
        button.classList.add('active');
        weightInput.setAttribute('disabled', 'disabled');
        weightInput.value = 'BW';
    }
}

function removeSet(button) {
    button.parentElement.remove();
}

function initializeWeightInputs() {
    document.querySelectorAll('.weight-amount').forEach(input => {
        input.addEventListener('input', (e) => {
            if (e.target.value.startsWith('BW+')) {
                const numericPart = e.target.value.substring(3);
                e.target.value = 'BW+' + numericPart.replace(/[^\d.,]/g, '');
            } else {
                let value = e.target.value.replace(/[^\d.,]/g, '');
                const decimalCount = (value.match(/[.,]/g) || []).length;
                if (decimalCount > 1) {
                    value = value.replace(/[.,]/g, (match, index) => 
                        index === value.indexOf('.') || index === value.indexOf(',') ? '.' : ''
                    );
                }
                e.target.value = value;
            }
        });
    });
}

function processWeightInput(weightInput) {
    const value = weightInput.value.trim();
    
    if (value.startsWith('BW+')) {
        const additionalWeight = parseFloat(value.replace('BW+', '')) || 0;
        return additionalWeight > 0 ? `BW+${additionalWeight}` : 'BW';
    }
    
    return value === 'BW' ? 'BW' : (parseFloat(value) || 0);
}

function saveWorkout() {
    if (!currentExercise) return;

    const setInputs = document.querySelectorAll('.set-input');
    const validSets = Array.from(setInputs)
        .map(setInput => {
            const set = {
                amount: parseInt(setInput.querySelector('input[placeholder="Amount"]').value) || 0
            };

            if (currentExercise.requiresWeight) {
                const weightInput = setInput.querySelector('.weight-amount');
                set.weight = processWeightInput(weightInput);
            }

            return set;
        })
        .filter(set => {
            if (!set.amount > 0) return false;
            if (!currentExercise.requiresWeight) return true;
            
            if (typeof set.weight === 'string') {
                return set.weight === 'BW' || set.weight.startsWith('BW+');
            }
            return set.weight > 0;
        });

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
    setsDiv.innerHTML = '';
    addSet();
}

function showNotification(message, type = 'info') {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    const setsContainer = document.querySelector('.sets-container');
    setsContainer.insertBefore(notification, setsContainer.firstChild);
    
    setTimeout(() => notification.classList.add('show'), 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// KEEP: Exercise list rendering
function renderExercises() {
    const container = document.getElementById('exercise-list');
    container.innerHTML = exercises.length ? exercises.map(exercise => {
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
    }).join('') : '<div class="card">No exercises added yet</div>';
}

function analyzeStrengthProfile(sets, bodyweight = 70) {
    const validSets = sets.filter(set => 
        set.amount > 0 && 
        set.amount <= MAX_RELIABLE_REPS
    ).map(set => ({
        ...set,
        actualWeight: parseWeight(set.weight, bodyweight)
    }));

    if (validSets.length === 0) return null;

    const estimates = validSets.map(set => ({
        weight: set.actualWeight,
        displayWeight: set.weight,
        reps: set.amount,
        estimate: estimate1RM(set.actualWeight, set.amount)
    })).filter(est => est.estimate !== null);

    if (estimates.length === 0) return null;

    const bestEstimate = estimates.reduce((best, current) => 
        current.estimate > best.estimate ? current : best
    );

    const byWeight = {};
    estimates.forEach(est => {
        if (!byWeight[est.weight]) byWeight[est.weight] = [];
        byWeight[est.weight].push(est);
    });

    const weightAnalysis = Object.entries(byWeight).map(([weight, estimates]) => ({
        weight: parseFloat(weight),
        displayWeight: estimates[0].displayWeight,
        avgEstimate: estimates.reduce((sum, est) => sum + est.estimate, 0) / estimates.length,
        repRange: {
            min: Math.min(...estimates.map(est => est.reps)),
            max: Math.max(...estimates.map(est => est.reps))
        }
    })).sort((a, b) => a.weight - b.weight);

    let gradientAnalysis = null;
    if (weightAnalysis.length >= MIN_GRADIENT_SAMPLES) {
        const points = weightAnalysis.map(wa => ({
            weight: wa.weight,
            estimate: wa.avgEstimate
        }));

        const gradients = [];
        for (let i = 0; i < points.length - 1; i++) {
            gradients.push({
                startWeight: points[i].weight,
                endWeight: points[i + 1].weight,
                gradient: calculateGradient(points[i], points[i + 1])
            });
        }

        const maxima = findLocalMaxima(points);

        const recommendations = [];
        gradients.forEach((g, i) => {
            if (g.gradient > 0 && (i === 0 || gradients[i - 1].gradient < g.gradient)) {
                const suggestedWeight = (g.startWeight + g.endWeight) / 2;
                recommendations.push({
                    weight: suggestedWeight,
                    reason: `Increasing 1RM estimates between ${g.startWeight}kg and ${g.endWeight}kg`
                });
            }
        });

        gradientAnalysis = {
            gradients,
            maxima: maxima.map(m => ({
                weight: m.weight,
                estimate: m.estimate
            })),
            recommendations
        };
    }

    return {
        bestSet: {
            weight: bestEstimate.displayWeight,
            actualWeight: bestEstimate.weight,
            reps: bestEstimate.reps,
            estimated1RM: bestEstimate.estimate
        },
        weightAnalysis,
        gradientAnalysis
    };
}

function displayStrengthAnalysis(analysis) {
    if (!analysis) return '';

    const template = document.getElementById('strength-analysis-template');
    const container = template.content.cloneNode(true);
    
    const bestSetElem = container.querySelector('.best-set');
    bestSetElem.textContent = 
        `Your highest estimated 1RM: ${analysis.bestSet.estimated1RM.toFixed(1)}kg ` +
        `(${analysis.bestSet.weight} × ${analysis.bestSet.reps} reps)`;

    const weightAnalysisElem = container.querySelector('.weight-analysis');
    analysis.weightAnalysis.forEach(wa => {
        const item = document.createElement('div');
        item.className = 'weight-item';
        item.innerHTML = 
            `<strong>${wa.displayWeight}</strong> ` +
            `Est. 1RM: ${wa.avgEstimate.toFixed(1)}kg ` +
            `(${wa.repRange.min}-${wa.repRange.max} reps)`;
        weightAnalysisElem.appendChild(item);
    });

    const recommendationsSection = container.querySelector('.recommendations-section');
    if (analysis.gradientAnalysis?.recommendations?.length) {
        const recommendationsElem = container.querySelector('.recommendations');
        analysis.gradientAnalysis.recommendations.forEach(rec => {
            const item = document.createElement('div');
            item.className = 'recommendation-item';
            item.innerHTML = 
                `Try: ${rec.weight.toFixed(1)}kg ` +
                `<span class="reason">${rec.reason}</span>`;
            recommendationsElem.appendChild(item);
        });
    } else {
        recommendationsSection.remove();
    }

    return container;
}

function renderWorkoutHistory(exerciseId) {
    const container = document.getElementById('workout-history');
    const exerciseWorkouts = workouts
        .filter(workout => workout.exerciseId === exerciseId)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    // Clear existing content
    container.innerHTML = '';
    
    // Strength Analysis for weighted exercises
    if (currentExercise.requiresWeight) {
        const allSets = exerciseWorkouts.reduce((sets, workout) => 
            sets.concat(workout.sets), []);
        const strengthProfile = analyzeStrengthProfile(allSets, currentExercise.bodyweight);
        if (strengthProfile) {
            container.appendChild(displayStrengthAnalysis(strengthProfile));
        }
    }
    
    // Workout History
    exerciseWorkouts.forEach(workout => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
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
                    </div>
                `).join('')}
                <div class="total-stats">
                    Total: ${workout.sets.reduce((sum, set) => sum + set.amount, 0)} ${currentExercise.measurementType}
                </div>
            </div>
        `;
        container.appendChild(historyItem);
    });

    if (exerciseWorkouts.length === 0) {
        container.innerHTML = '<div class="card">No workout history yet</div>';
    }
}

// KEEP: Event Listeners and Initialization - This should be at the end of the file
document.addEventListener('DOMContentLoaded', () => {
    // Add event listener for requires-weight checkbox
    document.getElementById('requires-weight').addEventListener('change', (e) => {
        document.querySelector('.bodyweight-input').style.display = e.checked ? 'block' : 'none';
    });

    // Initial render
    renderExercises();
});