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


  constructor() {
   // this._range = range;

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


}
