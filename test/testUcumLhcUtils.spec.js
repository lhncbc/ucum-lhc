/**
 * Mocha tests for the UcumLhcUtils class.
 *
 * Run from the command line with 'mocha testUcumLhcUtils.js' or
 * 'grunt test'Intern
 */

var assert = require('assert');
var Ucum = require('../source-cjs/config.js').Ucum;
var {ucumJsonDefs} = require('../source-cjs/ucumJsonDefs.js');
var UTables = require("../source-cjs/unitTables.js").UnitTables;
var Utils = require("../source-cjs/ucumLhcUtils.js").UcumLhcUtils;
var UString = require("../source-cjs/unitString.js").UnitString;

var uTabs = UTables.getInstance();
ucumJsonDefs.loadJsonDefs();
var uString = UString.getInstance();

var utils = Utils.getInstance();

describe('Test validateUnitString method', function() {

  it("should return an error message for no unit string supplied", function() {

    var resp1 = utils.validateUnitString();
    assert.equal(resp1.status, 'error', resp1.status);
    assert.equal(resp1.msg, 'No unit string specified.', resp1.msg);
  });

  it("should return a message for no unit found", function() {

    var resp2 = utils.validateUnitString('noFool', 'suggest');
    assert.equal(resp2.status, 'invalid', resp2.status);
    assert.equal(resp2.msg[0], 'noFool is not a valid UCUM code.  ' +
                 'No alternatives were found.', resp2.msg[0]);
  });

  it('should return invalid for a unit with two prefixes', () => {
    let resp =  utils.validateUnitString('mcg');
    assert.equal(resp.status, 'invalid', resp.status);
  });

  it("should return a message for 'Gauss'", function() {
    var resp3 = utils.validateUnitString('Gauss');
    assert.equal(resp3.status, 'invalid', resp3.status);
    assert.equal(resp3.msg[0], 'The UCUM code for Gauss is G.\nDid you mean G?',
                 resp3.msg[0]);
  });

  it("should return a unit with a code, name and guidance for 'Bi'", function() {
    var resp4 = utils.validateUnitString('Bi');
    var theUnit = resp4.unit;
    assert(theUnit != null);
    if (theUnit) {
      assert.equal(theUnit.code, 'Bi', theUnit.code);
      assert.equal(theUnit.name, 'Biot', theUnit.name);
      assert.equal(theUnit.guidance, 'equal to 10 amperes', theUnit.guidance);
    }
  });

  it("should return a missing parenthesis message for 'L/(5.mg", function() {
    var resp5 = utils.validateUnitString('L/(5.mg');
    assert.equal(resp5.status, 'invalid');
    assert.equal(resp5.unit, null);
    assert.equal(resp5.ucumCode, null);
    assert.equal(resp5.msg, 'Missing close parenthesis for open parenthesis' +
        ' at L/' + uString.openEmph_ + '(' + uString.closeEmph_ + '5.mg');
   });

  it("should return 3 suggestions for allergen", function() {
    var resp6 = utils.validateUnitString('allergen', 'suggest');
    assert.equal(resp6.status, 'invalid');
    assert.equal(resp6.unit, null);
    assert.equal(resp6.ucumCode, null);
    var suggs = resp6['suggestions'][0] ;
    assert.equal(suggs['units'].length, 3);
    assert.equal(suggs['msg'], 'allergen is not a valid ' +
      'UCUM code.  We found possible units that might be what was meant:');
    assert.equal(suggs['invalidUnit'], 'allergen');
    assert.deepEqual(suggs['units'][0],
       ['[BAU]','bioequivalent allergen unit', null]) ;
    assert.deepEqual(suggs['units'][1], ['[AU]', 'allergy unit',
       'Most standard test allergy units are reported as [IU] or as %. ']);
    assert.deepEqual(suggs['units'][2], ["[Amb'a'1'U]",
       'allergen unit for Ambrosia artemisiifolia', 'Amb a 1 is the major ' +
       'allergen in short ragweed, and can be converted Bioequivalent ' +
       'allergen units (BAU) where 350 Amb a 1 U/mL = 100,000 BAU/mL']);
  });

  it('should validate integer units', function() {
    // only postive integers consisting of a string of digits are valid as unit strings
    assert.equal(utils.validateUnitString('123').status, 'valid');
    assert.equal(utils.validateUnitString('1e3').status, 'invalid'); // invalid UCUM notation
    assert.equal(utils.validateUnitString('-123').status, 'invalid');
  });

  it('should say a unit that is only an annotation is valid - {g}', ()=>{
    // {g} was getting marked invalid, along with the suggestion that maybe the
    // user meant [g].  That is a useful suggestion, but it should be valid.
    const result = utils.validateUnitString('{g}');
    assert.equal(result.status, 'valid');
    assert(result.msg.length > 0);
  });


}); // end validateUnitString tests


