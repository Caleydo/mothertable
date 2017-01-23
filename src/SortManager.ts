/**
 * Created by bikramkawan on 23/01/2017.
 */

import App from './app';
import VisManager from './VisManager';
import * as d3 from 'd3';

export default class SortManager {

  private _sortCriteria;
  private _blockID;
  private _visManager;

  constructor(blockID, sortCriteria) {
    this._blockID = blockID;
    this._sortCriteria = sortCriteria;
    this._visManager = new VisManager();
    this.sortedRange();
  }

  get sortCriteria() {
    return this._sortCriteria;
  }

  set sortCriteria(value) {
    this._sortCriteria = value;
  }

  get blockID() {
    return this._blockID;
  }

  set blockID(value) {
    this._blockID = value;
  }

  updateVis(range) {

    App.blockList.forEach((value, key) => {
      (<any>value).data.idView(range).then((d) => {

        d3.selectAll(`[data-uid="${key}"]`).remove();

        // const newVis = new VisManager(d, key);

        this._visManager.createVis((<any>value).data, d, key);

      });

    });
  }

  sortedRange() {

    const block = App.blockList.get(this._blockID);

    if (this._sortCriteria === 'alphabetical') {
      (<any>block.data).sort(stringSort).then((d) => {
        this.updateVis((<any>d.range));
      })

    } else if (this._sortCriteria === 'min') {

      (<any>block.data).sort(minSort).then((d) => {
        this.updateVis((<any>d.range));
      });

    } else if (this._sortCriteria === 'max') {

      (<any>block.data).sort(maxSort).then((d) => {
        this.updateVis((<any>d.range));
      });

    }


  }


}


export function makeSort(block, sortMethod) {

  const s = new SortManager(block, sortMethod)

  return s.sortedRange();
}

function stringSort(aVal, bVal) {


  return (aVal.localeCompare(bVal));

}


function minSort(aVal, bVal) {

  return aVal - bVal;
}

function maxSort(aVal, bVal) {

  return bVal - aVal;
}
