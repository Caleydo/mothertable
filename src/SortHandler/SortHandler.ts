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
  combined: Range;
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

  async chooseType(newView: IAnyVector, sortCriteria: string) {
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


  async collectRangeList(col: IAnyVector, sortCriteria: string, type: string): Promise<Range[]> {
    const uniqValues = await this.uniqueValues(col);
    let sortedValue;
    if (type === 'sc') {

      sortedValue = uniqValues.sort(stringSort.bind(this, sortCriteria));
    } else if (type === 'ir') {

      sortedValue = uniqValues.sort(numSort.bind(this, sortCriteria));
    } else {

      return;
    }
    return await this.filterRangeByName(col, sortedValue); // sortedRange
  }

  /**
   *
   * @param columns
   * @returns {Promise<Range[][]>}
   */
  async sortColumns(columns: AnyColumn[]): Promise<ISortResults> {
    const d = await columns[0].dataView;
    let range: any = [await d.ids()];
    const rangesPerCol = new Map();
    //Iterate through all the columns
    for (const col of columns) {
      const nextColumnData = (<any>col).data;
      const sortCriteria = (<any>col).sortCriteria;
      const rangeOfView = [];

      // Iterate through all the ranges available for that column.
      // A column can be composed with array of ranges.
      for (const n of range) {
        //Create VectorView  of from each array element of range.
        const newView = await nextColumnData.idView(n);
        rangeOfView.push(await this.chooseType(newView, sortCriteria));
      }

      range = await this.concatRanges(rangeOfView);
      const dataElementsPerCol = range.map((d) => (d.dim(0).length));
      rangesPerCol.set(col.data.desc.id, dataElementsPerCol);
    }

    return {combined: mergeRanges(range), stratified: rangesPerCol};
  }


  async concatRanges(rangeOfViewData: Range[][]) {
    if (Array.isArray(rangeOfViewData[0])) {
      return rangeOfViewData.reduce((a, b) => a.concat(b));
    } else {
      return rangeOfViewData;
    }

  }

  /**
   *
   * @param column Data {IVector}
   * @param sortedByName {Array of unique elment  sorted by asc or dsc}
   * @returns {Promise<Range>}
   */
  async filterRangeByName(col: IAnyVector, sortedByName: any[]): Promise<Range[]> {
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


//See Test Folder for the use of this function
  async sortNumber(data: INumericalVector, sortCriteria: string) {
    const sortedView = await data.sort(numSort.bind(this, sortCriteria));
    return await sortedView.ids(); // sortedRange
  }


//See Test Folder for the use of this function
  async sortString(data: IStringVector, sortCriteria: string) {
    const sortedView = await data.sort(stringSort.bind(this, sortCriteria));
    return await sortedView.ids(); // sortedRange
  }


  /**
   * Method to find the unique items in the IVector data
   * @param coldata
   * @returns {Promise<[values]>}
   */
  //See Test Folder for the use of this function
  async uniqueValues(coldata: IAnyVector) {
    const allCatNames = await(coldata.data());
    //TODO what about Array.from(new Set(allCatNames));
    const uniqvalues = allCatNames.filter((x, i, a) => a.indexOf(x) === i);
    return uniqvalues;
  }

}

/**
 * See Test Folder for the use of this function
 * @param aVal
 * @param bval
 * @returns {boolean}
 */
export function filterCat(aVal: string, bval: string) {
  //if (aVal === bval) {
  return aVal === bval; //Also include undefined empty strings and null values.
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
  if (sortCriteria === SORT.asc) {
    return (aVal.localeCompare(bVal));
  }
  if (sortCriteria === SORT.desc) {
    return (bVal.localeCompare(aVal));
  }
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
  if (sortCriteria === SORT.asc) {
    return (aVal - bVal);
  }
  if (sortCriteria === SORT.desc) {
    return bVal - aVal;
  }
}

/**
 * Unused at the moment.
 * @param categories
 * @param sortCriteria
 * @param aVal
 * @param bVal
 * @returns {number}
 */
function categoricalSort(categories: {[key: string]: number}, sortCriteria: string, aVal: string, bVal: string) {
  if (sortCriteria === SORT.asc) {
    return categories[aVal] - categories[bVal];
  }
  if (sortCriteria === SORT.desc) {
    return categories[bVal] - categories[aVal];
  }
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


/**
 * Joining the stratifications from given array
 * Works with the output of `prepareRangeFromList()`.
 *
 * @param arr
 * @returns {Range[][]} Returns the range object from list
 */
function makeRangeFromList(arr: number[][][]): Range[][] {
  const rangeObject = arr.map((d) => {
    return d.map((e) => asRange(e));
  });
  return rangeObject;

}
