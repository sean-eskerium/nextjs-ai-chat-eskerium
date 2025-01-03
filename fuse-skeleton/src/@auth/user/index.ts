export interface User {
	id: string;
	role: string[];
	data: {
		displayName: string;
		photoURL: string;
		email: string;
		shortcuts: any[];
	};
}