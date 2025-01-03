import { User } from '@auth/user';
import { PartialDeep } from 'type-fest';

export default function UserModel(user: PartialDeep<User>): User {
	return {
		id: user.id || '',
		role: user.role || ['admin'],
		data: {
			displayName: user.data?.displayName || '',
			photoURL: user.data?.photoURL || '',
			email: user.data?.email || '',
			shortcuts: user.data?.shortcuts || []
		}
	};
}
