function showAlert(message, type) {
    const alertContainer = document.getElementById('alertMessage');
    const alertDiv = alertContainer.querySelector('div');
    
    // Set styles based on alert type
    if (type === 'error') {
        alertDiv.className = 'p-4 rounded-lg text-sm font-medium bg-red-100 text-red-700';
    } else if (type === 'success') {
        alertDiv.className = 'p-4 rounded-lg text-sm font-medium bg-green-100 text-green-700';
    }
    
    alertDiv.textContent = message;
    alertContainer.classList.remove('hidden');
    
    // Hide alert after 3 seconds
    setTimeout(() => {
        alertContainer.classList.add('hidden');
    }, 3000);
}

// Handle login and authentication
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const secretCode = document.getElementById('secretCode').value.trim();

    if (!username || !secretCode) {
        showAlert('Please enter both username and secret code', 'error');
        return;
    }

    try {
        // Log attempt
        console.log('Login attempt:', { username, secretCode });

        const response = await fetch('users.json');
        if (!response.ok) {
            throw new Error('Failed to fetch users data');
        }

        const data = await response.json();
        console.log('Users data loaded successfully');

        // Validate data structure
        if (!data || !data.users || !Array.isArray(data.users)) {
            throw new Error('Invalid users data structure');
        }

        // Find matching user
        const user = data.users.find(u => u.username === username);
        
        if (!user) {
            showAlert('User not found', 'error');
            return;
        }

        if (!user.active) {
            showAlert('Account is inactive', 'error');
            return;
        }

        if (user.secretCode !== secretCode) {
            showAlert('Invalid secret code', 'error');
            return;
        }

        const currentDate = new Date();
        const expiryDate = new Date(user.expiryDate);

        if (currentDate > expiryDate) {
            showAlert('Your access code has expired', 'error');
            return;
        }

        // Login successful
        localStorage.setItem('authUser', JSON.stringify({
            username: user.username,
            name: user.name,
            expiryDate: user.expiryDate,
            noAds: true
        }));

        window.location.href = 'index.html';

    } catch (error) {
        console.error('Login error:', error);
        showAlert('Error during login. Please try again.', 'error');
    }
});

// Handle guest login
document.getElementById('guestBtn').addEventListener('click', () => {
    localStorage.setItem('authUser', JSON.stringify({
        username: 'guest',
        noAds: false
    }));
    window.location.href = 'index.html';
});
