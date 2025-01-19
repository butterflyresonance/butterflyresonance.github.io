// Global state
let exercises = JSON.parse(localStorage.getItem('exercises')) || [];
let workouts = JSON.parse(localStorage.getItem('workouts')) || [];
let currentExercise = null;

// Constants for strength analysis
const MAX_RELIABLE_REPS = 12;
const MIN_GRADIENT_SAMPLES = 3;
const MIN_WEIGHT_DIFF = 2.5;
const MIN_VALID_WEIGHT = 1;
const HIGH_REP_ADJUSTMENT = 0.75;
const MAX_HIGH_REP_ESTIMATE = 30;
const FATIGUE_FACTOR = 0.92;

// Relative intensity table for high-rep estimation
const RELATIVE_INTENSITY = {
    1: 1.00, 2: 0.95, 3: 0.93, 4: 0.90, 5: 0.87,
    6: 0.85, 7: 0.83, 8: 0.80, 9: 0.77, 10: 0.75,
    11: 0.72, 12: 0.70, 13: 0.67, 14: 0.65, 15: 0.63,
    16: 0.61, 17: 0.59, 18: 0.57, 19: 0.55, 20: 0.53,
    25: 0.48, 30: 0.43
};

// 1RM Estimation Functions
function brzycki1RM(weight, reps) {
    return weight * (36 / (37 - reps));
}

function epley1RM(weight, reps) {
    return weight * (1 + 0.0333 * reps);
}

function lombardi1RM(weight, reps) {
    return weight * Math.pow(reps, 0.1);
}

function relativeIntensity1RM(weight, reps) {
    const repSchemes = Object.keys(RELATIVE_INTENSITY).map(Number);
    const closestReps = repSchemes.reduce((prev, curr) => {
        return Math.abs(curr - reps) < Math.abs(prev - reps) ? curr : prev;
    });
    
    const intensity = RELATIVE_INTENSITY[closestReps];
    return weight / intensity;
}

function estimate1RM(weight, reps, isBodyweightExercise = false) {
    if (weight < MIN_VALID_WEIGHT || reps <= 0) return null;
    if (reps === 1) return weight;
    
    if (reps > MAX_RELIABLE_REPS) {
        if (reps > MAX_HIGH_REP_ESTIMATE) return null;
        
        if (isBodyweightExercise) {
            const baseEstimate = relativeIntensity1RM(weight, reps);
            return baseEstimate * Math.pow(FATIGUE_FACTOR, Math.floor((reps - MAX_RELIABLE_REPS) / 5));
        }
        return null;
    }
    
    const estimates = [
        brzycki1RM(weight, reps),
        epley1RM(weight, reps),
        lombardi1RM(weight, reps)
    ];
    
    return estimates.reduce((sum, est) => sum + est, 0) / estimates.length;
}

// Weight parsing and analysis functions
function parseWeight(weightStr, bodyweight) {
    if (typeof weightStr === 'number') {
        return weightStr >= MIN_VALID_WEIGHT ? weightStr : null;
    }
    
    if (!weightStr || typeof weightStr !== 'string') {
        return null;
    }
    
    weightStr = weightStr.trim();
    
    if (weightStr === 'BW') {
        return bodyweight >= MIN_VALID_WEIGHT ? bodyweight : null;
    }
    
    const bwPlusMatch = weightStr.match(/^BW\+(\d+(\.\d+)?)$/);
    if (bwPlusMatch) {
        const additional = parseFloat(bwPlusMatch[1]);
        return bodyweight + additional;
    }
    
    const parsed = parseFloat(weightStr);
    return !isNaN(parsed) && parsed >= MIN_VALID_WEIGHT ? parsed : null;
}

function calculateGradient(point1, point2) {
    const weightDiff = point2.weight - point1.weight;
    if (weightDiff < MIN_WEIGHT_DIFF) return 0;
    
    const estimateDiff = point2.estimate - point1.estimate;
    return estimateDiff / weightDiff;
}

