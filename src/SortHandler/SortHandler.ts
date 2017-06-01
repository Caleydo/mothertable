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


export default class SortHandler {

  /**
   * stratify the given vector and returning a list of ranges per sorted unique value
   */
  private static async stratify(vector: IAnyVector, sortCriteria: 'asc' | 'desc'): Promise<Range[]> {
    //optimize for the simple cases
    if (vector.length === 0) {
      return Promise.resolve([]);
    } else if (vector.length === 1) {
      return [await vector.ids()];
    }

    const {data, ids} = await Promise.all([vector.data(), vector.ids()]).then((r) => ({data: r[0], ids: r[1]}));

    const uniqValues = SortHandler.toUnique(data);

    const valueType = vector.desc.value.type;
    const isNumeric = valueType === VALUE_TYPE_INT || valueType === VALUE_TYPE_REAL;
    const sortFunc = (isNumeric ? numSort : stringSort);

    const sortedValue = uniqValues.sort(sortFunc.bind(this, sortCriteria));

    return SortHandler.groupIDs(data, ids, sortedValue);
  }

  /**
   * sorts the given array of columns in a hierarchical way
   * @param columns
   * @return {Promise<{combined: Range, stratified: Map<string, number[]>}>}
   */
  static async sort(columns: AnyColumn[]): Promise<ISortResults> {
    const d = await columns[0].dataView;

    let range: Range[] = [await d.ids()];

    const groupSizes = new Map<string, number[]>();

    //Iterate through all the columns
    for (const column of columns) {
      const data = column.data;
      const sortCriteria = <'asc'|'desc'>column.sortCriteria;

      const nextRanges: Range[] = [];

      // Iterate through all the ranges available for that column.
      // A column can be composed with array of ranges.
      for (const n of range) {
        if (n.dim(0).length === 1) {
          //can't be splitted further
          nextRanges.push(n);
        } else {
          //Create VectorView  of from each array element of range.
          const newView: any = await data.idView(n);
          //sort this view and split in individual values
          nextRanges.push(...await SortHandler.stratify(newView, sortCriteria));
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
   *
   * @param columns
   * @returns {Promise<Range[][]>}
   */
  async sortColumns(columns: AnyColumn[]): Promise<ISortResults> {
    return SortHandler.sort(columns);
  }

  /**
   * return the matching ids for the given sorted set of values
   * @param data the data behind the ids
   * @param ids the ids to split
   * @param sortedSet the set of groups
   * @return Range[] the list of ranges one for each group
   */
  private static groupIDs<T>(data: T[], ids: Range, sortedSet: T[]): Range[] {
    //fetch all ids and data and convert to lists
    const idList = ids.dim(0).asList(data.length);

    return sortedSet.map((name) => {
      const filterCatImpl = filterCat.bind(this, name);
      //filter to the list of matching ids
      const matchingIds = idList.filter((id, i) => {
        const dataAt = data[i];
        return filterCatImpl(dataAt);
      });
      return asRange(matchingIds);
    });
  }

  private static toUnique<T>(values: T[]) {
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
