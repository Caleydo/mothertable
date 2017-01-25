/**
 * Created by bikramkawan on 20/01/2017.
 */

import {MultiForm} from 'phovea_core/src/multiform';
import Range1D from 'phovea_core/src/range/Range1D';
export default class Block {

  private _data;
  private _uid;
  private _multiform: MultiForm;
  private _blockDiv: HTMLDivElement;
  private _filteredVisData;
  private _filterDiv;
  private _activeCategories: string[];
  public static filtersRange = new Map();
  public static currentRange: Range1D = Range1D.all();

  constructor(data, filteredVisData, uid, multifom, div) {
    this._data = data;
    this._uid = uid;
    this._multiform = multifom;
    this._blockDiv = div;
    this._filteredVisData = filteredVisData;

  }


  get filteredVisData() {
    return this._filteredVisData;
  }

  set filteredVisData(value) {
    this._data = value;
  }

  get data() {
    return this._data;
  }

  set data(value) {
    this._data = value;
  }

  get uid() {
    return this._uid;
  }

  set uid(value) {
    this._uid = value;
  }

  get multiform() {
    return this._multiform;
  }

  set multiform(value) {
    this._multiform = value;
  }

  get blockDiv() {
    return this._blockDiv;
  }

  set blockDiv(value) {
    this._uid = value;
  }

  get filterDiv() {
    return this._filterDiv;
  }

  set filterDiv(value) {
    this._filterDiv = value;
  }


  get activeCategories() {
    return this._activeCategories;
  }

  set activeCategories(value) {
    this._activeCategories = value;
  }

}

