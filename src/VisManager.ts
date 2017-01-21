/**
 * Created by bikramkawan on 21/01/2017.
 */
export default class VisManager {

  private _visData;
  private _visUID;
  private _parentDiv;


  constructor(visData, visUID, parentDiv) {
    this._visData = visData;
    this._visUID = visUID;
    this._parentDiv = parentDiv;
  }

  get visData() {
    return this._visData;
  }

  set visData(value) {
    this._visData = value;
  }

  get visUID() {
    return this._visUID;
  }

  set visUID(value) {
    this._visUID = value;
  }

  get parentDiv() {
    return this._parentDiv;
  }

  set parentDiv(value) {
    this._parentDiv = value;
  }
}
