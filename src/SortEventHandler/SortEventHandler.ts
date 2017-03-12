/**
 * Created by bikramkawan on 11/02/2017.
 */

import {EventHandler} from 'phovea_core/src/event';
import {
  VALUE_TYPE_STRING, VALUE_TYPE_CATEGORICAL, VALUE_TYPE_INT, VALUE_TYPE_REAL,
  IDataType
} from 'phovea_core/src/datatype';
import {IAnyVector} from 'phovea_core/src/vector';
import Range from 'phovea_core/src/range/Range';
import {AnyColumn} from '../column/ColumnManager';


export const SORT = {
  asc: 'asc',
  desc: 'desc'

};


export default class SortEventHandler extends EventHandler {


  private sortCriteria: string;
  private columns: AnyColumn[];

  constructor(cols: AnyColumn[]) {
    super();
    this.columns = cols;
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
      case VALUE_TYPE_CATEGORICAL:
        return (await this.collectRangeList(newView, sortCriteria, 'sc'));
      case VALUE_TYPE_INT:
      case VALUE_TYPE_REAL:
        return (await this.collectRangeList(newView, sortCriteria, 'ir'));
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
    const sortedRange = await this.filterRangeByName(col, sortedValue);
    return sortedRange;
  }


  /**
   *
   * @param col Column Data {IVector}
   * @returns {Promise<Range>}
   */


  async sortByMe(): Promise<Range[][]> {
    const d = await this.columns[0].data.idView(this.columns[0].rangeView);
    let range: any = [await d.ids()];
    const initialColType = this.columns[0].data.desc.value.type;
    let c = NaN;
    this.columns.some((val, index) => {
      if (val.data.desc.value.type !== VALUE_TYPE_CATEGORICAL) {
        c = index;
      }
      return val.data.desc.value.type !== VALUE_TYPE_CATEGORICAL;
    });
    const rangeForMultiform = [];
    let dataElementsPerCol;
    let count = 0;
    //Iterate through all the columns
    for (const col of this.columns) {
      const nextColumnData = (<any>col).data;
      const sortCriteria = (<any>col).sortCriteria;
      const rangeOfView = [];
      /**
       * Iterate through all the ranges available for that column.
       * A column can be composed with array of ranges.
       */
      for (const n of range) {
        //Create VectorView  of from each array element of range.
        const newView = await nextColumnData.idView(n);
        rangeOfView.push(await this.chooseType(newView, sortCriteria));

      }

      range = await this.concatRanges(rangeOfView);


      if (count === 0 && initialColType !== VALUE_TYPE_CATEGORICAL) {
        dataElementsPerCol = [await (<any>col).data.length];
        rangeForMultiform.push(dataElementsPerCol);
      } else if (count === 0 && initialColType === VALUE_TYPE_CATEGORICAL) {
        const temp = range.map((d) => d.dim(0).length);
        dataElementsPerCol = temp;
        rangeForMultiform.push([await (<any>col).data.length]);
      } else if (count < c) {
        rangeForMultiform.push(dataElementsPerCol);
        const temp = range.map((d) => (d.dim(0).length));
        dataElementsPerCol = temp;
      } else {
        rangeForMultiform.push(dataElementsPerCol);
      }
      count = count + 1;

    }

    const mergedRanges = this.mergeRanges(range);
    const rangeListArr = prepareRangeFromList(mergedRanges.dim(0).asList(), rangeForMultiform);
    const rangesPerColumn = makeRangeFromList(rangeListArr);
    return rangesPerColumn;

  }


  mergeRanges(r) {
    const ranges = r;
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
    const coldata = col;
    for (const f of sortedByName) {
      const u: IAnyVector = await coldata.filter(filterCat.bind(this, f));
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
    const sortedRange = await  sortedView.ids();
    return sortedRange;
  }


//See Test Folder for the use of this function
  async sortString(data, sortCriteria) {
    const sortedView = await data.sort(stringSort.bind(this, sortCriteria));
    const sortedRange = await  sortedView.ids();
    return sortedRange;

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

//See Test Folder for the use of this function
export function filterCat(aVal, bval) {

  //if (aVal === bval) {

  return aVal === bval; //Also include undefined empty strings and null values.

  // }


}

//See Test Folder for the use of this function
export function stringSort(sortCriteria, aVal, bVal) {


  if (sortCriteria === SORT.asc) {


    return (aVal.localeCompare(bVal));
  }
  if (sortCriteria === SORT.desc) {


    return (bVal.localeCompare(aVal));
  }


}

//See Test Folder for the use of this function
export function numSort(sortCriteria, aVal, bVal) {
  if (sortCriteria === SORT.asc) {

    return (aVal - bVal);
  }

  if (sortCriteria === SORT.desc) {

    return bVal - aVal;
  }

}


// Unused at the moment.
function categoricalSort(categories, sortCriteria, aVal, bVal) {

  if (sortCriteria === SORT.asc) {

    return categories[aVal] - categories[bVal];
  }
  if (sortCriteria === SORT.desc) {

    return categories[bVal] - categories[aVal];
  }


}


function isSame(value, compareWith) {
  return value === compareWith;
}


//See Test Folder for the use of this function
export function prepareRangeFromList(sortedRange: number[], arr: number[][]) {
  const rlist = arr.map((d) => {
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


//Returns the range object from list
function makeRangeFromList(arr: number[][][]) {
  const rangeObject = arr.map((d) => {
    return d.map((e) => {
      const r = new Range();
      r.dim(0).pushList(e);
      return r;
    });
  });
  return rangeObject;

}
