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
					// #7A4A1E donne un contraste de ~4.7:1 sur fond blanc (WCAG AA : 4.5:1 minimum)
					dark: '#7A4A1E'
				},
				ivoire: '#F5F1E8',
				sable: '#E9E1D2',
				ardoise: '#5C6167',
				// Réservé aux messages d'erreur de formulaire : contraste 6:1 sur
				// blanc et sur ivoire, dans la même famille chaude que l'or.
				danger: '#9B2F26'
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
