//control desde el index
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    // Si no hay token, redirige al login
    window.location.href = 'login.html';
  }
});