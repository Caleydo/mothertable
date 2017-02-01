/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

import {IDataType} from 'phovea_core/src/datatype';
import {EventHandler} from 'phovea_core/src/event';
import {Range1D} from 'phovea_core/src/range';

abstract class AFilter<T, DATATYPE extends IDataType> extends EventHandler {
  static readonly EVENT_FILTER_CHANGED = 'filterChanged';

  abstract readonly node: HTMLElement;

  constructor(public readonly data: DATATYPE) {
    super();
  }

  get idtype() {
    return this.data.idtypes[0];
  }


  protected build(parent: HTMLElement) {
    const node = parent.ownerDocument.createElement('div');
    parent.appendChild(node);
    node.classList.add('filter');
    return node;
  }

  async filter(current: Range1D) {
    return current;
  }
}

export default AFilter;
