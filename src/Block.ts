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
  public static stringRange = new Map();
  public static currentRange: Range1D = Range1D.all();
  private strings = [{id: 1, value: 'A'},
    {id: 2, value: 'B'}, {id: 3, value: 'C'}, {id: 4, value: 'D'}, {id: 5, value: 'E'},
    {id: 6, value: 'F'}, {id: 7, value: 'G'}, {id: 8, value: 'H'}, {id: 9, value: 'I'},
    {id: 10, value: 'J'}, {id: 11, value: 'K'}, {id: 12, value: 'L'}, {id: 13, value: 'M'},
    {id: 14, value: 'N'}, {id: 15, value: 'O'}, {id: 16, value: 'P'}, {id: 17, value: 'Q'},
    {id: 18, value: 'R'}, {id: 19, value: 'S'}, {id: 20, value: 'T'}, {id: 21, value: 'U'},
    {id: 22, value: 'V'}, {id: 23, value: 'W'}, {id: 24, value: 'X'}, {id: 25, value: 'Y'}, {id: 26, value: 'Z'}];

  constructor(data, filteredVisData, uid, multifom, div) {
    this._data = data;
    this._uid = uid;
    this._multiform = multifom;
    this._blockDiv = div;
    this._filteredVisData = filteredVisData;
    this.strings.forEach((d)=>Block.stringRange.set(d.id,d.value));

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

