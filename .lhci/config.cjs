module.exports = {
	presets: ['lhci'],
	collect: {
		url: ['http://localhost:4173'],
		startServer: true,
		headless: 'new'
	},
	upload: {
		target: 'temporary-public-storage'
	}
};
