/**
 * Created by Holger Stitz on 08.03.2017.
 */
/// <reference types="jasmine" />
import {distributeColWidths} from '../src/column/ColumnManager';

describe('distribute two columns', () => {
  const columns = [
    {minWidth: 80, maxWidth: 300, lockedWidth: -1},
    {minWidth: 30, maxWidth: 200, lockedWidth: -1}
  ];

  it('for containerWidth = 50', () => {
    const containerWidth = 50;
    return expect(distributeColWidths(columns, containerWidth)).toEqual([80, 30]);
  });

  it('for containerWidth = 100', () => {
    const containerWidth = 100;
    return expect(distributeColWidths(columns, containerWidth)).toEqual([80, 30]);
  });

  it('for containerWidth = 200', () => {
    const containerWidth = 200;
    return expect(distributeColWidths(columns, containerWidth)).toEqual([125, 75]);
  });

  it('for containerWidth = 300', () => {
    const containerWidth = 300;
    return expect(distributeColWidths(columns, containerWidth)).toEqual([175, 125]);
  });

  it('for containerWidth = 400', () => {
    const containerWidth = 400;
    return expect(distributeColWidths(columns, containerWidth)).toEqual([225, 175]);
  });

  it('for containerWidth = 500', () => {
    const containerWidth = 500;
    return expect(distributeColWidths(columns, containerWidth)).toEqual([300, 200]);
  });

  it('for containerWidth = 600', () => {
    const containerWidth = 600;
    return expect(distributeColWidths(columns, containerWidth)).toEqual([300, 200]);
  });

  it('for containerWidth = 700', () => {
    const containerWidth = 700;
    return expect(distributeColWidths(columns, containerWidth)).toEqual([300, 200]);
  });

});


describe('distribute three columns', () => {
  const columns = [
    {minWidth: 80, maxWidth: 300, lockedWidth: -1},
    {minWidth: 30, maxWidth: 200, lockedWidth: -1},
    {minWidth: 30, maxWidth: 200, lockedWidth: -1}
  ];

  it('for containerWidth = 50', () => {
    const containerWidth = 50;
    return expect(distributeColWidths(columns, containerWidth)).toEqual([80, 30, 30]);
  });

  it('for containerWidth = 100', () => {
    const containerWidth = 100;
    return expect(distributeColWidths(columns, containerWidth)).toEqual([80, 30, 30]);
  });

  it('for containerWidth = 200', () => {
    const containerWidth = 200;
    return expect(distributeColWidths(columns, containerWidth)).toEqual([100, 50, 50]);
  });

  it('for containerWidth = 300', () => {
    const containerWidth = 300;
    return expect(distributeColWidths(columns, containerWidth)).toEqual([133.33333333333334, 83.33333333333334, 83.33333333333334]);
  });

  it('for containerWidth = 400', () => {
    const containerWidth = 400;
    return expect(distributeColWidths(columns, containerWidth)).toEqual([166.66666666666669, 116.66666666666667, 116.66666666666667]);
  });

  it('for containerWidth = 500', () => {
    const containerWidth = 500;
    return expect(distributeColWidths(columns, containerWidth)).toEqual([200, 150, 150]);
  });

  it('for containerWidth = 600', () => {
    const containerWidth = 600;
    return expect(distributeColWidths(columns, containerWidth)).toEqual([233.33333333333334, 183.33333333333334, 183.33333333333334]);
  });

  it('for containerWidth = 700', () => {
    const containerWidth = 700;
    return expect(distributeColWidths(columns, containerWidth)).toEqual([300, 200, 200]);
  });

});

describe('distribute three columns with one locked at 400', () => {
  const columns = [
    {minWidth: 80, maxWidth: 300, lockedWidth: -1},
    {minWidth: 30, maxWidth: 200, lockedWidth: 400},
    {minWidth: 30, maxWidth: 200, lockedWidth: -1}
  ];

  it('for containerWidth = 50', () => {
    const containerWidth = 50;
    return expect(distributeColWidths(columns, containerWidth)).toEqual([80, 400, 30]);
  });

  it('for containerWidth = 100', () => {
    const containerWidth = 100;
    return expect(distributeColWidths(columns, containerWidth)).toEqual([80, 400, 30]);
  });

  it('for containerWidth = 200', () => {
    const containerWidth = 200;
    return expect(distributeColWidths(columns, containerWidth)).toEqual([80, 400, 30]);
  });

  it('for containerWidth = 300', () => {
    const containerWidth = 300;
    return expect(distributeColWidths(columns, containerWidth)).toEqual([80, 400, 30]);
  });

  it('for containerWidth = 400', () => {
    const containerWidth = 400;
    return expect(distributeColWidths(columns, containerWidth)).toEqual([80, 400, 30]);
  });

  it('for containerWidth = 500', () => {
    const containerWidth = 500;
    return expect(distributeColWidths(columns, containerWidth)).toEqual([80, 400, 30]);
  });

  it('for containerWidth = 600', () => {
    const containerWidth = 600;
    return expect(distributeColWidths(columns, containerWidth)).toEqual([125, 400, 75]);
  });

  it('for containerWidth = 700', () => {
    const containerWidth = 700;
    return expect(distributeColWidths(columns, containerWidth)).toEqual([175, 400, 125]);
  });

  it('for containerWidth = 800', () => {
    const containerWidth = 800;
    return expect(distributeColWidths(columns, containerWidth)).toEqual([225, 400, 175]);
  });

  it('for containerWidth = 900', () => {
    const containerWidth = 900;
    return expect(distributeColWidths(columns, containerWidth)).toEqual([300, 400, 200]);
  });

  it('for containerWidth = 1000', () => {
    const containerWidth = 1000;
    return expect(distributeColWidths(columns, containerWidth)).toEqual([300, 400, 200]);
  });

});
