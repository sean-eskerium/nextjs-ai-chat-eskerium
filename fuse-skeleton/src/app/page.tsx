import { redirect } from 'next/navigation';

function MainPage() {
	redirect(`/(control-panel)/example`);
	return null;
}

export default MainPage;
