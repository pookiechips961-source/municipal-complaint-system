const API_URL = 'http://localhost:8080/api/complaints';
  const map = L.map('map').setView([19.0760, 72.8777], 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
  const markersLayer = L.layerGroup().addTo(map);

  let allComplaints = [];
  let markerById = {};
  let activeId = null;

  const statusClass = s => ({ 'In Progress': 'progress', 'Resolved': 'resolved' }[s] || 'pending');
  const statusColor = s => ({ 'In Progress': '#f59e0b', 'Resolved': '#22c55e' }[s] || '#ef4444');

  function esc(v) {
    return String(v ?? '').replace(/[&<>"']/g, ch =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }
  function safeImg(src) {
    return /^(data:image\/|https?:\/\/)/i.test(src || '') ? esc(src) : '';
  }

  async function fetchComplaints() {
    const tbody = document.getElementById('complaintTableBody');
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error();
      allComplaints = await response.json();
      updateStats();
      updateCategoryOptions();
      render();
    } catch (err) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty err">Failed to load. Check backend connection.</td></tr>';
    }
  }

  function updateStats() {
    const count = cls => allComplaints.filter(c => statusClass(c.status) === cls).length;
    document.getElementById('sTotal').textContent = allComplaints.length;
    document.getElementById('sPending').textContent = count('pending');
    document.getElementById('sProgress').textContent = count('progress');
    document.getElementById('sResolved').textContent = count('resolved');
  }

  function updateCategoryOptions() {
    const sel = document.getElementById('categoryFilter');
    const current = sel.value;
    const cats = [...new Set(allComplaints.map(c => c.category).filter(Boolean))].sort();
    sel.innerHTML = '<option value="">All categories</option>' +
      cats.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
    sel.value = cats.includes(current) ? current : '';
  }

  function filtered() {
    const q = document.getElementById('search').value.trim().toLowerCase();
    const st = document.getElementById('statusFilter').value;
    const cat = document.getElementById('categoryFilter').value;
    return allComplaints.filter(c =>
      (!st || statusClass(c.status) === st) &&
      (!cat || c.category === cat) &&
      (!q || (c.title || '').toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q)));
  }

  function render() {
    const tbody = document.getElementById('complaintTableBody');
    const list = filtered();
    tbody.innerHTML = '';
    markersLayer.clearLayers();
    markerById = {};

    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="empty">No complaints found.</td></tr>`;
      return;
    }

    list.forEach(c => {
      const hasLoc = c.latitude != null && c.longitude != null;
      const img = safeImg(c.imageData);
      const tr = document.createElement('tr');
      tr.dataset.id = c.id;
      if (c.id === activeId) tr.classList.add('active');
      tr.innerHTML = `
        <td>${esc(c.id)}</td>
        <td>${img ? `<img src="${img}" class="img-thumb" alt="Evidence">` : '<span class="meta">None</span>'}</td>
        <td><strong>${esc(c.title)}</strong><br><span class="meta">${esc(c.category)}</span></td>
        <td><div class="desc">${esc(c.description)}</div></td>
        <td><span class="badge ${statusClass(c.status)}">${esc(c.status)}</span></td>
        <td><div class="actions">
          <button data-status="In Progress" ${c.status === 'In Progress' ? 'disabled' : ''}>Progress</button>
          <button data-status="Resolved" ${c.status === 'Resolved' ? 'disabled' : ''}>Resolve</button>
        </div></td>`;

      tr.querySelectorAll('button').forEach(b =>
        b.addEventListener('click', e => { e.stopPropagation(); updateStatus(c.id, b.dataset.status); }));
      const thumb = tr.querySelector('.img-thumb');
      if (thumb) thumb.addEventListener('click', e => { e.stopPropagation(); openLightbox(img); });
      tr.addEventListener('click', () => focusComplaint(c.id, hasLoc ? [c.latitude, c.longitude] : null));
      tbody.appendChild(tr);

      if (hasLoc) {
        const marker = L.circleMarker([c.latitude, c.longitude], {
          radius: 8, color: '#18181b', weight: 1, fillColor: statusColor(c.status), fillOpacity: 0.9
        }).bindPopup(`<b>${esc(c.title)}</b><br>${esc(c.description)}`);
        marker.on('click', () => highlightRow(c.id, true));
        markersLayer.addLayer(marker);
        markerById[c.id] = marker;
      }
    });

    const pts = list.filter(c => c.latitude != null && c.longitude != null).map(c => [c.latitude, c.longitude]);
    if (pts.length) map.fitBounds(pts, { padding: [30, 30], maxZoom: 15 });
  }

  function focusComplaint(id, latlng) {
    highlightRow(id, false);
    if (latlng) {
      map.flyTo(latlng, 15);
      markerById[id] && markerById[id].openPopup();
    }
  }

  function highlightRow(id, scroll) {
    activeId = id;
    document.querySelectorAll('#complaintTableBody tr').forEach(r =>
      r.classList.toggle('active', r.dataset.id == id));
    if (scroll) {
      const row = document.querySelector(`#complaintTableBody tr[data-id="${id}"]`);
      row && row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  function openLightbox(src) {
    const box = document.getElementById('lightbox');
    box.querySelector('img').src = src;
    box.classList.add('open');
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') document.getElementById('lightbox').classList.remove('open');
  });

  async function updateStatus(id, newStatus) {
    try {
      const response = await fetch(`${API_URL}/${id}/status?status=${encodeURIComponent(newStatus)}`, { method: 'PATCH' });
      if (!response.ok) throw new Error();
      fetchComplaints();
    } catch (err) {
      alert('Error updating status.');
    }
  }

  ['search', 'statusFilter', 'categoryFilter'].forEach(id =>
    document.getElementById(id).addEventListener('input', render));

  fetchComplaints();