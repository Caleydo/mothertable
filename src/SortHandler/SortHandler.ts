/**
 * Created by bikramkawan on 11/02/2017.
 */

import {
  VALUE_TYPE_STRING, VALUE_TYPE_CATEGORICAL, VALUE_TYPE_INT, VALUE_TYPE_REAL,
  IDataType
} from 'phovea_core/src/datatype';
import {IAnyVector, INumericalVector} from 'phovea_core/src/vector';
import Range from 'phovea_core/src/range/Range';
import {list as asRange} from 'phovea_core/src/range';
import {makeListFromRange, mergeRanges} from '../column/utils';
import {IStringVector} from '../column/AVectorColumn';
import {AnyColumn} from '../column/ColumnManager';

interface ISortResults {
  /**
   * the sorted range to be shown
   */
  combined: Range;
  /**
   * the sizes of groups in individual columns identified by column.data.desc.id
   */
  stratified: Map<string, number[]>;
}

export const SORT = {
  asc: 'asc',
  desc: 'desc'

};


export default class SortHandler {

  /**
   * Find the method to get the range
   * @param newView {IVector)
   * @returns {Promise<Range>}
   */

  private async chooseType(newView: IAnyVector, sortCriteria: 'asc'|'desc') {
    const v = <IAnyVector>newView;
    switch (v.desc.value.type) {
      case VALUE_TYPE_STRING:
      case VALUE_TYPE_CATEGORICAL:
        return (await this.collectRangeList(newView, sortCriteria, 'sc'));
      case VALUE_TYPE_INT:
      case VALUE_TYPE_REAL:
        return (await this.collectRangeList(newView, sortCriteria, 'ir'));
    }
  }


  private async collectRangeList(col: IAnyVector, sortCriteria: 'asc'|'desc', type: 'sc'|'ir'): Promise<Range[]> {
    //optimize for the simple cases
    if (col.length === 0) {
      return Promise.resolve([]);
    } else if (col.length === 1) {
      return [await col.ids()];
    }
    //more than one
    const uniqValues = await this.toUnique(await col.data());
    let sortedValue;
    if (type === 'sc') {
      sortedValue = uniqValues.sort(stringSort.bind(this, sortCriteria));
    } else if (type === 'ir') {
      sortedValue = uniqValues.sort(numSort.bind(this, sortCriteria));
    } else {
      throw Error('invalid argument: ' + type);
    }
    return await this.filterRangeByName(col, sortedValue); // sortedRange
  }


  /**
   *
   * @param columns
   * @returns {Promise<Range[][]>}
   */
  async sortColumns(columns: AnyColumn[]): Promise<ISortResults> {
    // if(columns.length === 0) {
    //   return [[]];
    // }
    const d = await columns[0].dataView;
    let range: Range[] = [await d.ids()];

    const groupSizes = new Map<string, number[]>();

    //Iterate through all the columns
    for (const column of columns) {
      const data = column.data;
      const sortCriteria = <'asc'|'desc'>column.sortCriteria;
      const columnRanges: Range[] = [];

      // Iterate through all the ranges available for that column.
      // A column can be composed with array of ranges.
      for (const n of range) {
        if (n.dim(0).length === 1) {
          //can't be splitted further
          columnRanges.push(n);
        } else {
          //Create VectorView  of from each array element of range.
          const newView: any = await data.idView(n);
          columnRanges.push(...await this.chooseType(newView, sortCriteria));
        }
      }

      range = columnRanges;
      const dataElementsPerCol = range.map((d) => d.dim(0).length);
      groupSizes.set(column.data.desc.id, dataElementsPerCol);
    }

    return {combined: mergeRanges(range), stratified: groupSizes};
  }


  private concatRanges(rangeOfViewData: Range[][]|Range[]): Range[] {
    if (Array.isArray(rangeOfViewData[0])) {
      //flat the array
      return [].concat(...rangeOfViewData);
    } else {
      return <Range[]>rangeOfViewData;
    }
  }

  /**
   *
   * @param column Data {IVector}
   * @param sortedByName {Array of unique elment  sorted by asc or dsc}
   * @returns {Promise<Range>}
   */
  private async filterRangeByName(col: IAnyVector, sortedByName: any[]): Promise<Range[]> {
    //fetch all ids and data and convert to lists
    const data = await col.data();
    const ids = (await col.ids()).dim(0).asList(col.length);

    return sortedByName.map((name) => {
      const filterCatImpl = filterCat.bind(this, name);
      //filter to the list of matching ids
      const matchingIds = ids.filter((id, i) => {
        const dataAt = data[i];
        return filterCatImpl(dataAt);
      });
      return asRange(matchingIds);
    });
  }

  private toUnique<T>(values: T[]) {
    return Array.from(new Set(values));
  }
}

/**
 * See Test Folder for the use of this function
 * @param aVal
 * @param bVal
 * @returns {boolean}
 */
export function filterCat<T>(aVal: T, bVal: T) {
  //if (aVal === bval) {
  return aVal === bVal; //Also include undefined empty strings and null values.
  // }
}

/**
 * See Test Folder for the use of this function
 *
 * @param sortCriteria
 * @param aVal
 * @param bVal
 * @returns {number}
 */
export function stringSort(sortCriteria: string, aVal: string, bVal: string) {
  if (aVal === bVal) {
    return 0;
  }
  let r : number = 0;
  if (aVal === null) {
    r = +1;
  } else if (bVal === null) {
    r = -1;
  } else {
    r = aVal.localeCompare(bVal);
  }
  return sortCriteria === SORT.desc ? -r : r;
}
/**
 * See Test Folder for the use of this function
 *
 * @param sortCriteria
 * @param aVal
 * @param bVal
 * @returns {number}
 */
export function numSort(sortCriteria: string, aVal: number, bVal: number) {
  const isANaN = isNaN(aVal);
  const isBNaN = isNaN(bVal);
  if (aVal === bVal || (isANaN && isBNaN)) {
    return 0;
  }
  let r : number = 0;
  if (aVal === null || isANaN) {
    r = +1;
  } else if (bVal === null || isBNaN) {
    r = -1;
  } else {
    r = aVal - bVal;
  }
  return sortCriteria === SORT.desc ? -r : r;
}


/**
 * Stratifies (i.e. group) the sorted range by the given stratification array.
 * See 'Splitting multiforms' test for the use of this function
 *
 * @param sortedRange
 * @param stratifiedArr
 * @returns {number[][][]}
 */
export function prepareRangeFromList(sortedRange: number[], stratifiedArr: number[][]): number[][][] {
  const rlist = stratifiedArr.map((d) => {
    let index = 0;
    return d.map((e, i) => {
      if (i > 0) {
        index = index + d[i - 1];
      }

      return sortedRange.slice(index, index + e);

    });
  });
  return rlist;
}
