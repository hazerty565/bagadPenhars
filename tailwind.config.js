/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}', './src/routes/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				ink: '#25282B',
				marine: {
					DEFAULT: '#173B63',
					700: '#122F4F',
					900: '#0B1F35'
				},
				or: {
					DEFAULT: '#C6A45B',
					light: '#DCC48F',
					dark: '#A9873F'
				},
				ivoire: '#F5F1E8',
				sable: '#E9E1D2',
				ardoise: '#5C6167'
			},
			fontFamily: {
				serif: ['"Playfair Display"', 'Georgia', 'Cambria', 'serif'],
				sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif']
			},
			maxWidth: {
				'8xl': '88rem'
			},
			keyframes: {
				'fade-up': {
					'0%': { opacity: '0', transform: 'translateY(12px)' },
					'100%': { opacity: '1', transform: 'none' }
				}
			},
			animation: {
				'fade-up': 'fade-up 600ms ease-out both'
			}
		}
	},
	plugins: []
};
