import sheetsService from './sheetsService.js';

// Utility functions for time handling
const formatTime = (date) => {
  return date.toLocaleTimeString('en-US', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit'
  });
};

const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

// Form element references
const form = document.getElementById('timesheet-form');
const timeInInput = document.getElementById('time-in');
const timeOutInput = document.getElementById('time-out');
const dateInput = document.getElementById('date');
const activityInput = document.getElementById('activity');
const workScopeInput = document.getElementById('work-scope');
const tagsInput = document.getElementById('tags-input');
const tagsList = document.getElementById('tags-list');
const tagsHidden = document.getElementById('tags');
const errorMessage = document.getElementById('error-message');
const submitButton = form.querySelector('button[type="submit"]');

// Tags management
const tags = new Set();

function updateHiddenTagsInput() {
  tagsHidden.value = Array.from(tags).join(';');
}

function addTag(tagText, select = true) {
  if (!tagText.trim() || tags.has(tagText)) return;

  if (select) {
    tags.add(tagText);
    const tagElement = document.createElement('div');
    tagElement.className = 'tag';
    // Create text node
    tagElement.appendChild(document.createTextNode(tagText));
    
    // Create button
    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.setAttribute('aria-label', 'Remove tag');
    removeButton.textContent = '×';
    tagElement.appendChild(removeButton);
    
    tagElement.querySelector('button').addEventListener('click', () => {
      tags.delete(tagText);
      tagElement.remove();
      updateHiddenTagsInput();
    });
    
    tagsList.appendChild(tagElement);
    tagsInput.value = '';
    updateHiddenTagsInput();
  }
}

async function storeTags() {
  const { savedTags = [] } = await browser.storage.local.get('savedTags');
  const newTags = Array.from(tags);
  const uniqueTags = Array.from(new Set([...savedTags, ...newTags]));
  await browser.storage.local.set({ savedTags: uniqueTags });
}

async function loadTags() {
  const { savedTags = [] } = await browser.storage.local.get('savedTags');
  const tagList = document.getElementById('tag-suggestions');
  savedTags.forEach(tag => {
    const option = document.createElement('option');
    option.value = tag;
    tagList.appendChild(option);
  });
}

// Handle Enter key consistently across form inputs
function handleEnterKey(event) {
  const isSubmitButton = event.target.type === 'submit';
  const isCtrlEnter = event.ctrlKey && event.key === 'Enter';
  
  // Allow Ctrl+Enter to submit form
  if (isCtrlEnter) return;
  
  // If it's Enter without Ctrl
  if (event.key === 'Enter') {
    event.preventDefault();
    
    // Special handling for activity input
    if (event.target === activityInput) {
      const scopeButtons = document.querySelector('.scope-buttons');
      scopeButtons.querySelector('button').focus();
      return;
    }
    
    // Special handling for work scope buttons
    if (event.target.closest('.scope-buttons')) {
      const activeButton = document.querySelector('.scope-buttons button.active');
      if (activeButton) {
        selectWorkScope(activeButton.dataset.scope);
        document.getElementById('prioritization').focus();
        return;
      }
    }
    
    // Special handling for tags input
    if (event.target === tagsInput && tagsInput.value.trim()) {
      addTag(tagsInput.value.trim());
      return;
    }
    
    // For all other inputs, move to next field
    moveToNextField(event.target);
  }
}

// Add Enter key handler to all form inputs
function setupEnterKeyHandling() {
  const inputs = form.querySelectorAll('input:not([type="hidden"]), button:not([aria-label])');
  inputs.forEach(input => {
    input.addEventListener('keydown', handleEnterKey);
  });
}

function selectWorkScope(scope) {
  workScopeInput.value = scope;
  document.querySelectorAll('.scope-buttons button').forEach(button => {
    button.classList.toggle('active', button.dataset.scope === scope);
  });
  
  // Make prioritization optional for Personal scope
  const prioritizationInput = document.getElementById('prioritization');
  prioritizationInput.required = scope !== 'Personal';
}

function setupWorkScopeButtons() {
  const buttons = document.querySelectorAll('.scope-buttons button');
  
  buttons.forEach(button => {
    button.addEventListener('click', () => {
      selectWorkScope(button.dataset.scope);
      document.getElementById('prioritization').focus();
    });
  });
}

