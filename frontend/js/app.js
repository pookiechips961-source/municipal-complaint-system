const API_URL = 'http://localhost:8080/api/complaints';

    function esc(v) {
        return String(v ?? '').replace(/[&<>"']/g, ch =>
            ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
    }

    function safeImg(src) {
        return /^(data:image\/|https?:\/\/)/i.test(src || '') ? esc(src) : '';
    }

    async function renderFeed() {
        const feedContainer = document.getElementById('feedList');
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error();
            const complaints = await response.json();

            feedContainer.innerHTML = '';

            if (complaints.length === 0) {
                feedContainer.innerHTML = '<div class="card"><p>No complaints submitted yet.</p></div>';
                return;
            }

            complaints.forEach((item) => {
                const card = document.createElement('article');
                card.className = 'card';

                const img = safeImg(item.imageData);
                const imageHTML = img ? `<img src="${img}" alt="Complaint Image" class="complaint-img">` : '';

                card.innerHTML = `
                    <h3>${esc(item.title)}</h3>
                    <div class="meta-tag">Category: ${esc(item.category)}</div>
                    <p>${esc(item.description)}</p>
                    <div class="location-tag">📍 Lat: ${esc(item.latitude)}, Long: ${esc(item.longitude)}</div>
                    ${imageHTML}
                    <div>
                        <button type="button" class="btn-vote" onclick="vote(${item.id}, 'up')">▲ Upvote (${item.upvotes || 0})</button>
                        <button type="button" class="btn-vote" onclick="vote(${item.id}, 'down')">▼ Downvote (${item.downvotes || 0})</button>
                    </div>
                `;

                feedContainer.appendChild(card);
            });
        } catch (err) {
            feedContainer.innerHTML = '<div class="card"><p style="color: red;">Error connecting to backend server.</p></div>';
        }
    }

    async function vote(id, type) {
    let votedList = JSON.parse(localStorage.getItem('voted_complaints')) || [];

    if (votedList.includes(id)) {
        alert("You have already voted on this complaint!");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${id}/vote?type=${type}`, {
            method: 'PATCH'
        });
        
        if (!response.ok) throw new Error('Voting failed');

        votedList.push(id);
        localStorage.setItem('voted_complaints', JSON.stringify(votedList));

        renderFeed();
    } catch (err) {
        console.error("Error voting:", err);
        alert("Could not register vote.");
    }
}

    window.onload = renderFeed;