function findLocalMaxima(points) {
    if (points.length < 2) return points;
    
    return points.filter((point, i) => {
        const prev = points[i - 1];
        const next = points[i + 1];
        
        const prevDiff = !prev ? Infinity : point.estimate - prev.estimate;
        const nextDiff = !next ? Infinity : point.estimate - next.estimate;
        
        return prevDiff > 0 && nextDiff > 0;
    });
}

// Main strength analysis function
function analyzeStrengthProfile(sets, bodyweight = 70) {
    if (!Array.isArray(sets) || sets.length === 0) return null;
    if (bodyweight < MIN_VALID_WEIGHT) bodyweight = 70;

    // Process sets chronologically
    const weightMap = new Map();
    sets.forEach(set => {
        const key = set.weight.toString();
        if (!weightMap.has(key) || 
            new Date(set.date) > new Date(weightMap.get(key).date)) {
            weightMap.set(key, set);
        }
    });
    const uniqueSets = Array.from(weightMap.values());

    const validSets = uniqueSets
        .map(set => {
            const isBodyweightExercise = 
                String(set.weight).startsWith('BW') || 
                parseWeight(set.weight, bodyweight) === bodyweight;
            
            return {
                ...set,
                actualWeight: parseWeight(set.weight, bodyweight),
                isBodyweightExercise
            };
        })
        .filter(set => set.actualWeight !== null && set.amount > 0);

    if (validSets.length === 0) return null;

    const estimates = validSets
        .map(set => ({
            weight: set.actualWeight,
            displayWeight: set.weight,
            reps: set.amount,
            estimate: estimate1RM(
                set.actualWeight, 
                set.amount, 
                set.isBodyweightExercise
            ),
            date: set.date
        }))
        .filter(est => est.estimate !== null);

    if (estimates.length === 0) return null;

    const byWeight = {};
    estimates.forEach(est => {
        const key = Math.round(est.weight * 2) / 2;
        if (!byWeight[key] || new Date(est.date) > new Date(byWeight[key].date)) {
            byWeight[key] = est;
        }
    });

    const weightAnalysis = Object.values(byWeight)
        .map(est => ({
            weight: est.weight,
            displayWeight: est.displayWeight,
            avgEstimate: est.estimate,
            repRange: {
                current: est.reps
            },
            lastUpdated: est.date
        }))
        .sort((a, b) => a.weight - b.weight);

    const bestEstimate = estimates.reduce((best, current) => 
        current.estimate > best.estimate ? current : best
    );

    let gradientAnalysis = null;
    if (weightAnalysis.length >= MIN_GRADIENT_SAMPLES) {
        const points = weightAnalysis.map(wa => ({
            weight: wa.weight,
            estimate: wa.avgEstimate
        }));

        const gradients = [];
        for (let i = 0; i < points.length - 1; i++) {
            const gradient = calculateGradient(points[i], points[i + 1]);
            if (gradient !== 0) {
                gradients.push({
                    startWeight: points[i].weight,
                    endWeight: points[i + 1].weight,
                    gradient
                });
            }
        }

        const maxima = findLocalMaxima(points);
        const recommendations = [];

        gradients.forEach((g, i) => {
            if (g.gradient > 0 && (i === 0 || gradients[i - 1].gradient < g.gradient)) {
                const suggestedWeight = Math.round((g.startWeight + g.endWeight) / 2 * 2) / 2;
                recommendations.push({
                    weight: suggestedWeight,
                    reason: `Increasing strength gains between ${g.startWeight}kg and ${g.endWeight}kg`
                });
            }
        });

        maxima.forEach(m => {
            const nearestLower = weightAnalysis.find(wa => wa.weight < m.weight);
            const nearestHigher = weightAnalysis.find(wa => wa.weight > m.weight);
            
            if (nearestLower && (m.weight - nearestLower.weight) > MIN_WEIGHT_DIFF) {
                const suggestedWeight = Math.round((nearestLower.weight + m.weight) / 2 * 2) / 2;
                recommendations.push({
                    weight: suggestedWeight,
                    reason: `Explore strength potential between ${nearestLower.weight}kg and ${m.weight}kg`
                });
            }
            
            if (nearestHigher && (nearestHigher.weight - m.weight) > MIN_WEIGHT_DIFF) {
                const suggestedWeight = Math.round((m.weight + nearestHigher.weight) / 2 * 2) / 2;
                recommendations.push({
                    weight: suggestedWeight,
                    reason: `Explore strength potential between ${m.weight}kg and ${nearestHigher.weight}kg`
                });
            }
        });

        gradientAnalysis = {
            gradients,
            maxima: maxima.map(m => ({
                weight: m.weight,
                estimate: m.estimate
            })),
            recommendations: recommendations.sort((a, b) => a.weight - b.weight)
        };
    }

    return {
        bestSet: {
            weight: bestEstimate.displayWeight,
            actualWeight: bestEstimate.weight,
            reps: bestEstimate.reps,
            estimated1RM: bestEstimate.estimate,
            date: bestEstimate.date
        },
        weightAnalysis,
        gradientAnalysis,
        analysisType: validSets[0].isBodyweightExercise ? 'bodyweight' : 'standard'
    };
}

