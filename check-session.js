// Diagnostic script to check Meteor session state
// Run this in the browser console to debug authentication issues

console.log('=== Meteor Session Diagnostic ===\n');

// Check if user is logged in
console.log('1. Meteor.userId():', Meteor.userId());
console.log('2. Meteor.user():', Meteor.user());
console.log('3. Meteor.loggingIn():', Meteor.loggingIn());

// Check localStorage
console.log('\n4. LocalStorage tokens:');
console.log('   - Meteor.loginToken:', localStorage.getItem('Meteor.loginToken'));
console.log('   - Meteor.loginTokenExpires:', localStorage.getItem('Meteor.loginTokenExpires'));
console.log('   - Meteor.userId:', localStorage.getItem('Meteor.userId'));

// Check all Meteor-related localStorage items
console.log('\n5. All Meteor localStorage items:');
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key.startsWith('Meteor')) {
    console.log(`   - ${key}:`, localStorage.getItem(key));
  }
}

// Check connection status
console.log('\n6. Connection status:', Meteor.status());

// Instructions
console.log('\n=== Instructions ===');
console.log('If Meteor.userId() is null but localStorage has a loginToken:');
console.log('  → The token might be invalid or expired');
console.log('\nIf localStorage is empty:');
console.log('  → Session is not being saved (check browser settings)');
console.log('\nTo manually test login persistence:');
console.log('  1. Log in');
console.log('  2. Run this script');
console.log('  3. Refresh the page');
console.log('  4. Run this script again');
console.log('  5. Compare the results');
