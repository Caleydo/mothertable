/**
 * Created by bikramkawan on 11/02/2017.
 */

import {
  VALUE_TYPE_STRING, VALUE_TYPE_CATEGORICAL, VALUE_TYPE_INT, VALUE_TYPE_REAL,
  IDataType
} from 'phovea_core/src/datatype';
import {IAnyVector} from 'phovea_core/src/vector';
import Range from 'phovea_core/src/range/Range';

interface ISortResults {
  combined:Range;
  stratified:Map<string,number[]>;
}

export const SORT = {
  asc: 'asc',
  desc: 'desc'

};


export default class SortHandler {

  private sortCriteria: string;

  constructor() {
    //this.sortCriteria = sortCriteria;
    //this.sortMe();
  }

  /**
   * Find the method to get the range
   * @param newView {IVector)
   * @returns {Promise<Range>}
   */

  async chooseType(newView: IAnyVector, sortCriteria) {
    const v = <IAnyVector>newView;
    switch (v.desc.value.type) {
      case VALUE_TYPE_STRING:
        return (await this.sortString(newView, sortCriteria));
      case VALUE_TYPE_CATEGORICAL:
        return (await this.collectRangeList(newView, sortCriteria, 'sc'));
      case VALUE_TYPE_INT:
      case VALUE_TYPE_REAL:
        return (await this.sortNumber(newView, sortCriteria));
    }
  }


  async collectRangeList(col: IAnyVector, sortCriteria, type: string): Promise<Range[]> {
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
  async sortColumns(columns):Promise<ISortResults> {
    // if(columns.length === 0) {
    //   return [[]];
    // }
    const d = await columns[0].data.idView(columns[0].rangeView);
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

    // console.log(range, rangesPerCol)
    return {combined: this.mergeRanges(range), stratified: rangesPerCol};
  }


  mergeRanges(ranges) {
    const mergedRange = ranges.reduce((currentVal, nextValue) => {
      const r = new Range();
      r.dim(0).pushList(currentVal.dim(0).asList().concat(nextValue.dim(0).asList()));
      return r;
    });
    return mergedRange;
  }

  async concatRanges(rangeOfViewData: Range[][]) {
    if (Array.isArray(rangeOfViewData[0]) === true) {
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
    const sortArr = [];
    for (const f of sortedByName) {
      const u: IAnyVector = await col.filter(filterCat.bind(this, f));
      const id = await u.ids();
      if (id.size()[0] >= 1) {
        sortArr.push(id);
        // console.log(f, await coldata.data(), id.dim(0).asList());
      }
    }

    return sortArr;
  }


//See Test Folder for the use of this function
  async sortNumber(data: IAnyVector, sortCriteria) {
    const sortedView = await data.sort(numSort.bind(this, sortCriteria));
    return await sortedView.ids(); // sortedRange
  }


//See Test Folder for the use of this function
  async sortString(data, sortCriteria) {
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
export function filterCat(aVal, bval) {
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
export function stringSort(sortCriteria, aVal, bVal) {
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
export function numSort(sortCriteria, aVal, bVal) {
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
function categoricalSort(categories, sortCriteria, aVal, bVal) {
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
    return d.map((e) => {
      const r = new Range();
      r.dim(0).pushList(e);
      return r;
    });
  });
  return rangeObject;

}
