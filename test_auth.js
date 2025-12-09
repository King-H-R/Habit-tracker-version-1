// Test the auth endpoint directly with CSRF
const testEmail = 'singh@gmail.com';
const testPassword = 'Password123';
const baseUrl = 'http://localhost:3000';

async function testAuth() {
    console.log('1. Fetching CSRF Token...');
    const csrfRes = await fetch(`${baseUrl}/api/auth/csrf`);
    const csrfData = await csrfRes.json();
    const csrfToken = csrfData.csrfToken;
    console.log('CSRF Token:', csrfToken);

    console.log('2. Attempting verify credentials...');

    // Note: NextAuth expects x-www-form-urlencoded body usually, or JSON if configured?
    // Credentials provider defaults to form submission usually.
    // But 'json: true' implies we want JSON response.

    const res = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            // Cookie is needed for CSRF verification!
            'Cookie': csrfRes.headers.get('set-cookie')
        },
        body: new URLSearchParams({
            email: testEmail,
            password: testPassword,
            csrfToken: csrfToken,
            json: 'true'
        })
    });

    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Response:', JSON.stringify(data, null, 2));

    if (data.url && data.url.includes('error')) {
        console.log('❌ Auth Failed');
    } else if (data.url && !data.url.includes('signin')) {
        console.log('✅ Auth Success (Redirect to ' + data.url + ')');
    } else {
        console.log('❓ Result unclear (Redirect to ' + data.url + ')');
    }
}

testAuth();
