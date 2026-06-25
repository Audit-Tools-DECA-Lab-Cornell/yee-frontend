import Image from "next/image";

import { cn } from "@/lib/utils";

type BrandLogoVariant = "mark" | "horizontal" | "horizontalSubtitle" | "stackedSubtitle";
type BrandLogoTone = "light" | "dark";

type BrandLogoProps = {
	variant?: BrandLogoVariant;
	tone?: BrandLogoTone;
	className?: string;
	priority?: boolean;
};

const LOGO_SOURCES: Record<
	BrandLogoVariant,
	Record<BrandLogoTone, { src: string; width: number; height: number; alt: string }>
> = {
	mark: {
		light: {
			src: "/brand/logo-mark.png",
			width: 1024,
			height: 1024,
			alt: "YEE logo mark"
		},
		dark: {
			src: "/brand/logo-mark-white.png",
			width: 1024,
			height: 1024,
			alt: "YEE logo mark"
		}
	},
	horizontal: {
		light: {
			src: "/brand/logo-horizontal.png",
			width: 1012,
			height: 341,
			alt: "YEE horizontal logo"
		},
		dark: {
			src: "/brand/logo-horizontal-white.png",
			width: 1012,
			height: 341,
			alt: "YEE horizontal logo"
		}
	},
	horizontalSubtitle: {
		light: {
			src: "/brand/logo-horizontal-subtitle.png",
			width: 1428,
			height: 530,
			alt: "Youth Enabling Environments horizontal logo"
		},
		dark: {
			src: "/brand/logo-horizontal-subtitle-white.png",
			width: 1428,
			height: 530,
			alt: "Youth Enabling Environments horizontal logo"
		}
	},
	stackedSubtitle: {
		light: {
			src: "/brand/logo-stacked-subtitle.png",
			width: 535,
			height: 450,
			alt: "Youth Enabling Environments stacked logo"
		},
		dark: {
			src: "/brand/logo-stacked-subtitle-white.png",
			width: 535,
			height: 450,
			alt: "Youth Enabling Environments stacked logo"
		}
	}
};

export function BrandLogo({ variant = "horizontalSubtitle", tone = "light", className, priority }: BrandLogoProps) {
	const logo = LOGO_SOURCES[variant][tone];

	return (
		<Image
			src={logo.src}
			alt={logo.alt}
			width={logo.width}
			height={logo.height}
			priority={priority}
			className={cn("block h-auto w-auto select-none", className)}
		/>
	);
}