// UI Functions
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
    
    if (button.classList.contains('plus')) {
        button.classList.remove('active', 'plus');
        weightInput.removeAttribute('disabled');
        weightInput.value = '';
    } else if (button.classList.contains('active')) {
        button.classList.add('plus');
        weightInput.removeAttribute('disabled');
        weightInput.value = 'BW+';
        weightInput.focus();
    } else {
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

function displayStrengthAnalysis(strengthProfile) {
if (!strengthProfile) return '';

const isBW = strengthProfile.analysisType === 'bodyweight';
const formatWeight = (w) => {
    if (typeof w === 'string' && w.startsWith('BW')) {
        return w;
    }
    return `${w}kg`;
};

const template = document.getElementById('strength-analysis-template');
const container = template.content.cloneNode(true);

const bestSetElem = container.querySelector('.best-set');
bestSetElem.textContent = 
    `Your highest estimated 1RM: ${strengthProfile.bestSet.estimated1RM.toFixed(1)}kg ` +
    `(${formatWeight(strengthProfile.bestSet.weight)} × ${strengthProfile.bestSet.reps} reps)`;

const weightAnalysisElem = container.querySelector('.weight-analysis');
strengthProfile.weightAnalysis.forEach(wa => {
    const item = document.createElement('div');
    item.className = 'weight-item';
    item.innerHTML = 
        `<strong>${formatWeight(wa.displayWeight)}</strong> ` +
        `Est. 1RM: ${wa.avgEstimate.toFixed(1)}kg ` +
        `(${wa.repRange.current} reps)`;
    weightAnalysisElem.appendChild(item);
});

const recommendationsSection = container.querySelector('.recommendations-section');
if (strengthProfile.gradientAnalysis?.recommendations?.length) {
    const recommendationsElem = container.querySelector('.recommendations');
    strengthProfile.gradientAnalysis.recommendations.forEach(rec => {
        const item = document.createElement('div');
        item.className = 'recommendation-item';
        item.innerHTML = 
            `Try: ${formatWeight(rec.weight)} ` +
            `<span class="reason">${rec.reason}</span>`;
        recommendationsElem.appendChild(item);
    });
} else {
    recommendationsSection.remove();
}

return container;
}

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

function renderWorkoutHistory(exerciseId) {
const container = document.getElementById('workout-history');
const exerciseWorkouts = workouts
    .filter(workout => workout.exerciseId === exerciseId)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

container.innerHTML = '';

if (currentExercise.requiresWeight) {
    const allSets = exerciseWorkouts.reduce((sets, workout) => {
        return sets.concat(workout.sets.map(set => ({
            ...set,
            date: workout.date
        })));
    }, []);
    const strengthProfile = analyzeStrengthProfile(allSets, currentExercise.bodyweight);
    if (strengthProfile) {
        container.appendChild(displayStrengthAnalysis(strengthProfile));
    }
}

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
                        `<span>${set.weight === 'BW' ? 'Bodyweight' : 
                            set.weight.startsWith('BW+') ? set.weight : set.weight + ' kg'}</span>` : 
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

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
document.getElementById('requires-weight').addEventListener('change', (e) => {
    document.querySelector('.bodyweight-input').style.display = 
        e.target.checked ? 'block' : 'none';
});

renderExercises();
});