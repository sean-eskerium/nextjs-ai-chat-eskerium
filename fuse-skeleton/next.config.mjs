/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: false,
	eslint: {
		// Only enable ESLint in development
		ignoreDuringBuilds: process.env.NODE_ENV === 'production'
	},
	typescript: {
		// Dangerously allow production builds to successfully complete even if
		// your project has type errors.
		ignoreBuildErrors: true
	},
	webpack: (config, { isServer }) => {
		// Handle raw imports
		if (config.module && config.module.rules) {
			config.module.rules.push({
				test: /\.(json|js|ts|tsx|jsx)$/,
				resourceQuery: /raw/,
				use: 'raw-loader'
			});
		}

		// Handle Node.js modules
		if (!isServer) {
			config.resolve.fallback = {
				...config.resolve.fallback,
				fs: false,
				os: false,
				path: false,
				net: false,
				tls: false,
				crypto: false,
				dns: false,
				child_process: false,
			};
		}

		config.externals = [
			...(config.externals || []),
			'net',
			'tls',
			'crypto',
			'perf_hooks',
			'stream'
		];

		return config;
	},
	transpilePackages: ['@fuse/core'],
	modularizeImports: {
		'@mui/material': {
			transform: '@mui/material/{{member}}'
		},
		'@mui/icons-material': {
			transform: '@mui/icons-material/{{member}}'
		}
	}
};

export default nextConfig;
