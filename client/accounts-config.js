import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

// Meteor already handles session persistence via localStorage automatically
// This file ensures the accounts package is loaded on the client
Meteor.startup(() => {
  console.log('✅ Accounts system initialized');
});
