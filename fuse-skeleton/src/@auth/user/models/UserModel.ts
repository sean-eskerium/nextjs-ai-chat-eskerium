import _ from 'lodash';
import { PartialDeep } from 'type-fest';
import { User } from '@auth/user';

/**
 * Creates a new user object with the specified data.
 * Ensures all required fields have proper default values.
 */
function UserModel(data?: PartialDeep<User>): User {
	data = data || {};

	return _.defaults(data, {
		id: '',  // Empty string instead of null
		role: ['user'],  // Default role instead of null
		displayName: '',  // Empty string instead of null
		photoURL: '',
		email: '',
		shortcuts: [],
		settings: {},
		data: {
			shortcuts: [],
			settings: {}
		},
		loginRedirectUrl: '/'
	}) as User;
}

export default UserModel;