// Work scope keyboard shortcuts
document.addEventListener('keydown', (event) => {
  const activeElement = document.activeElement;
  if (activeElement.tagName === 'INPUT' && 
      (activeElement.type === 'text' || activeElement.type === 'number')) {
    return;
  }
  
  const key = event.key.toLowerCase();
  if (['c', 'a', 'p'].includes(key)) {
    event.preventDefault(); // Prevent key from being entered in next field
    const scope = {
      'c': 'Core',
      'a': 'Adjacent',
      'p': 'Personal'
    }[key];
    
    selectWorkScope(scope);
    document.getElementById('prioritization').focus();
  }
});

// Time validation helper
function isValidTimeOrder(timeIn, timeOut) {
  const [inHours, inMinutes] = timeIn.split(':').map(Number);
  const [outHours, outMinutes] = timeOut.split(':').map(Number);
  
  if (outHours < inHours) return false;
  if (outHours === inHours && outMinutes <= inMinutes) return false;
  
  return true;
}

// Move to next field
function moveToNextField(currentElement) {
  const focusableElements = Array.from(form.querySelectorAll('input:not([type="hidden"]), button:not([aria-label])'));
  const currentIndex = focusableElements.indexOf(currentElement);
  if (currentIndex < focusableElements.length - 1) {
    focusableElements[currentIndex + 1].focus();
  }
}

// Time input shortcuts
function handleTimeShortcuts(event, input) {
  // Alt+N: Current time
  if (event.altKey && event.key === 'n') {
    event.preventDefault();
    input.value = formatTime(new Date());
    moveToNextField(input);
  }
  
  // Alt+L: Last clock-out time (only for time-in)
  if (input === timeInInput && event.altKey && event.key === 'l') {
    event.preventDefault();
    browser.storage.local.get('lastClockOut').then(({ lastClockOut }) => {
      if (lastClockOut) {
        input.value = lastClockOut;
        moveToNextField(input);
      }
    });
  }
}

// Add time shortcut handlers
timeInInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    handleEnterKey(e);
  } else {
    handleTimeShortcuts(e, timeInInput);
  }
});

timeOutInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    handleEnterKey(e);
  } else {
    handleTimeShortcuts(e, timeOutInput);
  }
});

// Handle form submission
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  
  // Only allow submission via Ctrl+Enter or clicking the submit button
  if (event.type === 'submit' && 
      event.submitter === null && 
      !(event.ctrlKey && event.key === 'Enter')) {
    return;
  }
  
  try {
    // Validate times
    const timeIn = timeInInput.value;
    const timeOut = timeOutInput.value;
    if (!isValidTimeOrder(timeIn, timeOut)) {
      throw new Error('Time Out must be after Time In');
    }

    // Collect form data
    const formData = {
      date: dateInput.value,
      timeIn,
      timeOut,
      activity: activityInput.value,
      workScope: workScopeInput.value,
      energy: document.getElementById('energy').value,
      engagement: document.getElementById('engagement').value,
      prioritization: document.getElementById('prioritization').value || 'N/A',
      tags: tagsHidden.value,
      notes: document.getElementById('notes').value
    };

    // Send to Google Sheets
    try {
      await sheetsService.appendRow(formData);
    } catch (error) {
      throw new Error(`Failed to save to spreadsheet: ${error.message}`);
    }

    // Store activity in recent activities if new
    const { recentActivities = [] } = await browser.storage.local.get('recentActivities');
    if (!recentActivities.includes(formData.activity)) {
      recentActivities.unshift(formData.activity);
      if (recentActivities.length > 10) recentActivities.pop(); // Keep last 10
      await browser.storage.local.set({ recentActivities });
    }

    // Store last clock out time
    await browser.storage.local.set({ lastClockOut: formData.timeOut });

    // Store tags
    await storeTags();

    // Close popup
    window.close();
  } catch (error) {
    errorMessage.textContent = error.message;
  }
});

// Global keyboard handler for Ctrl+Enter submission
document.addEventListener('keydown', (event) => {
  if (event.ctrlKey && event.key === 'Enter') {
    form.requestSubmit();
  }
});

// Initialize form
document.addEventListener('DOMContentLoaded', async () => {
  // Set current date
  dateInput.value = formatDate(new Date());
  
  // Focus time-in field and select any existing content
  timeInInput.focus();
  timeInInput.select();
  
  // Setup Enter key handling
  setupEnterKeyHandling();
  
  // Setup work scope buttons
  setupWorkScopeButtons();

  // Load recent activities
  const { recentActivities = [] } = await browser.storage.local.get('recentActivities');
  const recentActivitiesList = document.getElementById('recent-activities');
  recentActivities.forEach(activity => {
    const option = document.createElement('option');
    option.value = activity;
    recentActivitiesList.appendChild(option);
  });

  // Make work scope required
  workScopeInput.required = true;

  // Load saved tags as suggestions
  await loadTags();
});