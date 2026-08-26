let students = [];

async function loadDashboard(){
  const res = await fetch('/api/dashboard');
  const data = await res.json();
  students = data.students;
  document.getElementById('studentsCount').textContent = data.stats.students;
  document.getElementById('attendance').textContent = `${data.stats.attendance}%`;
  document.getElementById('average').textContent = data.stats.average;
  document.getElementById('active').textContent = data.stats.active;
  document.getElementById('donutValue').textContent = `${data.stats.attendance}%`;
  document.querySelector('.donut').style.background = `conic-gradient(#4f46e5 0 ${data.stats.attendance}%,#edf0f5 ${data.stats.attendance}% 100%)`;
  renderStudents();
}

function renderStudents(){
  const q = document.getElementById('search').value.toLowerCase();
  const rows = students.filter(s => `${s.name} ${s.school} ${s.grade}`.toLowerCase().includes(q));
  document.getElementById('studentRows').innerHTML = rows.map(s => `
    <tr>
      <td>${escapeHtml(s.name)}</td>
      <td>${escapeHtml(s.grade)}</td>
      <td>${escapeHtml(s.school)}</td>
      <td>${s.attendance}%</td>
      <td><b>${s.average}</b></td>
      <td><span class="badge">${escapeHtml(s.status)}</span></td>
      <td><button class="delete" onclick="deleteStudent(${s.id})">Delete</button></td>
    </tr>
  `).join('');
}

async function deleteStudent(id){
  if(!confirm('Delete this student?')) return;
  await fetch(`/api/students/${id}`, {method:'DELETE'});
  loadDashboard();
}

function openModal(){document.getElementById('modal').classList.remove('hidden')}
function closeModal(){document.getElementById('modal').classList.add('hidden')}

document.getElementById('studentForm').addEventListener('submit', async e => {
  e.preventDefault();
  const form = new FormData(e.target);
  const body = Object.fromEntries(form.entries());
  await fetch('/api/students', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(body)
  });
  e.target.reset();
  closeModal();
  loadDashboard();
});

function escapeHtml(value){
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}

loadDashboard();
