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
    console.log(parent)
    let node;
    const idType = this.idtype.id;
    const element = document.querySelector(`.${idType}`);
    if (typeof(element) !== 'undefined' && element != null) {
      const p = document.querySelector(`.${idType}`);
      node = document.createElement('div');
      p.appendChild(node);
      node.classList.add('filter');
    } else {
      const p = parent.ownerDocument.createElement('div');
      parent.appendChild(p);
      p.classList.add(`${idType}`);
      const idTypeNode = document.createElement('div');
      console.log(parent)
      parent.insertBefore(idTypeNode,parent.childNodes[0]);
      idTypeNode.classList.add('idType');
      idTypeNode.innerHTML = `${idType.toLocaleUpperCase()}`;
      node = document.createElement('div');
      p.appendChild(node);
      node.classList.add('filter');
    }

    return node;

  }

  async filter(current: Range1D) {
    return current;
  }

  protected triggerFilterChanged() {
    this.fire(AFilter.EVENT_FILTER_CHANGED, this);
  }
}

export default AFilter;
