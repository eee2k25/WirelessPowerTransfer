const app = require('./app.json');

/** GitHub Pages lives at /WirelessPowerTransfer — set BASE_URL only for that export. */
module.exports = {
  ...app,
  expo: {
    ...app.expo,
    web: {
      ...app.expo.web,
      bundler: 'metro',
      output: 'single',
    },
    experiments: {
      ...(app.expo.experiments || {}),
      baseUrl: process.env.BASE_URL || '',
    },
  },
};
