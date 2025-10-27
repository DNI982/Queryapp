import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

/**
 * A Cloud Function that triggers when a user document is written in Firestore.
 * It syncs the `role` field from the Firestore document to a custom claim in Firebase Authentication.
 * This allows security rules to leverage the user's role directly from their auth token.
 */
exports.syncUserRole = functions.firestore
    .document('users/{userId}')
    .onWrite(async (change, context) => {
        const { userId } = context.params;
        const newUserData = change.after.data();
        const oldUserData = change.before.data();

        // If the document is deleted or the role hasn't changed, do nothing.
        if (!newUserData || (oldUserData && newUserData.role === oldUserData.role)) {
            return null;
        }

        const role = newUserData.role;

        try {
            // Set the custom claim on the user's auth token.
            await admin.auth().setCustomUserClaims(userId, { role: role });
            console.log(`Custom claim 'role: ${role}' set for user ${userId}`);
            
            // It's good practice to also update a field in the user document to confirm sync.
            return change.after.ref.set({ roleClaimSyncedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });

        } catch (error) {
            console.error(`Error setting custom claim for user ${userId}:`, error);
            return null;
        }
    });
