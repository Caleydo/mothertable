/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

import {IDataType} from 'phovea_core/src/datatype';
import {EventHandler} from 'phovea_core/src/event';

abstract class AFilter<T, DATATYPE extends IDataType> extends EventHandler {
  abstract readonly node: HTMLElement;

  constructor(public readonly data: DATATYPE) {
    super();
  }

  get idtype() {
    return this.data.idtypes[0];
  }


  protected build(parent: HTMLElement) {
    const node = parent.ownerDocument.createElement('div');
    node.classList.add('filter');
    return node;
  }
}

export default AFilter;
