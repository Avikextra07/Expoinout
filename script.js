const scriptURL = "https://script.google.com/macros/s/AKfycbw5tLBbMlhooXD1q5wzYipKl1rEYkMRI3lEXpnKzZEWlGGGalUGiQTGg_zRSyiLQ_A/exec";
const form = document.forms["submit-to-google-sheet"];
const formContainer = document.querySelector(".form-container");
const accessDeniedContainer = document.getElementById("access-denied-container");
const loadingOverlay = document.getElementById("loader");
const REQUIRED_IP = "103.189.163.3"; 

/**
 * 1. Action Handler
 * Sets the hidden input value before form submission
 */
function setAction(type) {
    document.getElementById('action_type').value = type;
}

/**
 * 2. UI State Management
 */
function showForm() {
    formContainer.style.display = "block";
    accessDeniedContainer.style.display = "none";
}

function showAccessDenied() {
    formContainer.style.display = "none";
    accessDeniedContainer.style.display = "block";
}

document.addEventListener("DOMContentLoaded", () => {
    
    // --- IP Security Check ---
    fetch('https://api.ipify.org?format=json')
        .then(response => response.json())
        .then(data => {
            if (data.ip === REQUIRED_IP) {
                showForm();
            } else {
                showAccessDenied();
            }
        })
        .catch(error => {
            console.error('Security Check Error:', error);
            showAccessDenied(); 
        });

    // --- Form Submission Logic ---
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        loadingOverlay.style.display = "flex"; // Show loader

        const formData = new FormData(form);
        const actionRequested = document.getElementById('action_type').value;

        fetch(scriptURL, { method: "POST", body: formData })
            .then((response) => response.json())
            .then((data) => {
                loadingOverlay.style.display = "none"; // Hide loader
                
                if (data.result === "success") {
                    const isArrival = data.type === 'arrival';
                    
                    Swal.fire({
                        title: isArrival ? "Welcome!" : "See you soon!",
                        html: `
                            <div style="padding: 10px;">
                                <p style="font-weight: 600;">${isArrival ? 'Arrival' : 'Departure'} Recorded Successfully.</p>
                                <h2 style="color: #6366f1; font-weight: 800;">${data.time}</h2>
                                ${data.isLate ? '<p style="color: #ef4444; font-weight: bold;">Status: Late Entry</p>' : ''}
                                <hr>
                                <small class="text-muted">Design & Developed By Roaming IT</small>
                            </div>
                        `,
                        icon: "success",
                        confirmButtonColor: "#6366f1"
                    });
                    
                    form.reset(); 
                    loadSavedData(); // Refill name/email from storage
                } else if (data.result === "duplicate") {
                    Swal.fire({
                        title: "Notice",
                        text: data.message,
                        icon: "info",
                        confirmButtonColor: "#6366f1"
                    });
                } else {
                    Swal.fire("Error", data.message || "Something went wrong.", "error");
                }
            })
            .catch((error) => {
                loadingOverlay.style.display = "none";
                Swal.fire("Connection Error", "Please check your internet and try again.", "error");
            });
    });

    // --- Local Storage (Save/Autofill) Logic ---
    const saveButton = document.getElementById('save-details-btn');
    const autofillButton = document.getElementById('autofill-btn');

    function loadSavedData() {
        const saved = JSON.parse(localStorage.getItem('wf_user_details') || '{}');
        if (Object.keys(saved).length > 0) {
            if (document.getElementById('name')) document.getElementById('name').value = saved.name || '';
            if (document.getElementById('email')) document.getElementById('email').value = saved.email || '';
            if (document.getElementById('contact_number')) document.getElementById('contact_number').value = saved.contact_number || '';
            if (document.getElementById('ex')) document.getElementById('ex').checked = saved.confirmAccuracy || false;
        }
    }

    if (saveButton) {
        saveButton.addEventListener('click', () => {
            const payload = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                contact_number: document.getElementById('contact_number').value,
                confirmAccuracy: document.getElementById('ex').checked
            };
            localStorage.setItem('wf_user_details', JSON.stringify(payload));
            Swal.fire({
                title: 'Details Saved',
                text: 'Your info will be pre-filled on this device.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });
        });
    }

    if (autofillButton) {
        autofillButton.addEventListener('click', () => {
            loadSavedData();
            Swal.fire({
                title: 'Autofilled',
                icon: 'success',
                timer: 1000,
                showConfirmButton: false
            });
        });
    }

    // Prefill data immediately on page load
    loadSavedData();
});
