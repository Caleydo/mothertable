/**
 * Created by bikramkawan on 20/01/2017.
 */
export default class BlockManager {

  private _data;
  private _uid;

  constructor(data, uid) {

    this._data = data;
    this._uid = uid;

    //  this.getBlock();
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

  getBlock() {
    const block = {data: this._data, uniqueID: this._uid};
    return block;

  }

}

