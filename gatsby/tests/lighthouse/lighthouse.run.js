 
// Node CLI for Lighthouse https://www.npmjs.com/package/lighthouse#using-the-node-cli
const lighthouse = require("lighthouse");

// Launch Chrome from node
const chromeLauncher = require("chrome-launcher");

const fs = require('fs');

const lighthouseConstants = require("./lighthouse-constants");

if (!fs.existsSync(lighthouseConstants.lighthouseDataDir)) {
  fs.mkdirSync(lighthouseConstants.lighthouseDataDir);
}

const devURL = lighthouseConstants.getDevURL();
const referenceURL = lighthouseConstants.getReferenceURL();

const launchChromeAndRunLighthouse = (
    url,
    opts = {
      //chromeFlags: ['--headless'],
    },
    config = {
      extends: 'lighthouse:default',
      settings: {
        output: ['html'],
        emulatedFormFactor: 'mobile',
        skipAudits: ['is-crawlable'],
        throttling: {
          // Using a "broadband" connection type
          // Corresponds to "Dense 4G 25th percentile" in https://docs.google.com/document/d/1Ft1Bnq9-t4jK5egLSOc28IL4TvR-Tt0se_1faTA4KTY/edit#heading=h.bb7nfy2x9e5v
          rttMs: 40,
          throughputKbps: 10 * 1024,
          cpuSlowdownMultiplier: 1,
        },
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo']
      },
    }
  ) =>
  chromeLauncher.launch({
    chromeFlags: opts.chromeFlags
  }).then(chrome => {
    opts.port = chrome.port;
    return lighthouse(url, opts, config).then(results =>
      chrome.kill().then(() => results)
    );
  });


console.log(`Running Lighthouse audit on ${devURL}`);
launchChromeAndRunLighthouse(devURL).then(
  (results) => {
    let data = JSON.stringify(results, 0, 4);
    fs.writeFileSync(lighthouseConstants.devJSONFile, data);
    fs.writeFileSync(
      lighthouseConstants.devHTMLFile,
      results.report[0]
    );

    console.log(`Running Lighthouse audit on ${referenceURL}`);
    launchChromeAndRunLighthouse(referenceURL).then(
      (results) => {
        let data = JSON.stringify(results, 0, 4);
        fs.writeFileSync(lighthouseConstants.referenceJSONFile, data);
        fs.writeFileSync(
          lighthouseConstants.referenceHTMLFile,
          results.report[0]
        );
        process.exit(0);
      });
  });
