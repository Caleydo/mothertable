/**
 * Created by Holger Stitz on 17.03.2017.
 */

/*
/// <reference types="jasmine" />
import * as d3 from 'd3';
import AColumnManager from '../src/column/AColumnManager';
import CategoricalColumn from '../src/column/CategoricalColumn';
import MatrixColumn from '../src/column/MatrixColumn';
import {EOrientation} from '../src/column/AColumn';
import {asVector} from 'phovea_core/src/vector/Vector';
import {IVector} from 'phovea_core/src/vector';
import {asMatrix} from 'phovea_core/src/matrix/Matrix';
import {IMatrix} from 'phovea_core/src/matrix/IMatrix';

describe('AColumnManager', () => {

  const colManager = new AColumnManager();

  const vRows = ['vRow1', 'vRow2', 'vRow3'];
  const vData = ['value1', 'value2', 'value3'];
  const vector:IVector<any, any> = asVector(vRows, vData);

  const vectorColumn = new CategoricalColumn(vector, EOrientation.Horizontal, d3.select('#foo'));
  colManager.add(vectorColumn);

  // add as duplicate with same data
  const vectorColumnSameData = new CategoricalColumn(vector, EOrientation.Horizontal, d3.select('#foo'));
  colManager.add(vectorColumnSameData);

  const mRows = ['mRow1', 'mRow2', 'mRow3'];
  const mCols = ['mCol1', 'mCol2', 'mCol3'];
  const mData = [[1, 2, 3], [4, 5, 6], [7, 8, 9]];
  const matrix:IMatrix<any, any> = asMatrix(mData, mRows, mCols);

  const matrixColumn = new MatrixColumn(matrix, EOrientation.Horizontal, d3.select('#foo'));
  colManager.add(matrixColumn);

  it('number of added columns', () => {
    expect(colManager.columns.length).toEqual(3);
  });

  it('test column order', () => {
    expect(colManager.columns[0]).toEqual(vectorColumn);
    expect(colManager.columns[2]).toEqual(matrixColumn);
  });

  it('test vector columns', () => {
    expect(colManager.vectorCols.length).toEqual(2);
    expect(colManager.vectorCols[0]).toEqual(vectorColumn);
  });

  it('test matrix columns', () => {
    expect(colManager.matrixCols.length).toEqual(1);
    expect(colManager.matrixCols[0]).toEqual(matrixColumn);
  });

  it('unique columns', () => {
    expect(colManager.unique(colManager.columns).length).toEqual(2);
    expect(colManager.unique(colManager.columns)[0]).toEqual(vectorColumn);
    expect(colManager.unique(colManager.columns)[1]).toEqual(matrixColumn);
  });

});
*/
