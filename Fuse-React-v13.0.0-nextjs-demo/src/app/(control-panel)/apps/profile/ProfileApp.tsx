'use client';

import FusePageSimple from '@fuse/core/FusePageSimple';
import { styled } from '@mui/material/styles';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import { motion } from 'motion/react';
import { SyntheticEvent, useState } from 'react';
import useThemeMediaQuery from '@fuse/hooks/useThemeMediaQuery';
import FuseTabs from 'src/components/tabs/FuseTabs';
import FuseTab from 'src/components/tabs/FuseTab';
import AboutTab from './tabs/about/AboutTab';
import PhotosVideosTab from './tabs/photos-videos/PhotosVideosTab';
import TimelineTab from './tabs/timeline/TimelineTab';

const Root = styled(FusePageSimple)(({ theme }) => ({
	'& .FusePageSimple-header': {
		backgroundColor: theme.palette.background.paper,
		borderBottomWidth: 1,
		borderStyle: 'solid',
		borderColor: theme.palette.divider,
		'& > .container': {
			maxWidth: '100%'
		}
	}
}));

/**
 * The profile page.
 */
function ProfileApp() {
	const [selectedTab, setSelectedTab] = useState('timeline');
	const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down('lg'));

	function handleTabChange(event: SyntheticEvent, value: string) {
		setSelectedTab(value);
	}

	return (
		<Root
			header={
				<div className="flex flex-col w-full">
					<img
						className="h-160 lg:h-320 object-cover w-full"
						src="/assets/images/pages/profile/cover.jpg"
						alt="Profile Cover"
					/>

					<div className="flex flex-col flex-0 lg:flex-row items-center max-w-5xl w-full mx-auto px-32 lg:h-72">
						<div className="-mt-96 lg:-mt-88 rounded-full">
							<motion.div
								initial={{ scale: 0 }}
								animate={{ scale: 1, transition: { delay: 0.1 } }}
							>
								<Avatar
									sx={{ borderColor: 'background.paper' }}
									className="w-128 h-128 border-4"
									src="/assets/images/avatars/male-04.jpg"
									alt="User avatar"
								/>
							</motion.div>
						</div>

						<div className="flex flex-col items-center lg:items-start mt-16 lg:mt-0 lg:ml-32">
							<Typography className="text-lg font-bold leading-none">Brian Hughes</Typography>
							<Typography color="text.secondary">London, UK</Typography>
						</div>

						<div className="hidden lg:flex h-32 mx-32 border-l-2" />

						<div className="flex items-center mt-24 lg:mt-0 space-x-24">
							<div className="flex flex-col items-center">
								<Typography className="font-bold">200k</Typography>
								<Typography
									className="text-sm font-medium"
									color="text.secondary"
								>
									FOLLOWERS
								</Typography>
							</div>
							<div className="flex flex-col items-center">
								<Typography className="font-bold">1.2k</Typography>
								<Typography
									className="text-sm font-medium"
									color="text.secondary"
								>
									FOLLOWING
								</Typography>
							</div>
						</div>

						<div className="flex flex-1 justify-end my-16 lg:my-0">
							<FuseTabs
								value={selectedTab}
								onChange={handleTabChange}
							>
								<FuseTab
									label="Timeline"
									value="timeline"
								/>
								<FuseTab
									label="About"
									value="about"
								/>
								<FuseTab
									label="Photos & Videos"
									value="photos-videos"
								/>
							</FuseTabs>
						</div>
					</div>
				</div>
			}
			content={
				<div className="flex flex-auto justify-center w-full max-w-5xl mx-auto p-24 sm:p-32">
					{selectedTab === 'timeline' && <TimelineTab />}
					{selectedTab === 'about' && <AboutTab />}
					{selectedTab === 'photos-videos' && <PhotosVideosTab />}
				</div>
			}
			scroll={isMobile ? 'normal' : 'page'}
		/>
	);
}

export default ProfileApp;
