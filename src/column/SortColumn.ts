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

export const sort = {
  asc: 'asc',
  desc: 'desc'

};


export default class SortColumn extends EventHandler {


  private sortCriteria: string;
  private data;

  constructor(data, sortCriteria: string) {
    super();
    this.data = data;
    this.sortCriteria = sortCriteria;
    this.sortMethod();

  }


  sortMethod() {
    const v = <IAnyVector>this.data;
    switch (v.desc.value.type) {
      case VALUE_TYPE_STRING:
      case VALUE_TYPE_CATEGORICAL:
        return this.sortString();
      case VALUE_TYPE_INT:
      case VALUE_TYPE_REAL:
        return this.sortNumber();
    }

  }

  async sortString() {

    const sortedView = await (<IAnyVector>this.data).sort(stringSort.bind(this, this.sortCriteria));
    const sortedRange = await  sortedView.ids();


    this.fire(AColumn.EVENT_SORT_CHANGED, sortedRange);


  }


  async sortNumber() {

    const sortedView = await (<IAnyVector>this.data).sort(numSort.bind(this, this.sortCriteria));
    const sortedRange = await  sortedView.ids();


    this.fire(AColumn.EVENT_SORT_CHANGED, sortedRange);

  }

// Unused at the moment because we are sorting categories by alphabetical order;
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


}


function stringSort(sortCriteria, aVal, bVal) {

  if (sortCriteria === sort.asc) {


    return (aVal.localeCompare(bVal));
  }
  if (sortCriteria === sort.desc) {

    return (bVal.localeCompare(aVal));
  }


}


function numSort(sortCriteria, aVal, bVal) {


  if (sortCriteria === sort.asc) {

    return (aVal - bVal);
  }

  if (sortCriteria === sort.desc) {

    return bVal - aVal;
  }

}


// Unused at the moment.
function categoricalSort(categories, sortCriteria, aVal, bVal) {

  if (sortCriteria === sort.asc) {

    return categories[aVal] - categories[bVal];
  }
  if (sortCriteria === sort.desc) {

    return categories[bVal] - categories[aVal];
  }


}


function isSame(value, compareWith) {
  return value === compareWith;
}
