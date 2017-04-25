/**
 * Created by Samuel Gratzl on 25.04.2017.
 */

import {IValueTypeDesc, VALUE_TYPE_CATEGORICAL, VALUE_TYPE_INT, VALUE_TYPE_REAL, ICategoricalValueTypeDesc, INumberValueTypeDesc} from 'phovea_core/src/datatype';

export class ScoreAccessorProxy<T> {
  /**
   * the accessor for the score column
   * @param row
   * @param index
   */
  accessor = (row: any, index: number) => this.access(row);
  scores: Map<number, T> = null;

  constructor(private readonly row2key: (row: any) => number, private readonly missingValue: T = null) {

  }

  protected access(row: any) {
    const rowId = this.row2key(row);
    if (this.scores === null || !this.scores.has(rowId)) {
      return this.missingValue;
    }
    return this.scores.get(rowId);
  }
}

class NumberScoreAccessorProxy extends ScoreAccessorProxy<number> {
}

class CategoricalScoreAccessorProxy extends ScoreAccessorProxy<string> {

  protected access(row: any) {
    const v = super.access(row);
    return String(v); //even null values;
  }
}

/**
 * creates and accessor helper
 * @param row2key
 * @returns {CategoricalScoreAccessorProxy|NumberScoreAccessorProxy}
 */
export default function createAccessor(colDesc: { type: string, missingValue?, accessor?}, row2key: (row: any) => number) {
  let accessor;
  switch(colDesc.type) {
    case 'categorical':
      accessor = new CategoricalScoreAccessorProxy(row2key, colDesc.missingValue);
      break;
    case 'number':
      accessor = new NumberScoreAccessorProxy(row2key, colDesc.missingValue);
      break;
    default:
      accessor = new ScoreAccessorProxy(row2key, colDesc.missingValue);
  }
  colDesc.accessor = accessor.accessor;
  return accessor;
}
