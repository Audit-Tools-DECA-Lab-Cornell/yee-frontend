import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "maps.googleapis.com"
			},
			{
				protocol: "https",
				hostname: "staticmap.openstreetmap.de"
			},
			{
				protocol: "https",
				hostname: "maps.wikimedia.org"
			}
		]
	}
};

export default nextConfig;
