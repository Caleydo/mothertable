/**
 * Created by bikramkawan on 11/02/2017.
 */

import {VALUE_TYPE_INT, VALUE_TYPE_REAL} from 'phovea_core/src/datatype';
import {IAnyVector} from 'phovea_core/src/vector';
import Range from 'phovea_core/src/range/Range';
import {list as asRange} from 'phovea_core/src/range';
import {mergeRanges} from '../column/utils';
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

/**
 * stratify the given vector and returning a list of ranges per sorted unique value
 */
async function stratify(vector: IAnyVector, sortCriteria: 'asc' | 'desc'): Promise<Range[]> {
  //optimize for the simple cases
  if (vector.length === 0) {
    return Promise.resolve([]);
  } else if (vector.length === 1) {
    return [await vector.ids()];
  }

  const {data, ids} = await Promise.all([vector.data(), vector.ids()]).then((r) => ({data: r[0], ids: r[1]}));
  const lookup = new Map<any, number[]>();

  ids.dim(0).forEach((id, i) => {
    let d = data[i];
    //special case for NaN replace it with null, since NaN != NaN comparision issue
    if (typeof d === 'number' && isNaN(d)) {
      d = null;
    }
    //check for group and collect
    if (!lookup.has(d)) {
      lookup.set(d, [id]);
    } else {
      lookup.get(d).push(id);
    }
  });

  const valueType = vector.desc.value.type;
  const isNumeric = valueType === VALUE_TYPE_INT || valueType === VALUE_TYPE_REAL;
  const sortFunc = (isNumeric ? numSort : stringSort);

  return Array.from(lookup.keys())
    .sort(sortFunc.bind(this, sortCriteria))
    .map((key) => asRange(lookup.get(key)));
}

/**
 * sorts the given array of columns in a hierarchical way
 * @param columns
 * @return {Promise<{combined: Range, stratified: Map<string, number[]>}>}
 */
export default async function sort(columns: AnyColumn[]): Promise<ISortResults> {
  const d = await columns[0].dataView;

  let range: Range[] = [await d.ids()];

  const groupSizes = new Map<string, number[]>();

//Iterate through all the columns
  for (const column of columns) {
    const data = column.data;
    const sortCriteria = <'asc' | 'desc'>column.sortCriteria;

    const nextRanges: Range[] = [];

    // Iterate through all the ranges available for that column.
    // A column can be composed with array of ranges.
    for (const n of range) {
      if (n.dim(0).length === 1) {
        //can't be splitted further
        nextRanges.push(n);
      } else {
        //Create VectorView  of from each array element of range.
        const newView: any = await
          data.idView(n);
        //sort this view and split in individual values
        nextRanges.push(...await stratify(newView, sortCriteria));
      }
    }

    //collect stats
    const dataElementsPerCol = nextRanges.map((d) => d.dim(0).length);
    groupSizes.set(column.data.desc.id, dataElementsPerCol);

    //the combined values of all subranges are the ranges for the next round
    range = nextRanges;
  }

  return {combined: mergeRanges(range), stratified: groupSizes};
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
  //NaN and null is maximal value
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
  return stratifiedArr.map((d) => {
    let index = 0;
    return d.map((e, i) => {
      if (i > 0) {
        index = index + d[i - 1];
      }
      return sortedRange.slice(index, index + e);

    });
  });
}
