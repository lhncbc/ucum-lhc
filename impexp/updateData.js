/**
 * This is the tool for generating ucumDefs.json. See the README for details.
 */

const params = process.argv.slice(2);

const fs = require('fs'),
      filenameToDelete = '../data/ucumDefs.json';

if (fs.existsSync(filenameToDelete)) {
  fs.unlinkSync(filenameToDelete);
}

const UcumXmlDocument = require('../source/ucumXmlDocument.js').UcumXmlDocument;
const docObj = UcumXmlDocument.getInstance();
docObj.parseXml();

if (!params.includes('--skip-ucum-csv')) {
  const UcumDataUpdater = require('./ucumDataUpdater.js').UcumDataUpdater;
  const upd = UcumDataUpdater.getInstance();
  upd.readFile('../data/ucum.csv');
}
