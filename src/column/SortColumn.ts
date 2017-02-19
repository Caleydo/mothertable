/**
 * Created by bikramkawan on 11/02/2017.
 */

import {EventHandler} from 'phovea_core/src/event';
import AColumn from './AColumn';
import {
  VALUE_TYPE_STRING, VALUE_TYPE_CATEGORICAL, VALUE_TYPE_INT, VALUE_TYPE_REAL,
  IDataType
} from 'phovea_core/src/datatype';
import {IAnyVector} from 'phovea_core/src/vector';
import AnyColumn from './ColumnManager';

export const SORT = {
  asc: 'asc',
  desc: 'desc'

};


export default class SortColumn extends EventHandler {


  private sortCriteria: string;
  private columns: AnyColumn[];

  constructor(cols: AnyColumn[], sortCriteria: string) {
    super();
    this.columns = cols;
    this.sortCriteria = sortCriteria;
    //this.sortMe();


  }


  async getViewRange(newView) {
    const v = <IAnyVector>newView;
    switch (v.desc.value.type) {
      case VALUE_TYPE_STRING:
        return (await this.sortString(newView));
      case VALUE_TYPE_CATEGORICAL:
        return (await this.getCatRange(newView));
      case VALUE_TYPE_INT:
      case VALUE_TYPE_REAL:
        return (await this.sortNumber(newView));
    }
  }

  async sortString(data) {
    const sortedView = await data.sort(stringSort.bind(this, this.sortCriteria));
    const sortedRange = await  sortedView.ids();
    return sortedRange;

  }

  async getCatRange(col) {

    const categories = await this.uniqCategories(col);
    const sortedByName = categories.sort(stringSort.bind(this, this.sortCriteria));
    const sortedRange = await this.sortCategory(col, sortedByName);
    return sortedRange;
  }


  async sortByMe() {

    let range = [await (<any>this.columns[0]).data.ids()];
    for (const col of this.columns) {
      const nextColumnData = (<any>col).data;
      const rangeOfView = [];
      for (const n of range) {
        const newView = await nextColumnData.idView(n);
        rangeOfView.push(await this.getViewRange(newView));
      }
      range = await this.concatRanges(rangeOfView);

    }
    return range;

  }


  async concatRanges(rangeOfViewData) {
    if (Array.isArray(rangeOfViewData[0]) === true) {
      return rangeOfViewData.reduce((a, b) => a.concat(b));
    } else {
      return rangeOfViewData;
    }


  }

  async sortCategory(col, sortedByName) {
    const sortArr = [];
    const coldata = col;
    for (const f of sortedByName) {
      const u = await coldata.filter(filterCat.bind(this, f));
      const id = await u.ids();
      if (id.size()[0] >= 1) {
        sortArr.push(id);
        console.log(f, await coldata.data(), id.dim(0).asList());
      }
    }

    return sortArr;
  }

  async sortNumber(data) {

    const sortedView = await data.sort(numSort.bind(this, this.sortCriteria));
    const sortedRange = await  sortedView.ids();

    return sortedRange;
  }

// Unused at the moment because we are sorting categories by alphabetical order;
  /*
   async sortCategorical() {
   const allCatNames = await(<any>this.data).data();
   const uniqueCategories = allCatNames.filter((x, i, a) => a.indexOf(x) === i);
   const catCount = {};
   uniqueCategories.forEach(((val, i) => {
   const count = allCatNames.filter(isSame.bind(this, val));
   catCount[val] = count.length;
   }));

   const sortedView = await (<IAnyVector>this.data).sort(categoricalSort.bind(this, catCount, this.sortCriteria));
   const sortedRange = await  (sortedView).ids();
   this.fire(AColumn.EVENT_SORT_CHANGED, sortedRange);

   }

   */


  async uniqCategories(coldata) {
    const allCatNames = await(coldata.data());
    const uniqCat = allCatNames.filter((x, i, a) => a.indexOf(x) === i);
    return uniqCat;

  }

}

function filterCat(aVal, bval) {

  if (aVal === bval) {

    return bval;

  }


}


export function stringSort(sortCriteria, aVal, bVal) {

  if (sortCriteria === SORT.asc) {


    return (aVal.localeCompare(bVal));
  }
  if (sortCriteria === SORT.desc) {

    return (bVal.localeCompare(aVal));
  }


}


function numSort(sortCriteria, aVal, bVal) {


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