describe('Test convertUnitTo method', function() {

  it("should return error messages for no unit strings supplied", function() {

    var resp1 = utils.convertUnitTo();
    assert.equal(resp1.status, 'error', resp1.status);
    assert.equal(resp1.msg[0], 'No "from" unit expression specified.', resp1.msg[0]);
    assert.equal(resp1.msg[1], 'No "from" value, or an invalid "from" value, ' +
                               'was specified.', resp1.msg[1]);
    assert.equal(resp1.msg[2], 'No "to" unit expression specified.', resp1.msg[2]);
  });

it("should return a message for invalid unit strings", function() {

  var resp2 = utils.convertUnitTo('good', 2017, 'bad');
  assert.equal(resp2.status, 'failed', resp2.status);
  assert.equal(resp2.msg[0], 'good is not a valid UCUM code.', resp2.msg[0]);
  assert.equal(resp2.msg[1], 'Unable to find a unit for good, so no ' +
                             'conversion could be performed.', resp2.msg[1]);
  assert.equal(resp2.msg[2], 'bad is not a valid UCUM code.', resp2.msg[2]);
  assert.equal(resp2.msg[3], 'Unable to find a unit for bad, so no ' +
                             'conversion could be performed.', resp2.msg[3]);
});

  it("should return a valid conversion value and units for grams to metric carats", function() {
    var resp3 = utils.convertUnitTo('g', 56, '[car_m]');
    assert.equal(resp3.status, 'succeeded', resp3.status);
    assert.equal(resp3.toVal, 280.00, resp3.toVal);
    assert.equal(resp3.fromUnit.name_, 'gram', JSON.stringify(resp3.fromUnit));
    assert.equal(resp3.toUnit.name_, 'metric carat', JSON.stringify(resp3.toUnit));
  });

  it("should return a valid conversion value and units for 0 Fahrenheit to Celsius", function() {
    var resp3 = utils.convertUnitTo('[degF]', 0, 'Cel');
    assert.equal(resp3.status, 'succeeded', resp3.status);
    assert.equal(Math.round(resp3.toVal*100), -1778, resp3.toVal);
    assert.equal(resp3.fromUnit.name_, 'degrees Fahrenheit', JSON.stringify(resp3.fromUnit));
    assert.equal(resp3.toUnit.name_, 'degree Celsius', JSON.stringify(resp3.toUnit));
  });

  it("should return a valid conversion value and units for -1 Celsius to Fahrenheit", function() {
    var resp3 = utils.convertUnitTo('Cel', -1, '[degF]');
    assert.equal(resp3.status, 'succeeded', resp3.status);
    assert.equal(Math.round(resp3.toVal*100), 3020, resp3.toVal);
    assert.equal(resp3.fromUnit.name_, 'degree Celsius', JSON.stringify(resp3.fromUnit));
    assert.equal(resp3.toUnit.name_, 'degrees Fahrenheit', JSON.stringify(resp3.toUnit));
  });


  it("should return an error for an attempt to translate g to /g", function() {
    var resp4 = utils.convertUnitTo('g', 847, '/g');
    assert.equal(resp4.status, 'failed', resp4.status);
    assert.equal(resp4.msg[0], 'Sorry.  g cannot be converted to /g.', resp4.msg[0]);
    assert.equal(resp4.toVal, null, resp4.toVal);
    assert.equal(resp4.fromUnit, undefined, resp4.fromUnit);
    assert.equal(resp4.toUnit, undefined, resp4.toUnit);
  });

  it("should return 3 suggestions for allergen and 2 for culture", function() {
    var resp5 = utils.convertUnitTo('allergen', 3, 'culture', 'suggest');
    assert.equal(resp5.status, 'failed');
    assert.equal(resp5.toVal, null);
    assert.equal(resp5.fromUnit, null);
    assert.equal(resp5.toUnit, null);
    assert.equal(resp5.msg.length, 2);
    assert.deepEqual(resp5.msg[0], 'Unable to find a unit for allergen, ' +
                     'so no conversion could be performed.');
    assert.deepEqual(resp5.msg[1], 'Unable to find a unit for culture, ' +
      'so no conversion could be performed.');
    var suggsFrom = resp5['suggestions']['from'][0] ;
    assert.deepEqual(suggsFrom['units'].length, 3);
    assert.deepEqual(suggsFrom['msg'], 'allergen is not a valid ' +
      'UCUM code.  We found possible units that might be what was meant:');
    assert.deepEqual(suggsFrom['invalidUnit'], 'allergen');
    assert.deepEqual(suggsFrom['units'][0],
      ['[BAU]','bioequivalent allergen unit', null]) ;
    assert.deepEqual(suggsFrom['units'][1], ['[AU]', 'allergy unit',
      'Most standard test allergy units are reported as [IU] or as %. ']);
    assert.deepEqual(suggsFrom['units'][2], ["[Amb'a'1'U]",
      'allergen unit for Ambrosia artemisiifolia', 'Amb a 1 is the major ' +
      'allergen in short ragweed, and can be converted Bioequivalent ' +
      'allergen units (BAU) where 350 Amb a 1 U/mL = 100,000 BAU/mL']);
    var suggsTo = resp5['suggestions']['to'][0] ;
    assert.deepEqual(suggsTo['units'].length, 2);
    assert.deepEqual(suggsTo['msg'], 'culture is not a valid ' +
      'UCUM code.  We found possible units that might be what was meant:');
    assert.deepEqual(suggsTo['invalidUnit'], 'culture');
    assert.deepEqual(suggsTo['units'][0], ['[CCID_50]',
      '50% cell culture infectious dose', null]);
    assert.deepEqual(suggsTo['units'][1], ['[TCID_50]',
      '50% tissue culture infectious dose', null]);
  });

  it("should return an error for an attempt to translate mol to 78.4(mmol/L)/s", function() {
    var resp4 = utils.convertUnitTo('mol', 1, '78.4(mmol/L)/s');
    assert.equal(resp4.status, 'failed', resp4.status);
    assert.equal(resp4.msg[0], '4(mmol/L) is not a valid UCUM code.  We assumed you meant 4.(mmol/L).', resp4.msg[0]);
    assert.equal(resp4.msg[1], 'Sorry.  mol cannot be converted to (78.(4.(mmol/L)))/s.', resp4.msg[1]);
    assert.equal(resp4.toVal, null, resp4.toVal);
    assert.equal(resp4.fromUnit, undefined, resp4.fromUnit);
    assert.equal(resp4.toUnit, undefined, resp4.toUnit);
  });

  it("should return a missing molecular weight error for an attempt to translate mol to 32.4(ug/g).mg", function() {
    var resp4 = utils.convertUnitTo('mol', 1, '32.4(ug/g).mg');
    assert.equal(resp4.status, 'failed', resp4.status);
    assert.equal(resp4.msg[0], '4(ug/g) is not a valid UCUM code.  We assumed you meant 4.(ug/g).', resp4.msg[0]);
    assert.equal(resp4.msg[1], Ucum.needMoleWeightMsg_);
    assert.equal(resp4.toVal, null, resp4.toVal);
    assert.equal(resp4.fromUnit, undefined, resp4.fromUnit);
    assert.equal(resp4.toUnit, undefined, resp4.toUnit);
  });

  it("should return an error for an attempt to translate mmol/L to mol", function() {
    var resp4 = utils.convertUnitTo('mmol/L', 1, 'mol');
    assert.equal(resp4.status, 'failed', resp4.status);
    assert.equal(resp4.msg[0], 'Sorry.  mmol/L cannot be converted to mol.', resp4.msg[0]);
    assert.equal(resp4.toVal, null, resp4.toVal);
    assert.equal(resp4.fromUnit, undefined, resp4.fromUnit);
    assert.equal(resp4.toUnit, undefined, resp4.toUnit);
  });

  it("should return 96 for a request to convert 5.33 mmol/L to mg{molybdenum}/dL weight 180.156", function() {
    var resp5 = utils.convertUnitTo('mmol/L', 5.33, 'mg{molybdenum}/dL', false, 180.156);
    assert.equal(resp5.status, 'succeeded', resp5.status + resp5.msg);
    assert.equal(resp5.toVal.toPrecision(2), 96, resp5.toVal);
  });

  it("should return 5.33 for a request to convert 96 mg/dL to mmol/L weight 180.156", function() {
    var resp5 = utils.convertUnitTo('mg/dL', 96, 'mmol/L', false, 180.156);
    assert.equal(resp5.status, 'succeeded', resp5.status + resp5.msg);
    assert.equal(resp5.toVal.toPrecision(3), 5.33, resp5.toVal.toPrecision(3));
  });

  it("should return 3.4 for a request to convert 300.57 umol/L to mg/dL weight 113.1179", function() {
    var resp5 = utils.convertUnitTo('umol/L', 300.57, 'mg/dL', false, 113.1179);
    assert.equal(resp5.status, 'succeeded', resp5.status + resp5.msg);
    assert.equal(resp5.toVal.toPrecision(3), 3.4, resp5.toVal);
  });

  it("should return 300.57 for a request to convert 3.4 mg/dL to umol/L weight 113.1179", function() {
    var resp5 = utils.convertUnitTo('mg/dL', 3.4, 'umol/L', false, 113.1179);
    assert.equal(resp5.status, 'succeeded', resp5.status + resp5.msg);
    assert.equal(resp5.toVal.toPrecision(5), 300.57, resp5.toVal)
  });

  it("should return 6.7 for a request to convert 1.67 mmol/L to mg/dL weight 40.078", function() {
    var resp5 = utils.convertUnitTo('mmol/L', 1.67, 'mg/dL', false, 40.078);
    assert.equal(resp5.status, 'succeeded', resp5.status + resp5.msg);
    assert.equal(resp5.toVal.toPrecision(2), 6.7, resp5.toVal);
  });

  it("should return 1.67 for a request to convert 6.7 mg/dL to mmol/L weight 40.078", function() {
    var resp5 = utils.convertUnitTo('mg/dL', 6.7, 'mmol/L', false, 40.078);
    assert.equal(resp5.status, 'succeeded', resp5.status + resp5.msg);
    assert.equal(resp5.toVal.toPrecision(3), 1.67, resp5.toVal.toPrecision(3));
  });

  it("should return .001 for a request to convert 1 umol.L/g to mg.L/g weight 1", function() {
    var resp5 = utils.convertUnitTo('umol.L/g', 1, 'mg.L/g', false, 1);
    assert.equal(resp5.status, 'succeeded', resp5.status + resp5.msg);
    assert.equal(resp5.toVal.toPrecision(3), .001, resp5.toVal.toPrecision(3));
  });

  it("should return .001 for a request to convert 1 mg.umol to mg2 weight 1", function() {
    var resp5 = utils.convertUnitTo('mg.umol', 1, 'mg2', false, 1);
    assert.equal(resp5.status, 'succeeded', resp5.status + resp5.msg);
    assert.equal(resp5.toVal.toPrecision(3), .001, resp5.toVal.toPrecision(3));
  });

  it("should return an error for an attempt to translate 1 pmol to 1/g weight 1", function() {
    var resp4 = utils.convertUnitTo('pmol', 1, '1/g', false, 1);
    assert.equal(resp4.status, 'failed', resp4.status);
    assert.equal(resp4.msg[0], 'Sorry.  pmol cannot be converted to 1/g.', resp4.msg[0]);
  });

  it("should return an error for an attempt to translate 1 pmol/g to mg/dL weight 1", function() {
    var resp4 = utils.convertUnitTo('pmol/g', 1, 'mg/dL', false, 1);
    assert.equal(resp4.status, 'failed', resp4.status);
    assert.equal(resp4.msg[0], 'Sorry.  pmol/g cannot be converted to mg/dL.', resp4.msg[0]);
  });

  it('should say that 1 2.[degF] = 2 [degF]', ()=>{
    var resp5 = utils.convertUnitTo('2.[degF]', 1, '[degF]');
    assert.equal(resp5.status, 'succeeded', resp5.status + resp5.msg);
    assert.equal(resp5.toVal.toPrecision(3), 2);
  });

  it('should convert 2.[degF] to Cel', ()=>{
    var resp = utils.convertUnitTo('2.[degF]', 1, 'Cel');
    assert.equal(resp.status, 'succeeded', resp.status + resp.msg);
    assert.equal(resp.toVal.toPrecision(7), -16.66667);
  });

  it('should convert [degF].2 to Cel', ()=>{
    var resp = utils.convertUnitTo('[degF].2', 1, 'Cel');
    assert.equal(resp.status, 'succeeded', resp.status + resp.msg);
    assert.equal(resp.toVal.toPrecision(7), -16.66667);
  });

  it('should not convert {degF} to Cel', ()=>{
    const resp = utils.convertUnitTo('{degF}', 5, 'Cel');
    assert.equal(resp.status, 'failed');
    assert.equal(
      '{degF} is a valid unit expression, but did you mean [degF] (degrees Fahrenheit)?',
      resp.msg[0]);
    assert.equal('Sorry.  {degF} cannot be converted to Cel.', resp.msg[1]);
  });

  it('should convert {degF} to 1', ()=>{
    const resp = utils.convertUnitTo('{degF}', 2, '1');
    assert.equal(resp.status, 'succeeded');
    assert.equal(resp.toVal, 2);
    assert.equal(resp.msg[0],
      '{degF} is a valid unit expression, but did you mean [degF] (degrees Fahrenheit)?');
  });

  it('should convert {aaa} to {bbb}', ()=>{
    const resp = utils.convertUnitTo('{aaa}', 2, '{bbb}');
    assert.equal(resp.status, 'succeeded');
    assert.equal(resp.toVal, 2);
    assert.equal(resp.msg.length, 0);
  });

  it('should convert 3.{aaa} to {bbb}', ()=>{
    const resp = utils.convertUnitTo('3.{aaa}', 2, '{bbb}');
    assert.equal(resp.status, 'succeeded');
    assert.equal(resp.toVal, 6);
    assert.equal(resp.msg.length, 0);
  });
}); // end convertUnitTo tests


