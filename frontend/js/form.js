const API_URL = 'http://localhost:8080/api/complaints';

function fetchCurrentLocation() {
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        return;
    }

    const btn = document.getElementById('btnLocation');
    btn.textContent = "📍 Detecting location...";
    btn.disabled = true;

    navigator.geolocation.getCurrentPosition(
        (position) => {
            document.getElementById('latitude').value = position.coords.latitude.toFixed(6);
            document.getElementById('longitude').value = position.coords.longitude.toFixed(6);
            btn.textContent = "📍 Location Captured Successfully";
            btn.style.backgroundColor = "#2a9d8f";
            btn.style.color = "#ffffff";
            setTimeout(() => {
                btn.textContent = "📍 Use Current GPS Location";
                btn.disabled = false;
            }, 3000);
        },
        (error) => {
            alert("Unable to retrieve your location. Please check browser permissions or enter manually.");
            btn.textContent = "📍 Use Current GPS Location";
            btn.disabled = false;
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

async function handleFormSubmit(event) {
    event.preventDefault();

    const title = document.getElementById('title').value;
    const category = document.getElementById('category').value;
    const description = document.getElementById('description').value;
    const latitude = parseFloat(document.getElementById('latitude').value);
    const longitude = parseFloat(document.getElementById('longitude').value);
    const fileInput = document.getElementById('imageData');

    let base64Image = "";
    if (fileInput.files.length > 0) {
        try {
            base64Image = await fileToBase64(fileInput.files[0]);
        } catch (error) {
            alert("Error processing image file.");
            return;
        }
    }

    const newComplaintPayload = {
        title: title,
        category: category,
        description: description,
        latitude: latitude,
        longitude: longitude,
        imageData: base64Image,
        upvotes: 0,
        downvotes: 0
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newComplaintPayload)
        });

        if (!response.ok) throw new Error('Submission failed');

        alert("Complaint submitted successfully!");
        window.location.href = "index.html";
    } catch (err) {
        alert("Error submitting complaint to server: " + err.message);
    }
}