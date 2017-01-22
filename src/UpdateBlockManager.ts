/**
 * Created by bikramkawan on 21/01/2017.
 */

import App from './app';
import * as d3 from 'd3';
import VisManager from './VisManager';
export default class UpdateBlockManager {

  private _blockList;
  private _range;
  private _visNode;


  constructor(range) {
    this._range = range;

  }


  get blockList() {
    return this._blockList;
  }

  set blockList(value) {
    this._blockList = value;
  }

  get range() {
    return this._range;
  }

  set range(value) {
    this._range = value;
  }

  get visNode() {
    return this._visNode;
  }

  set visNode(value) {
    this._visNode = value;
  }

  updateVis() {

    App.blockList.forEach((value, key) => {
      console.log(key);
      console.log((<any>value).data(this._range));

      (<any>value).idView(this._range).then((d) => {

        d3.selectAll(`[data-uid="${key}"]`).remove();

        const newVis = new VisManager(d, key);
        newVis.createVis();

      });

    });
  }

}
