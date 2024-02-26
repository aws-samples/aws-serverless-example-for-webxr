import {Amplify, Auth} from 'aws-amplify';
import amplifyConfig from './amplifyconfigure';

import './styles/auth.css';
// Configure Amplify
Amplify.configure(amplifyConfig);

// Get message div
const messageDiv = document.getElementById('message'); 

const handleSignUp = async () => {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const email = document.getElementById('email').value; // If using email

    try {
        const { user } = await Auth.signUp({
            username,
            password,
            attributes: {
                email // If using email
            }
        });
        console.log('Sign up success!', user);
        // Handle successful sign-up logic here
        // Displaying success message 
        showMessage('Sign up successful! Please use the same username and password to sign in', 'success');
    } catch (error) {
        console.error('Error signing up:', error);
        // Handle errors or show messages to user
        showMessage('Error signing up: ' + error.message, 'error');
    }
};

const handleSignIn = async () => {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const user = await Auth.signIn(username, password);
        console.log('Sign in success!', user);
        // Ensuring the session is established before fetching it and redirecting.
        await new Promise(resolve => setTimeout(resolve, 1000));  // wait for a second
        const session = await Auth.currentSession();
        console.log("session is", session);
    
        window.location.href = "main.html";
    } catch (error) {
        console.error('Error signing in:', error);
    }
};

const showMessage = (message, type) => {
    messageDiv.innerText = message;
    messageDiv.className = type;  // 'success' or 'error'
    messageDiv.style.display = 'block'; // Ensure it's visible
    setTimeout(() => {  // Hide after 3 seconds
        messageDiv.style.display = 'none';
    }, 3000);
};

// Attach event listeners
document.getElementById('signUpButton').addEventListener('click', handleSignUp);
document.getElementById('signInButton').addEventListener('click', handleSignIn);