describe('Test getSynonyms method', function() {

  it("should return an error message for no synonym supplied", function() {

    var resp1 = utils.checkSynonyms();
    assert.equal('error', resp1['status']);
    assert.equal('No term specified for synonym search.', resp1['msg']);
  });

  it("should return a message for no synonym found", function() {

    var resp2 = utils.checkSynonyms('Amess');
    assert.equal('failed', resp2['status']);
    assert.equal('Unable to find any units with synonym = Amess',
                  resp2['msg']);
  });

  it("should return multiple units for search term month", function() {
    var resp3 = utils.checkSynonyms('month');
    assert.equal('succeeded', resp3['status']);
    assert(resp3['units'].length > 1);
  });

  it("should return a code, name and guidance for each unit", function() {
    var resp4 = utils.checkSynonyms('month');
    var uLen = resp4['units'].length ;
    for (var u = 0; u < uLen; u++) {
      var theUnit = resp4['units'][u] ;
      assert.notStrictEqual(undefined, theUnit['code']);
      assert.notStrictEqual(undefined, theUnit['name']);
      assert.notStrictEqual(undefined, theUnit['guidance']);
    }
  });

}); // end checkSynonyms tests


describe('convertToBaseUnits', ()=> {
  it('should convert cm2/ms3 to base units', ()=>{
    const baseUnitData = utils.convertToBaseUnits('cm2/ms3', 1);
    assert.equal(baseUnitData.status, 'succeeded');
    assert.equal(baseUnitData.msg.length, 0);
    assert.equal(baseUnitData.magnitude, 100000);
    assert.equal(baseUnitData.fromUnitIsSpecial, false);
    assert.deepEqual(baseUnitData.unitToExp, {'m': 2, 's': -3});
  });


  it('should convert B[10.nV] to base units', ()=>{
    // Equivalent to 0.0000316227766016838 g.m2/(C.s2); 1 B[10.nV]=2*log10(10.nV)
    const baseUnitData = utils.convertToBaseUnits('B[10.nV]', 1);
    assert.equal(baseUnitData.status, 'succeeded');
    assert.equal(baseUnitData.msg.length, 0);
    assert.equal(baseUnitData.magnitude.toPrecision(15), 0.0000316227766016838);
    assert.equal(baseUnitData.fromUnitIsSpecial, true);
    assert.deepEqual(baseUnitData.unitToExp, {'g': 1, 'm': 2, 's': -2, 'C': -1});
  });

  it('should convert [degF] to base units', ()=>{
    const baseUnitData = utils.convertToBaseUnits('[degF]', 32);
    assert.equal(baseUnitData.status, 'succeeded');
    assert.equal(baseUnitData.msg.length, 0);
    assert.equal(baseUnitData.magnitude.toPrecision(15), 273.15);
    assert.equal(baseUnitData.fromUnitIsSpecial, true);
    assert.deepEqual(baseUnitData.unitToExp, {'K': 1});
  });

  it('should convert 2.[degF] to base units', ()=>{
    const baseUnitData = utils.convertToBaseUnits('2.[degF]', 16);
    assert.equal(baseUnitData.status, 'succeeded');
    assert.equal(baseUnitData.msg.length, 0);
    // Special units do not get a magnitude returned
    assert.equal(baseUnitData.magnitude.toPrecision(15), 273.15);
    assert.equal(baseUnitData.fromUnitIsSpecial, true);
    assert.deepEqual(baseUnitData.unitToExp, {'K': 1});
  });

  it('should convert [degF].2 to base units', ()=>{
    const baseUnitData = utils.convertToBaseUnits('[degF].2', 16);
    assert.equal(baseUnitData.status, 'succeeded');
    assert.equal(baseUnitData.msg.length, 0);
    assert.equal(baseUnitData.magnitude.toPrecision(15), 273.15);
    assert.equal(baseUnitData.fromUnitIsSpecial, true);
    assert.deepEqual(baseUnitData.unitToExp, {'K': 1});
  });

  it('should convert [degF] to base units with a different value', ()=>{
    const baseUnitData = utils.convertToBaseUnits('[degF]', 41);
    assert.equal(baseUnitData.status, 'succeeded');
    assert.equal(baseUnitData.msg.length, 0);
    assert.equal(baseUnitData.magnitude.toPrecision(15), 278.15);
    assert.equal(baseUnitData.fromUnitIsSpecial, true);
    assert.deepEqual(baseUnitData.unitToExp, {'K': 1});
  });

  it('should convert {degF} to 1', ()=>{
    const baseUnitData = utils.convertToBaseUnits('{degF}', 2);
    assert.equal(baseUnitData.status, 'succeeded');
    assert.equal(baseUnitData.msg.length, 1);
    assert.equal(baseUnitData.magnitude, 2);
    assert.equal(baseUnitData.fromUnitIsSpecial, false);
  });

  it('should not covert [iU] to base units', ()=>{
    // [iU] is an "arbitrary" unit and cannot be converted
    const baseUnitData = utils.convertToBaseUnits('[iU]', 1);
    assert(baseUnitData.msg.length > 0);
    assert.equal(baseUnitData.status, 'failed');
    assert.equal(baseUnitData.magnitude, undefined);
    assert.equal(baseUnitData.fromUnitIsSpecial, undefined);
    assert.deepEqual(baseUnitData.unitToExp, undefined);
  });

  it('should not covert m.[iU] to base units', ()=>{
    // [iU] is an "arbitrary" unit and cannot be converted
    const baseUnitData = utils.convertToBaseUnits('m.[iU]', 1);
    assert(baseUnitData.msg.length > 0);
    assert.equal(baseUnitData.status, 'failed');
    assert.equal(baseUnitData.magnitude, undefined);
    assert.equal(baseUnitData.fromUnitIsSpecial, undefined);
    assert.deepEqual(baseUnitData.unitToExp, undefined);
  });

  it('should return an error message for a unit string that is a synonym', ()=>{
    const baseUnitData = utils.convertToBaseUnits('foot', 1);
    assert(baseUnitData.msg.length > 0);
    assert.equal(baseUnitData.status, 'invalid');
    assert.equal(baseUnitData.magnitude, undefined);
    assert.equal(baseUnitData.fromUnitIsSpecial, undefined);
    assert.deepEqual(baseUnitData.unitToExp, undefined);
  });

  it('should return an error message for a unit string that is a unrecognized', ()=>{
    const baseUnitData = utils.convertToBaseUnits('zzz', 1);
    assert(baseUnitData.msg.length > 0);
    assert.equal(baseUnitData.status, 'invalid');
    assert.equal(baseUnitData.magnitude, undefined);
    assert.equal(baseUnitData.fromUnitIsSpecial, undefined);
    assert.deepEqual(baseUnitData.unitToExp, undefined);
  });

  it('should return an error message for if the amount is not specified', ()=>{
    const baseUnitData = utils.convertToBaseUnits('zzz', undefined);
    assert(baseUnitData.msg.length > 0);
    assert.equal(baseUnitData.status, 'error');
    assert.equal(baseUnitData.magnitude, undefined);
    assert.equal(baseUnitData.fromUnitIsSpecial, undefined);
    assert.deepEqual(baseUnitData.unitToExp, undefined);
  });

});
